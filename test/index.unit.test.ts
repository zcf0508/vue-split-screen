import { describe, expect, it } from 'vitest';

describe('should', () => {
  it('exposes the library entry', async () => {
    const library = await import('../src');

    expect(library.SplitScreen.name).toBe('SplitScreen');
  });
});
