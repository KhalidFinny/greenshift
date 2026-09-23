// The company's half of LVV verification, and the review body's answer after the wait it takes.

import type { BusinessSubmittedProject } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import { generateBlueprint } from "../forecast/forecast.service";
import { runMatching } from "../matchmaking/matching.service";
import { insertNotification } from "../notifications/notifications.repository";
import { toSubmittedProject } from "./project-view";
import * as repository from "./projects.repository";

export type StartLvvResult =
	| { outcome: "ok"; project: BusinessSubmittedProject }
	| { outcome: "not_found" }
	| { outcome: "conflict"; status: string };

// Only a project waiting on `registry` can start; the body's verdict arrives out of band.
export async function startLvvVerification(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
): Promise<StartLvvResult> {
	const row = await repository.findCompanyProject(db, projectId, companyId);
	if (!row) return { outcome: "not_found" };
	if (row.status !== "registry") {
		return { outcome: "conflict", status: row.status };
	}

	await repository.setProjectStatus(db, projectId, "assessment");

	return {
		outcome: "ok",
		project: toSubmittedProject({ ...row, status: "assessment" }),
	};
}

// Waits without holding the isolate's CPU. The executor form is deliberate: `Promise.withResolvers` is not in this project's type lib.
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

// Stands in for the environmental registry: the platform has no integration with it yet.
export interface RegistryCheck {
	registered: boolean;
	subject: string;
}

export async function checkEnvironmentalRegistry(
	title: string,
): Promise<RegistryCheck> {
	await sleep(REGISTRY_LOOKUP_MS);
	return { registered: true, subject: title };
}

/** How long the verification body takes to answer, in this flow. */
const LVV_REVIEW_MS = 10_000;
/** How long the registry lookup takes, before the body's own verdict. */
const REGISTRY_LOOKUP_MS = 1_000;

// Registry first, then matching, so the screen opens already populated.
export async function completeLvvReview(
	db: GreenShiftDb,
	companyId: number,
	projectId: number,
	title: string,
): Promise<void> {
	await sleep(LVV_REVIEW_MS);

	const registry = await checkEnvironmentalRegistry(title);
	if (!registry.registered) {
		await insertNotification(db, {
			userId: companyId,
			type: "verification",
			title: "Verification needs attention",
			body: `The environmental registry has no record for "${title}". Upload the site permit and registration documents, then the review continues.`,
			link: "/business/projects",
		});
		return;
	}

	const project = await repository.findCompanyProject(db, projectId, companyId);
	const blueprintId = project ? await generateBlueprint(db, project) : null;

	const matching = await runMatching(db, projectId);
	await repository.setProjectStatus(db, projectId, "tendering");

	const shortlist =
		matching && matching.shortlist.length > 0
			? ` The matching run scored ${matching.scored} verified vendor${matching.scored === 1 ? "" : "s"}; ${matching.shortlist.map((vendor) => vendor.name).join(", ")} lead the ranking.`
			: " No verified vendor could be scored yet, so the ranking will fill in as vendor profiles are verified.";

	await insertNotification(db, {
		userId: companyId,
		type: "verification",
		title: "Project verified by LVV",
		body: `"${title}" passed verification${
			blueprintId === null
				? ""
				: ", and its Green Project Blueprint is ready for bidders"
		}. Vendor matchmaking is open: choose a vendor when you are ready.${shortlist}`,
		link: "/business/matchmaking",
	});
}
