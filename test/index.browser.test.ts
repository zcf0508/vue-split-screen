import { describe, expect, it } from 'vitest';
import { SplitScreen } from '../src';

describe('browser bundle', () => {
  it('loads the public component in a browser', () => {
    expect(window).toBeDefined();
    expect(SplitScreen.name).toBe('SplitScreen');
  });
});
