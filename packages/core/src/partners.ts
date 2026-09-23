/**
 * The partner apps a bond is issued and held in.
 *
 * GreenShift never settles a trade itself: the instrument is issued, sold and
 * held by a licensed securities partner, and this registry is the hand-off to
 * those apps. It lives in core because two surfaces point at it: the public
 * listing, which opens the app to buy, and the landing page, which names the
 * partners a project is monitored through.
 *
 * Every link below was verified against the official listings:
 *   - Play listing "Trima+", publisher PT. Trimegah Sekuritas Indonesia Tbk
 *   - Play listing "IPOT", publisher PT Indopremier Sekuritas
 * The icons are the ones those listings publish.
 */

export interface PartnerApp {
	/** Stable key, used in deep links and copy payloads. */
	key: string;
	name: string;
	/** Company operating the app: shown as trust context. */
	publisher: string;
	/** Why an investor would pick this platform over the other. */
	note: string;
	/** Google Play listing. Always reachable, so it is the fallback target. */
	playUrl: string;
	/** The app's icon, as the store publishes it. */
	logoUrl: string;
	/**
	 * Best-effort Android URL scheme used to open the installed app.
	 *
	 * VERIFY BEFORE DEMO: neither the Play listing nor Trimegah's product page
	 * documents a public scheme, so this is a placeholder derived from the app
	 * id. Launching fails safe: if the scheme is wrong or the app is not
	 * installed, the Android intent resolves nothing and we fall back to the
	 * Play listing. To confirm, open this URL on a device with Trima+
	 * installed and check the app opens instead of Play.
	 *
	 * `null` means "no known scheme": the UI then skips the launch attempt and
	 * goes straight to Play, so we never fire a dead intent.
	 */
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
