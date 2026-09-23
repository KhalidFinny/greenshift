import { eq, sql } from "drizzle-orm";
import type { OrganizationType } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { auditLogs, users, vendors } from "../../../db/schema";

export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export async function findUserIdByEmail(
	db: GreenShiftDb,
	email: string,
): Promise<number | undefined> {
	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email))
		.limit(1);
	return existing?.id;
}

/** One registration, as the service hands it over. */
export interface RegisterAccountValues {
	accountType: OrganizationType;
	/** The representative's own details. */
	name: string;
	email: string;
	phone: string;
	/** The organization they represent. */
	organizationName: string;
	industry: string;
	address: string;
	/** Vendor-only extras; null for a company account. */
	businessInfo: string | null;
	nib: string | null;
	npwp: string | null;
	hashedPassword: string;
}

/**
 * Writes the account, the organization it represents, and the audit entry in
 * one batch, which D1 runs as one transaction: a vendor account without its
 * profile would be an account that cannot bid, so the two cannot be split.
 *
 * The profile and audit rows reference the account this same batch inserts,
 * which is why they carry the email as a subquery rather than an id: the id
 * exists only once the batch has run, and the email is the account's handle.
 * Drizzle types an integer column as `number`, so the subquery is cast to it;
 * SQLite resolves it to the account's id at execution.
 */
export async function insertRegisteredAccount(
	db: GreenShiftDb,
	values: RegisterAccountValues,
): Promise<UserRow> {
	const newUserId = sql`(select id from users where email = ${values.email})`;
	const registeredUserId = newUserId as unknown as number;
	const audit = {
		userId: registeredUserId,
		action: "auth.registered",
		entityType: "user",
		entityId: registeredUserId,
		metadata: {
			accountType: values.accountType,
			organizationName: values.organizationName,
		},
	};

	const account = db
		.insert(users)
		.values({
			email: values.email,
			name: values.name,
			role: values.accountType === "vendor" ? "vendor" : "business",
			hashedPassword: values.hashedPassword,
			companyName: values.organizationName,
			phone: values.phone,
			industrySector: values.accountType === "company" ? values.industry : null,
			address: values.address,
		})
		.returning();

	if (values.accountType === "vendor") {
		const vendorProfile = db.insert(vendors).values({
			userId: registeredUserId,
			companyName: values.organizationName,
			description: values.businessInfo,
			serviceCategory: values.industry,
			location: values.address,
			nib: values.nib,
			npwp: values.npwp,
		});
		const [rows] = await db.batch([
			account,
			vendorProfile,
			db.insert(auditLogs).values(audit),
		]);
		return rows[0];
	}

	const [rows] = await db.batch([account, db.insert(auditLogs).values(audit)]);
	return rows[0];
}
