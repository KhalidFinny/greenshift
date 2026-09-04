import {
	ContentSkeleton,
	EmptyState,
} from "@greenshift/ui";
import { HoldingsPanel } from "../organisms/holdings-panel";
import { useInvestorData } from "../lib/use-investor-data";

export function HoldingsTab() {
	const { items, isPending, isError, isDemo } = useInvestorData();

	if (isPending) return <ContentSkeleton />;
	if (isError) {
		return (
			<EmptyState
				title="Gagal memuat portofolio"
				description="Tidak dapat mengambil data obligasi Anda saat ini."
			/>
		);
	}

	return (
		<HoldingsPanel
			items={items}
			interactive={!isDemo}
			title="Semua Obligasi"
		/>
	);
}
