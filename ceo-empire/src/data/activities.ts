import type { ActivityCategory, ActivityItem } from '@/types/game';

export const ACTIVITY_ITEMS: ActivityItem[] = [
  // Reading — cheap, quick, small boosts
  {
    id: 'business_book',
    name: 'Read a Business Book',
    category: 'reading',
    icon: 'BookOpen',
    description: 'An hour with a classic on strategy and leadership.',
    cost: 10,
    educationBoost: 1,
  },
  {
    id: 'podcast',
    name: 'Listen to a Podcast',
    category: 'reading',
    icon: 'Headphones',
    description: 'Industry news and interviews on your commute.',
    cost: 15,
    educationBoost: 1,
  },
  {
    id: 'documentary',
    name: 'Watch a Documentary',
    category: 'reading',
    icon: 'Clapperboard',
    description: 'A deep dive into how the giants built their empires.',
    cost: 20,
    educationBoost: 2,
  },
  // Classes — mid-tier, steady boosts
  {
    id: 'online_course',
    name: 'Take an Online Course',
    category: 'classes',
    icon: 'Laptop',
    description: 'Self-paced, certificate included.',
    cost: 50,
    educationBoost: 3,
  },
  {
    id: 'workshop',
    name: 'Attend a Workshop',
    category: 'classes',
    icon: 'ClipboardList',
    description: 'A weekend intensive with hands-on exercises.',
    cost: 80,
    educationBoost: 3,
  },
  {
    id: 'night_class',
    name: 'Take a Night Class',
    category: 'classes',
    icon: 'GraduationCap',
    description: 'Evenings at the local community center, twice a week.',
    cost: 150,
    educationBoost: 5,
  },
  // College — expensive, big boosts
  {
    id: 'community_college',
    name: 'Community College Course',
    category: 'college',
    icon: 'GraduationCap',
    description: 'A full semester course toward an associate degree.',
    cost: 400,
    educationBoost: 7,
  },
  {
    id: 'university_semester',
    name: 'University Semester',
    category: 'college',
    icon: 'GraduationCap',
    description: 'A full course load at a four-year university.',
    cost: 2000,
    educationBoost: 12,
  },
  {
    id: 'executive_mba',
    name: 'Executive MBA Program',
    category: 'college',
    icon: 'Crown',
    description: 'The top-tier program — cohorts, case studies, and a fresh network.',
    cost: 10000,
    educationBoost: 20,
  },
];

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  reading: 'Reading',
  classes: 'Classes',
  college: 'College',
};

export function getActivity(id: string): ActivityItem | undefined {
  return ACTIVITY_ITEMS.find((a) => a.id === id);
}
