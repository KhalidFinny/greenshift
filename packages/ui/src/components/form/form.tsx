import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type * as React from "react";

import { Spinner } from "../loaders/spinner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

function toMessage(error: unknown): string | null {
	if (error === null || error === undefined || error === false) return null;
	if (typeof error === "string") return error;
	if (typeof error === "object" && "message" in error) {
		return String((error as { message: unknown }).message);
	}
	return String(error);
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
	const errorId = `${inputId}-error`;
	return (
		<div className="space-y-2">
			<Label htmlFor={inputId}>{label}</Label>
			<Input
				id={inputId}
				value={field.state.value ?? ""}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				{...props}
			/>
			{description && !error ? (
				<p className="text-sm text-muted-foreground">{description}</p>
			) : null}
			{error ? (
				<p id={errorId} role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}
		</div>
	);
}

/** Password input bound to the nearest TanStack Form field. */
function PasswordField(props: Omit<TextFieldProps, "type">) {
	return <TextField type="password" {...props} />;
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
	fieldComponents: { TextField, PasswordField },
	formComponents: { SubmitButton },
});

export { fieldContext, formContext, useFieldContext, useFormContext };
