import {
	faCircleCheck,
	faCircleExclamation,
	faCircleInfo,
	faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	publishToast,
	subscribeToasts,
	type ToastMessage,
	type ToastTone,
} from "@greenshift/core";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { cn } from "#/lib/utils";
import { Button } from "./button";

/**
 * Toasts are persisted in sessionStorage so they survive full page loads:
 * login/register/logout navigate with window.location.assign, which would
 * otherwise wipe an in-memory-only toast mid-flight. sessionStorage is
 * per-tab, so nothing lingers after the tab closes.
 */
const STORAGE_KEY = "greenshift:toasts";

interface ToastItem extends ToastMessage {
	id: number;
	tone: ToastTone;
	/** Epoch ms when the toast should dismiss itself. */
	expiresAt: number;
	/**
	 * Restored from sessionStorage after a page load: renders in place
	 * without the slide-in entry so it reads as continuous, not re-arriving.
	 */
	animateIn?: boolean;
}

interface ToastToneMeta {
	icon: typeof faCircleInfo;
	iconClass: string;
	label: string;
}

const TONE_META: Record<ToastTone, ToastToneMeta> = {
	success: {
		icon: faCircleCheck,
		iconClass: "text-primary",
		label: "Success",
	},
	error: {
		icon: faCircleExclamation,
		iconClass: "text-destructive",
		label: "Failed",
	},
	info: {
		icon: faCircleInfo,
		iconClass: "text-muted-foreground",
		label: "Info",
	},
};

const ERROR_DURATION_MS = 6500;
const TOAST_DURATION_MS = 4000;

function durationFor(tone: ToastTone): number {
	return tone === "error" ? ERROR_DURATION_MS : TOAST_DURATION_MS;
}

function readStored(): ToastItem[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as Partial<ToastItem>[];
		return parsed.flatMap((item) =>
			typeof item?.id === "number" &&
			typeof item?.message === "string" &&
			typeof item?.expiresAt === "number" &&
			item.expiresAt > Date.now()
				? [
						{
							id: item.id,
							tone:
								item.tone === "error" || item.tone === "success"
									? item.tone
									: "info",
							title: typeof item.title === "string" ? item.title : undefined,
							message: item.message,
							expiresAt: item.expiresAt,
							animateIn: false,
						},
					]
				: [],
		);
	} catch {
		return [];
	}
}

function writeStored(items: ToastItem[]): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	} catch {
		// Storage full / unavailable: toasts still work in memory.
	}
}

function ToastCard({
	item,
	onClose,
}: {
	item: ToastItem;
	onClose: () => void;
}) {
	const meta = TONE_META[item.tone];
	const entryAnimation =
		item.animateIn !== false
			? "animate-in fade-in-0 slide-in-from-top-4 duration-300 ease-out"
			: "";
	return (
		<div
			role={item.tone === "error" ? "alert" : "status"}
			className={cn(
				"pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg",
				entryAnimation,
			)}
		>
			<FontAwesomeIcon
				icon={meta.icon}
				className={cn("mt-0.5 text-lg", meta.iconClass)}
			/>
			<div className="min-w-0 flex-1">
				<p className="font-medium">{item.title ?? meta.label}</p>
				<p className="mt-0.5 text-base text-muted-foreground">{item.message}</p>
			</div>
			<Button
				variant="ghost"
				size="icon"
				className="-mr-1.5 -mt-1.5 shrink-0"
				onClick={onClose}
				aria-label="Dismiss notification"
			>
				<FontAwesomeIcon icon={faXmark} />
			</Button>
		</div>
	);
}

/**
 * Global toast surface. Mount once at the app root: it subscribes to the
 * core toast bus (where the API client publishes every mutation outcome),
 * renders stacked notifications top-center, and survives page navigation
 * by persisting pending toasts to sessionStorage.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
	// Server and first client render must match: start empty, then rehydrate
	// persisted toasts in an effect. Otherwise the client may render a stored
	// toast that the server never sent, which triggers a hydration mismatch.
	const [items, setItems] = useState<ToastItem[]>([]);
	const itemsRef = useRef<ToastItem[]>([]);
	itemsRef.current = items;
	const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
	const nextId = useRef(Date.now());

	const dismiss = useCallback((id: number) => {
		const timer = timers.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.current.delete(id);
		}
		const next = itemsRef.current.filter((item) => item.id !== id);
		itemsRef.current = next;
		setItems(next);
		writeStored(next);
	}, []);

	useEffect(() => {
		// Rehydrate after mount: keep unexpired toasts from a previous page
		// load and schedule their remaining lifetime (no timer restart).
		const stored = readStored();
		const valid = stored.filter((item) => item.expiresAt > Date.now());
		itemsRef.current = valid;
		setItems(valid);
		if (valid.length !== stored.length) writeStored(valid);
		for (const item of valid) {
			const timer = setTimeout(
				() => dismiss(item.id),
				Math.max(item.expiresAt - Date.now(), 0),
			);
			timers.current.set(item.id, timer);
		}
	}, [dismiss]);

	useEffect(() => {
		const unsubscribe = subscribeToasts((toast) => {
			const id = nextId.current++;
			const tone = toast.tone ?? "info";
			const entry: ToastItem = {
				...toast,
				id,
				tone,
				expiresAt: Date.now() + durationFor(tone),
			};
			const next = [...itemsRef.current, entry];
			itemsRef.current = next;
			setItems(next);
			writeStored(next);
			const timer = setTimeout(() => dismiss(id), durationFor(tone));
			timers.current.set(id, timer);
		});
		return () => {
			unsubscribe();
			for (const timer of timers.current.values()) clearTimeout(timer);
			timers.current.clear();
		};
	}, [dismiss]);

	return (
		<>
			{children}
			<div
				aria-live="polite"
				className="pointer-events-none fixed right-0 top-0 z-[100] flex flex-col items-end gap-2 px-4 pt-4"
			>
				{items.map((item) => (
					<ToastCard
						key={item.id}
						item={item}
						onClose={() => dismiss(item.id)}
					/>
				))}
			</div>
		</>
	);
}

/** Imperative toast for component-level events (CSV export, etc.). */
export function useToast() {
	return { toast: publishToast };
}
