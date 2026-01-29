const greetings = [
  "Time to make the numbers sing.",
  "Let's balance those books.",
  "Ready to reconcile?",
  "Numbers don't lie, but they do hide.",
  "Every cent accounted for.",
  "Making debits and credits best friends.",
  "The ledger awaits.",
  "Turning chaos into clarity.",
  "Let's close this month out.",
  "Where every transaction tells a story.",
]

export function HomeGreeting() {
  // Pick a random greeting on each page load (server-side)
  const randomIndex = Math.floor(Math.random() * greetings.length)
  const greeting = greetings[randomIndex]

  return (
    <div className="text-center py-12">
      <h1 className="text-xl font-semibold tracking-tight">
        {greeting}
      </h1>
    </div>
  )
}
