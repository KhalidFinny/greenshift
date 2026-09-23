import { relations } from "drizzle-orm";
import { brokerAssignments, brokerProfiles, documentRequests } from "./broker";
import { investments, roiPayments } from "./investments";
import {
	emissionReports,
	energyForecasts,
	milestoneEvidence,
	projectMilestones,
} from "./mrv";
import {
	negotiations,
	proposalRevisions,
	proposals,
	tenders,
	vendorAssignments,
	vendorMatchScores,
} from "./procurement";
import {
	blueprints,
	projectDocuments,
	projects,
	riskAssessments,
} from "./projects";
import { companyDocuments, users } from "./users";
import { vendorPortfolioItems, vendors } from "./vendor";

export const usersRelations = relations(users, ({ one, many }) => ({
	projects: many(projects, { relationName: "company_projects" }),
	vendorProfile: one(vendors),
	investments: many(investments),
	blueprintValidations: many(blueprints),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
	user: one(users, { fields: [vendors.userId], references: [users.id] }),
	proposals: many(proposals),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
	company: one(users, {
		fields: [projects.companyId],
		references: [users.id],
		relationName: "company_projects",
	}),
	documents: many(projectDocuments),
	riskAssessment: one(riskAssessments),
	tenders: many(tenders),
	blueprints: many(blueprints),
	investments: many(investments),
	emissionReports: many(emissionReports),
	forecasts: many(energyForecasts),
}));

export const projectDocumentsRelations = relations(
	projectDocuments,
	({ one }) => ({
		project: one(projects, {
			fields: [projectDocuments.projectId],
			references: [projects.id],
		}),
	}),
);

export const riskAssessmentsRelations = relations(
	riskAssessments,
	({ one }) => ({
		project: one(projects, {
			fields: [riskAssessments.projectId],
			references: [projects.id],
		}),
	}),
);

export const vendorMatchScoresRelations = relations(
	vendorMatchScores,
	({ one }) => ({
		project: one(projects, {
			fields: [vendorMatchScores.projectId],
			references: [projects.id],
		}),
		vendor: one(vendors, {
			fields: [vendorMatchScores.vendorId],
			references: [vendors.id],
		}),
	}),
);

export const vendorAssignmentsRelations = relations(
	vendorAssignments,
	({ one }) => ({
		project: one(projects, {
			fields: [vendorAssignments.projectId],
			references: [projects.id],
		}),
		vendor: one(vendors, {
			fields: [vendorAssignments.vendorId],
			references: [vendors.id],
		}),
	}),
);

export const tendersRelations = relations(tenders, ({ one, many }) => ({
	project: one(projects, {
		fields: [tenders.projectId],
		references: [projects.id],
	}),
	proposals: many(proposals),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
	tender: one(tenders, {
		fields: [proposals.tenderId],
		references: [tenders.id],
	}),
	vendor: one(vendors, {
		fields: [proposals.vendorId],
		references: [vendors.id],
	}),
	revisions: many(proposalRevisions),
}));

export const proposalRevisionsRelations = relations(
	proposalRevisions,
	({ one }) => ({
		proposal: one(proposals, {
			fields: [proposalRevisions.proposalId],
			references: [proposals.id],
		}),
	}),
);

export const blueprintsRelations = relations(blueprints, ({ one }) => ({
	project: one(projects, {
		fields: [blueprints.projectId],
		references: [projects.id],
	}),
	auditor: one(users, {
		fields: [blueprints.auditorId],
		references: [users.id],
	}),
}));

export const energyForecastsRelations = relations(
	energyForecasts,
	({ one }) => ({
		project: one(projects, {
			fields: [energyForecasts.projectId],
			references: [projects.id],
		}),
	}),
);

export const investmentsRelations = relations(investments, ({ one, many }) => ({
	project: one(projects, {
		fields: [investments.projectId],
		references: [projects.id],
	}),
	investor: one(users, {
		fields: [investments.investorId],
		references: [users.id],
	}),
	payments: many(roiPayments),
}));

export const roiPaymentsRelations = relations(roiPayments, ({ one }) => ({
	investment: one(investments, {
		fields: [roiPayments.investmentId],
		references: [investments.id],
	}),
}));

export const emissionReportsRelations = relations(
	emissionReports,
	({ one }) => ({
		project: one(projects, {
			fields: [emissionReports.projectId],
			references: [projects.id],
		}),
	}),
);

export const negotiationsRelations = relations(negotiations, ({ one }) => ({
	proposal: one(proposals, {
		fields: [negotiations.proposalId],
		references: [proposals.id],
	}),
}));

export const projectMilestonesRelations = relations(
	projectMilestones,
	({ one, many }) => ({
		project: one(projects, {
			fields: [projectMilestones.projectId],
			references: [projects.id],
		}),
		evidence: many(milestoneEvidence),
	}),
);

export const milestoneEvidenceRelations = relations(
	milestoneEvidence,
	({ one }) => ({
		milestone: one(projectMilestones, {
			fields: [milestoneEvidence.milestoneId],
			references: [projectMilestones.id],
		}),
	}),
);

export const companyDocumentsRelations = relations(
	companyDocuments,
	({ one }) => ({
		user: one(users, {
			fields: [companyDocuments.userId],
			references: [users.id],
		}),
	}),
);

export const vendorPortfolioItemsRelations = relations(
	vendorPortfolioItems,
	({ one }) => ({
		vendor: one(vendors, {
			fields: [vendorPortfolioItems.vendorId],
			references: [vendors.id],
		}),
	}),
);

export const brokerProfilesRelations = relations(brokerProfiles, ({ one }) => ({
	user: one(users, {
		fields: [brokerProfiles.userId],
		references: [users.id],
	}),
}));

export const brokerAssignmentsRelations = relations(
	brokerAssignments,
	({ one, many }) => ({
		project: one(projects, {
			fields: [brokerAssignments.projectId],
			references: [projects.id],
		}),
		broker: one(users, {
			fields: [brokerAssignments.brokerId],
			references: [users.id],
		}),
		documentRequests: many(documentRequests),
	}),
);

export const documentRequestsRelations = relations(
	documentRequests,
	({ one }) => ({
		assignment: one(brokerAssignments, {
			fields: [documentRequests.assignmentId],
			references: [brokerAssignments.id],
		}),
		project: one(projects, {
			fields: [documentRequests.projectId],
			references: [projects.id],
		}),
	}),
);
