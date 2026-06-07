import type { CounterStore } from "../types.ts";
import { existsSync, statSync, rmSync } from "fs";

const STORE_PATH = "./counter_store.json";
const DEFAULTS: CounterStore = { receipt: 15, allocation: 0 };

async function loadStore(): Promise<CounterStore> {
  // Guard: Dockerfile had "RUN mkdir -p counter_store.json" which creates
  // it as a directory. Detect and remove it so we can write a file instead.
  if (existsSync(STORE_PATH) && statSync(STORE_PATH).isDirectory()) {
    rmSync(STORE_PATH, { recursive: true, force: true });
    console.warn("[counterStore] Removed counter_store.json directory, recreating as file.");
  }

  try {
    const file = Bun.file(STORE_PATH);
    if (file.size === 0) throw new Error("empty");
    return JSON.parse(await file.text()) as CounterStore;
  } catch {
    // File doesn't exist or is corrupt — write fresh defaults
    await Bun.write(STORE_PATH, JSON.stringify(DEFAULTS, null, 2));
    return { ...DEFAULTS };
  }
}

async function saveStore(store: CounterStore): Promise<void> {
  await Bun.write(STORE_PATH, JSON.stringify(store, null, 2));
}

/** Atomically increment and return the new value. */
export async function nextCounter(type: keyof CounterStore): Promise<number> {
  const store = await loadStore();
  store[type] = (store[type] ?? 0) + 1;
  await saveStore(store);
  return store[type];
}

/** Peek at current counters without incrementing. */
export async function getCounters(): Promise<CounterStore> {
  return loadStore();
}

/** Pad a number to a fixed width, e.g. 16 → "0016" */
export function padNumber(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

/**
 * Build allocation ref: KAD/{LOCATION}/{YEAR}/{BLOCK}
 * e.g. KAD/GUDU/2026/001
 */
export function buildAllocRef(location: string, year: number, blockNo: string): string {
  const loc = location.split(",")[0].trim().toUpperCase().replace(/\s+/g, "");
  return `KAD/${loc}/${year}/${blockNo}`;
}