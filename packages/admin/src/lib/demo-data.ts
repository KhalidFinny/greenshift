import type {
	AdminBlueprint,
	AdminProject,
	AdminStats,
	AdminUser,
} from "@greenshift/api/contracts";

export const ROLE_LABELS: Record<string, string> = {
	business: "Bisnis",
	vendor: "Vendor",
	admin: "Admin",
};

export const BLUEPRINT_META: Record<
	string,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
	}
> = {
	published: { label: "Terverifikasi", variant: "default" },
	validated: { label: "Tervalidasi", variant: "secondary" },
	rejected: { label: "Ditolak", variant: "destructive" },
	audit: { label: "Dalam Audit", variant: "outline" },
	draft: { label: "Draf", variant: "outline" },
};

export const DEMO_STATS: AdminStats = {
	users: { business: 12, vendor: 5, admin: 2 },
	projects: {
		draft: 3,
		assessment: 2,
		funding: 4,
		monitoring: 1,
		completed: 6,
	},
	investments: { total: 24, sum: 2_500_000_000, roiPaid: 450_000_000 },
	payments: { paid: 18, scheduled: 4, failed: 2 },
	usersVerified: { verified: 21, unverified: 6 },
	companies: 14,
	investorsActive: 0,
	blueprints: {
		draft: 2,
		audit: 1,
		validated: 3,
		published: 5,
		rejected: 1,
	},
	funding: [
		{
			id: 1,
			title: "Retrofit Chiller Pabrik Tekstil",
			budget: 500_000_000,
			funded: 420_000_000,
			progress: 0.84,
		},
		{
			id: 2,
			title: "Motor Efisiensi Tinggi",
			budget: 350_000_000,
			funded: 280_000_000,
			progress: 0.8,
		},
		{
			id: 3,
			title: "Sistem Pencahayaan LED",
			budget: 150_000_000,
			funded: 150_000_000,
			progress: 1,
		},
		{
			id: 4,
			title: "Panel Surya Atap Gudang",
			budget: 800_000_000,
			funded: 320_000_000,
			progress: 0.4,
		},
		{
			id: 5,
			title: "Kompresor VFD",
			budget: 200_000_000,
			funded: 90_000_000,
			progress: 0.45,
		},
	],
};

export const DEMO_USERS: AdminUser[] = [
	{
		id: 1,
		email: "hijau@nusantara.co",
		name: "PT Hijau Nusantara",
		role: "business",
		companyName: "Nusantara",
		verifiedAt: "2026-07-10T08:00:00Z",
		vendorProfile: false,
		createdAt: "2026-06-15T09:00:00Z",
	},
	{
		id: 3,
		email: "vendor@ecotech.io",
		name: "EcoTech Solutions",
		role: "vendor",
		companyName: "EcoTech",
		verifiedAt: "2026-07-15T14:00:00Z",
		vendorProfile: true,
		createdAt: "2026-06-18T08:30:00Z",
	},
	{
		id: 4,
		email: "admin@greenshift.dev",
		name: "Administrator",
		role: "admin",
		companyName: "GreenShift",
		verifiedAt: "2026-06-01T00:00:00Z",
		vendorProfile: false,
		createdAt: "2026-06-01T00:00:00Z",
	},
	{
		id: 5,
		email: "ops@karbonbersih.co",
		name: "PT Karbon Bersih",
		role: "business",
		companyName: "Karbon Bersih",
		verifiedAt: null,
		vendorProfile: false,
		createdAt: "2026-08-01T07:00:00Z",
	},
];

export const DEMO_BLUEPRINTS: AdminBlueprint[] = [
	{
		id: 1,
		projectId: 1,
		projectTitle: "Retrofit Chiller Pabrik Tekstil",
		status: "published",
		auditNote: "Data valid, IRR 18.2%",
		validatedAt: "2026-08-10T10:00:00Z",
		publishedAt: "2026-08-12T09:00:00Z",
	},
	{
		id: 2,
		projectId: 2,
		projectTitle: "Motor Efisiensi Tinggi",
		status: "validated",
		auditNote: "Reduksi emisi terverifikasi",
		validatedAt: "2026-08-15T11:00:00Z",
		publishedAt: null,
	},
	{
		id: 3,
		projectId: 3,
		projectTitle: "Sistem Pencahayaan LED",
		status: "audit",
		auditNote: null,
		validatedAt: null,
		publishedAt: null,
	},
	{
		id: 4,
		projectId: 4,
		projectTitle: "Panel Surya Atap Gudang",
		status: "draft",
		auditNote: null,
		validatedAt: null,
		publishedAt: null,
	},
	{
		id: 5,
		projectId: 5,
		projectTitle: "Kompresor VFD",
		status: "rejected",
		auditNote: "Dokumen kurang lengkap",
		validatedAt: null,
		publishedAt: null,
	},
];

export const DEMO_PROJECTS: AdminProject[] = [
	{
		id: 1,
		title: "Retrofit Chiller",
		status: "funding",
		companyName: "PT Hijau Nusantara",
		industrySector: "Manufaktur",
		budget: 500_000_000,
		riskScore: 72,
		blueprintStatus: "published",
	},
	{
		id: 2,
		title: "Motor Efisiensi Tinggi",
		status: "funding",
		companyName: "PT Karbon Bersih",
		industrySector: "Industri Berat",
		budget: 350_000_000,
		riskScore: 68,
		blueprintStatus: "validated",
	},
	{
		id: 3,
		title: "Pencahayaan LED",
		status: "monitoring",
		companyName: "PT Hijau Nusantara",
		industrySector: "Gedung",
		budget: 150_000_000,
		riskScore: 85,
		blueprintStatus: "published",
	},
	{
		id: 4,
		title: "Panel Surya",
		status: "draft",
		companyName: "PT Karbon Bersih",
		industrySector: "Logistik",
		budget: 800_000_000,
		riskScore: 55,
		blueprintStatus: null,
	},
	{
		id: 5,
		title: "Kompresor VFD",
		status: "assessment",
		companyName: "PT Hijau Nusantara",
		industrySector: "Manufaktur",
		budget: 200_000_000,
		riskScore: 62,
		blueprintStatus: null,
	},
	{
		id: 6,
		title: "Heat Recovery",
		status: "completed",
		companyName: "PT Karbon Bersih",
		industrySector: "Industri Berat",
		budget: 450_000_000,
		riskScore: 78,
		blueprintStatus: "published",
	},
	{
		id: 7,
		title: "Variable Speed Drive",
		status: "completed",
		companyName: "PT Hijau Nusantara",
		industrySector: "Manufaktur",
		budget: 280_000_000,
		riskScore: 71,
		blueprintStatus: "published",
	},
	{
		id: 8,
		title: "Insulasi Pipa",
		status: "completed",
		companyName: "PT Karbon Bersih",
		industrySector: "Industri Berat",
		budget: 120_000_000,
		riskScore: 88,
		blueprintStatus: "published",
	},
	{
		id: 9,
		title: "Monitoring Energi",
		status: "assessment",
		companyName: "PT Hijau Nusantara",
		industrySector: "Gedung",
		budget: 90_000_000,
		riskScore: 45,
		blueprintStatus: null,
	},
	{
		id: 10,
		title: "Pompa VFD",
		status: "completed",
		companyName: "PT Karbon Bersih",
		industrySector: "Industri Berat",
		budget: 320_000_000,
		riskScore: 74,
		blueprintStatus: "published",
	},
];

export const ACTIVITY_DATA = [
	{ label: "Jan", value: 2 },
	{ label: "Feb", value: 5 },
	{ label: "Mar", value: 8 },
	{ label: "Apr", value: 12 },
	{ label: "Mei", value: 15 },
	{ label: "Jun", value: 18 },
	{ label: "Jul", value: 22 },
	{ label: "Agu", value: 28 },
];

export const PENDING_ACTIONS = [
	{
		id: 1,
		title: "Vendor EcoTech menunggu verifikasi sertifikasi",
		type: "vendor",
		severity: "medium" as const,
	},
	{
		id: 2,
		title: 'Blueprint "Sistem Pencahayaan LED" dalam audit',
		type: "blueprint",
		severity: "low" as const,
	},
	{
		id: 3,
		title: "PT Karbon Bersih belum diverifikasi",
		type: "user",
		severity: "medium" as const,
	},
	{
		id: 4,
		title: "2 pembayaran ROI terjadwal minggu ini",
		type: "payment",
		severity: "low" as const,
	},
];

export const SYSTEM_SUCCESS_RATE = 99.8;

export const SYSTEM_UPTIME = [
	{ hour: "00", value: 100 },
	{ hour: "04", value: 100 },
	{ hour: "08", value: 99 },
	{ hour: "12", value: 98 },
	{ hour: "16", value: 99 },
	{ hour: "20", value: 100 },
];

export const SYSTEM_COMPONENTS = [
	{ name: "API", status: "operational" as const },
	{ name: "Database", status: "operational" as const },
	{ name: "Payment Gateway", status: "operational" as const },
	{ name: "Notification Service", status: "operational" as const },
	{ name: "Matchmaking Engine", status: "operational" as const },
	{ name: "Storage", status: "operational" as const },
];
