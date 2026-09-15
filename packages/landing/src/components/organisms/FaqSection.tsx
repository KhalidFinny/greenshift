import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@greenshift/ui";

const faqs = [
	{
		question: "Apakah GreenShift menyediakan akun gratis?",
		answer:
			"Ya. Daftar gratis untuk mengeksplorasi platform: profil perusahaan, penilaian proyek dasar, blueprint, simulasi ROI, dan pencarian vendor dengan dataset demo.",
	},
	{
		question: "Bagaimana cara memulai?",
		answer:
			"Daftar akun gratis, lengkapi profil perusahaan Anda, dan ajukan proyek efisiensi energi pertama. Tim GreenShift memvalidasi setiap pengajuan sebelum proyek melanjutkan ke tahap berikutnya.",
	},
	{
		question: "Apakah saya perlu data teknis untuk memulai?",
		answer:
			"Tidak perlu. Cukup isi profil perusahaan dan unggah dokumen pendukung seperti tagihan listrik atau audit energi. Sistem memvalidasi setiap informasi secara otomatis agar prosesnya cepat dan transparan.",
	},
	{
		question: "Bagaimana proyek saya mendapatkan pendanaan?",
		answer:
			"Setelah proyek divalidasi dan blueprint-nya disusun, proyek siap menarik minat mitra investasi kami. GreenShift menjembatani kebutuhan pembiayaan Anda dengan investor yang berkomitmen pada transisi energi.",
	},
	{
		question: "Bagaimana saya memantau proyek setelah didanai?",
		answer:
			"Akses dashboard real-time untuk melacak performa proyek, pengembalian investasi, dan dampak pengurangan emisi karbon. Semua data tersedia dalam satu tempat.",
	},
	{
		question: "Siapa saja yang terlibat dalam ekosistem GreenShift?",
		answer:
			"Perusahaan industri, vendor energi, validator independen, mitra SCF berizin OJK, dan investor, semua bekerja dalam satu ekosistem yang terukur dan transparan.",
	},
];

export default function FaqSection() {
	return (
		<section id="faq" className="bg-white">
			<div className="page-wrap py-28">
				<header className="max-w-2xl">
					<p className="text-base font-bold uppercase tracking-[0.2em] text-[#03442C]">
						FAQ
					</p>
					<h2 className="mt-4 text-[40px] font-bold leading-tight text-[#1C1C1C]">
						Pertanyaan yang sering diajukan
					</h2>
					<p className="mt-6 text-lg leading-relaxed text-[#555555]">
						Tidak menemukan jawaban? Email kami di{" "}
						<a
							href="mailto:contact@greenshift.com"
							className="font-semibold text-[#00712D] underline underline-offset-2 hover:text-[#03442C]"
						>
							contact@greenshift.com
						</a>
						.
					</p>
				</header>

				<div className="mt-16 grid gap-x-16 lg:grid-cols-2">
					<Accordion
						type="single"
						collapsible
						className="border-t border-[#03442C]/20"
					>
						{faqs.slice(0, 3).map((faq) => (
							<AccordionItem
								key={faq.question}
								value={faq.question}
								className="border-b border-[#03442C]/20"
							>
								<AccordionTrigger className="py-6 text-xl font-semibold text-[#1C1C1C]">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="text-lg leading-relaxed text-[#555555]">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
					<Accordion
						type="single"
						collapsible
						className="border-t border-[#03442C]/20"
					>
						{faqs.slice(3).map((faq) => (
							<AccordionItem
								key={faq.question}
								value={faq.question}
								className="border-b border-[#03442C]/20"
							>
								<AccordionTrigger className="py-6 text-xl font-semibold text-[#1C1C1C]">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="text-lg leading-relaxed text-[#555555]">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</section>
	);
}
