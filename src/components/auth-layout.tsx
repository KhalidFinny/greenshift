import {
	Button,
	cn,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, FileText, Leaf, LineChart, Shield } from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";

/**
 * The chrome both auth pages share: background decoration, the brand column and
 * the card the form sits in.
 *
 * Extracted rather than copied so /login and /register cannot drift apart, and
 * so the responsive behaviour is decided once. The layout reflows below `lg`:
 * the brand column stacks under the card, and the decorative building is
 * dropped (it is a desktop composition, not content).
 */

/** Brand pillars. Static copy: they describe the product, not the current user. */
const FEATURES = [
	{ icon: Leaf, label: "Project\nManagement" },
	{ icon: Shield, label: "Risk\nAssessment" },
	{ icon: LineChart, label: "ROI\nTracking" },
	{ icon: FileText, label: "Transparent\nReporting" },
] as const;

interface AuthLayoutProps {
	/** Card heading. */
	title: string;
	/** Optional line under the heading. */
	description?: string;
	/** The form, and anything else that belongs inside the card. */
	children: ReactNode;
	/** The switch link, rendered under the card. */
	footer: ReactNode;
}

export function AuthLayout({
	title,
	description,
	children,
	footer,
}: AuthLayoutProps) {
	return (
		<div className="relative min-h-screen overflow-x-hidden bg-[#F8FAF8] text-[#123D38]">
			{/* Background decorations. Clipped to the viewport: they are wider
			    than a phone on purpose and must not widen the page. */}
			<div className="pointer-events-none absolute -left-32 -top-40 h-[420px] w-[650px] rounded-[45%] bg-[#E6F0EC]" />
			<div className="pointer-events-none absolute -bottom-48 -left-32 h-[300px] w-[620px] rounded-[50%] bg-[#E5F0EB]" />

			{/* Building image, desktop only: it is a composition, not content. */}
			<div className="pointer-events-none absolute bottom-0 right-0 h-[65vh] w-[24vw] overflow-hidden max-lg:hidden">
				<img
					src="/skysidebar.webp"
					alt=""
					aria-hidden="true"
					className="h-full w-full object-cover"
				/>
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#F8FAF8] via-[#F8FAF8]/40 to-transparent" />
			</div>

			<main className="relative z-10 mx-auto w-full max-w-[1600px] px-5 py-5 sm:px-8 sm:py-6 lg:px-12 lg:py-8">
				<header className="flex items-center justify-between gap-4">
					<div className="flex min-w-0 items-center gap-3 sm:gap-4">
						<Button
							variant="outline"
							size="sm"
							asChild
							className="h-11 cursor-pointer rounded-lg border-[#82928B] bg-white text-sm font-semibold text-[#123D38] hover:border-[#07815F] hover:bg-[#E6F0EC] sm:h-9"
						>
							<Link to="/">Back</Link>
						</Button>
						<Link to="/" className="min-w-0 no-underline">
							<img
								src="/logo-long.svg"
								alt="GreenShift"
								className="h-8 w-auto"
							/>
						</Link>
					</div>
					<span className="hidden text-right text-sm font-medium tracking-tight text-[#5A6B66] sm:block">
						Sustainable Finance
						<br />
						for a Greener Future.
					</span>
				</header>

				<section className="grid items-center gap-10 pt-8 lg:min-h-[calc(100vh-200px)] lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pt-0">
					{/* Brand column. Below `lg` it follows the card, so the form is
					    the first thing on a phone. */}
					<div className="max-lg:order-2">
						<h1 className="max-w-[620px] text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#123D38] sm:text-4xl lg:text-5xl xl:text-6xl">
							Build a more
							<br />
							sustainable economy
						</h1>

						<div className="mt-10 grid max-w-[680px] grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8 lg:mt-14">
							{FEATURES.map((feature) => (
								<div key={feature.label} className="space-y-3">
									<feature.icon className="h-6 w-6 text-[#07815F]" />
									<p className="text-sm font-medium leading-5 text-[#174A43]">
										{feature.label.split("\n").map((line, i) => (
											<span key={line}>
												{i > 0 && <br />}
												{line}
											</span>
										))}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Card */}
					<div className="relative z-20 mx-auto w-full max-w-[560px] rounded-2xl border border-[#E5EBE8] bg-white p-5 shadow-[0_20px_60px_rgba(18,61,55,0.08)] sm:p-6 lg:justify-self-end lg:p-8">
						<h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#123D38] sm:text-3xl">
							{title}
						</h2>
						{description ? (
							<p className="mt-1.5 text-sm text-[#5A6B66]">{description}</p>
						) : null}

						<div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
							{children}
						</div>

						<p className="mt-5 text-center text-sm text-[#5A6B66]">{footer}</p>
					</div>
				</section>
			</main>

			{/* Flows under the content on small screens; pinned on desktop where
			    the layout always fills the viewport. */}
			<p className="relative z-10 mt-8 text-center text-sm text-[#5A6B66] lg:absolute lg:bottom-8 lg:left-12 lg:mt-0 lg:text-left">
				© 2026 GreenShift
			</p>
		</div>
	);
}

/** Shared field chrome, so every auth input matches. */
const FIELD_CLASS =
	"h-11 w-full rounded-xl border border-[#82928B] bg-[#FBFCFB] px-4 text-[#123D38] outline-none transition placeholder:text-[#667570] focus:border-[#07815F] focus:ring-2 focus:ring-[#07815F]/10 sm:h-12";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-[#244D47]";

function FieldError({ id, error }: { id: string; error?: unknown }) {
	if (!error) return null;
	return (
		<p id={id} role="alert" className="text-sm text-red-700">
			{String(error)}
		</p>
	);
}

interface AuthInputProps extends ComponentProps<"input"> {
	id: string;
	label: string;
	error?: unknown;
}

export function AuthInput({ id, label, error, ...props }: AuthInputProps) {
	const errorId = `${id}-error`;
	return (
		<div className="space-y-2">
			<label htmlFor={id} className={LABEL_CLASS}>
				{label}
			</label>
			<input
				id={id}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				className={FIELD_CLASS}
				{...props}
			/>
			<FieldError id={errorId} error={error} />
		</div>
	);
}

/** Password input with a visibility toggle, matching `AuthInput`. */
export function AuthPasswordInput({
	id,
	label,
	error,
	...props
}: AuthInputProps) {
	const [visible, setVisible] = useState(false);
	const errorId = `${id}-error`;
	return (
		<div className="space-y-2">
			<label htmlFor={id} className={LABEL_CLASS}>
				{label}
			</label>
			<div className="relative">
				<input
					id={id}
					type={visible ? "text" : "password"}
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? errorId : undefined}
					className={`${FIELD_CLASS} pr-12`}
					{...props}
				/>
				<button
					type="button"
					// Not a tab stop: the field is reached with Tab, and the toggle
					// stays reachable by pointer or by screen-reader navigation.
					tabIndex={-1}
					onClick={() => setVisible((current) => !current)}
					aria-label={visible ? "Hide password" : "Show password"}
					className="absolute right-3 top-1/2 flex size-9 max-sm:size-11 -translate-y-1/2 items-center justify-center rounded-lg text-[#667570] transition hover:text-[#123D38]"
				>
					{visible ? (
						<EyeOff className="h-5 w-5" />
					) : (
						<Eye className="h-5 w-5" />
					)}
				</button>
			</div>
			<FieldError id={errorId} error={error} />
		</div>
	);
}

interface AuthSelectProps {
	id: string;
	label: string;
	error?: unknown;
	placeholder?: string;
	/** The chosen value; empty while nothing is chosen, which shows the placeholder. */
	value: string;
	onValueChange: (value: string) => void;
	options: readonly { value: string; label: string }[];
	disabled?: boolean;
}

/**
 * Select matching `AuthInput`, for a field whose values come from a fixed
 * vocabulary rather than from the user's own words.
 */
export function AuthSelect({
	id,
	label,
	error,
	placeholder,
	value,
	onValueChange,
	options,
	disabled,
}: AuthSelectProps) {
	const errorId = `${id}-error`;
	return (
		<div className="space-y-2">
			<label htmlFor={id} className={LABEL_CLASS}>
				{label}
			</label>
			<Select value={value} onValueChange={onValueChange} disabled={disabled}>
				<SelectTrigger
					id={id}
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? errorId : undefined}
					className="h-11 w-full rounded-xl border-[#82928B] bg-[#FBFCFB] px-4 text-[#123D38] data-placeholder:text-[#667570] focus-visible:border-[#07815F] focus-visible:ring-2 focus-visible:ring-[#07815F]/10 sm:h-12"
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<FieldError id={errorId} error={error} />
		</div>
	);
}

interface AuthTextareaProps extends ComponentProps<"textarea"> {
	id: string;
	label: string;
	error?: unknown;
}

/** Multi-line input matching `AuthInput`, for text that is not a single line. */
export function AuthTextarea({
	id,
	label,
	error,
	className,
	...props
}: AuthTextareaProps) {
	const errorId = `${id}-error`;
	return (
		<div className="space-y-2">
			<label htmlFor={id} className={LABEL_CLASS}>
				{label}
			</label>
			<textarea
				id={id}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				className={cn(
					"w-full rounded-xl border border-[#82928B] bg-[#FBFCFB] px-4 py-3 text-[#123D38] outline-none transition placeholder:text-[#667570] focus:border-[#07815F] focus:ring-2 focus:ring-[#07815F]/10",
					className,
				)}
				{...props}
			/>
			<FieldError id={errorId} error={error} />
		</div>
	);
}

/** The submit button both forms use. */
export function AuthSubmit({
	children,
	pending = false,
	disabled = false,
}: {
	children: ReactNode;
	/** Shows the working state: the request is in flight. */
	pending?: boolean;
	/** Blocks the action: the form is not ready to be submitted. */
	disabled?: boolean;
}) {
	return (
		<Button
			type="submit"
			size="lg"
			disabled={disabled || pending}
			aria-busy={pending}
			className="h-12 w-full cursor-pointer rounded-xl bg-[#07815F] font-semibold text-white transition hover:bg-[#066E53] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
		>
			{pending ? "Creating account..." : children}
		</Button>
	);
}
