// Minimal type declarations for bun:sqlite so the setup script typechecks
// without pulling in the full (globally-conflicting) bun-types package.
declare module "bun:sqlite" {
	type SqlValue = string | number | bigint | null | Uint8Array;

	interface StatementQuery {
		get(...params: SqlValue[]): unknown;
		all(...params: SqlValue[]): unknown[];
	}

	export class Database {
		constructor(path: string, options?: { readonly?: boolean; create?: boolean });
		run(sql: string, ...params: SqlValue[]): unknown;
		exec(sql: string): void;
		query(sql: string): StatementQuery;
		close(): void;
	}
}
