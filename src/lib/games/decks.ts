/** Question decks and word lists for the card-style love games. */

export const LOVE_QUIZ: { q: string; options: string[]; answer: number }[] = [
  { q: "What is the traditional gift for a 1st anniversary?", options: ["Paper", "Gold", "Silk", "Wood"], answer: 0 },
  { q: "Which hormone is nicknamed the 'love hormone'?", options: ["Dopamine", "Oxytocin", "Cortisol", "Insulin"], answer: 1 },
  { q: "Cupid is the Roman god of…", options: ["War", "Desire", "Wine", "Harvest"], answer: 1 },
  { q: "Which city is called the 'City of Love'?", options: ["Venice", "Vienna", "Paris", "Prague"], answer: 2 },
  { q: "Valentine's Day falls on…", options: ["Feb 12", "Feb 13", "Feb 14", "Feb 15"], answer: 2 },
  { q: "A red rose traditionally symbolises…", options: ["Friendship", "Jealousy", "Passionate love", "Farewell"], answer: 2 },
  { q: "What shape is most associated with love?", options: ["Star", "Heart", "Circle", "Diamond"], answer: 1 },
  { q: "Which famous couple died in Verona in Shakespeare's play?", options: ["Antony & Cleopatra", "Romeo & Juliet", "Tristan & Isolde", "Lancelot & Guinevere"], answer: 1 },
  { q: "The Taj Mahal was built as a monument to…", options: ["Victory", "A beloved wife", "A god", "A king's coronation"], answer: 1 },
  { q: "'Love at first sight' takes roughly how long, per studies?", options: ["1/5 of a second", "10 seconds", "1 minute", "1 hour"], answer: 0 },
  { q: "Which bird is a symbol of love and pairs for life?", options: ["Sparrow", "Swan", "Crow", "Seagull"], answer: 1 },
  { q: "The 50th wedding anniversary is the…", options: ["Silver", "Ruby", "Golden", "Diamond"], answer: 2 },
];

export const COUPLE_TRIVIA: string[] = [
  "What was your partner's first impression of you?",
  "What is your partner's dream travel destination?",
  "What food could your partner eat every single day?",
  "What song reminds your partner of you?",
  "What is your partner's biggest fear?",
  "What was your partner's favorite subject in school?",
  "What's your partner's go-to comfort movie?",
  "If your partner won the lottery, what would they buy first?",
  "What is your partner's hidden talent?",
  "What does your partner do when nobody is watching?",
  "What's your partner's coffee or tea order?",
  "Which superpower would your partner choose?",
  "What's the first thing your partner does in the morning?",
  "What childhood toy did your partner love most?",
  "What's your partner's most-used emoji?",
  "What would your partner's last meal be?",
];

export const THIS_OR_THAT: [string, string][] = [
  ["Beach vacation 🏖️", "Mountain cabin 🏔️"], ["Movie night in 🍿", "Fancy dinner out 🥂"],
  ["Sunrise 🌅", "Sunset 🌇"], ["Coffee ☕", "Tea 🍵"], ["Dogs 🐶", "Cats 🐱"],
  ["Sweet 🍰", "Savory 🍟"], ["Early bird 🐦", "Night owl 🦉"], ["Texting 💬", "Calling 📞"],
  ["Summer ☀️", "Winter ❄️"], ["Book 📖", "Podcast 🎧"], ["City lights 🌃", "Starry sky ✨"],
  ["Cook together 🍳", "Order in 🛵"], ["Road trip 🚗", "Flight ✈️"], ["Dance 💃", "Karaoke 🎤"],
  ["Big party 🎉", "Cozy night 🕯️"], ["Save 💰", "Splurge 🛍️"],
];

export const TRUTH_OR_DARE = {
  truths: [
    "What was the exact moment you knew you liked me?",
    "What's one thing you've never told me?",
    "What's your favorite memory of us?",
    "What did you think after our first kiss?",
    "What's one thing I do that secretly melts you?",
    "If we could relive one day together, which one?",
    "What's the most embarrassing thing you've done to impress me?",
    "What's one habit of mine you find adorable?",
    "Where do you see us in ten years?",
    "What's a dream about us you've never shared?",
  ],
  dares: [
    "Send me your favorite photo of us right now.",
    "Do your best impression of me.",
    "Slow dance with me for one minute — no music.",
    "Write a two-line poem about us on the spot.",
    "Give me a 30-second shoulder massage.",
    "Text me three things you love about me.",
    "Serenade me with any song for 20 seconds.",
    "Let me post anything on your story.",
    "Recreate our first date pose for a selfie.",
    "Whisper the cheesiest pickup line you know.",
  ],
};

export const NEVER_HAVE_I_EVER: string[] = [
  "Never have I ever pretended to like a gift from you.",
  "Never have I ever stalked your old photos for an hour.",
  "Never have I ever fallen asleep on a video call with you.",
  "Never have I ever eaten your snacks and blamed someone else.",
  "Never have I ever practiced saying 'I love you' in the mirror.",
  "Never have I ever gotten jealous over something silly.",
  "Never have I ever re-read our old chats when I missed you.",
  "Never have I ever forgotten an important date.",
  "Never have I ever cried during a romantic movie.",
  "Never have I ever daydreamed about our wedding.",
  "Never have I ever let you win a game on purpose.",
  "Never have I ever screenshotted your messages to show a friend.",
];

export const SPIN_PROMPTS: string[] = [
  "Give a compliment 💐", "Reveal a secret 🤫", "Kiss on the cheek 😘",
  "Share a memory 📸", "Do a silly dance 💃", "Say 'I love you' in 3 ways ❤️",
  "Plan the next date 🌹", "Give a hug 🤗", "Sing a love song line 🎶", "Truth question 🎯",
];

export const EMOJI_PUZZLES: { emojis: string; answer: string; hint: string }[] = [
  { emojis: "👫❤️🏝️", answer: "honeymoon", hint: "Post-wedding trip" },
  { emojis: "💌📬", answer: "love letter", hint: "Sealed with a kiss" },
  { emojis: "💍🤵👰", answer: "wedding", hint: "The big day" },
  { emojis: "🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹", answer: "dozen roses", hint: "Classic bouquet" },
  { emojis: "🍫📦❤️", answer: "box of chocolates", hint: "Life is like a…" },
  { emojis: "👀⚡❤️", answer: "love at first sight", hint: "Instant spark" },
  { emojis: "🐦🐦❤️", answer: "lovebirds", hint: "What people call you two" },
  { emojis: "🌙🚶🚶", answer: "moonlight walk", hint: "Romantic stroll" },
  { emojis: "💔🩹", answer: "heartbreak", hint: "Ouch" },
  { emojis: "😘✈️", answer: "flying kiss", hint: "Sent from afar" },
  { emojis: "🕯️🍽️🎻", answer: "candlelight dinner", hint: "Table for two" },
  { emojis: "☔❤️2️⃣", answer: "umbrella for two", hint: "Sharing in the rain" },
];

export const HANGMAN_WORDS: string[] = [
  "cuddle", "sweetheart", "butterflies", "forever", "soulmate", "romance",
  "darling", "adore", "smitten", "valentine", "moonlight", "heartbeat",
  "sunshine", "treasure", "beloved", "serenade", "devotion", "embrace",
];

export const WORD_SEARCH_WORDS: string[] = [
  "LOVE", "KISS", "HUG", "DATE", "RING", "ROSE", "HEART", "CUTE", "DEAR", "SOUL",
];

export const BINGO_ITEMS: string[] = [
  "Held hands today", "Said 'I love you'", "Shared a meal", "Long hug (10s+)",
  "Made them laugh", "Sent a selfie", "Complimented them", "Forehead kiss",
  "Planned a date", "Danced together", "Cooked together", "Watched a show",
  "Morning text", "Goodnight call", "Shared a song", "Little surprise",
  "Deep talk", "Walked together", "Took a photo", "Said thank you",
  "Inside joke", "Future plans talk", "Made their drink", "Slow dance", "Love note",
];

export const DAILY_CHALLENGES: string[] = [
  "Send your partner a voice note singing any song 🎤",
  "Share your favorite photo of the two of you 📸",
  "Write three things you're grateful for about them 🙏",
  "Plan a surprise 15-minute date for tonight 🌹",
  "Recreate your very first text conversation 💬",
  "Give your partner a genuine compliment about their character 💐",
  "Cook or order their favorite comfort food 🍜",
  "Slow dance to one full song together 💃",
  "Write a haiku about your partner ✍️",
  "Do one chore your partner usually does 🧺",
  "Share a childhood story they've never heard 🧸",
  "Take a walk together and leave phones at home 🚶‍♀️🚶",
  "Draw a portrait of each other in 60 seconds 🎨",
  "Exchange a 20-second hug right now 🤗",
];
