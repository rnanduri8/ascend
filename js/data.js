// ============================================================================
// Ascend. — static content banks (quotes + reading snippets)
// Pure data, no logic. Edit freely to add your own.
// ============================================================================

// "Dark-ish" motivation — blunt, unsentimental, discipline-forward.
const QUOTES = [
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.", author: "Ryan Holiday" },
  { text: "You will not rise to the level of your goals. You will fall to the level of your systems.", author: "James Clear" },
  { text: "Nobody is coming to save you. That's not pessimism — it's the beginning of self-reliance.", author: "Naval Ravikant" },
  { text: "The pain of discipline weighs ounces. The pain of regret weighs tons.", author: "Jim Rohn" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  { text: "Comfort is the enemy of achievement.", author: "Farrah Gray" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
  { text: "What is not devoured by fire is hardened by it.", author: "Anonymous" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Deserve victory.", author: "Ryan Holiday" },
  { text: "Between stimulus and response there is a space. In that space is our power to choose our response.", author: "Viktor Frankl" },
  { text: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", author: "Steven Pressfield" },
  { text: "The struggle you're in today is developing the strength you need for tomorrow. Don't wish it were easier — wish you were better.", author: "Jim Rohn" },
  { text: "No one saves us but ourselves. No one can and no one may. We ourselves must walk the path.", author: "Buddha" },
  { text: "You didn't come this far to only come this far.", author: "Anonymous" },
  { text: "Ego is the enemy of what you want and of what you have: mastery, security, real knowledge of yourself.", author: "Ryan Holiday" },
  { text: "Suffering is optional. Pain is inevitable, but the story you tell yourself about it is where suffering begins.", author: "Haruki Murakami (paraphrased)" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "There is no easy way from the earth to the stars.", author: "Seneca" },
  { text: "Fear is a reaction. Courage is a decision.", author: "Winston Churchill" },
  { text: "You are what you repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant, on Aristotle" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The most painful thing is losing yourself in the process of loving someone else too much, and forgetting that you are special too.", author: "Ernest Hemingway" },
  { text: "Get busy living or get busy dying.", author: "Stephen King" },
  { text: "If you want something you've never had, you must be willing to do something you've never done.", author: "Thomas Jefferson" }
];

// Reading interest categories shown in Settings
const READING_INTERESTS = [
  "Stoicism",
  "Discipline & Habits",
  "Leadership",
  "Business Strategy",
  "Productivity",
  "Financial Mindset",
  "Mental Toughness",
  "Deep Work / Focus"
];

// Short (~150-250 word) teaching snippets, tagged by interest.
// These are original short essays inspired by the ideas in each tradition —
// not excerpts from copyrighted books.
const READING_BANK = [
  {
    id: "r1", tags: ["Stoicism", "Mental Toughness"],
    title: "The Dichotomy of Control",
    body: "Every morning, before anything demands your attention, draw a line down the middle of what the day will bring. On one side: your judgments, your effort, your reactions — entirely yours. On the other: the traffic, the market, other people's opinions, the weather — never yours, no matter how much you insist otherwise. The Stoics didn't preach indifference to the world; they preached precision about where your energy actually does anything. Most anxiety is spent renovating the wrong side of that line. Today, before you react to anything, ask: is this mine to control? If not, note it and move on. If it is, act — fully, without waiting for permission or certainty."
  },
  {
    id: "r2", tags: ["Discipline & Habits", "Productivity"],
    title: "Systems Beat Goals",
    body: "A goal is a direction. A system is what actually moves you. The person who says 'I want to write a book' and the person who says 'I write 300 words every morning before checking my phone' are aiming at the same outcome, but only one of them has removed the decision from the equation. Willpower is a depleting resource; a system is a standing order you gave your past self so your present self doesn't have to negotiate every day. The fastest way to improve any area of your life is not to want it more — it's to make the desired behavior the path of least resistance, and the undesired one require friction."
  },
  {
    id: "r3", tags: ["Leadership"],
    title: "Authority Is Borrowed, Not Owned",
    body: "Titles grant permission to lead; they don't grant the ability. The moment a team stops believing a leader's decisions are made in good faith — for the mission, not for the leader's comfort — authority becomes hollow, enforced rather than followed. Real leadership is a loan renewed daily by consistency: doing the hard, unglamorous thing when no one's measuring it, admitting error before being caught in it, protecting the team's time as fiercely as your own. The leaders people would follow into difficulty are rarely the loudest in the room — they're the ones whose word has never once needed a disclaimer."
  },
  {
    id: "r4", tags: ["Business Strategy"],
    title: "Moats Are Verbs, Not Nouns",
    body: "A competitive advantage isn't a wall you build once — it's an action you repeat faster or better than anyone else can copy. Patents expire, brand fades, first-mover advantage evaporates the moment a well-funded competitor decides to care. What compounds is a *process*: how quickly you learn from customers, how cheaply you can experiment, how tightly your team is aligned on what not to do. Ask less 'what protects us' and more 'what are we doing every week that a competitor would need years to replicate, even with our exact playbook in hand.'"
  },
  {
    id: "r5", tags: ["Productivity", "Deep Work / Focus"],
    title: "Attention Is the Last Scarce Resource",
    body: "Time is finite but at least it's honest — a day is always 24 hours. Attention is finite and dishonest: it can be technically 'available' while being functionally useless, fragmented across seven tabs and a phone buzzing in the next room. The professionals who produce disproportionate output aren't working more hours than everyone else; they've simply refused to let their best hours become communal property. Block time before the day claims it for you. An unprotected calendar is a calendar other people's priorities will fill by default."
  },
  {
    id: "r6", tags: ["Financial Mindset"],
    title: "Enough Is a Number, Not a Feeling",
    body: "The single most dangerous idea in personal finance is that more will eventually feel like enough. It won't, structurally — because the reference point moves with the income. The people who escape the treadmill are the ones who define 'enough' in advance, in writing, before the number arrives, so a future version of themselves can't renegotiate the definition under the influence of a bigger paycheck. Wealth is not what you accumulate; it's the gap between what you earn and what you spend, held open on purpose."
  },
  {
    id: "r7", tags: ["Mental Toughness", "Discipline & Habits"],
    title: "The Comfort Crisis Is Self-Inflicted",
    body: "Physical discomfort used to be unavoidable — cold, hunger, exertion were defaults, not choices. Now they're optional, and most people opt out entirely, then wonder why their capacity to handle hard things has quietly eroded. Deliberately choosing manageable discomfort — a hard workout, a cold shower, a fast, a long walk with no phone — isn't about the specific activity. It's rehearsal. You're proving to your nervous system, on your own terms, that discomfort is survivable and temporary, so that when hardship arrives uninvited, it meets a person who has practiced this before."
  },
  {
    id: "r8", tags: ["Stoicism"],
    title: "Premeditatio Malorum",
    body: "The Stoics practiced imagining loss in advance — not to court anxiety, but to inoculate against it and to sharpen gratitude for what's still present. Picture, briefly and deliberately, the job ending, the health faltering, the relationship changing. Not to dwell — to notice how much of your current peace you've been taking for granted, and to rehearse the response you'd want to have if it happened. This isn't pessimism; pessimism expects the worst and stops there. This is preparation: expect that anything can end, and let that fact make you more present with it while it hasn't."
  },
  {
    id: "r9", tags: ["Deep Work / Focus", "Business Strategy"],
    title: "Say No At The Strategy Level, Not The Task Level",
    body: "Most people try to protect their time by declining individual requests as they arrive — a losing, exhausting game, because each one arrives dressed as reasonable. The better move is to decide, in advance and out loud, what you are not doing this quarter. A stated strategy ('we are not entering that market,' 'I am not taking on client work below X') turns a hundred future negotiations into a single past decision. Strategy is mostly the art of preemptive refusal."
  },
  {
    id: "r10", tags: ["Leadership", "Mental Toughness"],
    title: "Composure Is a Force Multiplier",
    body: "In any group under pressure, people unconsciously calibrate their own alarm to whoever seems most in control. This means a leader's visible composure isn't cosmetic — it is, functionally, the team's shared nervous system regulator. You don't have to feel calm to provide it; you have to act as if the situation, however bad, is still within the range of things you've handled before. The skill isn't suppressing fear. It's metabolizing it fast enough that it never becomes anyone else's problem but yours."
  },
  {
    id: "r11", tags: ["Financial Mindset", "Discipline & Habits"],
    title: "Automate the Virtue",
    body: "Nobody consistently 'decides' to save money every month with equal enthusiasm — motivation is too unreliable a foundation for a 30-year plan. The people who build wealth quietly are the ones who removed the decision: automatic transfers the day the paycheck lands, before the money is visible enough to negotiate with. The same principle scales to every good habit you're relying on willpower for. If a behavior matters for decades, it shouldn't depend on how you feel on a given Tuesday."
  },
  {
    id: "r12", tags: ["Productivity", "Business Strategy"],
    title: "The Cost of a Decision Is Not the Decision",
    body: "Most delayed decisions aren't delayed because more information is coming — they're delayed because the decision-maker is avoiding the discomfort of being wrong in public. But the real cost of most decisions isn't the decision itself; it's the weeks spent circling it while the option set quietly narrows. Set a deadline for the decision before you have all the facts you'd like to have. A good decision made on time beats a perfect decision made too late to matter."
  }
];
