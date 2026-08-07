import {
  BookOpen,
  Dumbbell,
  GraduationCap,
  GlassWater,
  Brain,
  Music,
  Code,
  Sun,
  Moon,
  Bike,
  Heart,
  Coffee,
  Pencil,
  type LucideIcon,
} from 'lucide-react';

export const habitIconMap: Record<string, LucideIcon> = {
  BookOpen,
  Dumbbell,
  GraduationCap,
  GlassWater,
  Brain,
  Music,
  Code,
  Sun,
  Moon,
  Bike,
  Heart,
  Coffee,
  Pencil,
};

export const habitIconNames = Object.keys(habitIconMap);

export function getHabitIcon(name: string): LucideIcon {
  return habitIconMap[name] ?? BookOpen;
}
