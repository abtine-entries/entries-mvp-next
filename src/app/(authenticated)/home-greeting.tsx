const greetings = [
  "Another day, another ledger.",
  "All accounts present and accounted for.",
  "Your GL missed you.",
  "May your debits always equal your credits.",
  "Today's forecast: 100% chance of reconciliation.",
  "Revenue is up, coffee is hot, let's go.",
  "The books won't balance themselves — oh wait.",
  "Let's make today count (pun intended).",
  "Time to make some entries.",
  "Receipts don't file themselves yet.",
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
