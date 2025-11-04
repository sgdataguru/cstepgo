import type { Activity, ActivityType, ItineraryDay, Location } from './trip-types';

// Itinerary Builder State
export interface ItineraryBuilderState {
  days: ItineraryDay[];
  selectedDay: number;
  activities: Activity[];
  isDragging: boolean;
  draggedActivity: Activity | null;
  errors: Record<string, string>;
  template: Template | null;
}

// Activity with builder-specific fields
export interface BuilderActivity extends Activity {
  dayNumber: number;
  isExpanded: boolean;
  tempId?: string; // For unsaved activities
}

// Templates
export interface Template {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  thumbnail?: string;
  category: string;
  activities: TemplateActivity[];
}

export interface TemplateActivity {
  dayOffset: number; // Which day (0-based)
  defaultTime: string; // HH:mm format
  type: ActivityType;
  title: string;
  description: string;
  duration: number; // minutes
  location?: Partial<Location>;
}

// Form data structures
export interface ActivityFormData {
  startTime: string;
  endTime?: string;
  location: Location | null;
  type: ActivityType;
  description: string;
  notes?: string;
}

export interface ItineraryBuilderProps {
  startDate: Date;
  endDate: Date;
  onChange: (itinerary: ItineraryData) => void;
  defaultTemplate?: string;
  initialData?: ItineraryData;
}

export interface ItineraryData {
  version: string;
  days: ItineraryDay[];
}

// Validation
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface TimeConflict {
  dayNumber: number;
  activities: string[]; // Activity IDs
  message: string;
}
