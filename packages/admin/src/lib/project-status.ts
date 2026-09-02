export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const PROJECT_STATUS_LABELS: Record<string, string> = {
	draft: "Draf",
	assessment: "Penilaian",
	tendering: "Tender",
	blueprint: "Blueprint",
	funding: "Pendanaan",
	monitoring: "Monitoring",
	completed: "Selesai",
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
	draft: "Draf",
	audit: "Audit",
	validated: "Tervalidasi",
	rejected: "Ditolak",
	published: "Terpublikasi",
};

export const BLUEPRINT_STATUS_BADGE: Record<string, BadgeVariant> = {
	draft: "outline",
	audit: "secondary",
	validated: "default",
	rejected: "destructive",
	published: "default",
};
