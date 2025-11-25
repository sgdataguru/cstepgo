import { prisma } from '@/lib/prisma';
import type {
  CreateActivityInput,
  UpdateActivityInput,
  OwnerActivitiesQuery,
  ActivityBookingsQuery,
} from '@/lib/validations/activitySchemas';

/**
 * Activity Service
 * Handles all business logic for activity management
 */

// Get all activities for an owner
export async function getOwnerActivities(
  ownerId: string,
  query: OwnerActivitiesQuery
) {
  const { status, page, limit, sortBy, sortOrder } = query;
  
  // Build where clause
  const where: any = { ownerId };
  
  if (status !== 'ALL') {
    where.status = status;
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Build orderBy
  const orderBy: any = {};
  if (sortBy === 'bookings') {
    orderBy.totalBookings = sortOrder;
  } else {
    orderBy[sortBy] = sortOrder;
  }
  
  // Fetch activities with pagination
  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        photos: {
          where: { isCover: true },
          take: 1,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    }),
    prisma.activity.count({ where }),
  ]);
  
  // Calculate stats
  const stats = await prisma.activity.groupBy({
    by: ['status'],
    where: { ownerId },
    _count: true,
  });
  
  const statsMap = stats.reduce((acc, stat) => {
    acc[stat.status.toLowerCase()] = stat._count;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    activities: activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      category: activity.category,
      status: activity.status,
      thumbnailUrl: activity.photos[0]?.thumbnailUrl || '',
      location: {
        city: activity.city,
        address: activity.address,
      },
      pricePerPerson: activity.pricePerPerson,
      currency: activity.currency,
      maxParticipants: activity.maxParticipants,
      totalBookings: activity.totalBookings,
      upcomingBookings: activity._count.bookings,
      totalRevenue: activity.totalRevenue,
      averageRating: activity.averageRating || 0,
      reviewCount: activity.reviewCount,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      publishedAt: activity.publishedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      total,
      active: statsMap['active'] || 0,
      draft: statsMap['draft'] || 0,
      pendingApproval: statsMap['pending_approval'] || 0,
    },
  };
}

// Get single activity detail
export async function getActivity(activityId: string, ownerId?: string) {
  const where: any = { id: activityId };
  
  // If ownerId provided, ensure the activity belongs to this owner
  if (ownerId) {
    where.ownerId = ownerId;
  }
  
  const activity = await prisma.activity.findUnique({
    where,
    include: {
      photos: {
        orderBy: { order: 'asc' },
      },
      schedules: {
        orderBy: { dayOfWeek: 'asc' },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });
  
  if (!activity) {
    return null;
  }
  
  // Calculate booking stats
  const bookingStats = await prisma.activityBooking.groupBy({
    by: ['status'],
    where: { activityId: activity.id },
    _sum: {
      totalAmount: true,
      participants: true,
    },
    _count: true,
  });
  
  const statsMap = bookingStats.reduce((acc, stat) => {
    acc[stat.status.toLowerCase()] = {
      count: stat._count,
      revenue: Number(stat._sum.totalAmount || 0),
      participants: stat._sum.participants || 0,
    };
    return acc;
  }, {} as Record<string, any>);
  
  return {
    ...activity,
    bookingStats: {
      total: activity._count.bookings,
      upcoming: statsMap['confirmed']?.count || 0,
      completed: statsMap['completed']?.count || 0,
      cancelled: statsMap['cancelled']?.count || 0,
      revenue: Number(activity.totalRevenue),
    },
  };
}

// Create new activity
export async function createActivity(
  ownerId: string,
  data: CreateActivityInput
) {
  const {
    title,
    description,
    category,
    location,
    pricePerPerson,
    groupPricing,
    minParticipants,
    maxParticipants,
    durationMinutes,
    scheduleType,
    schedules,
    availableDays,
    blackoutDates,
    advanceBookingDays,
    cancellationPolicy,
    inclusions,
    exclusions,
    requirements,
    photoIds,
    status,
  } = data;
  
  // Create activity with related data in a transaction
  const activity = await prisma.$transaction(async (tx) => {
    // Create the activity
    const newActivity = await tx.activity.create({
      data: {
        ownerId,
        title,
        description,
        category,
        address: location.address,
        city: location.city,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        placeId: location.placeId,
        pricePerPerson,
        groupPricing: groupPricing as any,
        minParticipants,
        maxParticipants,
        durationMinutes,
        scheduleType,
        availableDays: availableDays || [],
        blackoutDates: blackoutDates?.map(d => new Date(d)) || [],
        advanceBookingDays,
        cancellationPolicy: cancellationPolicy as any,
        inclusions,
        exclusions,
        requirements,
        status,
      },
    });
    
    // Create schedules
    if (schedules && schedules.length > 0) {
      await tx.activitySchedule.createMany({
        data: schedules.map((schedule) => ({
          activityId: newActivity.id,
          dayOfWeek: schedule.dayOfWeek || null,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isRecurring: schedule.isRecurring,
          specificDate: schedule.specificDate ? new Date(schedule.specificDate) : null,
        })),
      });
    }
    
    // Link photos (assuming they were uploaded separately)
    if (photoIds && photoIds.length > 0) {
      await tx.activityPhoto.updateMany({
        where: {
          id: { in: photoIds },
        },
        data: {
          activityId: newActivity.id,
        },
      });
      
      // Set first photo as cover
      await tx.activityPhoto.update({
        where: { id: photoIds[0] },
        data: { isCover: true },
      });
    }
    
    // Update owner stats
    await tx.activityOwner.update({
      where: { id: ownerId },
      data: {
        totalActivities: { increment: 1 },
        activeActivities: status === 'ACTIVE' ? { increment: 1 } : undefined,
      },
    });
    
    return newActivity;
  });
  
  return activity;
}

// Update existing activity
export async function updateActivity(
  activityId: string,
  ownerId: string,
  data: UpdateActivityInput
) {
  // First verify ownership
  const existing = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { ownerId: true, status: true },
  });
  
  if (!existing || existing.ownerId !== ownerId) {
    throw new Error('Activity not found or unauthorized');
  }
  
  const {
    title,
    description,
    category,
    location,
    pricePerPerson,
    groupPricing,
    minParticipants,
    maxParticipants,
    durationMinutes,
    scheduleType,
    schedules,
    availableDays,
    blackoutDates,
    advanceBookingDays,
    cancellationPolicy,
    inclusions,
    exclusions,
    requirements,
    photoIds,
    status,
  } = data;
  
  const activity = await prisma.$transaction(async (tx) => {
    // Update the activity
    const updated = await tx.activity.update({
      where: { id: activityId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(location && {
          address: location.address,
          city: location.city,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
          placeId: location.placeId,
        }),
        ...(pricePerPerson && { pricePerPerson }),
        ...(groupPricing && { groupPricing: groupPricing as any }),
        ...(minParticipants && { minParticipants }),
        ...(maxParticipants && { maxParticipants }),
        ...(durationMinutes && { durationMinutes }),
        ...(scheduleType && { scheduleType }),
        ...(availableDays && { availableDays }),
        ...(blackoutDates && { blackoutDates: blackoutDates.map((d: string) => new Date(d)) }),
        ...(advanceBookingDays && { advanceBookingDays }),
        ...(cancellationPolicy && { cancellationPolicy: cancellationPolicy as any }),
        ...(inclusions && { inclusions }),
        ...(exclusions !== undefined && { exclusions }),
        ...(requirements !== undefined && { requirements }),
        ...(status && { status }),
      },
    });
    
    // Update schedules if provided
    if (schedules) {
      // Delete existing schedules
      await tx.activitySchedule.deleteMany({
        where: { activityId },
      });
      
      // Create new schedules
      await tx.activitySchedule.createMany({
        data: schedules.map((schedule: any) => ({
          activityId,
          dayOfWeek: schedule.dayOfWeek || null,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isRecurring: schedule.isRecurring,
          specificDate: schedule.specificDate ? new Date(schedule.specificDate) : null,
        })),
      });
    }
    
    // Update photos if provided
    if (photoIds && photoIds.length > 0) {
      // Unlink old photos (don't delete, they might be reused)
      await tx.activityPhoto.updateMany({
        where: { activityId },
        data: { activityId: null as any }, // This might need adjustment based on schema
      });
      
      // Link new photos
      await tx.activityPhoto.updateMany({
        where: { id: { in: photoIds } },
        data: { activityId },
      });
      
      // Set first photo as cover
      await tx.activityPhoto.update({
        where: { id: photoIds[0] },
        data: { isCover: true },
      });
    }
    
    // Update owner stats if status changed
    if (status && status !== existing.status) {
      const oldActive = existing.status === 'ACTIVE';
      const newActive = status === 'ACTIVE';
      
      if (oldActive !== newActive) {
        await tx.activityOwner.update({
          where: { id: ownerId },
          data: {
            activeActivities: newActive ? { increment: 1 } : { decrement: 1 },
          },
        });
      }
    }
    
    return updated;
  });
  
  return activity;
}

// Delete activity
export async function deleteActivity(activityId: string, ownerId: string) {
  // Verify ownership
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      ownerId: true,
      status: true,
      _count: {
        select: { bookings: true },
      },
    },
  });
  
  if (!activity || activity.ownerId !== ownerId) {
    throw new Error('Activity not found or unauthorized');
  }
  
  // If there are bookings, soft delete (archive) instead
  if (activity._count.bookings > 0) {
    await prisma.activity.update({
      where: { id: activityId },
      data: { status: 'ARCHIVED' },
    });
    
    return { archived: true };
  }
  
  // Otherwise, hard delete
  await prisma.$transaction(async (tx) => {
    // Delete related data
    await tx.activitySchedule.deleteMany({ where: { activityId } });
    await tx.activityPhoto.deleteMany({ where: { activityId } });
    
    // Delete the activity
    await tx.activity.delete({ where: { id: activityId } });
    
    // Update owner stats
    await tx.activityOwner.update({
      where: { id: ownerId },
      data: {
        totalActivities: { decrement: 1 },
        activeActivities: activity.status === 'ACTIVE' ? { decrement: 1 } : undefined,
      },
    });
  });
  
  return { archived: false };
}

// Toggle activity status
export async function toggleActivityStatus(
  activityId: string,
  ownerId: string,
  newStatus: 'ACTIVE' | 'INACTIVE'
) {
  // Verify ownership
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { ownerId: true, status: true },
  });
  
  if (!activity || activity.ownerId !== ownerId) {
    throw new Error('Activity not found or unauthorized');
  }
  
  // Cannot activate if pending approval
  if (newStatus === 'ACTIVE' && activity.status === 'PENDING_APPROVAL') {
    throw new Error('Cannot activate activity pending approval');
  }
  
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.activity.update({
      where: { id: activityId },
      data: { status: newStatus },
    });
    
    // Update owner stats
    const oldActive = activity.status === 'ACTIVE';
    const newActive = newStatus === 'ACTIVE';
    
    if (oldActive !== newActive) {
      await tx.activityOwner.update({
        where: { id: ownerId },
        data: {
          activeActivities: newActive ? { increment: 1 } : { decrement: 1 },
        },
      });
    }
    
    return result;
  });
  
  return updated;
}

// Get activity bookings
export async function getActivityBookings(
  activityId: string,
  ownerId: string,
  query: ActivityBookingsQuery
) {
  // Verify ownership
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { ownerId: true },
  });
  
  if (!activity || activity.ownerId !== ownerId) {
    throw new Error('Activity not found or unauthorized');
  }
  
  const { status, startDate, endDate, page, limit } = query;
  
  // Build where clause
  const where: any = { activityId };
  
  if (status) {
    where.status = status === 'UPCOMING' ? 'CONFIRMED' : status.toUpperCase();
  }
  
  if (startDate || endDate) {
    where.scheduledDate = {};
    if (startDate) where.scheduledDate.gte = new Date(startDate);
    if (endDate) where.scheduledDate.lte = new Date(endDate);
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Fetch bookings
  const [bookings, total] = await Promise.all([
    prisma.activityBooking.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      skip,
      take: limit,
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    prisma.activityBooking.count({ where }),
  ]);
  
  // Calculate summary
  const summary = await prisma.activityBooking.aggregate({
    where,
    _sum: {
      participants: true,
      totalAmount: true,
    },
    _avg: {
      participants: true,
    },
  });
  
  return {
    bookings: bookings.map((booking) => ({
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      participants: booking.participants,
      leadPassenger: {
        name: booking.passenger.name,
        email: booking.passenger.email,
        phone: booking.passenger.phone || '',
      },
      totalAmount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      createdAt: booking.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    summary: {
      totalParticipants: summary._sum.participants || 0,
      totalRevenue: Number(summary._sum.totalAmount || 0),
      averageGroupSize: summary._avg.participants || 0,
    },
  };
}
