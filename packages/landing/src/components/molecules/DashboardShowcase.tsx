import GlassCard from "../atoms/GlassCard";

export default function DashboardShowcase() {
	return (
		<figure className="relative w-[80%] max-w-[1000px] m-0">
			<GlassCard>
				<div className="relative">
					<img
						src="/dashboard.webp"
						alt="Tampilan dasbor GreenShift menampilkan metrik proyek energi"
						decoding="async"
						className="w-full"
					/>
				</div>
			</GlassCard>
			<figcaption className="sr-only">
				Dashboard monitoring proyek GreenShift dengan visualisasi data real-time
			</figcaption>
		</figure>
	);
}
