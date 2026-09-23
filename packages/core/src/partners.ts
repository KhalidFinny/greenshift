/** The partner apps a bond is issued and held in: GreenShift settles nothing itself. */

export interface PartnerApp {
	key: string;
	name: string;
	publisher: string;
	note: string;
	playUrl: string;
	logoUrl: string;
	/** Best-effort scheme; a wrong or absent app falls back to Play, null skips the attempt. */
	deepLinkScheme: string | null;
}

export const TRIMA_PLUS: PartnerApp = {
	key: "trima-plus",
	name: "Trima+",
	publisher: "PT Trimegah Sekuritas Indonesia Tbk",
	note: "Buy corporate bonds directly from the app, including during the IPO offering period.",
	playUrl:
		"https://play.google.com/store/apps/details?id=id.trimegah.tplus.android&hl=id",
	logoUrl: "/partners/trima-plus.webp",
	deepLinkScheme: "trimaplus://",
};

export const IPOT: PartnerApp = {
	key: "ipot",
	name: "IPOT",
	publisher: "PT Indopremier Sekuritas",
	note: "An alternative if you already have a securities account at IPOT.",
	playUrl:
		"https://play.google.com/store/apps/details?id=com.indopremier.ipot&hl=id",
	logoUrl: "/partners/ipot.webp",
	deepLinkScheme: null,
};

/** Ordered by preference: Trima+ first, it is the only bond-capable target. */
export const PARTNER_APPS: PartnerApp[] = [TRIMA_PLUS, IPOT];

export const PRIMARY_PARTNER = TRIMA_PLUS;
