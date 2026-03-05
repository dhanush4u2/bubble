export type BubbleCategory = 'productive' | 'lifestyle' | 'leisure' | 'accent';

export interface TimeEntry {
  id: string;
  bubbleId: string;
  duration: number; // minutes
  date: string;
  note?: string;
}

export interface BubbleItem {
  id: string;
  name: string;
  category: BubbleCategory;
  expectedWeeklyHours: number;
  actualWeeklyHours: number;
  parentId?: string;
  children?: BubbleItem[];
  description?: string;
  color?: string;
}

export const defaultBubbles: BubbleItem[] = [
  {
    id: 'work',
    name: 'Work',
    category: 'productive',
    expectedWeeklyHours: 40,
    actualWeeklyHours: 36,
    description: 'Professional growth & income',
    children: [
      { id: 'work-deep', name: 'Deep Work', category: 'productive', expectedWeeklyHours: 20, actualWeeklyHours: 14, parentId: 'work' },
      { id: 'work-meetings', name: 'Meetings', category: 'productive', expectedWeeklyHours: 8, actualWeeklyHours: 12, parentId: 'work' },
      { id: 'work-admin', name: 'Admin', category: 'productive', expectedWeeklyHours: 4, actualWeeklyHours: 6, parentId: 'work' },
    ]
  },
  {
    id: 'upskilling',
    name: 'Learning',
    category: 'productive',
    expectedWeeklyHours: 10,
    actualWeeklyHours: 5,
    description: 'Skills & personal development',
    children: [
      { id: 'upskilling-courses', name: 'Courses', category: 'productive', expectedWeeklyHours: 5, actualWeeklyHours: 2, parentId: 'upskilling' },
      { id: 'upskilling-reading', name: 'Reading', category: 'productive', expectedWeeklyHours: 3, actualWeeklyHours: 2, parentId: 'upskilling' },
      { id: 'upskilling-projects', name: 'Projects', category: 'productive', expectedWeeklyHours: 2, actualWeeklyHours: 1, parentId: 'upskilling' },
    ]
  },
  {
    id: 'health',
    name: 'Health',
    category: 'lifestyle',
    expectedWeeklyHours: 8,
    actualWeeklyHours: 7,
    description: 'Physical & mental wellbeing',
    children: [
      { id: 'health-gym', name: 'Gym', category: 'lifestyle', expectedWeeklyHours: 4, actualWeeklyHours: 3, parentId: 'health' },
      { id: 'health-sleep', name: 'Sleep', category: 'lifestyle', expectedWeeklyHours: 2, actualWeeklyHours: 3, parentId: 'health' },
      { id: 'health-meditation', name: 'Mindfulness', category: 'lifestyle', expectedWeeklyHours: 2, actualWeeklyHours: 1, parentId: 'health' },
    ]
  },
  {
    id: 'relationships',
    name: 'People',
    category: 'lifestyle',
    expectedWeeklyHours: 10,
    actualWeeklyHours: 8,
    description: 'Family, friends & social life',
    children: [
      { id: 'rel-family', name: 'Family', category: 'lifestyle', expectedWeeklyHours: 5, actualWeeklyHours: 4, parentId: 'relationships' },
      { id: 'rel-friends', name: 'Friends', category: 'lifestyle', expectedWeeklyHours: 3, actualWeeklyHours: 3, parentId: 'relationships' },
      { id: 'rel-partner', name: 'Partner', category: 'lifestyle', expectedWeeklyHours: 2, actualWeeklyHours: 1, parentId: 'relationships' },
    ]
  },
  {
    id: 'leisure',
    name: 'Leisure',
    category: 'leisure',
    expectedWeeklyHours: 14,
    actualWeeklyHours: 18,
    description: 'Rest, fun & entertainment',
    children: [
      { id: 'leisure-entertainment', name: 'Entertainment', category: 'leisure', expectedWeeklyHours: 7, actualWeeklyHours: 10, parentId: 'leisure' },
      { id: 'leisure-hobbies', name: 'Hobbies', category: 'leisure', expectedWeeklyHours: 4, actualWeeklyHours: 5, parentId: 'leisure' },
      { id: 'leisure-social', name: 'Social', category: 'leisure', expectedWeeklyHours: 3, actualWeeklyHours: 3, parentId: 'leisure' },
    ]
  },
];

export const recentEntries: TimeEntry[] = [
  { id: '1', bubbleId: 'work-deep', duration: 120, date: new Date().toISOString(), note: 'Product design sprint' },
  { id: '2', bubbleId: 'health-gym', duration: 60, date: new Date().toISOString(), note: 'Chest & back' },
  { id: '3', bubbleId: 'upskilling-courses', duration: 45, date: new Date().toISOString(), note: 'TypeScript advanced' },
  { id: '4', bubbleId: 'leisure-entertainment', duration: 90, date: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', bubbleId: 'work-meetings', duration: 120, date: new Date(Date.now() - 86400000).toISOString() },
];

export const getCategoryColor = (category: BubbleCategory): string => {
  const colors = {
    productive: '#4CAF50',
    lifestyle: '#FF9800',
    leisure: '#2196F3',
    accent: '#FF5252',
  };
  return colors[category];
};

export const getCategoryLightBg = (category: BubbleCategory): string => {
  const bgs = {
    productive: '#E8F5E9',
    lifestyle: '#FFF3E0',
    leisure: '#E3F2FD',
    accent: '#FFEBEE',
  };
  return bgs[category];
};

// Keep backward compat
export const getCategoryGlow = (_category: BubbleCategory): string => 'none';
export const getCategoryBg = getCategoryLightBg;
