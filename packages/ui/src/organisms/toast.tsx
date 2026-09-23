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
	TOAST_STORAGE_KEY,
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
import { Button } from "../atoms/button";

/** Toasts persist in sessionStorage: login/register/logout navigate with window.location.assign, which would wipe an in-memory toast. */
const STORAGE_KEY = TOAST_STORAGE_KEY;

interface ToastItem extends ToastMessage {
	id: number;
	tone: ToastTone;
	expiresAt: number;
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

export function ToastProvider({ children }: { children: ReactNode }) {
	// Start empty and rehydrate in an effect, or a stored toast the server never sent trips hydration.
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
				// The shell header owns the top-right strip (bell, profile), so the stack sits below it.
				className="pointer-events-none fixed top-20 right-0 z-[100] flex flex-col items-end gap-2 px-4"
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

export function useToast() {
	return { toast: publishToast };
}
