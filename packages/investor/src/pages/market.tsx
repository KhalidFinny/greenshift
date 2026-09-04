import type { MarketProject } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	ContentSkeleton,
	EmptyState,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@greenshift/ui";
import { DEMO_MARKET } from "../lib/demo-data";
import { titleCase } from "../lib/format";
import { BondBuyDialog } from "../organisms/bond-buy-dialog";
import { MarketCard } from "../organisms/market-card";

export function GreenMarket() {
	const query = useQuery({
		queryKey: ["investor", "market"],
		queryFn: () => api.investor.market(),
	});
	const [sector, setSector] = useState("all");
	const [sort, setSort] = useState("return");
	const [selected, setSelected] = useState<MarketProject | null>(null);

	if (query.isPending) return <ContentSkeleton />;
	if (query.isError) {
		return (
			<EmptyState
				title="Gagal memuat Green Market"
				description="Tidak dapat mengambil daftar proyek pendanaan saat ini."
			/>
		);
	}

	const liveProjects = query.data.projects;
	const isDemo = liveProjects.length === 0;
	const source: MarketProject[] = isDemo ? DEMO_MARKET : liveProjects;
	const sectors = [...new Set(source.map((project) => titleCase(project.industrySector ?? "Umum")))].sort();

	const projects = [...source]
		.filter((project) =>
			sector === "all"
				? true
				: titleCase(project.industrySector ?? "Umum") === sector,
		)
		.sort((a, b) => {
			if (sort === "risk") return (a.riskScore ?? 999) - (b.riskScore ?? 999);
			if (sort === "funding") return b.fundingProgress - a.fundingProgress;
			return (b.blueprint.irr ?? 0) - (a.blueprint.irr ?? 0);
		});

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-end gap-3">
				<Select value={sector} onValueChange={setSector}>
					<SelectTrigger>
						<SelectValue placeholder="Semua sektor" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Semua Sektor</SelectItem>
						{sectors.map((item) => (
							<SelectItem key={item} value={item}>
								{item}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={sort} onValueChange={setSort}>
					<SelectTrigger>
						<SelectValue placeholder="Urutkan" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="return">Return &gt; 10%</SelectItem>
						<SelectItem value="risk">Risiko terendah</SelectItem>
						<SelectItem value="funding">Pendanaan tertinggi</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{projects.length === 0 ? (
				<EmptyState
					title="Tidak ada hasil"
					description="Belum ada proyek untuk filter yang dipilih."
				/>
			) : (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
					{projects.map((project) => (
						<MarketCard
							key={project.id}
							project={project}
							disabled={isDemo}
							onBuy={() => setSelected(project)}
						/>
					))}
				</div>
			)}

			<BondBuyDialog
				project={selected}
				open={selected !== null && !isDemo}
				onOpenChange={(open) => {
					if (!open) setSelected(null);
				}}
			/>
		</div>
	);
}
