import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { VNode } from 'vue';

export interface SlotData {
  id: string
  key: string
  route: RouteLocationNormalizedLoaded
  slot?: VNode[]
  createdAt: number
}

export interface HistoryEntry {
  id: string
  leftId?: string
  rightId?: string
  routePath: string
  action: 'push' | 'replace'
  createdAt: number
}

export function createTimeline() {
  let idCounter = 1;
  const genId = () => String(idCounter++);

  const slotsById = new Map<string, SlotData>();
  const history: HistoryEntry[] = [];
  let index = -1;

  function createSlot(route: RouteLocationNormalizedLoaded, slot?: VNode[]) {
    const id = genId();
    const s: SlotData = {
      id,
      key: id,
      route,
      slot,
      createdAt: Date.now(),
    };
    slotsById.set(id, s);
    return s;
  }

  function getCurrentEntry() {
    if (index < 0 || index >= history.length) { return undefined; }
    return history[index];
  }

  function push(left: boolean, slot: SlotData) {
    const prev = getCurrentEntry();
    let leftId = prev?.leftId;
    let rightId = prev?.rightId;

    if (!prev) {
      // initial push: if triggered from left, set left; if from right, set right
      if (left) {
        leftId = slot.id;
      }
      else {
        rightId = slot.id;
      }
    }
    else {
      if (left) {
        // left-initiated navigation: replace right side with new slot
        rightId = slot.id;
      }
      else {
        // right-initiated navigation: move previous right to left (if any), then set new right
        if (prev.rightId) {
          leftId = prev.rightId;
        }
        rightId = slot.id;
      }
    }

    // truncate forward history and append new entry
    history.splice(index + 1, history.length - index - 1, {
      id: genId(),
      leftId,
      rightId,
      routePath: slot.route?.path || '',
      action: 'push',
      createdAt: Date.now(),
    });

    index = history.length - 1;
    return getCurrentEntry();
  }

  function replace(left: boolean, slot: SlotData) {
    const prev = getCurrentEntry();
    let leftId = prev?.leftId;
    let rightId = prev?.rightId;

    if (left) { 
      leftId = slot.id;
      // When replacing left, clear the right side to show placeholder
      rightId = undefined;
    }
    else { 
      rightId = slot.id;
      // When replacing right, keep the left side unchanged
    }

    const entry: HistoryEntry = {
      id: genId(),
      leftId,
      rightId,
      routePath: slot.route?.path || '',
      action: 'replace',
      createdAt: Date.now(),
    };

    // Replace the current history entry so browser replace semantics match timeline
    if (index < 0) {
      history.splice(0, history.length, entry);
      index = history.length - 1;
    }
    else {
      history.splice(index, 1, entry);
      // index remains the same (we replaced current)
    }

    return getCurrentEntry();
  }

  function back() {
    if (history.length === 0) { return; }
    index = Math.max(0, index - 1);
    return getCurrentEntry();
  }

  function forward() {
    if (history.length === 0) { return; }
    index = Math.min(history.length - 1, index + 1);
    return getCurrentEntry();
  }

  function getSlotsArray() {
    return Array.from(slotsById.values());
  }

  function getSlotById(id?: string) {
    if (!id) { return undefined; }
    return slotsById.get(id);
  }

  function getVisibleSlotIds() {
    const cur = getCurrentEntry();
    if (!cur) { return [] as string[]; }
    if (cur.leftId && cur.rightId) { return [cur.leftId, cur.rightId]; }
    if (cur.leftId) { return [cur.leftId]; }
    if (cur.rightId) { return [cur.rightId]; }
    return [];
  }

  function gc() {
    const referenced = new Set<string>();
    for (const e of history) {
      if (e.leftId) { referenced.add(e.leftId); }
      if (e.rightId) { referenced.add(e.rightId); }
    }
    for (const id of Array.from(slotsById.keys())) {
      if (!referenced.has(id)) { slotsById.delete(id); }
    }
  }

  return {
    createSlot,
    push,
    replace,
    back,
    forward,
    getCurrentEntry,
    getSlotsArray,
    getSlotById,
    getVisibleSlotIds,
    gc,
  } as const;
}
