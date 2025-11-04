'use client';

import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import DayTabs from './DayTabs';
import ActivityBlock from './ActivityBlock';
import { useItineraryBuilder } from '@/hooks/useItineraryBuilder';
import type { ItineraryData } from '@/types/itinerary-builder-types';

export interface ItineraryBuilderProps {
  startDate: Date;
  endDate: Date;
  onChange: (itinerary: ItineraryData) => void;
  defaultTemplate?: string;
}

/**
 * ItineraryBuilder - Main container for building trip itineraries
 */
const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const {
    days,
    selectedDay,
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    selectDay,
    getItineraryData,
  } = useItineraryBuilder(startDate, endDate);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = activities.findIndex((a) => a.id === active.id);
      const newIndex = activities.findIndex((a) => a.id === over.id);

      // Reorder logic would go here
      // For now, we'll keep it simple
    }
  };

  // Update parent on change
  React.useEffect(() => {
    onChange(getItineraryData());
  }, [days, onChange, getItineraryData]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Day Navigation Tabs */}
      <DayTabs
        days={days}
        selectedDay={selectedDay}
        onSelectDay={selectDay}
      />

      {/* Activities List */}
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {days[selectedDay - 1]?.title || `Day ${selectedDay}`} Activities
          </h3>
          <button
            onClick={() => addActivity(selectedDay)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-modernSg text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        </div>

        {/* Activity Blocks */}
        {activities.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No activities added yet</p>
            <button
              onClick={() => addActivity(selectedDay)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-modernSg text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Activity
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activities.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <ActivityBlock
                    key={activity.id}
                    activity={activity}
                    index={index}
                    onUpdate={updateActivity}
                    onDelete={deleteActivity}
                    onDuplicate={(id) => {
                      // Duplicate logic
                      const activityToDuplicate = activities.find((a) => a.id === id);
                      if (activityToDuplicate) {
                        addActivity(selectedDay);
                        // Copy properties to new activity
                      }
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Helper Text */}
        <p className="mt-4 text-sm text-gray-500 text-center">
          Drag activities to reorder them, or use the up/down buttons
        </p>
      </div>
    </div>
  );
};

ItineraryBuilder.displayName = 'ItineraryBuilder';

export default ItineraryBuilder;
