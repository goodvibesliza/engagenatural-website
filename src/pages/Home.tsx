import React from 'react'
import { Button } from '@/components/ui/Button'

// Petal radial background helper
const PetalWash: React.FC = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 -z-10"
    style={{
      background:
        'radial-gradient(60rem 30rem at 20% 10%, rgba(242,212,202,0.45) 0%, rgba(242,212,202,0.0) 55%),' +
        'radial-gradient(40rem 20rem at 80% 0%, rgba(246,227,220,0.55) 0%, rgba(246,227,220,0.0) 50%)',
    }}
  />
)

export default function Home(): JSX.Element {
  return (
    <main className="relative bg-white">
      <PetalWash />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl md:text-6xl font-extrabold leading-tight text-primary">
            Not just training. A movement you’re part of.
          </h1>

          <p className="mt-5 text-lg md:text-xl text-muted font-body max-w-prose">
            Micro-lessons and community support that give staff confidence and brands measurable results.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              className="bg-black text-white hover:bg-[#1A1A1A] border border-black"
            >
              Join the Community
            </Button>
            <Button
              variant="outline"
              className="border-black text-black hover:bg-[var(--color-petal-pink)] hover:text-[var(--color-black)]"
            >
              For Brands
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
