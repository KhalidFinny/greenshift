import {
	createFormHook,
	createFormHookContexts,
	useStore,
} from "@tanstack/react-form";
import type * as React from "react";
import { useLayoutEffect, useRef } from "react";

import { cn } from "#/lib/utils";
import { Button } from "../atoms/button";
import { Input } from "../atoms/input";
import { Label } from "../atoms/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../atoms/select";
import { Spinner } from "../atoms/spinner";

const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

function toMessage(error: unknown): string | null {
	if (error === null || error === undefined || error === false) return null;
	if (typeof error === "string") return error;
	if (typeof error === "object" && "message" in error) {
		return String(error.message);
	}
	return String(error);
}

const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

function groupDigits(digits: string): string {
	return digits.replace(THOUSANDS, ".");
}

/** The Indonesian convention `parseIdNumber` reads: dots group in threes, a comma opens the decimals, four decimals max. */
function regroupNumber(raw: string): string {
	const cleaned = raw.replace(/[^0-9.,]/g, "");
	if (!cleaned) return "";

	const comma = cleaned.lastIndexOf(",");
	if (comma >= 0) {
		const whole = groupDigits(cleaned.slice(0, comma).replace(/[.,]/g, ""));
		const decimals = cleaned
			.slice(comma + 1)
			.replace(/[.,]/g, "")
			.slice(0, 4);
		// A trailing comma is the user starting the decimals, so it stays.
		if (cleaned.endsWith(",")) return `${whole},`;
		return decimals ? `${whole},${decimals}` : whole;
	}

	if (cleaned.includes(".")) {
		if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) return cleaned;

		const dot = cleaned.indexOf(".");
		const whole = cleaned.slice(0, dot).replace(/\D/g, "");
		const decimals = cleaned.slice(dot + 1).replace(/\D/g, "");
		const oneDot = dot === cleaned.lastIndexOf(".");
		if (oneDot && whole.length <= 2 && decimals.length <= 2) {
			const grouped = groupDigits(whole);
			if (cleaned.endsWith(".")) return `${grouped},`;
			return decimals ? `${grouped},${decimals}` : grouped;
		}
		return groupDigits(cleaned.replace(/\./g, ""));
	}

	return groupDigits(cleaned);
}

/** Where the caret belongs after regrouping: after the same digit as before, ignoring the dots the field inserted. */
function caretAfterRegrouping(
	raw: string,
	grouped: string,
	caret: number,
): number {
	const significantBefore = raw.slice(0, caret).replace(/[^0-9,]/g, "").length;
	if (significantBefore === 0) return 0;

	let seen = 0;
	for (let index = 0; index < grouped.length; index += 1) {
		if (/[0-9,]/.test(grouped[index] ?? "")) {
			seen += 1;
			if (seen === significantBefore) return index + 1;
		}
	}
	return grouped.length;
}

function FieldMessages({
	id,
	description,
	error,
}: {
	id: string;
	description?: string;
	error: string | null;
}) {
	if (error) {
		return (
			<p id={`${id}-error`} role="alert" className="text-sm text-destructive">
				{error}
			</p>
		);
	}
	if (description) {
		return (
			<p id={`${id}-description`} className="text-sm text-muted-foreground">
				{description}
			</p>
		);
	}
	return null;
}

function FieldShell({
	id,
	label,
	description,
	error,
	children,
}: {
	id: string;
	label: string;
	description?: string;
	error: string | null;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			{children}
			<FieldMessages id={id} description={description} error={error} />
		</div>
	);
}

function describes(
	id: string,
	error: string | null,
	description?: string,
): string | undefined {
	if (error) return `${id}-error`;
	if (description) return `${id}-description`;
	return undefined;
}

export interface TextFieldProps
	extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "onBlur"> {
	label: string;
	description?: string;
}

function TextField({ label, description, id, ...props }: TextFieldProps) {
	const field = useFieldContext<string>();
	const error = toMessage(field.state.meta.errors[0]);
	const inputId = id ?? field.name;
	return (
		<FieldShell
			id={inputId}
			label={label}
			description={description}
			error={error}
		>
			<Input
				id={inputId}
				value={field.state.value ?? ""}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				aria-invalid={error ? true : undefined}
				aria-describedby={describes(inputId, error, description)}
				{...props}
			/>
		</FieldShell>
	);
}

function PasswordField(props: Omit<TextFieldProps, "type">) {
	return <TextField type="password" {...props} />;
}

export interface NumberFieldProps
	extends Omit<
		React.ComponentProps<"input">,
		"value" | "onChange" | "onBlur" | "type"
	> {
	label: string;
	description?: string;
	prefix?: string;
	unit?: string;
	min?: number;
	max?: number;
}

/** Bound to the nearest field: the value is the grouped string on screen, callers parse it at the edge. */
function NumberField({
	label,
	description,
	prefix,
	unit,
	id,
	inputMode = "decimal",
	min,
	max,
	className,
	...props
}: NumberFieldProps) {
	const field = useFieldContext<string>();
	const error = toMessage(field.state.meta.errors[0]);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const caretRef = useRef<number | null>(null);

	// A re-render drops the caret to the end of a controlled value, so it is restored before the browser paints.
	useLayoutEffect(() => {
		const caret = caretRef.current;
		if (caret === null) return;
		caretRef.current = null;
		inputRef.current?.setSelectionRange(caret, caret);
	});
	const inputId = id ?? field.name;
	const unitId = `${inputId}-unit`;
	// Exactly one marker carries the id, so the description never dangles.
	const markerId = (unit ?? prefix) ? unitId : undefined;
	const describedBy = error
		? `${inputId}-error`
		: (markerId ?? describes(inputId, error, description));
	return (
		<FieldShell
			id={inputId}
			label={label}
			description={description}
			error={error}
		>
			<div className="flex items-center gap-2">
				{prefix ? (
					<span
						id={unit ? undefined : unitId}
						className="shrink-0 text-sm text-muted-foreground"
					>
						{prefix}
					</span>
				) : null}
				<Input
					ref={inputRef}
					id={inputId}
					inputMode={inputMode}
					min={min}
					max={max}
					value={field.state.value ?? ""}
					onBlur={() => {
						const regrouped = regroupNumber(field.state.value ?? "");
						if (regrouped !== field.state.value) field.handleChange(regrouped);
						field.handleBlur();
					}}
					onChange={(event) => {
						const input = event.target;
						const caret = input.selectionStart ?? input.value.length;
						// Everything but digits, dots and commas is dropped; the dots group in threes.
						const regrouped = regroupNumber(input.value);
						// Always written back: the controlled value is also what strips a rejected character.
						caretRef.current = caretAfterRegrouping(
							input.value,
							regrouped,
							caret,
						);
						field.handleChange(regrouped);
					}}
					aria-invalid={error ? true : undefined}
					aria-describedby={describedBy}
					className={cn("text-base tabular-nums", className)}
					{...props}
				/>
				{unit ? (
					<span id={unitId} className="shrink-0 text-sm text-muted-foreground">
						{unit}
					</span>
				) : null}
			</div>
		</FieldShell>
	);
}

export interface TextareaFieldProps
	extends Omit<
		React.ComponentProps<"textarea">,
		"value" | "onChange" | "onBlur"
	> {
	label: string;
	description?: string;
}

function TextareaField({
	label,
	description,
	id,
	className,
	rows = 5,
	...props
}: TextareaFieldProps) {
	const field = useFieldContext<string>();
	const error = toMessage(field.state.meta.errors[0]);
	const inputId = id ?? field.name;
	return (
		<FieldShell
			id={inputId}
			label={label}
			description={description}
			error={error}
		>
			<textarea
				id={inputId}
				rows={rows}
				value={field.state.value ?? ""}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				aria-invalid={error ? true : undefined}
				aria-describedby={describes(inputId, error, description)}
				className={cn(
					"w-full rounded-lg border border-input bg-input/20 px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
					className,
				)}
				{...props}
			/>
		</FieldShell>
	);
}

export interface SelectFieldOption {
	value: string;
	label: string;
}

export interface SelectFieldProps {
	label: string;
	description?: string;
	placeholder?: string;
	options: readonly (SelectFieldOption | string)[];
	id?: string;
	disabled?: boolean;
	className?: string;
}

function SelectField({
	label,
	description,
	placeholder,
	options,
	id,
	disabled,
	className,
}: SelectFieldProps) {
	const field = useFieldContext<string>();
	const error = toMessage(field.state.meta.errors[0]);
	const inputId = id ?? field.name;
	const items = options.map((option) =>
		typeof option === "string" ? { value: option, label: option } : option,
	);
	return (
		<FieldShell
			id={inputId}
			label={label}
			description={description}
			error={error}
		>
			<Select
				value={field.state.value}
				onValueChange={(value) => field.handleChange(value)}
				disabled={disabled}
			>
				<SelectTrigger
					id={inputId}
					aria-invalid={error ? true : undefined}
					aria-describedby={describes(inputId, error, description)}
					className={cn("w-full", className)}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</FieldShell>
	);
}

export interface CheckboxFieldProps
	extends Omit<
		React.ComponentProps<"input">,
		"value" | "onChange" | "onBlur" | "type"
	> {
	label: string;
	description?: string;
}

/** The label is the click target, so the whole sentence is aimed at, not the 16px box. */
function CheckboxField({
	label,
	description,
	id,
	className,
	...props
}: CheckboxFieldProps) {
	const field = useFieldContext<boolean>();
	const error = toMessage(field.state.meta.errors[0]);
	const inputId = id ?? field.name;
	return (
		<div className="space-y-2">
			<div className="flex items-start gap-3">
				<input
					id={inputId}
					type="checkbox"
					checked={field.state.value}
					onBlur={field.handleBlur}
					onChange={(event) => field.handleChange(event.target.checked)}
					aria-invalid={error ? true : undefined}
					aria-describedby={describes(inputId, error, description)}
					className={cn("mt-0.5 size-5 shrink-0 accent-primary", className)}
					{...props}
				/>
				<Label htmlFor={inputId} className="text-base font-normal leading-6">
					{label}
				</Label>
			</div>
			<FieldMessages id={inputId} description={description} error={error} />
		</div>
	);
}

function SubmitButton({
	children,
	...props
}: React.ComponentProps<typeof Button>) {
	const form = useFormContext();
	return (
		<form.Subscribe
			selector={(state) => [state.canSubmit, state.isSubmitting] as const}
		>
			{([canSubmit, isSubmitting]) => (
				<Button type="submit" disabled={!canSubmit || isSubmitting} {...props}>
					{isSubmitting ? (
						<span className="inline-flex items-center gap-2">
							<Spinner className="size-4" />
							{children}
						</span>
					) : (
						children
					)}
				</Button>
			)}
		</form.Subscribe>
	);
}

export const { useAppForm, withForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		CheckboxField,
		NumberField,
		PasswordField,
		SelectField,
		TextareaField,
		TextField,
	},
	formComponents: { SubmitButton },
});

// Role packages import only from `@greenshift/ui`, so `useStore` is re-exported here.
export { useStore };

export { fieldContext, formContext, useFieldContext, useFormContext };
