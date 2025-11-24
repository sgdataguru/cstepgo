import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Service to handle automatic offline status for inactive drivers
 * This should be run periodically (e.g., every 5 minutes) as a cron job or background task
 */
export class DriverAvailabilityService {
  /**
   * Set drivers to offline if they've been inactive for longer than their configured timeout
   */
  static async setInactiveDriversOffline(): Promise<{
    updated: number;
    drivers: Array<{ id: string; driverId: string; lastActivityAt: Date | null }>;
  }> {
    const now = new Date();
    
    // Find drivers who are AVAILABLE or BUSY but haven't been active within their timeout window
    // Using Prisma's type-safe methods to avoid SQL injection
    const drivers = await prisma.driver.findMany({
      where: {
        status: 'APPROVED',
        availability: {
          in: ['AVAILABLE', 'BUSY']
        },
        OR: [
          {
            lastActivityAt: null
          },
          {
            lastActivityAt: {
              lt: new Date(Date.now() - 30 * 60 * 1000) // Default 30 minutes if not set
            }
          }
        ]
      }
    });
    
    // Filter by individual auto_offline_minutes
    const inactiveDrivers = drivers.filter(driver => {
      if (!driver.lastActivityAt) return true;
      const inactiveMinutes = (now.getTime() - driver.lastActivityAt.getTime()) / (1000 * 60);
      return inactiveMinutes >= driver.autoOfflineMinutes;
    });
    
    const updatedDrivers: Array<{ id: string; driverId: string; lastActivityAt: Date | null }> = [];
    
    for (const driver of inactiveDrivers) {
      try {
        const previousAvailability = driver.availability;
        
        // Update driver to offline
        const updatedDriver = await prisma.driver.update({
          where: { id: driver.id },
          data: {
            availability: 'OFFLINE',
            updatedAt: now
          }
        });
        
        // Log the change
        await prisma.driverAvailabilityHistory.create({
          data: {
            driverId: driver.id,
            previousStatus: previousAvailability,
            newStatus: 'OFFLINE',
            changeReason: `Auto-offline after ${driver.autoOfflineMinutes} minutes of inactivity`,
            triggeredBy: 'system',
            metadata: {
              lastActivityAt: driver.lastActivityAt,
              autoOfflineMinutes: driver.autoOfflineMinutes
            }
          }
        });
        
        updatedDrivers.push({
          id: driver.id,
          driverId: driver.driverId,
          lastActivityAt: driver.lastActivityAt
        });
      } catch (error) {
        console.error(`Failed to set driver ${driver.driverId} offline:`, error);
      }
    }
    
    return {
      updated: updatedDrivers.length,
      drivers: updatedDrivers
    };
  }
  
  /**
   * Check and activate scheduled breaks/unavailability periods
   */
  static async activateScheduledBreaks(): Promise<{
    activated: number;
    schedules: Array<{ id: string; driverId: string; scheduleType: string }>;
  }> {
    const now = new Date();
    
    // Find schedules that should be active now but driver hasn't been set to that status
    const activeSchedules = await prisma.driverAvailabilitySchedule.findMany({
      where: {
        isActive: true,
        startTime: {
          lte: now
        },
        endTime: {
          gte: now
        }
      },
      include: {
        driver: {
          select: {
            id: true,
            driverId: true,
            availability: true,
            status: true
          }
        }
      }
    });
    
    const activatedSchedules: Array<{ id: string; driverId: string; scheduleType: string }> = [];
    
    for (const schedule of activeSchedules) {
      // Skip if driver is not approved
      if (schedule.driver.status !== 'APPROVED') {
        continue;
      }
      
      // Determine target status based on schedule type
      const targetStatus = schedule.scheduleType === 'break' ? 'BUSY' : 'OFFLINE';
      
      // Skip if driver is already in the correct status
      if (schedule.driver.availability === targetStatus) {
        continue;
      }
      
      try {
        // Update driver availability
        await prisma.driver.update({
          where: { id: schedule.driver.id },
          data: {
            availability: targetStatus,
            updatedAt: now
          }
        });
        
        // Log the change
        await prisma.driverAvailabilityHistory.create({
          data: {
            driverId: schedule.driver.id,
            previousStatus: schedule.driver.availability,
            newStatus: targetStatus,
            changeReason: `Scheduled ${schedule.scheduleType}: ${schedule.reason || 'No reason provided'}`,
            triggeredBy: 'system',
            metadata: {
              scheduleId: schedule.id,
              scheduleType: schedule.scheduleType,
              startTime: schedule.startTime,
              endTime: schedule.endTime
            }
          }
        });
        
        activatedSchedules.push({
          id: schedule.id,
          driverId: schedule.driver.driverId,
          scheduleType: schedule.scheduleType
        });
      } catch (error) {
        console.error(`Failed to activate schedule for driver ${schedule.driver.driverId}:`, error);
      }
    }
    
    return {
      activated: activatedSchedules.length,
      schedules: activatedSchedules
    };
  }
  
  /**
   * Check and deactivate expired scheduled breaks/unavailability periods
   */
  static async deactivateExpiredBreaks(): Promise<{
    deactivated: number;
    schedules: Array<{ id: string; driverId: string }>;
  }> {
    const now = new Date();
    
    // Find schedules that have ended but driver might still be in break/offline status
    const expiredSchedules = await prisma.driverAvailabilitySchedule.findMany({
      where: {
        isActive: true,
        endTime: {
          lte: now
        }
      },
      include: {
        driver: {
          select: {
            id: true,
            driverId: true,
            availability: true,
            status: true
          }
        }
      }
    });
    
    const deactivatedSchedules: Array<{ id: string; driverId: string }> = [];
    
    for (const schedule of expiredSchedules) {
      try {
        // Check if there are any other active schedules for this driver
        const otherActiveSchedules = await prisma.driverAvailabilitySchedule.count({
          where: {
            driverId: schedule.driver.id,
            isActive: true,
            id: { not: schedule.id },
            startTime: { lte: now },
            endTime: { gte: now }
          }
        });
        
        // Only set driver back to AVAILABLE if no other schedules are active
        if (otherActiveSchedules === 0 && schedule.driver.status === 'APPROVED') {
          await prisma.driver.update({
            where: { id: schedule.driver.id },
            data: {
              availability: 'AVAILABLE',
              updatedAt: now
            }
          });
          
          // Log the change
          await prisma.driverAvailabilityHistory.create({
            data: {
              driverId: schedule.driver.id,
              previousStatus: schedule.driver.availability,
              newStatus: 'AVAILABLE',
              changeReason: `Scheduled ${schedule.scheduleType} ended`,
              triggeredBy: 'system',
              metadata: {
                scheduleId: schedule.id,
                scheduleType: schedule.scheduleType,
                endTime: schedule.endTime
              }
            }
          });
        }
        
        deactivatedSchedules.push({
          id: schedule.id,
          driverId: schedule.driver.driverId
        });
      } catch (error) {
        console.error(`Failed to deactivate schedule for driver ${schedule.driver.driverId}:`, error);
      }
    }
    
    return {
      deactivated: deactivatedSchedules.length,
      schedules: deactivatedSchedules
    };
  }
  
  /**
   * Run all availability maintenance tasks
   * This is the main method to call from a cron job
   */
  static async runMaintenanceTasks(): Promise<{
    timestamp: Date;
    inactiveDriversOffline: number;
    schedulesActivated: number;
    schedulesDeactivated: number;
  }> {
    console.log('[DriverAvailabilityService] Running maintenance tasks...');
    
    const [inactiveResult, activatedResult, deactivatedResult] = await Promise.all([
      this.setInactiveDriversOffline(),
      this.activateScheduledBreaks(),
      this.deactivateExpiredBreaks()
    ]);
    
    const result = {
      timestamp: new Date(),
      inactiveDriversOffline: inactiveResult.updated,
      schedulesActivated: activatedResult.activated,
      schedulesDeactivated: deactivatedResult.deactivated
    };
    
    console.log('[DriverAvailabilityService] Maintenance complete:', result);
    
    return result;
  }
}
