import {
	createFormHook,
	createFormHookContexts,
	useStore,
} from "@tanstack/react-form";
import type * as React from "react";

import { cn } from "#/lib/utils";
import { Spinner } from "../loaders/spinner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

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

/**
 * What a field says underneath its control. One element for both, so a message
 * never lands above the control in some fields and below it in others.
 */
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

/** The label plus message stack every control in this bundle wraps itself in. */
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

/** The id of whatever currently describes the control, or nothing. */
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

/** Text input bound to the nearest TanStack Form field. */
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

/** Password input bound to the nearest TanStack Form field. */
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
	/** Static marker before the input, such as `Rp`. */
	prefix?: string;
	/** Static unit after the input, such as `MWh/year`. */
	unit?: string;
}

/**
 * Numeric input bound to the nearest field. The value stays the string the user
 * typed (Indonesian grouping included), so what is stored is what is shown back;
 * callers parse it at the edge. The unit sits outside the input, so it can never
 * be mistaken for part of the number.
 */
function NumberField({
	label,
	description,
	prefix,
	unit,
	id,
	inputMode = "decimal",
	className,
	...props
}: NumberFieldProps) {
	const field = useFieldContext<string>();
	const error = toMessage(field.state.meta.errors[0]);
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
					id={inputId}
					inputMode={inputMode}
					value={field.state.value ?? ""}
					onBlur={field.handleBlur}
					onChange={(event) => field.handleChange(event.target.value)}
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

/** Multi-line input bound to the nearest field. */
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
	/** Plain strings double as both value and label. */
	options: readonly (SelectFieldOption | string)[];
	/** Defaults to the field name, which is what the label points at. */
	id?: string;
	disabled?: boolean;
	className?: string;
}

/** Single-choice select bound to the nearest field. */
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

/**
 * Boolean consent box bound to the nearest field. The label is the click target,
 * so the whole sentence is what the user aims at, not the 16px box.
 */
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
					className={cn("mt-1 size-5 shrink-0 accent-primary", className)}
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

/** Submit button wired to the nearest TanStack Form. */
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

// Role packages import only from `@greenshift/ui`, so the reactive store reader
// the wizard needs to derive values from live form state is re-exported here
// rather than reached for directly.
export { useStore };

export { fieldContext, formContext, useFieldContext, useFormContext };
