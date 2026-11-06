import { pageBg } from '../ui'
import Stepper from './Stepper'
import Icon from './Icon'

// Wspólny szkielet ekranów logowania, rejestracji i ankiety
export default function AuthShell({ title, subtitle, children, wide = false, step, labels }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  wide?: boolean
  step?: number
  labels?: string[]
}) {
  return (
    <div className={`relative flex min-h-screen items-center justify-center overflow-hidden ${pageBg} p-4 py-8 text-white md:p-6`}>

      <div className={`relative z-10 flex w-full flex-col gap-8 animate-fade-in ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        {step && labels && <Stepper step={step} labels={labels} />}

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500 text-white">
            <Icon name="dumbbell" size={30} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">{title}</h1>
          {subtitle && <p className="text-zinc-400">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  )
}
