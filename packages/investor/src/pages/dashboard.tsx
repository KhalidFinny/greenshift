import {
	faBriefcase,
	faGauge,
	faLeaf,
	faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ContentSkeleton,
	EmptyState,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@greenshift/ui";
import { ClimateImpactCard } from "../organisms/climate-impact-card";
import { HoldingsTable } from "../organisms/holdings-table";
import { KpiRow } from "../organisms/kpi-row";
import { MonthlyInvestmentCard } from "../organisms/monthly-investment-card";
import { SectorAllocationCard } from "../organisms/sector-allocation-card";
import {
	investedByMonth,
	investedBySector,
	portfolioTotals,
} from "../lib/portfolio-metrics";
import { usePortfolioList } from "../lib/use-portfolio-list";
import { HoldingsTab } from "./holdings";
import { ImpactTab } from "./impact";
import { TransactionsTab } from "./transactions";

const TAB_CLASS =
	"gap-2 rounded-lg border border-transparent px-5 text-base [&_svg]:size-4 data-active:border-border data-active:bg-muted data-active:text-foreground";

function OverviewTab() {
	const { items, isPending, isError, isDemo } = usePortfolioList();

	if (isPending) return <ContentSkeleton />;
	if (isError) {
		return (
			<EmptyState
				title="Gagal memuat portofolio"
				description="Tidak dapat mengambil data investasi Anda saat ini."
			/>
		);
	}

	const totals = portfolioTotals(items);
	const months = investedByMonth(items);
	const sectors = investedBySector(items);

	return (
		<div className="space-y-6">
			<KpiRow totals={totals} bondCount={items.length} />

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				<MonthlyInvestmentCard months={months} total={totals.invested} />
				<ClimateImpactCard totals={totals} bondCount={items.length} />
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				<SectorAllocationCard sectors={sectors} />
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle className="text-lg">Obligasi Terbaru</CardTitle>
					</CardHeader>
					<CardContent className="pt-0">
						<HoldingsTable items={items} limit={6} interactive={!isDemo} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export function InvestorDashboard() {
	return (
		<div className="space-y-6">
			<Tabs defaultValue="ringkasan">
				<div className="rounded-xl border border-border bg-card p-2">
					<TabsList className="grid h-12 w-full grid-cols-4 gap-2 bg-transparent p-0">
						<TabsTrigger value="ringkasan" className={TAB_CLASS}>
							<FontAwesomeIcon icon={faGauge} />
							Ringkasan
						</TabsTrigger>
						<TabsTrigger value="holdings" className={TAB_CLASS}>
							<FontAwesomeIcon icon={faBriefcase} />
							Holdings
						</TabsTrigger>
						<TabsTrigger value="dampak" className={TAB_CLASS}>
							<FontAwesomeIcon icon={faLeaf} />
							Dampak
						</TabsTrigger>
						<TabsTrigger value="transaksi" className={TAB_CLASS}>
							<FontAwesomeIcon icon={faReceipt} />
							Transaksi
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="ringkasan">
					<OverviewTab />
				</TabsContent>
				<TabsContent value="holdings">
					<HoldingsTab />
				</TabsContent>
				<TabsContent value="dampak">
					<ImpactTab />
				</TabsContent>
				<TabsContent value="transaksi">
					<TransactionsTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
