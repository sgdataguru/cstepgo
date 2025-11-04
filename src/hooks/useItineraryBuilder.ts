import { useState, useCallback, useMemo } from 'react';
import { differenceInDays, addDays, format } from 'date-fns';
import type {
  ItineraryBuilderState,
  ItineraryData,
  Template,
  BuilderActivity,
} from '@/types/itinerary-builder-types';
import type { Activity, ItineraryDay } from '@/types/trip-types';

/**
 * Hook to manage itinerary builder state and operations
 */
export function useItineraryBuilder(startDate: Date, endDate: Date) {
  // Calculate number of days
  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Initialize days
  const initialDays: ItineraryDay[] = useMemo(() => {
    return Array.from({ length: totalDays }, (_, index) => ({
      dayNumber: index + 1,
      date: addDays(startDate, index),
      title: `Day ${index + 1}`,
      activities: [],
    }));
  }, [startDate, totalDays]);

  const [state, setState] = useState<ItineraryBuilderState>({
    days: initialDays,
    selectedDay: 1,
    activities: [],
    isDragging: false,
    draggedActivity: null,
    errors: {},
    template: null,
  });

  // Add activity to specific day
  const addActivity = useCallback((dayNumber: number) => {
    const newActivity: Activity = {
      id: `temp-${Date.now()}`,
      startTime: '09:00',
      location: {
        name: '',
      },
      type: 'activity',
      description: '',
      order: state.days[dayNumber - 1].activities.length,
    };

    setState((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              activities: [...day.activities, newActivity],
            }
          : day
      ),
    }));
  }, [state.days]);

  // Update activity
  const updateActivity = useCallback(
    (id: string, updates: Partial<Activity>) => {
      setState((prev) => ({
        ...prev,
        days: prev.days.map((day) => ({
          ...day,
          activities: day.activities.map((activity) =>
            activity.id === id ? { ...activity, ...updates } : activity
          ),
        })),
      }));
    },
    []
  );

  // Delete activity
  const deleteActivity = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      days: prev.days.map((day) => ({
        ...day,
        activities: day.activities.filter((activity) => activity.id !== id),
      })),
    }));
  }, []);

  // Move activity (reorder)
  const moveActivity = useCallback(
    (activityId: string, fromDay: number, toDay: number, toIndex: number) => {
      setState((prev) => {
        const fromDayData = prev.days.find((d) => d.dayNumber === fromDay);
        const activity = fromDayData?.activities.find((a) => a.id === activityId);

        if (!activity) return prev;

        // Remove from source day
        const updatedDays = prev.days.map((day) =>
          day.dayNumber === fromDay
            ? {
                ...day,
                activities: day.activities.filter((a) => a.id !== activityId),
              }
            : day
        );

        // Add to destination day at specified index
        return {
          ...prev,
          days: updatedDays.map((day) =>
            day.dayNumber === toDay
              ? {
                  ...day,
                  activities: [
                    ...day.activities.slice(0, toIndex),
                    { ...activity, order: toIndex },
                    ...day.activities.slice(toIndex),
                  ].map((a, idx) => ({ ...a, order: idx })),
                }
              : day
          ),
        };
      });
    },
    []
  );

  // Apply template
  const applyTemplate = useCallback((template: Template) => {
    setState((prev) => {
      const newDays = prev.days.map((day, dayIndex) => {
        const templateActivities = template.activities
          .filter((ta) => ta.dayOffset === dayIndex)
          .map((ta, actIndex) => ({
            id: `template-${Date.now()}-${actIndex}`,
            startTime: ta.defaultTime,
            location: {
              name: ta.location?.name || '',
              address: ta.location?.address,
            },
            type: ta.type,
            description: ta.description,
            order: actIndex,
          }));

        return {
          ...day,
          activities: [...day.activities, ...templateActivities],
        };
      });

      return {
        ...prev,
        days: newDays,
        template,
      };
    });
  }, []);

  // Get itinerary data for submission
  const getItineraryData = useCallback((): ItineraryData => {
    return {
      version: '1.0',
      days: state.days.map((day) => ({
        ...day,
        date: format(day.date, 'yyyy-MM-dd'),
      })),
    };
  }, [state.days]);

  // Select day
  const selectDay = useCallback((dayNumber: number) => {
    setState((prev) => ({ ...prev, selectedDay: dayNumber }));
  }, []);

  // Set dragging state
  const setDragging = useCallback((isDragging: boolean, activity?: Activity | null) => {
    setState((prev) => ({
      ...prev,
      isDragging,
      draggedActivity: activity || null,
    }));
  }, []);

  return {
    days: state.days,
    selectedDay: state.selectedDay,
    activities: state.days[state.selectedDay - 1]?.activities || [],
    isDragging: state.isDragging,
    draggedActivity: state.draggedActivity,
    errors: state.errors,
    template: state.template,
    totalDays,
    addActivity,
    updateActivity,
    deleteActivity,
    moveActivity,
    applyTemplate,
    selectDay,
    setDragging,
    getItineraryData,
  };
}
