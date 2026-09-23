import {
	ApiError,
	credentialLimits,
	getDevRole,
	getDevScope,
	industrySectors,
	type OrganizationType,
	registerLimits,
	roleHome,
	useAuth,
	vendorServiceCategories,
} from "@greenshift/core";
import {
	DistrictCombobox,
	RadioGroup,
	RadioGroupItem,
	useAppForm,
	useStore,
} from "@greenshift/ui";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
	AUTH_LABEL_CLASS,
	AuthInput,
	AuthLayout,
	AuthPasswordInput,
	AuthSelect,
	AuthSubmit,
	AuthTextarea,
} from "../components/auth-layout";
import { getSessionFn } from "../lib/session";

export const Route = createFileRoute("/register")({
	beforeLoad: async () => {
		if (getDevScope() === "landing") throw redirect({ to: "/" });
		const user = await getSessionFn();
		const devRole = getDevRole();
		if (user && (!devRole || user.role === devRole)) {
			throw redirect({ to: roleHome[user.role] as "/" });
		}
	},
	component: RegisterPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits with the separators an Indonesian number is written with. */
const PHONE_RE = /^[+()\d][+()\d\s-]*$/;
/** NIB and NPWP as they are written on the document; format is not enforced. */
const LEGAL_ID_RE = /^[\d.\-\s]+$/;

/** The two organizations a person can register; the summary copy is what tells them apart. */
const ACCOUNT_TYPES: readonly {
	value: OrganizationType;
	label: string;
	summary: string;
}[] = [
	{
		value: "company",
		label: "Company",
		summary: "Submit energy transition projects and open tenders to vendors.",
	},
	{
		value: "vendor",
		label: "Vendor",
		summary: "Bid on tenders and deliver the installations that are awarded.",
	},
];

function RegisterPage() {
	const { register } = useAuth();
	const [error, setError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			accountType: "company" as OrganizationType,
			name: "",
			email: "",
			password: "",
			phone: "",
			organizationName: "",
			industry: "",
			district: "",
			street: "",
			businessInfo: "",
			nib: "",
			npwp: "",
		},
		onSubmit: async ({ value }) => {
			setError(null);
			try {
				await register({
					accountType: value.accountType,
					name: value.name,
					email: value.email,
					password: value.password,
					phone: value.phone,
					organizationName: value.organizationName,
					industry: value.industry,
					// One address on the wire: the street line the user typed, then the
					// district they picked from the dataset the platform knows.
					address: [value.street.trim(), value.district.trim()]
						.filter(Boolean)
						.join(", "),
					// Blank optionals are left out rather than sent empty, so the
					// server stores nothing for a field the user skipped.
					...(value.businessInfo.trim()
						? { businessInfo: value.businessInfo }
						: {}),
					...(value.nib.trim() ? { nib: value.nib } : {}),
					...(value.npwp.trim() ? { npwp: value.npwp } : {}),
				});
				// SPA transition: register() invalidates the router and beforeLoad redirects
				// to the role home with the fresh session, so the toast survives.
			} catch (err) {
				setError(
					err instanceof ApiError
						? err.message
						: "Something went wrong, please try again",
				);
			}
		},
	});

	const accountType = useStore(form.store, (state) => state.values.accountType);
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
	const canSubmit = useStore(form.store, (state) => state.canSubmit);
	const isVendor = accountType === "vendor";
	const organizationLabel = isVendor ? "Vendor" : "Company";
	const industries = isVendor ? vendorServiceCategories : industrySectors;

	return (
		<AuthLayout
			title="Create your account"
			description="Join GreenShift as a company or vendor."
			footer={
				<>
					Already have an account?{" "}
					<Link
						to="/login"
						className="ml-1 font-semibold text-[#07815F] hover:underline"
					>
						Sign in
					</Link>
				</>
			}
		>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit();
				}}
				className="space-y-6"
				noValidate
			>
				{/* The account type decides which organization the form describes, so
				    it comes first and re-labels the fields under it. */}
				<form.AppField name="accountType">
					{(field) => (
						<fieldset>
							<legend className="mb-2 block text-sm font-medium text-[#244D47]">
								Account type
							</legend>
							<RadioGroup
								value={field.state.value}
								onValueChange={(value) =>
									field.handleChange(value as OrganizationType)
								}
								onBlur={field.handleBlur}
								className="gap-2"
							>
								{ACCOUNT_TYPES.map((type) => (
									<label
										key={type.value}
										htmlFor={`account-type-${type.value}`}
										className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
											field.state.value === type.value
												? "border-[#07815F] bg-[#F1F8F5]"
												: "border-[#82928B] bg-[#FBFCFB] hover:border-[#07815F]"
										}`}
									>
										<RadioGroupItem
											id={`account-type-${type.value}`}
											value={type.value}
											className="mt-0.5 size-4 border-[#667570] data-[state=checked]:border-[#07815F] [&_svg]:fill-[#07815F]"
										/>
										<span className="space-y-0.5">
											<span className="block text-sm font-semibold text-[#123D38]">
												{type.label}
											</span>
											<span className="block text-sm text-[#5A6B66]">
												{type.summary}
											</span>
										</span>
									</label>
								))}
							</RadioGroup>
						</fieldset>
					)}
				</form.AppField>

				<div className="space-y-4 border-t border-[#E5EBE8] pt-5">
					<h3 className="text-sm font-semibold text-[#123D38]">Your account</h3>

					<div className="grid gap-4 sm:grid-cols-2">
						<form.AppField
							name="name"
							validators={{
								onChange: ({ value }) =>
									value.trim() ? undefined : "Name is required",
							}}
						>
							{(field) => (
								<AuthInput
									id="name"
									label="Full name"
									maxLength={registerLimits.name}
									autoComplete="name"
									placeholder="Your full name"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									error={field.state.meta.errors[0]}
								/>
							)}
						</form.AppField>

						<form.AppField
							name="phone"
							validators={{
								onChange: ({ value }) => {
									if (!value.trim()) return "Phone is required";
									return PHONE_RE.test(value.trim())
										? undefined
										: "Enter a phone number";
								},
							}}
						>
							{(field) => (
								<AuthInput
									id="phone"
									label="Phone"
									maxLength={registerLimits.phone}
									type="tel"
									autoComplete="tel"
									placeholder="+62 812 3456 7890"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									error={field.state.meta.errors[0]}
								/>
							)}
						</form.AppField>
					</div>

					<form.AppField
						name="email"
						validators={{
							onChange: ({ value }) => {
								if (!value.trim()) return "Work email is required";
								return EMAIL_RE.test(value.trim())
									? undefined
									: "Enter a valid email";
							},
						}}
					>
						{(field) => (
							<AuthInput
								id="email"
								label="Work email"
								maxLength={credentialLimits.email}
								type="email"
								autoComplete="email"
								placeholder="you@company.com"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								error={field.state.meta.errors[0]}
							/>
						)}
					</form.AppField>

					<form.AppField
						name="password"
						validators={{
							onChange: ({ value }) => {
								if (!value) return "Password is required";
								return value.length >= 8
									? undefined
									: "Password must be at least 8 characters";
							},
						}}
					>
						{(field) => (
							<AuthPasswordInput
								id="password"
								label="Password"
								maxLength={credentialLimits.password}
								autoComplete="new-password"
								placeholder="At least 8 characters"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								error={field.state.meta.errors[0]}
							/>
						)}
					</form.AppField>
				</div>

				<div className="space-y-4 border-t border-[#E5EBE8] pt-5">
					<h3 className="text-sm font-semibold text-[#123D38]">
						{organizationLabel} details
					</h3>

					<form.AppField
						name="organizationName"
						validators={{
							onChange: ({ value }) =>
								value.trim()
									? undefined
									: `${organizationLabel} name is required`,
						}}
					>
						{(field) => (
							<AuthInput
								id="organizationName"
								label={`${organizationLabel} name`}
								maxLength={registerLimits.organizationName}
								autoComplete="organization"
								placeholder={
									isVendor ? "PT Contoh Energi" : "PT Contoh Nusantara"
								}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								error={field.state.meta.errors[0]}
							/>
						)}
					</form.AppField>

					<form.AppField
						name="industry"
						validators={{
							onChange: ({ value }) =>
								value
									? undefined
									: isVendor
										? "Choose what the vendor delivers"
										: "Choose an industry",
						}}
					>
						{(field) => (
							<AuthSelect
								id="industry"
								label={isVendor ? "Service category" : "Industry"}
								placeholder={
									isVendor ? "Choose a service category" : "Choose an industry"
								}
								value={field.state.value}
								onValueChange={field.handleChange}
								options={industries.map((item) => ({
									value: item,
									label: item,
								}))}
								error={field.state.meta.errors[0]}
							/>
						)}
					</form.AppField>

					<form.AppField
						name="district"
						validators={{
							onChange: ({ value }) =>
								value.trim() ? undefined : "Choose the registered district",
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<label htmlFor="district" className={AUTH_LABEL_CLASS}>
									{isVendor ? "Business district" : "Registered district"}
								</label>
								<DistrictCombobox
									id="district"
									value={field.state.value}
									onChange={field.handleChange}
									onBlur={field.handleBlur}
									error={field.state.meta.errors[0]}
								/>
								<p className="text-sm text-[#5A6B66]">
									Search the district the organization is registered in. The
									list is the national district dataset, so the address can be
									compared with the projects you work on.
								</p>
							</div>
						)}
					</form.AppField>

					<form.AppField name="street">
						{(field) => (
							<AuthInput
								id="street"
								label="Street, building, number"
								maxLength={120}
								autoComplete="street-address"
								placeholder="Jl. Soekarno Hatta 12"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								error={field.state.meta.errors[0]}
							/>
						)}
					</form.AppField>

					{isVendor ? (
						<>
							<form.AppField name="businessInfo">
								{(field) => (
									<AuthTextarea
										id="businessInfo"
										label="What the company does"
										maxLength={registerLimits.businessInfo}
										rows={3}
										placeholder="Energy audits, boiler retrofits, solar installation"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										error={field.state.meta.errors[0]}
									/>
								)}
							</form.AppField>

							<div className="grid gap-4 sm:grid-cols-2">
								<form.AppField
									name="nib"
									validators={{
										onChange: ({ value }) =>
											value.trim() && !LEGAL_ID_RE.test(value.trim())
												? "Enter NIB as digits"
												: undefined,
									}}
								>
									{(field) => (
										<AuthInput
											id="nib"
											label="NIB"
											maxLength={registerLimits.legalId}
											inputMode="numeric"
											placeholder="Optional"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											error={field.state.meta.errors[0]}
										/>
									)}
								</form.AppField>

								<form.AppField
									name="npwp"
									validators={{
										onChange: ({ value }) =>
											value.trim() && !LEGAL_ID_RE.test(value.trim())
												? "Enter NPWP as digits"
												: undefined,
									}}
								>
									{(field) => (
										<AuthInput
											id="npwp"
											label="NPWP"
											maxLength={registerLimits.legalId}
											inputMode="numeric"
											placeholder="Optional"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											error={field.state.meta.errors[0]}
										/>
									)}
								</form.AppField>
							</div>
						</>
					) : null}

					<p className="text-sm text-[#5A6B66]">
						{isVendor
							? "Verification: an administrator reviews your profile after you add your NIB, NPWP, and certifications in Settings."
							: "Company legality documents are uploaded with your first project submission."}
					</p>
				</div>

				{error ? (
					<p
						role="alert"
						className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
					>
						{error}
					</p>
				) : null}

				<AuthSubmit pending={isSubmitting} disabled={!canSubmit}>
					{isVendor ? "Create vendor account" : "Create company account"}
				</AuthSubmit>
			</form>
		</AuthLayout>
	);
}
