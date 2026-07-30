import { useState, useEffect, useRef, useCallback } from 'react'
import { Building2, Truck, ShieldCheck, Landmark, TrendingUp } from 'lucide-react'
import { useInView } from '#/hooks/useInView'

const actors = [
  {
    icon: Building2,
    label: 'Perusahaan',
    tagline: 'Mengajukan proyek dan kebutuhan energi',
    detail:
      'Perusahaan industri mengajukan proyek efisiensi energi ke GreenShift beserta dokumen pendukung seperti tagihan listrik, audit energi, dan data operasional. Tim kami memvalidasi setiap pengajuan agar proyek siap untuk tahap selanjutnya.',
    angle: -90,
  },
  {
    icon: Truck,
    label: 'Vendor',
    tagline: 'Menyediakan solusi dan menjalankan proyek',
    detail:
      'Vendor energi terdaftar menyediakan solusi teknis, melakukan assessment lapangan, dan menjalankan proyek efisiensi energi. Setiap vendor telah melalui proses verifikasi untuk memastikan kualitas dan keandalan.',
    angle: -90 + 72,
  },
  {
    icon: ShieldCheck,
    label: 'Validator Independen',
    tagline: 'Memvalidasi data dan dampak secara objektif',
    detail:
      'Validator independen melakukan verifikasi data energi, menghitung dampak pengurangan emisi karbon, dan menyusun laporan audit yang transparan. Memastikan setiap klaim berbasis data faktual dan dapat diverifikasi.',
    angle: -90 + 72 * 2,
  },
  {
    icon: Landmark,
    label: 'Mitra SCF Berizin OJK',
    tagline: 'Menyediakan akses pendanaan publik',
    detail:
      'Mitra supply chain financing berizin OJK menyediakan instrumen pendanaan hijau seperti green bonds dan sukuk. Menghubungkan proyek terverifikasi dengan sumber pendanaan publik yang terpercaya.',
    angle: -90 + 72 * 3,
  },
  {
    icon: TrendingUp,
    label: 'Investor',
    tagline: 'Mendanai proyek dan menerima imbal hasil',
    detail:
      'Investor individu maupun institusi mendanai proyek efisiensi energi melalui platform GreenShift. Setiap investasi terhubung dengan proyek nyata yang menghasilkan ROI dan dampak pengurangan emisi yang terukur.',
    angle: -90 + 72 * 4,
  },
]

const RADIUS = 210
const DEGREES_PER_SEC = 72 / 6 // 6s per node, 30s per full cycle
const RESUME_DELAY = 8000

function normalizeAngle(a: number) {
  return ((a % 360) + 360) % 360
}

function detectCrossing(prevAngle: number, currAngle: number, current: number): number {
  const p = normalizeAngle(prevAngle)
  const c = normalizeAngle(currAngle)
  const moveAmount = ((c - p) + 360) % 360

  for (let i = 0; i < actors.length; i++) {
    if (i === current) continue
    const node = normalizeAngle(actors[i].angle)
    const distFromPrev = ((node - p) + 360) % 360
    const distFromCurr = Math.abs(c - node)
    const circularDist = Math.min(distFromCurr, 360 - distFromCurr)
    if (distFromPrev > 0 && distFromPrev <= moveAmount && circularDist < 8) {
      return i
    }
  }
  return current
}

export default function EkosistemSection() {
  const [active, setActive] = useState(0)
  const [ballAngle, setBallAngle] = useState(actors[0].angle)
  const pausedRef = useRef(false)
  const lastTimeRef = useRef<number | null>(null)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevBallAngleRef = useRef(actors[0].angle)
  const { ref, isVisible } = useInView<HTMLElement>({ threshold: 0.1 })
  const selected = actors[active]
  const Icon = selected.icon

  // Orbital animation loop
  useEffect(() => {
    let raf: number

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now
      }

      if (!pausedRef.current) {
        const dt = (now - lastTimeRef.current) / 1000
        setBallAngle((prev) => prev + DEGREES_PER_SEC * dt)
      }

      lastTimeRef.current = now
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Detect when ball crosses a node
  useEffect(() => {
    const crossed = detectCrossing(prevBallAngleRef.current, ballAngle, active)
    if (crossed !== active) {
      setActive(crossed)
    }
    prevBallAngleRef.current = ballAngle
  }, [ballAngle, active])

  // Pause on user click, resume after delay
  const handleNodeClick = useCallback(
    (i: number) => {
      setActive(i)
      setBallAngle(actors[i].angle)
      prevBallAngleRef.current = actors[i].angle
      pausedRef.current = true
      lastTimeRef.current = null

      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = setTimeout(() => {
        pausedRef.current = false
        lastTimeRef.current = null
        prevBallAngleRef.current = actors[i].angle
      }, RESUME_DELAY)
    },
    [],
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  // Ball position
  const rad = (ballAngle * Math.PI) / 180
  const bx = Math.cos(rad) * RADIUS
  const by = Math.sin(rad) * RADIUS

  return (
    <section
      id="ekosistem"
      ref={ref}
      className="relative overflow-hidden bg-white"
    >
      <div className="page-wrap relative z-10 py-24">
        <header className="mb-16 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#03442C]">
            Ekosistem
          </p>
          <h2 className="mt-4 text-[36px] font-bold leading-tight text-[#1C1C1C]">
            Kolaborasi untuk transisi energi industri
          </h2>
        </header>

        <div
          className={`grid grid-cols-[1fr_1fr] gap-16 items-center transition-all duration-700 motion-reduce:transition-none ${
            isVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Left: Circular ecosystem */}
          <div className="flex justify-center">
            <div
              className="relative"
              style={{ width: `${RADIUS * 2 + 120}px`, height: `${RADIUS * 2 + 120}px` }}
            >
              {/* Orbit ring */}
              <div
                className="absolute inset-0 m-auto rounded-full border border-[#03442C]/12"
                style={{ width: `${RADIUS * 2}px`, height: `${RADIUS * 2}px` }}
                aria-hidden="true"
              />

              {/* SVG connecting lines + orbiting ball */}
              <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                {actors.map((actor, i) => {
                  const actorRad = (actor.angle * Math.PI) / 180
                  const cx = RADIUS + 60
                  const cy = RADIUS + 60
                  const nx = cx + Math.cos(actorRad) * RADIUS
                  const ny = cy + Math.sin(actorRad) * RADIUS
                  return (
                    <line
                      key={i}
                      x1={cx}
                      y1={cy}
                      x2={nx}
                      y2={ny}
                      stroke="#03442C"
                      strokeOpacity={active === i ? '0.4' : '0.15'}
                      strokeWidth={active === i ? '1.5' : '1'}
                      strokeDasharray="4 4"
                      className="transition-all duration-500 motion-reduce:transition-none"
                    />
                  )
                })}
                {/* Orbiting ball */}
                <circle
                  cx={RADIUS + 60 + bx}
                  cy={RADIUS + 60 + by}
                  r={6}
                  fill="#00712D"
                />
                <circle
                  cx={RADIUS + 60 + bx}
                  cy={RADIUS + 60 + by}
                  r={10}
                  fill="none"
                  stroke="#00712D"
                  strokeOpacity={0.3}
                  strokeWidth={2}
                />
              </svg>

              {/* Outer nodes */}
              {actors.map((actor, i) => {
                const actorRad = (actor.angle * Math.PI) / 180
                const x = Math.cos(actorRad) * RADIUS
                const y = Math.sin(actorRad) * RADIUS
                const NodeIcon = actor.icon
                const isActive = active === i

                return (
                  <button
                    key={actor.label}
                    onClick={() => handleNodeClick(i)}
                    className={`absolute flex flex-col items-center text-center cursor-pointer transition-all duration-500 motion-reduce:transition-none ${
                      isActive
                        ? 'opacity-100'
                        : 'opacity-45 hover:opacity-75'
                    }`}
                    style={{
                      left: `calc(50% + ${x}px - 60px)`,
                      top: `calc(50% + ${y}px - 44px)`,
                      width: '120px',
                    }}
                  >
                    <div
                      className={`flex h-[60px] w-[60px] items-center justify-center rounded-full border transition-all duration-500 motion-reduce:transition-none ${
                        isActive
                          ? 'border-[#03442C]/30 bg-[#03442C] shadow-[0_2px_16px_rgba(3,68,44,0.15)]'
                          : 'border-[#03442C]/15 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
                      }`}
                    >
                      <NodeIcon
                        className={`h-[24px] w-[24px] transition-colors duration-500 motion-reduce:transition-none ${
                          isActive ? 'text-white' : 'text-[#03442C]'
                        }`}
                        strokeWidth={1.5}
                      />
                    </div>
                    <p
                      className={`mt-2 text-[13px] font-semibold leading-tight transition-colors duration-500 motion-reduce:transition-none ${
                        isActive ? 'text-[#1C1C1C]' : 'text-[#999]'
                      }`}
                    >
                      {actor.label}
                    </p>
                  </button>
                )
              })}

              {/* Center logo */}
              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full border border-[#03442C]/20 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                  <img
                    src="/logo-short.svg"
                    alt="GreenShift"
                    className="h-[48px] w-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Selected node detail */}
          <article className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#03442C]/20 bg-[#03442C]/5">
                <Icon className="h-[24px] w-[24px] text-[#03442C]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[32px] font-bold leading-[1.2] text-[#1C1C1C]">
                {selected.label}
              </h3>
            </div>
            <p className="text-[22px] font-medium leading-[1.6] text-[#03442C]">
              {selected.tagline}
            </p>
            <p className="text-[22px] leading-[1.8] text-[#555]">
              {selected.detail}
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
