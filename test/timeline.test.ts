import { describe, expect, it } from 'vitest';
import { createTimeline } from '../src/components/SplitScreen/timeline';

function makeRoute(path: string) {
  return {
    path,
    name: undefined,
    params: {},
    query: {},
    hash: '',
    fullPath: path,
    matched: [],
    meta: {},
    redirectedFrom: undefined,
  };
}

describe('timeline basic operations', () => {
  it('push and replace and navigate', () => {
    const t = createTimeline();

  const s1 = t.createSlot(makeRoute('/a'));
    t.push(true, s1);
    expect(t.getSlotsArray().length).toBe(1);
    expect(t.getVisibleSlotIds()).toEqual([s1.id]);

  const s2 = t.createSlot(makeRoute('/b'));
    t.push(false, s2);
    expect(t.getSlotsArray().length).toBe(2);
    // now should have two visible ids
    // debug
    // console.log('after push s2', t.getSlotsArray(), t.getVisibleSlotIds());
    expect(t.getVisibleSlotIds().sort()).toEqual([s1.id, s2.id].sort());

  const s3 = t.createSlot(makeRoute('/c'));
    t.replace(false, s3);
    expect(t.getVisibleSlotIds().includes(s3.id)).toBe(true);

    t.back();
    // after replace the previous entry should be the initial single-left entry
    expect(t.getVisibleSlotIds().sort()).toEqual([s1.id].sort());

    t.forward();
    expect(t.getVisibleSlotIds().includes(s3.id)).toBe(true);
  });

  it('left/right trigger semantics', () => {
    // initial: home on left
  const t = createTimeline();
  const home = t.createSlot(makeRoute('/home'));
    t.push(true, home);

    // left click go -> should replace right (so left stays home, right becomes A)
  const A = t.createSlot(makeRoute('/A'));
    t.push(true, A);
    let cur = t.getCurrentEntry();
    expect(cur?.leftId).toBe(home.id);
    expect(cur?.rightId).toBe(A.id);

    // left click again -> replace right with B, left remains home
  const B = t.createSlot(makeRoute('/B'));
    t.push(true, B);
    cur = t.getCurrentEntry();
    expect(cur?.leftId).toBe(home.id);
    expect(cur?.rightId).toBe(B.id);

    // now right click go -> should move previous right (B) to left and set new right C
  const C = t.createSlot(makeRoute('/C'));
    t.push(false, C);
    cur = t.getCurrentEntry();
    expect(cur?.leftId).toBe(B.id);
    expect(cur?.rightId).toBe(C.id);
  });

  it('gc removes unreferenced slots', () => {
  const t = createTimeline();
  const s1 = t.createSlot(makeRoute('/a'));
  t.push(true, s1);
  const s2 = t.createSlot(makeRoute('/b'));
    t.push(false, s2);

    // new push truncates forward history
    t.back();
  const s3 = t.createSlot(makeRoute('/d'));
    t.push(false, s3);

    // s2 should be unreferenced now
    t.gc();
    const ids = t.getSlotsArray().map(s => s.id);
    expect(ids.includes(s2.id)).toBe(false);
    expect(ids.includes(s1.id)).toBe(true);
    expect(ids.includes(s3.id)).toBe(true);
  });
});
