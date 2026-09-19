import {
	faArrowRight,
	faBolt,
	faBuilding,
	faCheck,
	faChevronDown,
	faCircleCheck,
	faGavel,
	faHandshake,
	faLeaf,
	faMagnifyingGlassChart,
	faShieldHalved,
	faSolarPanel,
	faStar,
	faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	MATCH_FACTORS,
	MATCHMAKING_PROJECTS,
	PROCUREMENT_METHODS,
	type ProcurementMethod,
	RECOMMENDED_VENDORS,
	type RecommendedVendor,
} from "./lib/matchmaking";
import { formatId } from "./lib/number-format";

const METHOD_ICONS = {
	DIRECT_SELECTION: faHandshake,
	CLOSED_BIDDING: faGavel,
	OPEN_BIDDING: faMagnifyingGlassChart,
} as const;

const NEED_ICONS = [faBolt, faWallet, faLeaf, faBuilding] as const;

function VendorRow({
	vendor,
	rank,
	best,
	expanded,
	onToggle,
}: {
	vendor: RecommendedVendor;
	rank: number;
	best: boolean;
	expanded: boolean;
	onToggle: () => void;
}) {
	return (
		<div>
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={expanded}
				className="flex w-full cursor-pointer flex-row items-center justify-between gap-4 p-4 text-left"
			>
				<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-green-700 text-base font-semibold text-white tabular-nums">
					{rank}
				</span>
				<span className="flex min-w-0 flex-1 items-center gap-3">
					<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
						<FontAwesomeIcon icon={faSolarPanel} className="size-5" />
					</span>
					<span className="min-w-0">
						<span className="block truncate text-base font-semibold">
							{vendor.name}
						</span>
						<span className="block truncate text-base text-gray-500">
							{vendor.subtitle}
						</span>
					</span>
				</span>
				<span className="shrink-0 text-center">
					{best && (
						<Badge className="bg-green-100 text-green-800">Best Match</Badge>
					)}
					<span className="mt-1 block text-2xl font-bold tabular-nums text-green-700">
						{vendor.score}%
					</span>
					<span className="block text-base text-gray-500">Match Score</span>
				</span>
				<span className="hidden min-w-0 flex-1 grid-cols-3 gap-6 md:grid">
					<span className="min-w-0">
						<span className="block text-base text-gray-500">
							Estimasi Biaya
						</span>
						<span className="block truncate text-base font-semibold tabular-nums">
							{vendor.costEstimate}
						</span>
						<span className="block truncate text-base text-gray-500 tabular-nums">
							{vendor.price} · {vendor.duration}
						</span>
					</span>
					<span className="min-w-0">
						<span className="block text-base text-gray-500">
							Pengalaman Relevan
						</span>
						<span className="block truncate text-base font-semibold">
							{vendor.relevantExperience}
						</span>
						<span className="block truncate text-base text-gray-500">
							{vendor.duration}
						</span>
					</span>
					<span className="min-w-0">
						<span className="block text-base text-gray-500">Risiko</span>
						<span className="block truncate text-base font-semibold">
							{vendor.riskLevel}
						</span>
						<span className="block truncate text-base text-gray-500">
							{vendor.desc}
						</span>
					</span>
				</span>
				<span className="flex shrink-0 items-center gap-1 text-base font-medium text-green-700">
					Lihat Detail
					<FontAwesomeIcon
						icon={faChevronDown}
						className={
							expanded
								? "size-4 rotate-180 transition-transform"
								: "size-4 transition-transform"
						}
					/>
				</span>
			</button>
			{expanded && (
				<div className="border-t border-green-100 bg-green-50/50 p-4">
					{best ? (
						<>
							<p className="text-base font-semibold text-green-800">
								Mengapa peringkat #1?
							</p>
							<ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
								{vendor.whyRank.map((reason) => (
									<li
										key={reason}
										className="flex items-start gap-2 text-base text-green-800"
									>
										<FontAwesomeIcon
											icon={faCheck}
											className="mt-1 size-4 shrink-0"
										/>
										{reason}
									</li>
								))}
							</ul>
						</>
					) : (
						<div className="space-y-1 text-base">
							<p className="tabular-nums">
								{vendor.price} · {vendor.duration}
							</p>
							<p className="text-muted-foreground">{vendor.desc}</p>
							<p className="text-muted-foreground">
								{vendor.relevantExperience} · Risiko {vendor.riskLevel}
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export function MatchmakingDetail({ projectId }: { projectId: string }) {
	const project = MATCHMAKING_PROJECTS.find((p) => p.id === projectId);
	const [method, setMethod] = useState<ProcurementMethod["id"] | null>(null);
	const navigate = useNavigate();

	function handleLanjutkan() {
		if (method === null) return;
		window.alert("Vendor dan metode procurement berhasil disimpan!");
		void navigate({ to: "/business/matchmaking" });
	}

	if (!project) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-semibold">Vendor Matchmaking</h1>
					<p className="mt-1 text-base text-muted-foreground">
						Proyek tidak ditemukan
					</p>
				</div>
			</div>
		);
	}

	const [best, ...rest] = [...RECOMMENDED_VENDORS].sort(
		(a, b) => b.score - a.score,
	);
	const [expandedVendor, setExpandedVendor] = useState(best.id);
	const capacity =
		project.capex !== null
			? `${((project.capex / 1_000_000_000) * 0.5).toFixed(1).replace(".", ",")} MWp`
			: "—";
	const budget =
		project.capex !== null
			? `Rp ${(project.capex / 1_000_000_000).toFixed(1).replace(".", ",")} Miliar`
			: "—";
	const metrics = [
		{ icon: faBolt, label: "Kapasitas", value: capacity },
		{ icon: faWallet, label: "Budget", value: budget },
		{ icon: faLeaf, label: "Target Emisi", value: "45% vs baseline" },
		{ icon: faBuilding, label: "Tipe Proyek", value: project.sector },
	];
	const needs = [
		{
			label: "Nilai CAPEX",
			value: project.capex !== null ? `Rp ${formatId(project.capex)}` : "—",
		},
		{ label: "Lokasi", value: project.location },
		{ label: "Sektor", value: project.sector },
		{ label: "Pengajuan", value: project.submittedAt },
	];

	return (
		<div className="space-y-6 bg-gray-50 p-6">
			<div>
				<h1 className="text-2xl font-semibold">{project.name}</h1>
				<p className="mt-1 text-base text-muted-foreground">
					Rekomendasi vendor dan metode procurement untuk proyek ini.
				</p>
			</div>

			<div className="flex items-center gap-6 rounded-xl border border-gray-100 bg-white p-4">
				<span className="shrink-0 rounded-lg bg-green-50 p-3 text-green-700">
					<FontAwesomeIcon icon={faSolarPanel} className="size-6" />
				</span>
				<div className="grid min-w-0 flex-1 grid-cols-2 divide-x divide-gray-200 sm:grid-cols-4">
					{metrics.map((m) => (
						<div key={m.label} className="flex items-center gap-3 px-4">
							<FontAwesomeIcon
								icon={m.icon}
								className="size-5 shrink-0 text-green-700"
							/>
							<div className="min-w-0">
								<p className="truncate text-base text-gray-500">{m.label}</p>
								<p className="truncate text-base font-semibold tabular-nums">
									{m.value}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[65fr_35fr]">
				<div className="min-w-0 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Smart Recommendation</CardTitle>
							<CardDescription>
								Vendor dengan skor kecocokan tertinggi untuk kebutuhan proyek.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div
								className={
									expandedVendor === best.id
										? "overflow-hidden rounded-xl border-2 border-green-500"
										: "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
								}
							>
								<VendorRow
									vendor={best}
									rank={1}
									best
									expanded={expandedVendor === best.id}
									onToggle={() => setExpandedVendor(best.id)}
								/>
							</div>
							{rest.map((vendor, i) => (
								<div
									key={vendor.id}
									className={
										expandedVendor === vendor.id
											? "overflow-hidden rounded-xl border-2 border-green-500 bg-white shadow-sm"
											: "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
									}
								>
									<VendorRow
										vendor={vendor}
										rank={i + 2}
										best={false}
										expanded={expandedVendor === vendor.id}
										onToggle={() => setExpandedVendor(vendor.id)}
									/>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Pilih Metode Procurement</CardTitle>
							<CardDescription>
								Tentukan cara vendor dipilih untuk proyek ini.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4 sm:flex-row">
							{PROCUREMENT_METHODS.map((m) => {
								const selected = method === m.id;
								return (
									<button
										key={m.id}
										type="button"
										aria-pressed={selected}
										onClick={() => setMethod(m.id)}
										className={
											selected
												? "relative flex-1 rounded-xl border-2 border-green-500 bg-white p-4 text-left shadow-sm"
												: "flex-1 rounded-xl border bg-white p-4 text-left shadow-sm"
										}
									>
										{selected && (
											<FontAwesomeIcon
												icon={faCircleCheck}
												className="absolute right-3 top-3 size-4 text-green-600"
											/>
										)}
										<FontAwesomeIcon
											icon={METHOD_ICONS[m.id]}
											className="size-5 text-green-700"
										/>
										<p className="mt-2 text-base font-semibold">{m.label}</p>
										<p className="mt-1 text-base font-normal text-muted-foreground">
											{m.desc}
										</p>
									</button>
								);
							})}
						</CardContent>
					</Card>
				</div>

				<div className="min-w-0 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Ringkasan Kebutuhan Proyek</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{needs.map((n, i) => (
								<div
									key={n.label}
									className="flex items-center justify-between gap-4"
								>
									<p className="flex items-center gap-2 text-base text-gray-500">
										<FontAwesomeIcon
											icon={NEED_ICONS[i % NEED_ICONS.length]}
											className="size-4"
										/>
										{n.label}
									</p>
									<p className="text-base font-semibold tabular-nums">
										{n.value}
									</p>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Match Factors</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{MATCH_FACTORS.map((f) => (
								<div key={f.label} className="space-y-1">
									<div className="flex items-center justify-between gap-3">
										<p className="text-base font-medium">{f.label}</p>
										<p className="text-base tabular-nums text-muted-foreground">
											{f.pct}%
										</p>
									</div>
									<div
										role="progressbar"
										aria-valuenow={f.pct}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-label={f.label}
										className="h-2 rounded-full bg-gray-200"
									>
										<div
											className="h-2 rounded-full bg-green-600"
											style={{ width: `${f.pct}%` }}
										/>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<div className="rounded-lg bg-green-50 p-4 text-green-800">
						<p className="flex items-center gap-2 text-base font-semibold">
							<FontAwesomeIcon icon={faStar} className="size-4" />
							Bagaimana match score dihitung?
						</p>
						<p className="mt-2 text-base">
							Skor kecocokan dihitung dari kesesuaian teknis (40%) + rekam jejak
							(30%) + harga (20%) + kapasitas (10%).
						</p>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-4">
				<div className="flex items-center gap-3">
					<FontAwesomeIcon
						icon={faShieldHalved}
						className="size-5 text-green-700"
					/>
					<div>
						<p className="text-base font-semibold">Langkah Selanjutnya</p>
						{method === null && (
							<p className="text-base text-muted-foreground">
								Pilih metode procurement di atas untuk melanjutkan.
							</p>
						)}
					</div>
				</div>
				<Button
					type="button"
					disabled={method === null}
					onClick={handleLanjutkan}
					className="cursor-pointer transition-colors hover:bg-green-700"
				>
					Lanjutkan
					<FontAwesomeIcon icon={faArrowRight} />
				</Button>
			</div>
		</div>
	);
}
