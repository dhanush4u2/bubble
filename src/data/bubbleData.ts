export type BubbleCategory = 'productive' | 'learning' | 'health' | 'relationships' | 'leisure';

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
    actualWeeklyHours: 0,
    description: 'Professional growth & income',
    children: [
      { id: 'work-deep', name: 'Deep Work', category: 'productive', expectedWeeklyHours: 20, actualWeeklyHours: 0, parentId: 'work' },
      { id: 'work-meetings', name: 'Meetings', category: 'productive', expectedWeeklyHours: 8, actualWeeklyHours: 0, parentId: 'work' },
      { id: 'work-admin', name: 'Admin', category: 'productive', expectedWeeklyHours: 4, actualWeeklyHours: 0, parentId: 'work' },
    ]
  },
  {
    id: 'upskilling',
    name: 'Learning',
    category: 'learning',
    expectedWeeklyHours: 10,
    actualWeeklyHours: 0,
    description: 'Skills & personal development',
    children: [
      { id: 'upskilling-courses', name: 'Courses', category: 'learning', expectedWeeklyHours: 5, actualWeeklyHours: 0, parentId: 'upskilling' },
      { id: 'upskilling-reading', name: 'Reading', category: 'learning', expectedWeeklyHours: 3, actualWeeklyHours: 0, parentId: 'upskilling' },
      { id: 'upskilling-projects', name: 'Projects', category: 'learning', expectedWeeklyHours: 2, actualWeeklyHours: 0, parentId: 'upskilling' },
    ]
  },
  {
    id: 'health',
    name: 'Health',
    category: 'health',
    expectedWeeklyHours: 8,
    actualWeeklyHours: 0,
    description: 'Physical & mental wellbeing',
    children: [
      { id: 'health-gym', name: 'Gym', category: 'health', expectedWeeklyHours: 4, actualWeeklyHours: 0, parentId: 'health' },
      { id: 'health-sleep', name: 'Sleep', category: 'health', expectedWeeklyHours: 2, actualWeeklyHours: 0, parentId: 'health' },
      { id: 'health-meditation', name: 'Mindfulness', category: 'health', expectedWeeklyHours: 2, actualWeeklyHours: 0, parentId: 'health' },
    ]
  },
  {
    id: 'relationships',
    name: 'People',
    category: 'relationships',
    expectedWeeklyHours: 10,
    actualWeeklyHours: 0,
    description: 'Family, friends & social life',
    children: [
      { id: 'rel-family', name: 'Family', category: 'relationships', expectedWeeklyHours: 5, actualWeeklyHours: 0, parentId: 'relationships' },
      { id: 'rel-friends', name: 'Friends', category: 'relationships', expectedWeeklyHours: 3, actualWeeklyHours: 0, parentId: 'relationships' },
      { id: 'rel-partner', name: 'Partner', category: 'relationships', expectedWeeklyHours: 2, actualWeeklyHours: 0, parentId: 'relationships' },
    ]
  },
  {
    id: 'leisure',
    name: 'Leisure',
    category: 'leisure',
    expectedWeeklyHours: 14,
    actualWeeklyHours: 0,
    description: 'Rest, fun & entertainment',
    children: [
      { id: 'leisure-entertainment', name: 'Entertainment', category: 'leisure', expectedWeeklyHours: 7, actualWeeklyHours: 0, parentId: 'leisure' },
      { id: 'leisure-hobbies', name: 'Hobbies', category: 'leisure', expectedWeeklyHours: 4, actualWeeklyHours: 0, parentId: 'leisure' },
      { id: 'leisure-social', name: 'Social', category: 'leisure', expectedWeeklyHours: 3, actualWeeklyHours: 0, parentId: 'leisure' },
    ]
  },
];

export const recentEntries: TimeEntry[] = [];

export const getCategoryColor = (category: BubbleCategory): string => {
  const colors: Record<BubbleCategory, string> = {
    productive: '#4CAF50',
    learning: '#2196F3',
    health: '#FF9800',
    relationships: '#E91E63',
    leisure: '#9C27B0',
  };
  return colors[category] ?? '#4CAF50';
};

export const getCategoryLightBg = (category: BubbleCategory): string => {
  const bgs: Record<BubbleCategory, string> = {
    productive: '#E8F5E9',
    learning: '#E3F2FD',
    health: '#FFF3E0',
    relationships: '#FCE4EC',
    leisure: '#F3E5F5',
  };
  return bgs[category] ?? '#E8F5E9';
};

export const getCategoryGlow = (_category: BubbleCategory): string => 'none';
export const getCategoryBg = getCategoryLightBg;
