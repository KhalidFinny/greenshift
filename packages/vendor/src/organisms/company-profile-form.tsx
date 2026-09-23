import { vendorServiceCategories } from "@greenshift/core";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@greenshift/ui";
import { useEffect, useState } from "react";

interface CompanyProfileFormProps {
	companyName?: string;
	description?: string;
	serviceCategory?: string | null;
	location?: string | null;
	onSave: (data: {
		companyName: string;
		description: string;
		serviceCategory: string;
		location: string;
	}) => void;
}

/**
 * Company profile form. Only the fields the API stores on the vendor profile are
 * editable: the company's own details, what it delivers, and where it works from
 * (proximity is part of the matchmaking score).
 */
export function CompanyProfileForm({
	companyName: initialCompanyName,
	description: initialDescription,
	serviceCategory: initialServiceCategory,
	location: initialLocation,
	onSave,
}: CompanyProfileFormProps) {
	const [companyName, setCompanyName] = useState(initialCompanyName ?? "");
	const [description, setDescription] = useState(initialDescription ?? "");
	const [serviceCategory, setServiceCategory] = useState(
		initialServiceCategory ?? "",
	);
	const [location, setLocation] = useState(initialLocation ?? "");

	// The profile arrives asynchronously; adopt it once it lands.
	useEffect(() => {
		if (initialCompanyName !== undefined) setCompanyName(initialCompanyName);
	}, [initialCompanyName]);
	useEffect(() => {
		if (initialDescription !== undefined) setDescription(initialDescription);
	}, [initialDescription]);
	useEffect(() => {
		if (initialServiceCategory !== undefined)
			setServiceCategory(initialServiceCategory ?? "");
	}, [initialServiceCategory]);
	useEffect(() => {
		if (initialLocation !== undefined) setLocation(initialLocation ?? "");
	}, [initialLocation]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		onSave({ companyName, description, serviceCategory, location });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Company Profile Information</CardTitle>
			</CardHeader>
			<CardContent className="text-sm">
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="cp-name" className="text-sm font-semibold">
							Company Name:
						</Label>
						<Input
							id="cp-name"
							value={companyName}
							onChange={(e) => setCompanyName(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="cp-desc" className="text-sm font-semibold">
							Company Profile Description:
						</Label>
						<textarea
							id="cp-desc"
							rows={4}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="cp-category" className="text-sm font-semibold">
								Service Category:
							</Label>
							<Select
								value={serviceCategory}
								onValueChange={setServiceCategory}
							>
								<SelectTrigger id="cp-category" className="w-full">
									<SelectValue placeholder="Choose a service category" />
								</SelectTrigger>
								<SelectContent>
									{vendorServiceCategories.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="cp-location" className="text-sm font-semibold">
								Business Address:
							</Label>
							<Input
								id="cp-location"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="City, province"
							/>
						</div>
					</div>

					<Button type="submit" size="sm" className="gap-2">
						Save Profile
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
