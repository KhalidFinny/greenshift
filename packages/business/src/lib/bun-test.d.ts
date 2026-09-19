/* Ambient types for bun:test (bun provides the runtime; this keeps
 * `bun run typecheck` green without adding dependencies). */
declare module "bun:test" {
	export function describe(name: string, fn: () => void): void;
	export function test(name: string, fn: () => void): void;
	export interface BunExpect {
		toBe(expected: unknown): void;
		toEqual(expected: unknown): void;
		toContain(item: unknown): void;
		toBeNull(): void;
		toBeFalse(): void;
		not: BunExpect;
	}
	export function expect(actual: unknown): BunExpect;
}
