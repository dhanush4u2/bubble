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
  icon: string;
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
    icon: '💼',
    expectedWeeklyHours: 40,
    actualWeeklyHours: 36,
    description: 'Professional growth & income',
    children: [
      { id: 'work-deep', name: 'Deep Work', category: 'productive', icon: '🧠', expectedWeeklyHours: 20, actualWeeklyHours: 14, parentId: 'work' },
      { id: 'work-meetings', name: 'Meetings', category: 'productive', icon: '📅', expectedWeeklyHours: 8, actualWeeklyHours: 12, parentId: 'work' },
      { id: 'work-admin', name: 'Admin', category: 'productive', icon: '📋', expectedWeeklyHours: 4, actualWeeklyHours: 6, parentId: 'work' },
    ]
  },
  {
    id: 'upskilling',
    name: 'Learning',
    category: 'productive',
    icon: '📚',
    expectedWeeklyHours: 10,
    actualWeeklyHours: 5,
    description: 'Skills & personal development',
    children: [
      { id: 'upskilling-courses', name: 'Courses', category: 'productive', icon: '🎓', expectedWeeklyHours: 5, actualWeeklyHours: 2, parentId: 'upskilling' },
      { id: 'upskilling-reading', name: 'Reading', category: 'productive', icon: '📖', expectedWeeklyHours: 3, actualWeeklyHours: 2, parentId: 'upskilling' },
      { id: 'upskilling-projects', name: 'Side Projects', category: 'productive', icon: '🚀', expectedWeeklyHours: 2, actualWeeklyHours: 1, parentId: 'upskilling' },
    ]
  },
  {
    id: 'health',
    name: 'Health',
    category: 'lifestyle',
    icon: '💪',
    expectedWeeklyHours: 8,
    actualWeeklyHours: 7,
    description: 'Physical & mental wellbeing',
    children: [
      { id: 'health-gym', name: 'Gym', category: 'lifestyle', icon: '🏋️', expectedWeeklyHours: 4, actualWeeklyHours: 3, parentId: 'health' },
      { id: 'health-sleep', name: 'Sleep', category: 'lifestyle', icon: '😴', expectedWeeklyHours: 2, actualWeeklyHours: 3, parentId: 'health' },
      { id: 'health-meditation', name: 'Mindfulness', category: 'lifestyle', icon: '🧘', expectedWeeklyHours: 2, actualWeeklyHours: 1, parentId: 'health' },
    ]
  },
  {
    id: 'relationships',
    name: 'Relationships',
    category: 'lifestyle',
    icon: '❤️',
    expectedWeeklyHours: 10,
    actualWeeklyHours: 8,
    description: 'Family, friends & social life',
    children: [
      { id: 'rel-family', name: 'Family', category: 'lifestyle', icon: '🏠', expectedWeeklyHours: 5, actualWeeklyHours: 4, parentId: 'relationships' },
      { id: 'rel-friends', name: 'Friends', category: 'lifestyle', icon: '🤝', expectedWeeklyHours: 3, actualWeeklyHours: 3, parentId: 'relationships' },
      { id: 'rel-partner', name: 'Partner', category: 'lifestyle', icon: '💑', expectedWeeklyHours: 2, actualWeeklyHours: 1, parentId: 'relationships' },
    ]
  },
  {
    id: 'leisure',
    name: 'Leisure',
    category: 'leisure',
    icon: '🎮',
    expectedWeeklyHours: 14,
    actualWeeklyHours: 18,
    description: 'Rest, fun & entertainment',
    children: [
      { id: 'leisure-entertainment', name: 'Entertainment', category: 'leisure', icon: '📺', expectedWeeklyHours: 7, actualWeeklyHours: 10, parentId: 'leisure' },
      { id: 'leisure-hobbies', name: 'Hobbies', category: 'leisure', icon: '🎨', expectedWeeklyHours: 4, actualWeeklyHours: 5, parentId: 'leisure' },
      { id: 'leisure-social', name: 'Social Media', category: 'leisure', icon: '📱', expectedWeeklyHours: 3, actualWeeklyHours: 3, parentId: 'leisure' },
    ]
  },
];

export const recentEntries: TimeEntry[] = [
  { id: '1', bubbleId: 'work-deep', duration: 120, date: new Date().toISOString(), note: 'Product design sprint' },
  { id: '2', bubbleId: 'health-gym', duration: 60, date: new Date().toISOString(), note: 'Chest & back' },
  { id: '3', bubbleId: 'upskilling-courses', duration: 45, date: new Date().toISOString(), note: 'TypeScript advanced patterns' },
  { id: '4', bubbleId: 'leisure-entertainment', duration: 90, date: new Date(Date.now() - 86400000).toISOString(), note: 'Netflix series' },
  { id: '5', bubbleId: 'work-meetings', duration: 120, date: new Date(Date.now() - 86400000).toISOString() },
];

export const getCategoryColor = (category: BubbleCategory): string => {
  const colors = {
    productive: 'hsl(162 77% 58%)',
    lifestyle: 'hsl(20 100% 70%)',
    leisure: 'hsl(88 55% 58%)',
    accent: 'hsl(232 100% 74%)',
  };
  return colors[category];
};

export const getCategoryGlow = (category: BubbleCategory): string => {
  const glows = {
    productive: '0 0 40px hsl(162 77% 58% / 0.5)',
    lifestyle: '0 0 40px hsl(20 100% 70% / 0.5)',
    leisure: '0 0 40px hsl(88 55% 58% / 0.5)',
    accent: '0 0 40px hsl(232 100% 74% / 0.5)',
  };
  return glows[category];
};

export const getCategoryBg = (category: BubbleCategory): string => {
  const bgs = {
    productive: 'rgba(59, 232, 176, 0.15)',
    lifestyle: 'rgba(255, 138, 101, 0.15)',
    leisure: 'rgba(156, 204, 101, 0.15)',
    accent: 'rgba(124, 140, 255, 0.15)',
  };
  return bgs[category];
};
