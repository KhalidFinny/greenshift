import { desc, eq } from "drizzle-orm";
import type { GreenShiftDb } from "../../../db";
import { investments, projects, users } from "../../../db/schema";

/** Investments with investor and project context, newest first. */
export async function listInvestments(
	db: GreenShiftDb,
	status: string | undefined,
	limit: number,
) {
	const query = db
		.select({
			investment: investments,
			investor: users,
			projectTitle: projects.title,
		})
		.from(investments)
		.innerJoin(users, eq(investments.investorId, users.id))
		.innerJoin(projects, eq(investments.projectId, projects.id))
		.$dynamic();
	if (status) {
		query.where(eq(investments.status, status));
	}
	query.orderBy(desc(investments.investedAt)).limit(limit);
	const rows = await query;
	return rows;
}
