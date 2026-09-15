/**
 * Broker platform registry for the "beli obligasi" hand-off.
 *
 * GreenShift never settles a bond trade itself: bonds are bought through a
 * licensed broker app. Trima+ (Trimegah Sekuritas) is the primary target: it is
 * the only platform here that explicitly sells corporate bonds (including IPO)
 * on mobile, which matches the project-bond issuance scenario. IPOT is kept as
 * the manual search target for investors who already use it.
 *
 * Every link below was verified against the official listings:
 *   - Play listing "Trima+", publisher PT. Trimegah Sekuritas Indonesia Tbk
 *   - trimegahsekuritas.com/en/site/product-services/trima
 */

export interface BrokerPlatform {
	/** Stable key, used in deep links and copy payloads. */
	key: string;
	name: string;
	/** Company operating the app: shown as trust context. */
	publisher: string;
	/** Why an investor would pick this platform over the other. */
	note: string;
	/** Google Play listing. Always reachable, so it is the fallback target. */
	playUrl: string;
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

export const TRIMA_PLUS: BrokerPlatform = {
	key: "trima-plus",
	name: "Trima+",
	publisher: "PT Trimegah Sekuritas Indonesia Tbk",
	note: "Bisa beli obligasi korporasi langsung dari aplikasi, termasuk masa penawaran IPO.",
	playUrl:
		"https://play.google.com/store/apps/details?id=id.trimegah.tplus.android&hl=id",
	deepLinkScheme: "trimaplus://",
};

export const IPOT: BrokerPlatform = {
	key: "ipot",
	name: "IPOT",
	publisher: "PT Indopremier Sekuritas",
	note: "Alternatif bila Anda sudah punya akun efek di IPOT.",
	playUrl:
		"https://play.google.com/store/apps/details?id=com.indopremier.ipot&hl=id",
	deepLinkScheme: null,
};

/** Ordered by preference: Trima+ first, it is the only bond-capable target. */
export const BROKER_PLATFORMS: BrokerPlatform[] = [TRIMA_PLUS, IPOT];

export const PRIMARY_BROKER = TRIMA_PLUS;
