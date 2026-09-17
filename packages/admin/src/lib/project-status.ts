export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const PROJECT_STATUS_LABELS: Record<string, string> = {
	draft: "Draft",
	assessment: "Assessment",
	tendering: "Tender",
	blueprint: "Blueprint",
	funding: "Funding",
	monitoring: "Monitoring",
	completed: "Completed",
};

export const PROJECT_STATUS_OPTIONS = [
	"draft",
	"assessment",
	"tendering",
	"blueprint",
	"funding",
	"monitoring",
	"completed",
] as const;

export const PROJECT_STATUS_BADGE: Record<string, BadgeVariant> = {
	draft: "outline",
	assessment: "secondary",
	tendering: "secondary",
	blueprint: "secondary",
	funding: "default",
	monitoring: "secondary",
	completed: "default",
};

export const BLUEPRINT_STATUS_LABELS: Record<string, string> = {
	draft: "Draft",
	audit: "Audit",
	validated: "Validated",
	rejected: "Rejected",
	published: "Published",
};

export const BLUEPRINT_STATUS_BADGE: Record<string, BadgeVariant> = {
	draft: "outline",
	audit: "secondary",
	validated: "default",
	rejected: "destructive",
	published: "default",
};
