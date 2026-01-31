const greetings = [
  "Let's close some books today.",
  "Ready when you are.",
  "I've been keeping an eye on things.",
  "Numbers are looking good — let's dig in.",
  "Another day, another ledger.",
  "The books won't balance themselves.",
  "Let's make today count.",
  "Everything's in order — where should we start?",
  "Your clients are waiting.",
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
