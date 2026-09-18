import {
	faFilter,
	faMapMarkerAlt,
	faSearch,
	faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { BrokerAssignedProject } from "../lib/types";
import { useBrokerData } from "../lib/use-broker-data";

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

{
	/* Modal Decline Assignment (Mandatory Reason per spec) */
}
function DeclineAssignmentModal({
	project,
	onDecline,
}: {
	project: BrokerAssignedProject;
	onDecline: (projectId: string, reason: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState("");

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!reason.trim()) return;
		onDecline(project.id, reason);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
				>
					Decline Assignment
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<FontAwesomeIcon icon={faTimesCircle} />
						Decline Project Assignment
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
					<div className="rounded-lg bg-muted p-3">
						<p className="font-semibold text-foreground">{project.title}</p>
						<p className="text-muted-foreground mt-0.5">
							Client: {project.companyName}
						</p>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="decline-reason" className="text-xs font-semibold">
							Reason for Declining Assignment (Required):
						</Label>
						<textarea
							id="decline-reason"
							rows={4}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Explain the financial or operational reason for declining..."
							required
						/>
					</div>

					<p className="text-[11px] text-muted-foreground italic">
						* Declining an assignment does not cancel the project. The client
						company will be notified to select another underwriting broker.
					</p>

					<div className="flex justify-end gap-2 pt-2 border-t border-border">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" variant="destructive">
							Confirm Decline Assignment
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function BrokerAssignedProjectsPage() {
	const { projects, acceptAssignment, declineAssignment } = useBrokerData();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredProjects = projects.filter(
		(p) =>
			p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Assigned Verified Projects</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					GHG LVV verified green projects allocated by client companies for
					external green bond underwriting and preparation.
				</p>
			</div>

			{/* Search & Filter Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<FontAwesomeIcon
						icon={faSearch}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
					/>
					<Input
						placeholder="Search by project name, client company, or vendor..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<Button variant="outline" className="gap-2 shrink-0">
					<FontAwesomeIcon icon={faFilter} />
					Filter Workflow Status
				</Button>
			</div>

			<Tabs defaultValue="all">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="all">All ({filteredProjects.length})</TabsTrigger>
					<TabsTrigger value="under_review">
						Under Review (
						{
							filteredProjects.filter(
								(p) =>
									p.workflowStatus === "UNDER_REVIEW" ||
									p.workflowStatus === "DOCUMENT_COLLECTION",
							).length
						}
						)
					</TabsTrigger>
					<TabsTrigger value="bond_issuance">
						Bond Issuance (
						{
							filteredProjects.filter(
								(p) =>
									p.workflowStatus === "READY_FOR_BOND_ISSUANCE" ||
									p.workflowStatus === "BOND_ISSUANCE",
							).length
						}
						)
					</TabsTrigger>
					<TabsTrigger value="monitoring">
						Monitoring (
						{
							filteredProjects.filter((p) => p.workflowStatus === "MONITORING")
								.length
						}
						)
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="mt-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{filteredProjects.map((proj) => (
							<Card key={proj.id} className="flex flex-col justify-between">
								<CardHeader className="space-y-3 pb-3">
									<Badge className="bg-[#03442C] text-white">
										{proj.workflowStatus.replace(/_/g, " ")}
									</Badge>
									<CardTitle className="text-base line-clamp-2">
										{proj.title}
									</CardTitle>
									<p className="text-xs text-muted-foreground font-medium">
										Client: {proj.companyName}
									</p>
									<p className="text-xs text-muted-foreground">
										Contractor / Vendor: {proj.vendorName}
									</p>
								</CardHeader>

								<CardContent className="space-y-4 text-xs">
									<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-2.5">
										<div>
											<p className="text-muted-foreground">Project Value</p>
											<p className="font-semibold text-foreground mt-0.5">
												{formatRupiah(proj.projectValue)}
											</p>
										</div>
										<div>
											<p className="text-muted-foreground">Bond Target</p>
											<p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
												{formatRupiah(proj.bondInfo.totalAmount)}
											</p>
										</div>
									</div>

									<div className="flex items-center justify-between text-muted-foreground">
										<span className="flex items-center gap-1">
											<FontAwesomeIcon
												icon={faMapMarkerAlt}
												className="text-red-500"
											/>
											{proj.location}
										</span>
										<span>
											Risk:{" "}
											<strong className="text-foreground">
												{proj.riskAssessment.overallRiskLevel}
											</strong>
										</span>
									</div>

									{/* Accept / Decline actions for newly assigned projects */}
									{!proj.isAccepted && !proj.declineReason ? (
										<div className="space-y-2 pt-2 border-t border-border">
											<div className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
												New assignment pending confirmation.
											</div>
											<div className="flex items-center justify-between gap-2">
												<DeclineAssignmentModal
													project={proj}
													onDecline={declineAssignment}
												/>
												<Button
													size="sm"
													onClick={() => acceptAssignment(proj.id)}
													className="bg-[#03442C] text-white hover:bg-[#03442C]/90 text-xs"
												>
													Accept Assignment
												</Button>
											</div>
										</div>
									) : proj.declineReason ? (
										<div className="rounded-lg bg-red-50 p-2.5 text-[11px] text-red-900 dark:bg-red-950/40 dark:text-red-200 space-y-1 pt-2 border-t border-border">
											<p className="font-bold">
												Assignment Declined by Broker:
											</p>
											<p className="italic">"{proj.declineReason}"</p>
										</div>
									) : (
										<div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
											<Link to="/broker/projects/$id" params={{ id: proj.id }}>
												<Button
													size="sm"
													className="w-full bg-[#03442C] text-white hover:bg-[#03442C]/90"
												>
													Project Detail
												</Button>
											</Link>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="under_review" className="mt-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{filteredProjects
							.filter(
								(p) =>
									p.workflowStatus === "UNDER_REVIEW" ||
									p.workflowStatus === "DOCUMENT_COLLECTION",
							)
							.map((proj) => (
								<Card key={proj.id} className="flex flex-col justify-between">
									<CardHeader className="space-y-3 pb-3">
										<CardTitle className="text-base line-clamp-2">
											{proj.title}
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 text-xs">
										<Link to="/broker/projects/$id" params={{ id: proj.id }}>
											<Button
												size="sm"
												className="w-full bg-[#03442C] text-white hover:bg-[#03442C]/90"
											>
												Open Project →
											</Button>
										</Link>
									</CardContent>
								</Card>
							))}
					</div>
				</TabsContent>

				<TabsContent value="bond_issuance" className="mt-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{filteredProjects
							.filter(
								(p) =>
									p.workflowStatus === "READY_FOR_BOND_ISSUANCE" ||
									p.workflowStatus === "BOND_ISSUANCE",
							)
							.map((proj) => (
								<Card key={proj.id} className="flex flex-col justify-between">
									<CardHeader className="space-y-3 pb-3">
										<CardTitle className="text-base line-clamp-2">
											{proj.title}
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 text-xs">
										<Link to="/broker/projects/$id" params={{ id: proj.id }}>
											<Button
												size="sm"
												className="w-full bg-[#03442C] text-white hover:bg-[#03442C]/90"
											>
												Open Project →
											</Button>
										</Link>
									</CardContent>
								</Card>
							))}
					</div>
				</TabsContent>

				<TabsContent value="monitoring" className="mt-6">
					<Card>
						<CardContent className="p-8 text-center text-xs text-muted-foreground">
							No projects in the long-term monitoring phase yet.
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
