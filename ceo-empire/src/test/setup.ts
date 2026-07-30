import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// With `globals: false`, RTL can't auto-detect a global afterEach to register its
// cleanup, so each render would otherwise leak into the next test's jsdom document.
afterEach(() => {
  cleanup();
});
