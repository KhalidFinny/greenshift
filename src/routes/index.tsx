import { createFileRoute } from '@tanstack/react-router'
import HeroSection from '#/features/home/components/organisms/HeroSection'
import CaraKerjaSection from '#/features/home/components/organisms/CaraKerjaSection'
import EkosistemSection from '#/features/home/components/organisms/EkosistemSection'

export const Route = createFileRoute('/')({
  component: () => (
    <main>
      <HeroSection />
      <CaraKerjaSection />
      <EkosistemSection />
    </main>
  ),
})
