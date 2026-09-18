/** Demo accounts shared by the setup scripts (`bun run db:setup`). */
export const DEMO_PASSWORD = "12345678";

export interface DemoAccount {
	username: string;
	name: string;
	role: "business" | "investor" | "vendor" | "broker" | "admin";
	companyName: string | null;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
	{
		username: "business1",
		name: "PT Green Nusantara",
		role: "business",
		companyName: "PT Green Nusantara",
	},
	{
		username: "investor1",
		name: "Green Fund Capital",
		role: "investor",
		companyName: "Green Fund Capital",
	},
	{
		username: "vendor1",
		name: "EcoTech Solutions",
		role: "vendor",
		companyName: "EcoTech Solutions",
	},
	{
		username: "broker1",
		name: "Capital Green Securities",
		role: "broker",
		companyName: "Capital Green Securities",
	},
	{
		username: "vendor2",
		name: "Eco Power Indonesia",
		role: "vendor",
		companyName: "PT Eco Power Indonesia",
	},
	{
		username: "vendor3",
		name: "Bio Thermal Energy",
		role: "vendor",
		companyName: "PT Bio Thermal Energy",
	},
	{ username: "admin", name: "Administrator", role: "admin", companyName: null },
];

/** Accounts the broker-stage fixtures rely on. */
export const BROKER_STAGE_ACCOUNTS = ["broker1", "vendor2", "vendor3"] as const;

export function emailFor(username: string): string {
	return `${username}@greenshift.dev`;
}
