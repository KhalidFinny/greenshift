import { buildAccountStatements } from "./accounts";

/**
 * Prints the account rows of `DEMO_ACCOUNTS` as SQL and nothing else.
 *
 * The deployed database holds no fixtures, so this is the way the logins are
 * created remotely: the statements are idempotent, which makes the file safe to
 * load into a database that already has some of the accounts.
 *
 *   bun scripts/seed-accounts.ts > scripts/accounts.sql
 *   bunx wrangler d1 execute greenshift-db --remote --file=scripts/accounts.sql
 */
if (import.meta.main) {
	const statements = await buildAccountStatements();
	console.log(statements.join("\n"));
}
