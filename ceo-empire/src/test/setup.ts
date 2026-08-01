import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom/vitest';

expect.extend(toHaveNoViolations);

// With `globals: false`, RTL can't auto-detect a global afterEach to register its
// cleanup, so each render would otherwise leak into the next test's jsdom document.
afterEach(() => {
  cleanup();
});
