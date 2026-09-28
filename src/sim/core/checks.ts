import type { Check } from './types';

export const pass = (name: string, note?: string): Check => ({ name, status: 'pass', note });
export const fail = (name: string, expected: unknown, actual: unknown, note?: string): Check => ({ name, status: 'fail', expected, actual, note });
export const warn = (name: string, note: string, actual?: unknown): Check => ({ name, status: 'warn', note, actual });
export const skip = (name: string, note: string): Check => ({ name, status: 'skip', note });

/** One check: equal, or say what was expected and what came. */
export function expectEqual(name: string, expected: unknown, actual: unknown, note?: string): Check {
  return JSON.stringify(expected) === JSON.stringify(actual) ? pass(name, note) : fail(name, expected, actual, note);
}

export function expectTrue(name: string, ok: boolean, expected: unknown, actual: unknown, note?: string): Check {
  return ok ? pass(name, note) : fail(name, expected, actual, note);
}

/** Any fail → FAIL; any warn → WARN; else PASS (skips don't count). */
export function outcomeOf(checks: Check[]): 'PASS' | 'FAIL' | 'WARN' {
  if (checks.some((c) => c.status === 'fail')) return 'FAIL';
  if (checks.some((c) => c.status === 'warn')) return 'WARN';
  return 'PASS';
}
