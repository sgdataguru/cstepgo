'use client';

import React, { useState } from 'react';
import { GripVertical, Trash2, ChevronDown, ChevronUp, Copy, MapPin } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Activity, ActivityType } from '@/types/trip-types';

export interface ActivityBlockProps {
  activity: Activity;
  index: number;
  onUpdate: (id: string, updates: Partial<Activity>) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const activityTypeOptions: { value: ActivityType; label: string }[] = [
  { value: 'transport', label: 'Transport' },
  { value: 'activity', label: 'Activity' },
  { value: 'meal', label: 'Meal' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'other', label: 'Other' },
];

/**
 * ActivityBlock - Draggable activity item in itinerary builder
 */
const ActivityBlock: React.FC<ActivityBlockProps> = ({
  activity,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleUpdate = (field: keyof Activity, value: any) => {
    onUpdate(activity.id, { [field]: value });
  };

  const handleLocationUpdate = (field: string, value: string) => {
    onUpdate(activity.id, {
      location: {
        ...activity.location,
        [field]: value,
      },
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white border-2 rounded-lg transition-all duration-200
        ${isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-t-lg border-b border-gray-200">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </button>

        {/* Activity Number */}
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-modernSg text-white text-sm font-bold">
          {index + 1}
        </span>

        {/* Activity Type */}
        <select
          value={activity.type}
          onChange={(e) => handleUpdate('type', e.target.value as ActivityType)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-modernSg focus:border-transparent"
        >
          {activityTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {/* Actions */}
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(activity.id)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Duplicate activity"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>
        )}
        <button
          onClick={() => onDelete(activity.id)}
          className="p-1 hover:bg-red-100 rounded transition-colors"
          aria-label="Delete activity"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>

      {/* Content - Expandable */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={activity.startTime}
                onChange={(e) => handleUpdate('startTime', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time (Optional)
              </label>
              <input
                type="time"
                value={activity.endTime || ''}
                onChange={(e) => handleUpdate('endTime', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <input
              type="text"
              value={activity.location.name}
              onChange={(e) => handleLocationUpdate('name', e.target.value)}
              placeholder="Enter location name"
              className="input-field"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={activity.description}
              onChange={(e) => handleUpdate('description', e.target.value)}
              placeholder="Describe this activity..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={activity.notes || ''}
              onChange={(e) => handleUpdate('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={2}
              className="input-field resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

ActivityBlock.displayName = 'ActivityBlock';

export default ActivityBlock;
