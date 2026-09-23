/* Districts come from the closed list in `@greenshift/core`, so a picked address
   is one the platform can compare; the plain input keeps text-field keyboard behaviour. */

import {
	faChevronDown,
	faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { loadDistricts } from "@greenshift/core";
import { useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";

/** How many matches the list shows before it asks the reader to keep typing. */
const MAX_SHOWN = 100;

export interface DistrictComboboxProps {
	id: string;
	value: string;
	onChange: (value: string) => void;
	/** Called when the field loses focus, for a caller that validates on blur. */
	onBlur?: () => void;
	/** A field message, which the input points at when it has one. */
	error?: string;
	placeholder?: string;
	className?: string;
}

export function DistrictCombobox({
	id,
	value,
	onChange,
	onBlur,
	error,
	placeholder = "Type a district…",
	className,
}: DistrictComboboxProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [districts, setDistricts] = useState<string[] | null>(null);
	const [failed, setFailed] = useState(false);
	const anchor = useRef<HTMLDivElement | null>(null);

	function load() {
		setFailed(false);
		void loadDistricts()
			.then(setDistricts)
			.catch(() => setFailed(true));
	}

	function openList() {
		setOpen(true);
		if (districts === null) load();
	}

	const matches = useMemo(() => {
		const needle = query.trim().toLowerCase();
		const found = needle
			? (districts ?? []).filter((option) =>
					option.toLowerCase().includes(needle),
				)
			: (districts ?? []);
		return { total: found.length, shown: found.slice(0, MAX_SHOWN) };
	}, [districts, query]);

	const listId = `${id}-listbox`;

	return (
		<div ref={anchor} className="relative">
			<FontAwesomeIcon
				icon={faLocationDot}
				className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				id={id}
				role="combobox"
				aria-expanded={open}
				aria-controls={listId}
				aria-autocomplete="list"
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? `${id}-error` : undefined}
				value={open ? query : value}
				onFocus={() => {
					setQuery("");
					openList();
				}}
				onClick={() => {
					if (open) return;
					setQuery("");
					openList();
				}}
				onChange={(event) => {
					setQuery(event.target.value);
					openList();
				}}
				onBlur={onBlur}
				onKeyDown={(event) => {
					if (event.key === "Escape") setOpen(false);
				}}
				placeholder={placeholder}
				autoComplete="off"
				className={cn(
					"h-11 w-full rounded-lg border border-input bg-input/20 pr-12 pl-9 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
					className,
				)}
			/>
			<button
				type="button"
				tabIndex={-1}
				aria-label="Open district options"
				onMouseDown={(event) => event.preventDefault()}
				onClick={() => {
					setQuery("");
					openList();
				}}
				className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring max-sm:size-11"
			>
				<FontAwesomeIcon icon={faChevronDown} className="size-4" />
			</button>

			{open ? (
				<>
					{/* A click anywhere else closes the list without stealing the one
					    the reader was making. */}
					<button
						type="button"
						tabIndex={-1}
						aria-label="Close district options"
						onClick={() => setOpen(false)}
						className="fixed inset-0 z-40 cursor-default"
					/>
					<div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
						<div
							role="listbox"
							id={listId}
							aria-label="District list"
							className="max-h-64 overflow-y-auto p-1"
						>
							{districts === null && !failed ? (
								<p className="px-3 py-2 text-sm text-muted-foreground">
									Loading the district list…
								</p>
							) : null}
							{failed ? (
								<div className="px-3 py-2">
									<p className="text-sm text-destructive">
										Could not load the district list.
									</p>
									<button
										type="button"
										onClick={load}
										className="mt-1 rounded text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
									>
										Try again
									</button>
								</div>
							) : null}
							{matches.shown.map((option) => (
								<button
									key={option}
									type="button"
									role="option"
									aria-selected={option === value}
									onClick={() => {
										onChange(option);
										setOpen(false);
									}}
									className={cn(
										"block w-full truncate rounded px-3 py-2 text-left text-sm",
										option === value
											? "bg-muted font-semibold"
											: "hover:bg-muted",
									)}
								>
									{option}
								</button>
							))}
							{districts !== null && matches.total === 0 ? (
								<div className="px-3 py-2">
									<p className="text-sm font-medium">
										No district matches that.
									</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Try another spelling, or the district next to it.
									</p>
								</div>
							) : null}
						</div>
						{matches.total > MAX_SHOWN ? (
							<p className="border-t border-border px-3 py-2 text-sm tabular-nums text-muted-foreground">
								{MAX_SHOWN} of {matches.total}. Keep typing.
							</p>
						) : null}
					</div>
				</>
			) : null}

			{error ? (
				<p
					id={`${id}-error`}
					role="alert"
					className="mt-2 text-sm text-destructive"
				>
					{error}
				</p>
			) : null}
		</div>
	);
}
