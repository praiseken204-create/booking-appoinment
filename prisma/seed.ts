import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean up in dependency order
  await prisma.providerEarning.deleteMany();
  await prisma.appointmentHistory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.blockedTime.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.cancellationPolicy.deleteMany();
  await prisma.service.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // ---- ADMIN ----
  const admin = await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@bookappoint.com",
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  // ---- CUSTOMERS ----
  const customers: { id: string; name: string; email: string; phone: string | null }[] = [];
  const customerNames = [
    ["John Doe", "john@example.com"],
    ["Jane Smith", "jane@example.com"],
    ["Ada Obi", "ada@example.com"],
    ["Musa Bello", "musa@example.com"],
    ["Grace Johnson", "grace@example.com"],
    ["David Okafor", "david@example.com"],
    ["Sarah Ade", "sarah@example.com"],
    ["Tunde Bakare", "tunde@example.com"],
  ];
  for (const [name, email] of customerNames) {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: "+2348000000000",
        passwordHash,
        role: "CUSTOMER",
        emailVerified: new Date(),
        preferences: {
          create: {},
        },
      },
    });
    customers.push(user);
  }

  // ---- PROVIDERS ----
  type SeedService = {
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    paymentRequirement: "NO_PAYMENT" | "FULL_PAYMENT" | "DEPOSIT" | "PAY_LATER";
    depositAmount: number;
    bufferBefore: number;
    bufferAfter: number;
  };
  type SeedProvider = {
    user: { name: string; email: string };
    businessName: string;
    bio: string;
    category: string;
    location: string;
    address: string;
    isVerified: boolean;
    verificationStatus: string;
    services: SeedService[];
  };
  const providers: SeedProvider[] = [
    {
      user: { name: "Elite Barbers", email: "elite@provider.com" },
      businessName: "Elite Barbers",
      bio: "Premium barbering and grooming services in the heart of the city. Experienced barbers, premium products, and a relaxed atmosphere.",
      category: "Beauty",
      location: "Lagos, Nigeria",
      address: "12 Adeola Odeku St, Victoria Island",
      isVerified: true,
      verificationStatus: "VERIFIED",
      services: [
        {
          name: "Men's Haircut",
          description: "Classic haircut with consultation and styling.",
          durationMinutes: 45,
          price: 5000,
          paymentRequirement: "DEPOSIT",
          depositAmount: 2000,
          bufferBefore: 10,
          bufferAfter: 10,
        },
        {
          name: "Premium Haircut",
          description: "Full grooming experience with hot towel and beard trim.",
          durationMinutes: 60,
          price: 8000,
          paymentRequirement: "DEPOSIT",
          depositAmount: 3000,
          bufferBefore: 10,
          bufferAfter: 15,
        },
        {
          name: "Beard Trim",
          description: "Precision beard trimming and shaping.",
          durationMinutes: 30,
          price: 2500,
          paymentRequirement: "NO_PAYMENT",
          depositAmount: 0,
          bufferBefore: 5,
          bufferAfter: 5,
        },
      ],
    },
    {
      user: { name: "Hamza Wellness Clinic", email: "hamza@provider.com" },
      businessName: "Hamza Wellness Clinic",
      bio: "Consultations and wellness services with qualified health professionals.",
      category: "Health",
      location: "Abuja, Nigeria",
      address: "5 Gana Street, Maitama",
      isVerified: true,
      verificationStatus: "VERIFIED",
      services: [
        {
          name: "General Consultation",
          description: "45-minute general health consultation.",
          durationMinutes: 45,
          price: 15000,
          paymentRequirement: "FULL_PAYMENT",
          depositAmount: 0,
          bufferBefore: 5,
          bufferAfter: 5,
        },
        {
          name: "Health Checkup",
          description: "Comprehensive routine health checkup.",
          durationMinutes: 90,
          price: 35000,
          paymentRequirement: "DEPOSIT",
          depositAmount: 10000,
          bufferBefore: 15,
          bufferAfter: 15,
        },
      ],
    },
    {
      user: { name: "FitZone Training", email: "fitzone@provider.com" },
      businessName: "FitZone Training",
      bio: "Personal training and fitness coaching tailored to your goals.",
      category: "Fitness",
      location: "Lagos, Nigeria",
      address: "22 Admiralty Way, Lekki Phase 1",
      isVerified: true,
      verificationStatus: "VERIFIED",
      services: [
        {
          name: "Personal Training Session",
          description: "1-on-1 personal training session.",
          durationMinutes: 60,
          price: 10000,
          paymentRequirement: "PAY_LATER",
          depositAmount: 0,
          bufferBefore: 10,
          bufferAfter: 10,
        },
        {
          name: "Nutrition Consultation",
          description: "Personalized nutrition and meal planning.",
          durationMinutes: 45,
          price: 12000,
          paymentRequirement: "DEPOSIT",
          depositAmount: 4000,
          bufferBefore: 5,
          bufferAfter: 5,
        },
      ],
    },
    {
      user: { name: "LensCraft Photography", email: "lenscraft@provider.com" },
      businessName: "LensCraft Photography",
      bio: "Professional photography for events, portraits, and commercial work.",
      category: "Photography",
      location: "Ibadan, Nigeria",
      address: "8 Basorun Road, Ibadan",
      isVerified: false,
      verificationStatus: "PENDING",
      services: [
        {
          name: "Portrait Photography",
          description: "Studio portrait photography session.",
          durationMinutes: 60,
          price: 20000,
          paymentRequirement: "DEPOSIT",
          depositAmount: 5000,
          bufferBefore: 15,
          bufferAfter: 15,
        },
      ],
    },
  ];

  const providerIds: string[] = [];
  const serviceMap: Record<string, string[]> = {};

  for (const p of providers) {
    const user = await prisma.user.create({
      data: {
        name: p.user.name,
        email: p.user.email,
        phone: "+2348110000000",
        passwordHash,
        role: "PROVIDER",
        emailVerified: new Date(),
      },
    });

    const profile = await prisma.providerProfile.create({
      data: {
        userId: user.id,
        businessName: p.businessName,
        bio: p.bio,
        category: p.category,
        location: p.location,
        address: p.address,
        isVerified: p.isVerified,
        verificationStatus: p.verificationStatus as never,
        contactEmail: p.user.email,
        contactPhone: "+2348110000000",
        policies: {
          create: {},
        },
      },
    });

    providerIds.push(profile.id);
    serviceMap[profile.id] = [];

    // Availability: Mon-Fri 9-6, Sat 10-4
    const availability = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "18:00" },
      { dayOfWeek: 6, startTime: "10:00", endTime: "16:00" },
    ];

    for (const a of availability) {
      await prisma.availability.create({
        data: { providerId: profile.id, ...a },
      });
    }

    for (const s of p.services) {
      const service = await prisma.service.create({
        data: { providerId: profile.id, ...s },
      });
      serviceMap[profile.id].push(service.id);
    }
  }

  // ---- Create some sample upcoming appointments ----
  const isToday = (date: Date) => {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  // Helper to build a date at a given hour in the future
  const inDays = (days: number, hour: number, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(8 + (days % 10), 30, 0, 0);
    return d;
  };

  async function createSampleAppointments() {
    const eliteProfile = await prisma.providerProfile.findFirst({
      where: { businessName: "Elite Barbers" },
    });
    const hamzaProfile = await prisma.providerProfile.findFirst({
      where: { businessName: "Hamza Wellness Clinic" },
    });
    const fitProfile = await prisma.providerProfile.findFirst({
      where: { businessName: "FitZone Training" },
    });

    if (!eliteProfile || !hamzaProfile || !fitProfile) return;

    const eliteServices = await prisma.service.findMany({
      where: { providerId: eliteProfile.id },
    });
    const hamzaServices = await prisma.service.findMany({
      where: { providerId: hamzaProfile.id },
    });
    const fitServices = await prisma.service.findMany({
      where: { providerId: fitProfile.id },
    });

    const now = new Date();
    now.setSeconds(0, 0);

    // Today's appointments for providers
    const today = new Date();
    today.setDate(today.getDate());
    const appt1Start = new Date(today);
    appt1Start.setHours(10, 0, 0, 0);
    const appt1End = new Date(appt1Start);
    appt1End.setMinutes(appt1Start.getMinutes() + (eliteServices[0]?.durationMinutes || 45));

    const a1 = await prisma.appointment.create({
      data: {
        bookingReference: "BK-SEED001",
        customerId: customers[0].id,
        providerId: eliteProfile.id,
        serviceId: eliteServices[0].id,
        startTime: appt1Start,
        endTime: appt1End,
        customerName: customers[0].name,
        customerPhone: customers[0].phone,
        status: "CONFIRMED",
        customerNotes: "Corporate client, prefer clean classic cut.",
        history: {
          create: [
            {
              action: "BOOKING_CREATED",
              newStatus: "PENDING",
              changedBy: "SYSTEM",
            },
          ],
        },
      },
    });

    await prisma.payment.create({
      data: {
        appointmentId: a1.id,
        customerId: customers[0].id,
        providerId: eliteProfile.id,
        amount: eliteServices[0].depositAmount,
        currency: "NGN",
        paymentProvider: "mock",
        transactionReference: "REF-SEED001",
        paymentType: "DEPOSIT",
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // Upcoming appointment (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appt2Start = new Date(tomorrow);
    appt2Start.setHours(14, 0, 0, 0);
    const appt2End = new Date(appt2Start);
    appt2End.setMinutes(appt2Start.getMinutes() + (hamzaServices[0]?.durationMinutes || 45));

    const a2 = await prisma.appointment.create({
      data: {
        bookingReference: "BK-SEED002",
        customerId: customers[1].id,
        providerId: hamzaProfile.id,
        serviceId: hamzaServices[0].id,
        startTime: appt2Start,
        endTime: appt2End,
        customerName: customers[1].name,
        customerPhone: customers[1].phone,
        status: "CONFIRMED",
      },
    });

    await prisma.payment.create({
      data: {
        appointmentId: a2.id,
        customerId: customers[1].id,
        providerId: hamzaProfile.id,
        amount: hamzaServices[0].price,
        currency: "NGN",
        paymentProvider: "mock",
        transactionReference: "REF-SEED002",
        paymentType: "FULL_PAYMENT",
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // A completed appointment ready for review
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    const appt3Start = new Date(pastDate);
    appt3Start.setHours(11, 0, 0, 0);
    const appt3End = new Date(appt3Start);
    appt3End.setMinutes(appt3Start.getMinutes() + (fitServices[0]?.durationMinutes || 60));

    const a3 = await prisma.appointment.create({
      data: {
        bookingReference: "BK-SEED003",
        customerId: customers[0].id,
        providerId: fitProfile.id,
        serviceId: fitServices[0].id,
        startTime: appt3Start,
        endTime: appt3End,
        customerName: customers[0].name,
        customerPhone: customers[0].phone,
        status: "COMPLETED",
      },
    });

    await prisma.review.create({
      data: {
        appointmentId: a3.id,
        customerId: customers[0].id,
        providerId: fitProfile.id,
        rating: 5,
        comment: "Great trainer, very professional and motivating!",
      },
    });

    // A cancelled appointment
    const cancelledStart = new Date();
    cancelledStart.setDate(cancelledStart.getDate() - 1);
    cancelledStart.setHours(9, 0, 0, 0);
    const cancelledEnd = new Date(cancelledStart);
    cancelledEnd.setMinutes(cancelledStart.getMinutes() + 45);

    await prisma.appointment.create({
      data: {
        bookingReference: "BK-SEED004",
        customerId: customers[2].id,
        providerId: eliteProfile.id,
        serviceId: eliteServices[0].id,
        startTime: cancelledStart,
        endTime: cancelledEnd,
        customerName: customers[2].name,
        customerPhone: customers[2].phone,
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: "Customer requested cancellation",
        history: {
          create: [
            {
              action: "BOOKING_CANCELLED",
              previousStatus: "CONFIRMED",
              newStatus: "CANCELLED",
              changedBy: "SYSTEM",
            },
          ],
        },
      },
    });

    // A pending appointment for a provider
    const pendingStart = new Date();
    pendingStart.setDate(pendingStart.getDate() + 2);
    pendingStart.setHours(10, 0, 0, 0);
    const pendingEnd = new Date(pendingStart);
    pendingEnd.setMinutes(pendingStart.getMinutes() + (eliteServices[0]?.durationMinutes || 45));

    const a5 = await prisma.appointment.create({
      data: {
        bookingReference: "BK-SEED005",
        customerId: customers[3].id,
        providerId: eliteProfile.id,
        serviceId: eliteServices[0].id,
        startTime: pendingStart,
        endTime: pendingEnd,
        customerName: customers[3].name,
        customerPhone: customers[3].phone,
        status: "PENDING",
      },
    });

    // Notification for customers
    await prisma.notification.createMany({
      data: [
        {
          userId: customers[0].id,
          type: "BOOKING_CONFIRMATION",
          title: "Booking confirmed",
          message: `Your appointment at Elite Barbers for ${eliteServices[0].name} is confirmed.`,
          relatedAppointmentId: a1.id,
        },
        {
          userId: customers[1].id,
          type: "BOOKING_CONFIRMATION",
          title: "Booking confirmed",
          message: `Your appointment at Hamza Wellness Clinic for ${hamzaServices[0].name} is confirmed.`,
          relatedAppointmentId: a2.id,
        },
        {
          userId: customers[0].id,
          type: "APPOINTMENT_REMINDER",
          title: "Payment reminder",
          message: `Your appointment with FitZone Training is coming up.`,
          relatedAppointmentId: a3.id,
        },
      ],
    });
  }

  await createSampleAppointments();

  console.log(`Seeded:
  - 1 admin
  - ${customers.length} customers
  - ${providers.length} providers
  - ${Object.values(serviceMap).flat().length} services
  - sample appointments & reviews
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
