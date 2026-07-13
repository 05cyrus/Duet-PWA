/** Static content: daily quotes, mood metadata, habit presets, nav registry. */

export const DAILY_QUOTES = [
  { text: "In all the world, there is no heart for me like yours.", author: "Maya Angelou" },
  { text: "Whatever our souls are made of, his and mine are the same.", author: "Emily Brontë" },
  { text: "I love you not only for what you are, but for what I am when I am with you.", author: "Roy Croft" },
  { text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
  { text: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle" },
  { text: "You are my today and all of my tomorrows.", author: "Leo Christopher" },
  { text: "I have found the one whom my soul loves.", author: "Song of Solomon" },
  { text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott" },
  { text: "Grow old along with me; the best is yet to be.", author: "Robert Browning" },
  { text: "If I know what love is, it is because of you.", author: "Hermann Hesse" },
  { text: "Love recognizes no barriers.", author: "Maya Angelou" },
  { text: "We loved with a love that was more than love.", author: "Edgar Allan Poe" },
  { text: "You know you're in love when you can't fall asleep because reality is finally better than your dreams.", author: "Dr. Seuss" },
  { text: "There is always some madness in love. But there is also always some reason in madness.", author: "Friedrich Nietzsche" },
  { text: "A successful marriage requires falling in love many times, always with the same person.", author: "Mignon McLaughlin" },
  { text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", author: "Lao Tzu" },
  { text: "The giving of love is an education in itself.", author: "Eleanor Roosevelt" },
  { text: "Where there is love there is life.", author: "Mahatma Gandhi" },
  { text: "Love does not consist of gazing at each other, but in looking outward together in the same direction.", author: "Antoine de Saint-Exupéry" },
  { text: "At the touch of love everyone becomes a poet.", author: "Plato" },
  { text: "Two hearts, one home.", author: "Duet" },
  { text: "Every love story is beautiful, but ours is my favorite.", author: "Unknown" },
  { text: "Together is a wonderful place to be.", author: "Unknown" },
  { text: "You're my favorite notification.", author: "Duet" },
  { text: "Home is wherever I'm with you.", author: "Edward Sharpe" },
  { text: "I'd rather share one lifetime with you than face all the ages of this world alone.", author: "J.R.R. Tolkien" },
  { text: "You are the finest, loveliest, tenderest, and most beautiful person I have ever known.", author: "F. Scott Fitzgerald" },
  { text: "Love is friendship that has caught fire.", author: "Ann Landers" },
  { text: "P.S. I love you.", author: "Cecelia Ahern" },
  { text: "Take my hand, take my whole life too.", author: "Elvis Presley" },
  { text: "All that you are is all that I'll ever need.", author: "Ed Sheeran" },
];

/**
 * Mood metadata. `chart` colors are validated (six-checks palette validator)
 * against the light (#fff7f9) and dark (#171122) app surfaces; every chart
 * mark additionally carries an emoji + text label so identity is never
 * color-alone.
 */
export const MOOD_META: Record<
  string,
  { emoji: string; label: string; chart: { light: string; dark: string } }
> = {
  happy:    { emoji: "😊", label: "Happy",    chart: { light: "#b45309", dark: "#d97706" } },
  sad:      { emoji: "😢", label: "Sad",      chart: { light: "#2563eb", dark: "#3b82f6" } },
  excited:  { emoji: "🤩", label: "Excited",  chart: { light: "#c2410c", dark: "#ea580c" } },
  romantic: { emoji: "😍", label: "Romantic", chart: { light: "#e11d5b", dark: "#db2777" } },
  angry:    { emoji: "😠", label: "Angry",    chart: { light: "#991b1b", dark: "#dc2626" } },
  sleepy:   { emoji: "😴", label: "Sleepy",   chart: { light: "#7c3aed", dark: "#8b5cf6" } },
  busy:     { emoji: "💼", label: "Busy",     chart: { light: "#0d9488", dark: "#0d9488" } },
};

export const HABIT_PRESETS = [
  { name: "Date Night", emoji: "🌹" },
  { name: "Workout Together", emoji: "💪" },
  { name: "Movie Night", emoji: "🎬" },
  { name: "Read Together", emoji: "📚" },
  { name: "Meditate", emoji: "🧘" },
  { name: "Cook Together", emoji: "🍳" },
  { name: "Plan a Trip", emoji: "✈️" },
  { name: "Morning Walk", emoji: "🚶" },
  { name: "Gratitude Note", emoji: "🙏" },
];

export const BUCKET_CATEGORIES: Record<string, { label: string; emoji: string }> = {
  travel:       { label: "Travel",        emoji: "🌍" },
  restaurants:  { label: "Restaurants",   emoji: "🍽️" },
  movies:       { label: "Movies",        emoji: "🎬" },
  "dream-house":{ label: "Dream House",   emoji: "🏡" },
  savings:      { label: "Savings Goals", emoji: "💰" },
  other:        { label: "Other",         emoji: "✨" },
};

export const MEMORY_KIND_META: Record<string, { label: string; emoji: string }> = {
  "first-meet":  { label: "First Meet",     emoji: "👀" },
  "first-date":  { label: "First Date",     emoji: "🌹" },
  trip:          { label: "Trip",           emoji: "✈️" },
  anniversary:   { label: "Anniversary",    emoji: "💍" },
  special:       { label: "Special Moment", emoji: "✨" },
};

export const EVENT_KIND_META: Record<string, { label: string; emoji: string; color: string }> = {
  birthday:    { label: "Birthday",   emoji: "🎂", color: "#fb923c" },
  anniversary: { label: "Anniversary",emoji: "💍", color: "#f43f6e" },
  trip:        { label: "Trip",       emoji: "✈️", color: "#38bdf8" },
  reminder:    { label: "Reminder",   emoji: "⏰", color: "#a688fa" },
  date:        { label: "Date Plan",  emoji: "🌹", color: "#f472b6" },
  other:       { label: "Other",      emoji: "📌", color: "#94a3b8" },
};

export const QUICK_NOTE_COLORS = ["#ffe4ea", "#ece8ff", "#ffedd5", "#dcfce7", "#e0f2fe"];

export const REACTION_EMOJIS = ["❤️", "😂", "😍", "😮", "😢", "🔥", "👍", "🥰"];

export const CHAT_EMOJIS = [
  "❤️","🥰","😍","😘","💕","💖","💘","💝","😊","😂","🤣","😉","😜","🤗","😇","🥺",
  "😢","😭","😠","😴","🤤","🙈","🙊","💋","🌹","🌸","🌺","🌻","🍕","🍰","☕","🍷",
  "🎉","🎁","✨","⭐","🔥","💯","👍","👏","🙌","💪","🤝","🙏","🐻","🐱","🐶","🦋",
];
