/**
 * Prisma enums are UPPER_SNAKE_CASE (e.g. Subject.COMPUTER_SCIENCE); the
 * shared TypeScript types the web/mobile apps consume use lower_snake_case
 * string literals (e.g. "computer_science"). Casing is the only difference,
 * so a straightforward case transform round-trips cleanly in both directions.
 */
export function enumToShared<T extends string = string>(value: string): T {
  return value.toLowerCase() as T;
}

export function sharedToEnum<T extends string = string>(value: string): T {
  return value.toUpperCase() as T;
}

/** Maps enumToShared over every element of an array (e.g. PersonalFocus[]). */
export function enumArrayToShared<T extends string = string>(values: string[]): T[] {
  return values.map((v) => enumToShared<T>(v));
}

export function enumArrayToPrisma<T extends string = string>(values: string[]): T[] {
  return values.map((v) => sharedToEnum<T>(v));
}
