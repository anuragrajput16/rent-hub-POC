/**
 * In-memory store, persisted to localStorage. Every read/write in the app goes
 * through `src/api/` so a real backend can replace this file alone.
 */
import { useSyncExternalStore } from 'react';
import { buildSeed } from '../data/seed';
import type { DB } from '../types';

const KEY = 'rentease.db.v1';

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    // Spread over a fresh seed so a DB saved before a slice existed (rewards,
    // say) picks up the new keys instead of crashing on `undefined.find`.
    if (raw) return { ...buildSeed(), ...(JSON.parse(raw) as Partial<DB>) } as DB;
  } catch {
    // Corrupt or unavailable storage falls back to a fresh seed.
  }
  return buildSeed();
}

let db: DB = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Private-mode / quota failures shouldn't break the session.
  }
}

/** Replace the DB with the result of `fn` and notify subscribers. */
export function mutate(fn: (draft: DB) => DB | void): DB {
  const next = fn(db);
  if (next) db = next;
  db = { ...db };
  persist();
  listeners.forEach((l) => l());
  return db;
}

export function snapshot(): DB {
  return db;
}

export function reset() {
  db = buildSeed();
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** The whole DB. Its reference changes on every `mutate`, and only then. */
export function useDbRoot(): DB {
  return useSyncExternalStore(
    subscribe,
    () => db,
    () => db,
  );
}

/**
 * Subscribe a component to a derived slice of the store. Selection happens
 * during render against the current props, so selectors are free to filter and
 * map; the subscription itself is on the stable DB reference.
 */
export function useDb<T>(select: (db: DB) => T): T {
  return select(useDbRoot());
}

/** Network-ish delay so mocked calls behave like real ones. */
export function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
