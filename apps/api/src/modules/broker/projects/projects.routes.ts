import { Hono } from "hono";
import { createFactory } from "hono/factory";
import type { BrokerAssignedProject } from "../../../contracts";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { isoDate } from "../../../lib/format";
import { toRiskAssessment } from "../broker.shared";
import { projectLifecycleRoutes } from "./projects.lifecycle.routes";
import {
	getBrokerRepresentative,
	listAssignments,
	loadProjectContext,
} from "./projects.repository";

const factory = createFactory<ApiEnv>();

export const projectRoutes = new Hono<ApiEnv>();

projectRoutes.get(
	"/projects",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const brokerId = c.get("user").id;
		const limit = 100;

		const rows = await listAssignments(db, brokerId, limit);
		const representative = await getBrokerRepresentative(db, brokerId);
		const context = await loadProjectContext(
			db,
			rows.map((row) => row.project.id),
		);

		const list: BrokerAssignedProject[] = rows.map(
			({ assignment, project, company }) => {
				const entry = context.get(project.id);
				const validated =
					entry?.blueprintStatus === "validated" ||
					entry?.blueprintStatus === "published";
				const accepted =
					assignment.status !== "ASSIGNED" && assignment.status !== "DECLINED";
				return {
					id: project.id,
					title: project.title,
					companyName: company.name,
					companyEmail: company.email,
					vendorName: entry?.vendorName ?? null,
					industrySector: project.industrySector,
					location: project.location,
					projectValue: entry?.contractValue ?? project.budget ?? 0,
					lvvGrkStatus: validated ? "VERIFIED" : "PENDING",
					lvvGrkVerificationDate: isoDate(entry?.blueprintValidatedAt ?? null),
					blueprintStatus: entry?.blueprintStatus ?? null,
					workflowStatus: assignment.status,
					riskAssessment: entry?.risk ?? toRiskAssessment(undefined),
					bondInfo: {
						status: assignment.bondStatus,
						bondSerialNumber: assignment.bondSerialNumber,
						totalAmount: assignment.bondAmount ?? entry?.contractValue ?? 0,
						tenorMonths: assignment.tenorMonths,
						couponRatePercent: assignment.couponRatePercent,
						issuanceDate: isoDate(assignment.issuanceDate),
						maturityDate: isoDate(assignment.maturityDate),
						brokerRepresentative: representative,
					},
					financialProjections: entry?.financialProjections ?? {
						irrPercent: null,
						npvAmount: null,
						paybackYears: null,
					},
					assignedAt: assignment.assignedAt.toISOString(),
					isAccepted: accepted,
					declineReason: assignment.declineReason,
					informationRequest: assignment.informationRequest,
					outstandingRequestsCount: entry?.outstandingRequestsCount ?? 0,
					lastReportDate: entry?.lastReportDate ?? null,
					description: project.description,
					documents: entry?.documents ?? [],
					milestones: entry?.milestones ?? [],
				};
			},
		);

		return c.json({ projects: list });
	}),
);

projectRoutes.route("/", projectLifecycleRoutes);
