"use client";

import * as React from "react";
import { AppointmentActions } from "./actions";
import { RescheduleModal } from "./reschedule-modal";

export function AppointmentManage({
  appointmentId,
  providerId,
  serviceId,
  duration,
  status,
}: {
  appointmentId: string;
  providerId: string;
  serviceId: string;
  duration: number;
  status: string;
}) {
  const [showReschedule, setShowReschedule] = React.useState(false);

  if (!["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "RESCHEDULED"].includes(status)) {
    return null;
  }

  return (
    <>
      <AppointmentActions
        appointmentId={appointmentId}
        status={status}
        onReschedule={() => setShowReschedule(true)}
      />
      <RescheduleModal
        open={showReschedule}
        onClose={() => setShowReschedule(false)}
        appointmentId={appointmentId}
        providerId={providerId}
        serviceId={serviceId}
        duration={duration}
      />
    </>
  );
}