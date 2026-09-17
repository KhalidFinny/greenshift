import {
	faArrowUpRightFromSquare,
	faCheck,
	faCopy,
	faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { publishToast } from "@greenshift/core";
import { Button } from "@greenshift/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { bondCodeFor, bondSearchPayload } from "../lib/bond-code";
import {
	BROKER_PLATFORMS,
	type BrokerPlatform,
	PRIMARY_BROKER,
} from "../lib/broker-platforms";

type LaunchState = "idle" | "opening" | "launched" | "fallback";

interface BondPurchaseActionsProps {
	project: {
		id: number;
		title: string;
		bondCode?: string | null;
		companyName?: string | null;
		blueprint?: { irr?: number };
	};
}

/** How long we wait for a deep link to hand off before assuming it failed. */
const LAUNCH_TIMEOUT_MS = 1500;

/** Copy text to the clipboard, with a legacy fallback for non-secure contexts. */
async function copyText(value: string): Promise<boolean> {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(value);
			return true;
		}
	} catch {
		// Permission denied or insecure context: fall through to execCommand.
	}

	try {
		const area = document.createElement("textarea");
		area.value = value;
		area.setAttribute("readonly", "");
		area.style.position = "fixed";
		area.style.opacity = "0";
		document.body.appendChild(area);
		area.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(area);
		return ok;
	} catch {
		return false;
	}
}

/**
 * Best-effort app launch on Android.
 *
 * We navigate to the app's URL scheme and watch for the page being backgrounded
 * (`visibilitychange`/`pagehide`). If neither fires before the timeout the app
 * is missing or the scheme does not resolve, so the caller sends the investor to
 * Google Play instead of leaving them on a dead screen.
 *
 * Returns true when the hand-off was detected.
 */
function launchApp(
	scheme: string,
	timeoutMs = LAUNCH_TIMEOUT_MS,
): Promise<boolean> {
	return new Promise((resolve) => {
		let settled = false;
		const finish = (launched: boolean) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(launched);
		};

		const onHidden = () => {
			if (document.visibilityState === "hidden") finish(true);
		};
		const onPageHide = () => finish(true);

		const cleanup = () => {
			window.clearTimeout(timer);
			document.removeEventListener("visibilitychange", onHidden);
			window.removeEventListener("pagehide", onPageHide);
		};

		// Timers are throttled in background tabs, but a backgrounded page is
		// exactly the success case (handled by the listeners above).
		const timer = window.setTimeout(() => finish(false), timeoutMs);

		document.addEventListener("visibilitychange", onHidden);
		window.addEventListener("pagehide", onPageHide);

		try {
			window.location.href = scheme;
		} catch {
			finish(false);
		}
	});
}

function isAndroid(): boolean {
	if (typeof navigator === "undefined") return false;
	return /android/i.test(navigator.userAgent);
}

function openPlay(platform: BrokerPlatform) {
	window.open(platform.playUrl, "_blank", "noopener,noreferrer");
}

/**
 * The "buy bond" hand-off on each verified card.
 *
 * Priority order:
 *   1. Open the broker app via Android deep link (Trima+ first).
 *   2. Deep link failed / unsupported -> Google Play listing.
 *   3. Always: "Copy Code" so the code can be searched manually in any broker.
 */
export function BondPurchaseActions({ project }: BondPurchaseActionsProps) {
	const code = bondCodeFor(project);
	const [launch, setLaunch] = useState<LaunchState>("idle");
	const [platform, setPlatform] = useState<BrokerPlatform>(PRIMARY_BROKER);
	const [copied, setCopied] = useState(false);
	const copiedTimer = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (copiedTimer.current !== null) {
				window.clearTimeout(copiedTimer.current);
			}
		};
	}, []);

	const openPlatform = useCallback(async (target: BrokerPlatform) => {
		setPlatform(target);

		// No known scheme, or not Android: never fire a dead intent, go to Play.
		if (!target.deepLinkScheme || !isAndroid()) {
			setLaunch("fallback");
			openPlay(target);
			return;
		}

		setLaunch("opening");
		const launched = await launchApp(target.deepLinkScheme);
		if (launched) {
			setLaunch("launched");
			return;
		}
		// App not installed or scheme unsupported -> Play listing.
		setLaunch("fallback");
		openPlay(target);
	}, []);

	const handleCopy = useCallback(async () => {
		const ok = await copyText(bondSearchPayload(project));
		if (!ok) {
			publishToast({
				tone: "error",
				title: "Copy failed",
				message: `Copy manually: ${code}`,
			});
			return;
		}
		setCopied(true);
		publishToast({
			tone: "success",
			title: "Code copied",
			message: `${code} is ready to paste into ${platform.name}.`,
		});
		if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
		copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
	}, [project, code, platform.name]);

	const secondary = BROKER_PLATFORMS.find(
		(entry) => entry.key !== PRIMARY_BROKER.key,
	);

	return (
		<div className="space-y-3">
			<p className="text-sm text-muted-foreground">
				Bond code{" "}
				<span className="font-mono font-medium text-foreground">{code}</span>
			</p>

			<Button
				size="lg"
				className="w-full text-base"
				disabled={launch === "opening"}
				onClick={() => void openPlatform(PRIMARY_BROKER)}
			>
				<FontAwesomeIcon icon={faArrowUpRightFromSquare} />
				{launch === "opening"
					? `Opening ${PRIMARY_BROKER.name}...`
					: `Buy on ${PRIMARY_BROKER.name}`}
			</Button>

			{/* Deep link failed or the platform has no scheme: Play is the exit. */}
			{launch === "fallback" && (
				<div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
					<p className="text-sm font-medium">
						{platform.name} is not installed
					</p>
					<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
						We are redirecting you to Google Play. Once installed, search for
						code <span className="font-mono">{code}</span>.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-2 w-full"
						onClick={() => openPlay(platform)}
					>
						<FontAwesomeIcon icon={faArrowUpRightFromSquare} />
						Open Google Play
					</Button>
				</div>
			)}

			{launch === "launched" && (
				<p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed text-muted-foreground">
					{platform.name} is open. Search for code{" "}
					<span className="font-mono font-semibold">{code}</span> in the search
					field.
				</p>
			)}

			<div className="flex gap-2">
				<Button
					variant="outline"
					size="lg"
					className="flex-1 text-base"
					onClick={() => void handleCopy()}
				>
					<FontAwesomeIcon icon={copied ? faCheck : faCopy} />
					{copied ? "Copied" : "Copy Code"}
				</Button>
				{secondary && (
					<Button
						variant="ghost"
						size="lg"
						className="flex-1 text-base"
						onClick={() => void openPlatform(secondary)}
					>
						<FontAwesomeIcon icon={faMagnifyingGlass} />
						Search on {secondary.name}
					</Button>
				)}
			</div>
		</div>
	);
}
