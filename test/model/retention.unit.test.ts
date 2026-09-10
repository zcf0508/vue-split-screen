import type { SplitRouteNode, SplitTrail } from '../../src/model';
import { describe, expect, it } from 'vitest';
import { selectRetainedPageIds } from '../../src/model';

function node(id: string): SplitRouteNode {
  return { id, fullPath: `/${id.toLowerCase()}` };
}

const A = node('A');
const B = node('B');
const C = node('C');
const D = node('D');

function select(
  trail: SplitTrail,
  activeIds: string[],
  recency: readonly string[] = [],
  max = 1,
) {
  return selectRetainedPageIds(trail, activeIds, recency, max);
}

describe('inactive page retention', () => {
  it('retains nothing by default', () => {
    expect(select([A, B, C], ['B', 'C'], [], 0).retained).toEqual([]);
  });

  it('does not count active panes against the limit', () => {
    expect(select([A, B, C, D], ['C', 'D'], [], 10).retained).toEqual(['A', 'B']);
  });

  it('evicts the least recently active page', () => {
    const first = select([A, B, C], ['B', 'C']);
    const second = select([A, B, C, D], ['C', 'D'], first.recency);

    expect(first.retained).toEqual(['A']);
    expect(second.retained).toEqual(['B']);
  });

  it('touches a retained page when it becomes active again', () => {
    const first = select([A, B, C], ['B', 'C']);
    const second = select([A, B, C], ['A', 'B'], first.recency);

    expect(second.recency).toEqual(['C', 'A', 'B']);
    expect(second.retained).toEqual(['C']);
  });

  it('drops nodes removed by a branch and applies a reduced limit immediately', () => {
    const selection = select([A, B, D], ['B', 'D'], ['A', 'B', 'C', 'D'], 0);

    expect(selection.recency).toEqual(['A', 'B', 'D']);
    expect(selection.retained).toEqual([]);
  });
});
