import { faBuilding, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	api,
	type BusinessProfile,
	type BusinessProfileBody,
	industrySectors,
	registerLimits,
	useAuth,
} from "@greenshift/core";
import {
	AccountPhotoCard,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DistrictCombobox,
	EmptyState,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ShimmerBlock,
} from "@greenshift/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

function savedLabel(updatedAt: string | null): string | null {
	if (!updatedAt) return null;
	return new Date(updatedAt).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

/** The sign-in email is the account's identity and is not editable here; the picture is. */
export function CompanySettingsPage() {
	const { user } = useAuth();

	const profileQuery = useQuery({
		queryKey: ["business", "profile"],
		queryFn: async () => (await api.business.profile()).profile,
	});

	const saved = profileQuery.data
		? savedLabel(profileQuery.data.updatedAt)
		: null;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Company settings</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					The organization this account represents and the person representing
					it. Projects you submit are listed under this company.
				</p>
			</div>

			<Card>
				<CardHeader className="border-b border-border bg-muted/30">
					<CardTitle className="flex items-center gap-2 text-lg">
						<FontAwesomeIcon icon={faBuilding} className="text-[#03442C]" />
						Company profile
					</CardTitle>
					<CardDescription className="text-sm">
						The sector is what your projects are compared against when vendors
						are matched to them.
						{saved ? ` Last saved ${saved}.` : ""}
					</CardDescription>
				</CardHeader>
				<CardContent className="p-6">
					{profileQuery.isPending ? (
						<div className="space-y-3">
							{Array.from({ length: 4 }).map((_, index) => (
								<ShimmerBlock key={index} className="h-10 w-full rounded-lg" />
							))}
						</div>
					) : profileQuery.isError || !profileQuery.data ? (
						<EmptyState
							tone="error"
							title="Your company profile did not load"
							description="The company record could not be read from the account. Try again to reload it."
							action={
								<Button
									variant="outline"
									onClick={() => profileQuery.refetch()}
								>
									Try again
								</Button>
							}
						/>
					) : (
						<CompanyProfileForm profile={profileQuery.data} />
					)}
				</CardContent>
			</Card>

			{user ? <AccountPhotoCard user={user} /> : null}
		</div>
	);
}

function CompanyProfileForm({ profile }: { profile: BusinessProfile }) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [companyName, setCompanyName] = useState(profile.companyName ?? "");
	const [representative, setRepresentative] = useState(profile.representative);
	const [industrySector, setIndustrySector] = useState(
		profile.industrySector ?? "",
	);
	const [address, setAddress] = useState(profile.address ?? "");
	const [contactPhone, setContactPhone] = useState(profile.contactPhone ?? "");

	const { mutate: saveProfile, isPending } = useMutation({
		mutationFn: (body: BusinessProfileBody) => api.business.saveProfile(body),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["business", "profile"],
			});
			// The shell and the photo card read the name from session context, not this query.
			await router.invalidate();
		},
	});

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		saveProfile({
			companyName: companyName.trim(),
			representative: representative.trim(),
			industrySector,
			address: address.trim(),
			contactPhone: contactPhone.trim(),
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="company-name">Company name</Label>
					<Input
						id="company-name"
						required
						maxLength={registerLimits.organizationName}
						value={companyName}
						onChange={(event) => setCompanyName(event.target.value)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="company-sector">Industry sector</Label>
					<Select value={industrySector} onValueChange={setIndustrySector}>
						<SelectTrigger id="company-sector" className="w-full">
							<SelectValue placeholder="Choose a sector" />
						</SelectTrigger>
						<SelectContent>
							{industrySectors.map((sector) => (
								<SelectItem key={sector} value={sector}>
									{sector}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="company-representative">Representative</Label>
					<Input
						id="company-representative"
						required
						maxLength={registerLimits.name}
						value={representative}
						onChange={(event) => setRepresentative(event.target.value)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="company-phone">Contact phone</Label>
					<Input
						id="company-phone"
						type="tel"
						maxLength={registerLimits.phone}
						value={contactPhone}
						onChange={(event) => setContactPhone(event.target.value)}
					/>
				</div>

				<div className="space-y-2 md:col-span-2">
					<Label htmlFor="company-address">Registered address</Label>
					<DistrictCombobox
						id="company-address"
						value={address}
						onChange={setAddress}
					/>
					<p className="text-sm text-muted-foreground">
						The district the company is registered in, from the national
						district dataset, so it can be compared with the projects you
						submit.
					</p>
				</div>
			</div>

			<div className="flex justify-end pt-2">
				<Button type="submit" disabled={isPending} className="gap-2">
					<FontAwesomeIcon icon={faFloppyDisk} />
					{isPending ? "Saving…" : "Save changes"}
				</Button>
			</div>
		</form>
	);
}
