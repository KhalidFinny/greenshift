import { Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from "@greenshift/ui";
import { useVendorData } from "../lib/use-vendor-data";
import { ClosedBidCard } from "../organisms/closed-bid-card";
import { NegotiationCard } from "../organisms/negotiation-card";
import { OpenBidLeaderboard } from "../organisms/open-bid-leaderboard";
import { ProposalCard } from "../organisms/proposal-card";

export function VendorTendersPage() {
	const {
		leaderboard,
		placeOpenBid,
		proposals,
		negotiations,
		submitNegotiationResponse,
	} = useVendorData();

	return (
		<div className="space-y-6">
			<Tabs defaultValue="active">
				<TabsList className="flex w-full flex-wrap gap-1 md:grid md:grid-cols-4 md:gap-0">
					<TabsTrigger value="active" className="flex-1 md:flex-none">Lelang Aktif</TabsTrigger>
					<TabsTrigger value="proposals" className="flex-1 md:flex-none">Proposal Saya ({proposals.length})</TabsTrigger>
					<TabsTrigger value="negotiations" className="flex-1 md:flex-none">
						Negosiasi ({negotiations.length})
					</TabsTrigger>
					<TabsTrigger value="completed" className="flex-1 md:flex-none">Selesai</TabsTrigger>
				</TabsList>

				{/* Active Tenders Tab */}
				<TabsContent value="active" className="mt-6 space-y-6">
					<OpenBidLeaderboard
						leaderboard={leaderboard}
						projectTitle="Pemasangan Solar PV Atap Pabrik Tekstil 1.2 MWp"
						projectClient="PT Sinar Tekstil Indonesia • Cikarang, Jawa Barat"
						deadline="12 Sep 2026 17:00"
						onRevise={placeOpenBid}
					/>

					<ClosedBidCard
						title="Retrofit HVAC & Smart Chiller Effisiensi Tinggi"
						participantCount={7}
						submittedPrice={8350000000}
					/>
				</TabsContent>

				{/* My Proposals Tab */}
				<TabsContent value="proposals" className="mt-6 space-y-4">
					{proposals.map((prop) => (
						<ProposalCard key={prop.id} proposal={prop} />
					))}
				</TabsContent>

				{/* Negotiations Tab */}
				<TabsContent value="negotiations" className="mt-6 space-y-4">
					{negotiations.map((neg) => (
						<NegotiationCard
							key={neg.id}
							negotiation={neg}
							onSubmitResponse={submitNegotiationResponse}
						/>
					))}
				</TabsContent>

				{/* Completed Tenders Tab */}
				<TabsContent value="completed" className="mt-6">
					<Card>
						<CardContent className="p-8 text-center text-xs text-muted-foreground">
							Belum ada lelang histori yang ditutup dalam 30 hari terakhir.
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
