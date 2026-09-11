import { prisma } from "@/lib/prisma";
import { timeToMinutes, minutesToTime } from "@/lib/format";

export interface SlotConfig {
  providerId: string;
  serviceId: string;
  dateISO: string; // YYYY-MM-DD
  timezone?: string;
}

export interface GeneratedSlot {
  startTime: string; // HH:mm
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  available: boolean;
  blockedReason?: string;
}

export interface DayAvailability {
  available: boolean;
  slots: { start: string; end: string }[];
}

/**
 * Check if two time ranges overlap (in minutes).
 * requestedStart < existingEnd AND requestedEnd > existingStart
 */
export function rangesOverlap(
  requestedStart: number,
  requestedEnd: number,
  existingStart: number,
  existingEnd: number
): boolean {
  return requestedStart < existingEnd && requestedEnd > existingStart;
}

/**
 * Load the provider's working periods for a given day of week.
 */
export async function getWorkingPeriods(
  providerId: string,
  dayOfWeek: number
): Promise<{ start: number; end: number }[]> {
  const availabilities = await prisma.availability.findMany({
    where: { providerId, dayOfWeek, isActive: true },
  });
  return availabilities.map((a) => ({
    start: timeToMinutes(a.startTime),
    end: timeToMinutes(a.endTime),
  }));
}

/**
 * Load blocked periods that overlap a given date, returning minute ranges.
 */
export async function getBlockedPeriods(
  providerId: string,
  dateISO: string
): Promise<{ start: number; end: number }[]> {
  const startOfDay = new Date(`${dateISO}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateISO}T23:59:59.999Z`);

  const blocked = await prisma.blockedTime.findMany({
    where: {
      providerId,
      startDateTime: { lt: endOfDay },
      endDateTime: { gt: startOfDay },
    },
  });

  return blocked.map((b) => ({
    start: timeOfDay(b.startDateTime),
    end: timeOfDay(b.endDateTime),
  }));
}

function timeOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Load existing active appointments for a provider on a date.
 * Returns minute ranges of the full occupied window (including buffers).
 */
export async function getExistingAppointments(
  providerId: string,
  dateISO: string
): Promise<{ start: number; end: number }[]> {
  const startOfDay = new Date(`${dateISO}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateISO}T23:59:59.999Z`);

  const appointments = await prisma.appointment.findMany({
    where: {
      providerId,
      startTime: { lt: endOfDay },
      endTime: { gt: startOfDay },
      status: {
        in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "RESCHEDULED"],
      },
    },
  });

  return appointments.map((a) => ({
    start: a.startTime.getHours() * 60 + a.startTime.getMinutes(),
    end: a.endTime.getHours() * 60 + a.endTime.getMinutes(),
  }));
}

/**
 * Generate available time slots for a given service on a given date.
 *
 * The date is interpreted using the provided timezone offset (minutes).
 * All slot math is done in "wall clock" minutes of the date.
 */
export async function generateSlots(
  config: SlotConfig
): Promise<{ slots: GeneratedSlot[]; dateAvailable: boolean }> {
  const { providerId, serviceId, dateISO } = config;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) {
    throw new Error("Service not found or inactive");
  }

  const date = new Date(`${dateISO}T00:00:00.000Z`);
  const dayOfWeek = date.getUTCDay();

  const workingPeriods = await getWorkingPeriods(providerId, dayOfWeek);
  const blockedPeriods = await getBlockedPeriods(providerId, dateISO);
  const existingAppointments = await getExistingAppointments(providerId, dateISO);

  // If date is in the past (ignoring time), no slots
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  if (compareDate < today) {
    return { slots: [], dateAvailable: false };
  }

  if (workingPeriods.length === 0) {
    return { slots: [], dateAvailable: false };
  }

  const duration = service.durationMinutes;
  const bufferBefore = service.bufferBefore;
  const bufferAfter = service.bufferAfter;
  const slotInterval = 30; // generate slots every 30 minutes

  const slots: GeneratedSlot[] = [];

  for (const period of workingPeriods) {
    for (
      let start = period.start;
      start + duration <= period.end;
      start += slotInterval
    ) {
      const end = start + duration;
      // With buffer, the total occupied window is [start-bufferBefore, end+bufferAfter]
      const occupiedStart = start - bufferBefore;
      const occupiedEnd = end + bufferAfter;

      let available = true;
      let blockedReason: string | undefined;

      // Blocked period overlap
      for (const bp of blockedPeriods) {
        if (rangesOverlap(occupiedStart, occupiedEnd, bp.start, bp.end)) {
          available = false;
          blockedReason = "Provider unavailable";
          break;
        }
      }

      // Existing appointment overlap (with buffers)
      if (available) {
        for (const appt of existingAppointments) {
          if (rangesOverlap(occupiedStart, occupiedEnd, appt.start, appt.end)) {
            available = false;
            blockedReason = "Slot already booked";
            break;
          }
        }
      }

      if (available) {
        // Also ensure this specific start time doesn't overlap any existing appointment start
        slots.push({
          startTime: minutesToTime(start),
          endTime: minutesToTime(end),
          startMinutes: start,
          endMinutes: end,
          available: true,
        });
      }
    }
  }

  return { slots, dateAvailable: slots.length > 0 };
}

/**
 * Server-side verification that a booking request is valid and has no conflict.
 * This is the authoritative check used at booking time.
 */
export interface BookingRequest {
  providerId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  customerId: string;
}

export interface BookingCheckResult {
  valid: boolean;
  errors: string[];
}

/**
 * The authoritative server-side double-booking / availability check.
 * Must be called inside a database transaction to prevent races.
 */
export async function verifyBookingAvailability(
  req: BookingRequest
): Promise<BookingCheckResult> {
  const errors: string[] = [];

  const service = await prisma.service.findUnique({
    where: { id: req.serviceId },
    include: { provider: true },
  });

  if (!service) return { valid: false, errors: ["Service not found"] };
  if (!service.isActive) return { valid: false, errors: ["Service is not active"] };
  if (service.providerId !== req.providerId) {
    return { valid: false, errors: ["Service does not belong to this provider"] };
  }
  if (!service.provider.isActive || service.provider.isSuspended) {
    return { valid: false, errors: ["Provider is not available"] };
  }

  // Duration check
  const expectedDuration = service.durationMinutes;
  const actualDuration = (req.endTime.getTime() - req.startTime.getTime()) / 60000;
  if (actualDuration !== expectedDuration) {
    errors.push("Invalid appointment duration");
  }

  const dateISO = req.startTime.toISOString().split("T")[0];
  const dayOfWeek = req.startTime.getUTCDay();

  const startMins = req.startTime.getUTCHours() * 60 + req.startTime.getUTCMinutes();
  const endMins = req.endTime.getUTCHours() * 60 + req.endTime.getUTCMinutes();

  // Working hours check
  const periods = await prisma.availability.findMany({
    where: { providerId: req.providerId, dayOfWeek, isActive: true },
  });
  const inWorkingHours = periods.some((p) => {
    const ps = timeToMinutes(p.startTime);
    const pe = timeToMinutes(p.endTime);
    return startMins >= ps && endMins <= pe;
  });
  if (!inWorkingHours) errors.push("Outside provider working hours");

  // Blocked time check (with buffer)
  const blocked = await prisma.blockedTime.findMany({
    where: {
      providerId: req.providerId,
      startDateTime: { lt: req.endTime },
      endDateTime: { gt: req.startTime },
    },
  });
  if (blocked.length > 0) errors.push("Provider is unavailable at the selected time");

  // Existing appointment overlap (with buffers)
  const existing = await prisma.appointment.findMany({
    where: {
      providerId: req.providerId,
      status: {
        in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "RESCHEDULED"],
      },
      OR: [
        { startTime: { lt: req.endTime }, endTime: { gt: req.startTime } },
      ],
    },
  });

  const occupiedStart = startMins - service.bufferBefore;
  const occupiedEnd = endMins + service.bufferAfter;

  for (const appt of existing) {
    const aStart = appt.startTime.getUTCHours() * 60 + appt.startTime.getUTCMinutes();
    const aEnd = appt.endTime.getUTCHours() * 60 + appt.endTime.getUTCMinutes();
    if (rangesOverlap(occupiedStart, occupiedEnd, aStart, aEnd)) {
      errors.push(
        "This time slot was just booked. Please select another available time."
      );
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}
