import { useState } from 'react'

export function useStepper(totalSteps: number, initialStep: number = 0) {
  const [activeStep, setActiveStep] = useState(initialStep)

  const goTo = (index: number) => {
    if (index >= 0 && index < totalSteps) {
      setActiveStep(index)
    }
  }

  const next = () => goTo(Math.min(activeStep + 1, totalSteps - 1))
  const prev = () => goTo(Math.max(activeStep - 1, 0))

  return { activeStep, setActiveStep: goTo, next, prev }
}
