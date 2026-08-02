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
    costType: 'cash',
    educationBoost: 1,
  },
  {
    id: 'podcast',
    name: 'Listen to a Podcast',
    category: 'reading',
    icon: 'Headphones',
    description: 'Industry news and interviews on your commute.',
    cost: 15,
    costType: 'cash',
    educationBoost: 1,
  },
  {
    id: 'documentary',
    name: 'Watch a Documentary',
    category: 'reading',
    icon: 'Clapperboard',
    description: 'A deep dive into how the giants built their empires.',
    cost: 20,
    costType: 'cash',
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
    costType: 'cash',
    educationBoost: 3,
  },
  {
    id: 'workshop',
    name: 'Attend a Workshop',
    category: 'classes',
    icon: 'ClipboardList',
    description: 'A weekend intensive with hands-on exercises.',
    cost: 80,
    costType: 'cash',
    educationBoost: 3,
  },
  {
    id: 'night_class',
    name: 'Take a Night Class',
    category: 'classes',
    icon: 'GraduationCap',
    description: 'Evenings at the local community center, twice a week.',
    cost: 150,
    costType: 'cash',
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
    costType: 'cash',
    educationBoost: 7,
  },
  {
    id: 'university_semester',
    name: 'University Semester',
    category: 'college',
    icon: 'GraduationCap',
    description: 'A full course load at a four-year university.',
    cost: 2000,
    costType: 'cash',
    educationBoost: 12,
  },
  {
    id: 'executive_mba',
    name: 'Executive MBA Program',
    category: 'college',
    icon: 'Crown',
    description: 'The top-tier program — cohorts, case studies, and a fresh network.',
    cost: 10000,
    costType: 'cash',
    educationBoost: 20,
  },
  // Recreation — paid for with XP instead of cash, a break from the grind
  {
    id: 'video_games',
    name: 'Play Video Games',
    category: 'recreation',
    icon: 'Gamepad2',
    description: 'Strategy games sharpen the mind more than you’d think.',
    cost: 20,
    costType: 'xp',
    educationBoost: 1,
  },
  {
    id: 'go_for_a_run',
    name: 'Go for a Run',
    category: 'recreation',
    icon: 'Footprints',
    description: 'Clear your head and get the blood flowing.',
    cost: 15,
    costType: 'xp',
    educationBoost: 1,
  },
  {
    id: 'play_football',
    name: 'Play Football',
    category: 'recreation',
    icon: 'Trophy',
    description: 'A pickup game with friends after work.',
    cost: 35,
    costType: 'xp',
    educationBoost: 2,
  },
  {
    id: 'rec_sports_league',
    name: 'Join a Rec Sports League',
    category: 'recreation',
    icon: 'Users',
    description: 'A weekly league — teamwork skills that carry over to the office.',
    cost: 100,
    costType: 'xp',
    educationBoost: 5,
  },
  {
    id: 'esports_tournament',
    name: 'Compete in an Esports Tournament',
    category: 'recreation',
    icon: 'Gamepad2',
    description: 'High-stakes, high-focus competition against real opponents.',
    cost: 200,
    costType: 'xp',
    educationBoost: 8,
  },
];

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  reading: 'Reading',
  classes: 'Classes',
  college: 'College',
  recreation: 'Recreation',
};

export function getActivity(id: string): ActivityItem | undefined {
  return ACTIVITY_ITEMS.find((a) => a.id === id);
}

/** XP earned per point of educationBoost when a cash-cost activity is done, so
 * investing in yourself also funds the XP you spend on recreation. */
export const XP_PER_EDUCATION_BOOST = 4;

export function activityXpReward(activity: ActivityItem): number {
  return activity.educationBoost * XP_PER_EDUCATION_BOOST;
}
