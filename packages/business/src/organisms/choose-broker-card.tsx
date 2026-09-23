/* The company's broker choice: the pool it picks from, and the broker that received the project. */

import { faScaleBalanced } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api, type BusinessBrokerOption } from "@greenshift/core";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	EmptyState,
	ShimmerBlock,
} from "@greenshift/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatSubmittedAt } from "../lib/project-display";

function BrokerRow({
	broker,
	busy,
	onChoose,
}: {
	broker: BusinessBrokerOption;
	busy: boolean;
	onChoose: (brokerId: number) => void;
}) {
	return (
		<li className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border p-4">
			<div className="min-w-0 space-y-1">
				<p className="font-medium">{broker.firmName}</p>
				{broker.representative ? (
					<p className="text-sm text-muted-foreground">
						Represented by {broker.representative}
					</p>
				) : null}
				<p className="text-sm text-muted-foreground">
					{broker.licenseNumber
						? `Licence ${broker.licenseNumber}`
						: "No licence number is stored on this profile"}
					{broker.licenseAuthority ? ` · ${broker.licenseAuthority}` : ""}
				</p>
				{broker.address ? (
					<p className="text-sm text-muted-foreground">{broker.address}</p>
				) : null}
			</div>
			<Button
				type="button"
				variant="outline"
				disabled={busy}
				onClick={() => onChoose(broker.id)}
			>
				Choose this broker
			</Button>
		</li>
	);
}

export function ChooseBrokerCard({ projectId }: { projectId: number }) {
	const queryClient = useQueryClient();

	const brokerQuery = useQuery({
		queryKey: ["business", "project-broker", projectId],
		queryFn: async () => api.business.projectBroker(projectId),
		staleTime: 60 * 1000,
	});

	const awarded = brokerQuery.data?.awarded === true;
	const assignment = brokerQuery.data?.assignment ?? null;

	// The pool is asked for only when a choice is actually open.
	const poolQuery = useQuery({
		queryKey: ["business", "brokers"],
		enabled: awarded && assignment === null,
		queryFn: async () => (await api.business.brokers()).brokers,
		staleTime: 5 * 60 * 1000,
	});

	// The client publishes the endpoint's own message, so the card only refreshes the read.
	const choose = useMutation({
		mutationFn: (brokerId: number) =>
			api.business.assignBroker(projectId, brokerId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["business", "project-broker", projectId],
			});
		},
	});

	return (
		<Card>
			<CardHeader className="border-b border-border bg-muted/30">
				<CardTitle className="flex items-center gap-2 text-lg">
					<FontAwesomeIcon icon={faScaleBalanced} className="text-[#03442C]" />
					Broker
				</CardTitle>
				<CardDescription className="text-sm">
					The firm that receives this project once its tender is awarded.
				</CardDescription>
			</CardHeader>
			<CardContent className="p-6">
				{brokerQuery.isPending ? (
					<div className="space-y-3" aria-busy>
						<ShimmerBlock className="h-16 w-full rounded-xl" />
						<ShimmerBlock className="h-16 w-full rounded-xl" />
					</div>
				) : brokerQuery.isError || !brokerQuery.data ? (
					<EmptyState
						tone="error"
						title="The broker record did not load"
						description="The project's assignment could not be read. Try again to reload it."
						action={
							<Button variant="outline" onClick={() => brokerQuery.refetch()}>
								Try again
							</Button>
						}
					/>
				) : !awarded ? (
					<p className="text-sm text-muted-foreground">
						The broker can be chosen once this project's tender is awarded.
					</p>
				) : assignment ? (
					<div className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<p className="font-medium">{assignment.firmName}</p>
							<Badge variant="outline">
								{assignment.status.replace(/_/g, " ").toLowerCase()}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground">
							Assigned {formatSubmittedAt(assignment.assignedAt)}
						</p>
						{assignment.declineReason ? (
							<p className="rounded-lg border border-amber-600/30 bg-amber-50 px-4 py-3 text-sm text-amber-700">
								The broker declined this assignment: {assignment.declineReason}
							</p>
						) : null}
					</div>
				) : (
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							This project's tender is awarded. Choose the verified broker that
							receives it.
						</p>
						{poolQuery.isPending ? (
							<div className="space-y-3" aria-busy>
								<ShimmerBlock className="h-20 w-full rounded-xl" />
								<ShimmerBlock className="h-20 w-full rounded-xl" />
							</div>
						) : poolQuery.isError ? (
							<div className="flex flex-wrap items-center gap-3">
								<p className="text-sm text-muted-foreground">
									The verified brokers did not load.
								</p>
								<Button
									type="button"
									variant="link"
									onClick={() => poolQuery.refetch()}
								>
									Try again
								</Button>
							</div>
						) : (poolQuery.data ?? []).length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No verified broker is available to choose yet.
							</p>
						) : (
							<ul className="space-y-3">
								{(poolQuery.data ?? []).map((broker) => (
									<BrokerRow
										key={broker.id}
										broker={broker}
										busy={choose.isPending}
										onChoose={(brokerId) => choose.mutate(brokerId)}
									/>
								))}
							</ul>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
