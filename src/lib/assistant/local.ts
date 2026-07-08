/**
 * Offline / no-API-key fallback for the Love Assistant.
 * A tiny intent matcher over curated suggestion decks — works fully offline.
 */

const DECKS: { keywords: string[]; intro: string; ideas: string[] }[] = [
  {
    keywords: ["date", "evening", "night out", "weekend", "plan"],
    intro: "Here are some date ideas you two might love 🌹",
    ideas: [
      "🕯️ Cook a 3-course dinner together — each of you secretly plans one course",
      "🌌 Stargazing picnic with a blanket, snacks and a playlist",
      "🎨 Paint each other's portraits in 30 minutes, then swap",
      "📸 Photo-walk challenge: 10 photos, one theme, compare at a café",
      "🎳 Retro night: bowling or arcade, loser plans the next date",
      "🌅 Sunrise drive + breakfast at a place you've never tried",
    ],
  },
  {
    keywords: ["gift", "present", "surprise", "birthday", "anniversary gift"],
    intro: "Gift inspiration coming right up 🎁",
    ideas: [
      "📖 A mini photo book of your favorite memories together",
      "💌 A '12 open-when letters' bundle (open when sad, happy, missing me…)",
      "🌱 A plant you name together and raise as a team",
      "🎧 A custom playlist with a note for why each song matters",
      "⭐ Name a star or adopt an animal in their name",
      "🧩 A custom puzzle made from one of your photos",
    ],
  },
  {
    keywords: ["tip", "advice", "fight", "argue", "communication", "improve", "stronger"],
    intro: "A few gentle relationship tips 💞",
    ideas: [
      "🗣️ Try a weekly 20-minute check-in: highs, lows, and one appreciation each",
      "⏸️ In disagreements, take a 20-minute pause before finishing the talk",
      "🙏 Say one specific thank-you per day — specificity beats frequency",
      "📵 Keep one meal a day fully phone-free",
      "👂 Repeat back what you heard before responding — it defuses 80% of misfires",
      "❗ If things feel consistently heavy, a couples counselor is a sign of strength, not failure",
    ],
  },
  {
    keywords: ["talk", "conversation", "question", "deep", "ask"],
    intro: "Conversation starters to spark something real 💬",
    ideas: [
      "🌠 What's a dream you've never said out loud?",
      "🧒 What did you need to hear as a kid that no one said?",
      "🗺️ If we could teleport anywhere right now, where would you take us?",
      "💪 What's something hard you did that you're secretly proud of?",
      "🥰 When did you last feel most loved by me?",
      "🔮 What do you hope our life looks like in five years?",
    ],
  },
  {
    keywords: ["game", "play", "bored", "fun"],
    intro: "Ready, set, play 🎮",
    ideas: [
      "💘 Take the Love Quiz in the Games tab — loser owes a massage",
      "🎯 Couple Trivia: guess each other's answers, winner picks dinner",
      "🚀 Race the same Geometry Track level and compare scores",
      "🎲 Truth or Dare — the app has fresh prompts waiting",
      "🎱 Fill today's Love Bingo card together before midnight",
    ],
  },
  {
    keywords: ["trip", "travel", "vacation", "holiday", "getaway"],
    intro: "Pack your bags — trip ideas 🧳",
    ideas: [
      "🏔️ A cabin weekend with no wifi and a stack of board games",
      "🏙️ Be tourists in your own city: museum, viewpoint, fancy dessert",
      "🚗 A road trip where each of you picks one secret stop",
      "🏝️ Beach town in the off-season — empty beaches, cozy cafés",
      "🎪 Plan around an event: a festival, concert or food market in a nearby city",
    ],
  },
  {
    keywords: ["food", "eat", "dinner", "restaurant", "cook", "hungry"],
    intro: "Food is love — try these 🍜",
    ideas: [
      "🍝 Recreate the dish from your first date at home",
      "🌮 'Around the world' month: a new cuisine every Friday",
      "👩‍🍳 Take a cooking class together (pasta and sushi ones are great for two)",
      "🍰 Bake-off: same recipe, separate bowls, blind taste test",
      "🥡 Order each other's dinner — no vetoes allowed",
    ],
  },
];

const FALLBACK = {
  intro: "I can help with dates, gifts, tips, conversation starters, games, trips and food 💞 Try asking one of these:",
  ideas: [
    "💡 \"Plan us a cozy date for this weekend\"",
    "🎁 \"Gift ideas for our anniversary\"",
    "💬 \"Give us deep conversation starters\"",
    "✈️ \"Where should we travel next?\"",
    "🍕 \"What should we cook tonight?\"",
  ],
};

export function localAssistantReply(message: string): string {
  const q = message.toLowerCase();
  const deck = DECKS.find((d) => d.keywords.some((k) => q.includes(k))) ?? FALLBACK;
  const picked = [...deck.ideas].sort(() => 0.5 - Math.random()).slice(0, 5);
  return `${deck.intro}\n\n${picked.join("\n")}`;
}
