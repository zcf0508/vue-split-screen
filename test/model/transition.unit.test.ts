import type { SplitRouteNode, SplitTrail } from '../../src/model';
import { describe, expect, it } from 'vitest';
import { navigateTrail, presentTrail } from '../../src/model';

function node(id: string): SplitRouteNode {
  return { id, fullPath: `/${id.toLowerCase()}` };
}

const A = node('A');
const B = node('B');
const C = node('C');
const D = node('D');

describe('split trail transitions', () => {
  it('appends a destination after a push from the current node', () => {
    const trail = [A, B, C] as SplitTrail;

    expect(navigateTrail(trail, C.id, D, 'push')).toEqual([A, B, C, D]);
    expect(trail).toEqual([A, B, C]);
  });

  it('branches after a push from the companion node', () => {
    expect(navigateTrail([A, B, C], B.id, D, 'push')).toEqual([A, B, D]);
  });

  it('replaces the current node without adding another level', () => {
    expect(navigateTrail([A, B, C], C.id, D, 'replace')).toEqual([A, B, D]);
  });

  it('replaces a companion and drops its descendants', () => {
    expect(navigateTrail([A, B, C], B.id, D, 'replace')).toEqual([A, D]);
  });

  it('replaces the only node', () => {
    expect(navigateTrail([A], A.id, D, 'replace')).toEqual([D]);
  });

  it('rejects navigation from a node outside the trail', () => {
    expect(() => navigateTrail([A, B], C.id, D, 'push'))
      .toThrowError(new RangeError('Unknown split-route node: C'));
  });
});

describe('split trail presentation', () => {
  it('presents a single node without a companion', () => {
    expect(presentTrail([A])).toEqual({ companion: undefined, current: A });
  });

  it('presents only the final two nodes from a deeper trail', () => {
    expect(presentTrail([A, B, C])).toEqual({ companion: B, current: C });
  });
});
