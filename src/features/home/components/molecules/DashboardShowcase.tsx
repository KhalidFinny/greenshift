import GlassCard from '../atoms/GlassCard'

export default function DashboardShowcase() {
  return (
    <figure className="relative w-[80%] max-w-[1000px] m-0">
      <GlassCard className="cursor-pointer transition-transform duration-500 hover:-translate-y-2 pointer-events-auto motion-reduce:hover:translate-y-0">
        <div className="relative">
          <img
            src="/CompanyProjectSubmissionDashboard.png"
            alt="Tampilan dasbor GreenShift menampilkan metrik proyek energi"
            className="w-full"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[12px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]" aria-hidden="true" />
        </div>
      </GlassCard>
      <figcaption className="sr-only">
        Dashboard monitoring proyek GreenShift dengan visualisasi data real-time
      </figcaption>
    </figure>
  )
}
