import { useInView } from "../../hooks/useInView";
import { useMouseParallax } from "../../hooks/useMouseParallax";
import { useStepper } from "../../hooks/useStepper";

const steps = [
	{
		id: "01",
		stepLabel: "Validate",
		title: "Mulai Dengan Mudah",
		description:
			"Cukup isi profil perusahaan Anda dan unggah dokumen pendukung seperti tagihan listrik, audit energi, serta data operasional lainnya. Sistem kami akan memvalidasi setiap informasi secara otomatis agar prosesnya cepat, transparan, dan tanpa ribet.",
	},
	{
		id: "02",
		stepLabel: "Prepare",
		title: "Siapkan Strategi Terbaik",
		description:
			"Tim GreenShift akan menyusun technical blueprint dan financial model yang disesuaikan dengan kebutuhan proyek Anda. Dari analisis kelayakan hingga perencanaan implementasi, semuanya dirancang untuk memastikan proyek berjalan efisien dan menghasilkan dampak nyata.",
	},
	{
		id: "03",
		stepLabel: "Fund",
		title: "Dapatkan Pendanaan",
		description:
			"Proyek yang telah divalidasi dan terstruktur dengan baik siap menarik minat mitra investasi kami. Kami menjembatani kebutuhan pembiayaan Anda dengan jaringan investor yang berkomitmen pada transisi energi berkelanjutan.",
	},
	{
		id: "04",
		stepLabel: "Monitor",
		title: "Pantau Dengan Percaya Diri",
		description:
			"Akses dashboard real-time untuk melacak performa proyek, pengembalian investasi, dan dampak pengurangan emisi karbon. Semua data tersedia dalam satu tempat sehingga Anda bisa mengambil keputusan yang tepat kapan saja.",
	},
];

export default function CaraKerjaSection() {
	const { activeStep, setActiveStep } = useStepper(steps.length);
	const imageRef = useMouseParallax<HTMLDivElement>({ intensity: 0.025 });
	const { ref, isVisible } = useInView<HTMLElement>({ threshold: 0.1 });

	return (
		<section
			id="cara-kerja"
			ref={ref}
			className="relative overflow-hidden bg-white"
		>
			<div className="page-wrap relative z-10 py-24">
				<header className="mb-12 max-w-2xl">
					<p className="text-sm font-bold uppercase tracking-[0.2em] text-[#03442C]">
						Cara Kerja
					</p>
					<h2 className="mt-4 text-[36px] font-bold leading-tight text-[#1C1C1C]">
						Langkah Menuju Transisi Energi
					</h2>
				</header>

				<nav
					className="mb-20 flex flex-wrap items-start"
					aria-label="Langkah proses"
				>
					{steps.map((step, index) => (
						<div key={step.id} className="flex items-start">
							<button
								type="button"
								onClick={() => setActiveStep(index)}
								aria-pressed={activeStep === index}
								className="flex flex-col items-center cursor-pointer px-4"
							>
								<span
									className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold transition-all duration-500 motion-reduce:transition-none"
									style={{
										backgroundColor:
											activeStep === index ? "#00712D" : "transparent",
										color: activeStep === index ? "#fff" : "#03442C",
										border: activeStep === index ? "none" : "2px solid #03442C",
									}}
								>
									{step.id}
								</span>
								<span
									className="mt-3 text-base font-semibold transition-colors duration-300 motion-reduce:transition-none"
									style={{
										color: activeStep === index ? "#03442C" : "#555555",
									}}
								>
									{step.stepLabel}
								</span>
							</button>
							{index < steps.length - 1 && (
								<div
									className="mt-6 h-px w-12 bg-[#03442C]/20"
									aria-hidden="true"
								/>
							)}
						</div>
					))}
				</nav>

				<div
					className={`grid grid-cols-1 items-start gap-12 transition-all duration-700 motion-reduce:transition-none lg:grid-cols-[1fr_1.5fr] lg:gap-20 ${
						isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
					}`}
				>
					<article id={`step-panel-${steps[activeStep].id}`}>
						<h3 className="text-[32px] font-bold leading-[1.2] text-[#1C1C1C]">
							{steps[activeStep].title}
						</h3>
						<p className="mt-6 text-[22px] leading-[1.8] text-[#555]">
							{steps[activeStep].description}
						</p>
					</article>

					<figure className="m-0">
						<div
							ref={imageRef}
							className="rounded-[16px] border border-[#03442C]/20 bg-white p-2 will-change-transform motion-reduce:!transform-none"
						>
							<img
								src="/dashboard.webp"
								alt="Dasbor GreenShift menampilkan visualisasi data proyek efisiensi energi"
								loading="lazy"
								decoding="async"
								className="w-full rounded-[12px]"
							/>
						</div>
						<figcaption className="sr-only">
							Preview dashboard monitoring proyek GreenShift
						</figcaption>
					</figure>
				</div>
			</div>
		</section>
	);
}
