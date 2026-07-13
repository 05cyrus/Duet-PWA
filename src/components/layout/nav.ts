export interface NavItem {
  href: string;
  label: string;
  emoji: string;
}

/** Primary items surface in the mobile bottom bar. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", emoji: "🏠" },
  { href: "/chat", label: "Chat", emoji: "💬" },
  { href: "/games", label: "Games", emoji: "🎮" },
  { href: "/timeline", label: "Timeline", emoji: "📖" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/calendar", label: "Calendar", emoji: "📅" },
  { href: "/habits", label: "Habits", emoji: "✅" },
  { href: "/moods", label: "Moods", emoji: "🌈" },
  { href: "/bucket-list", label: "Bucket List", emoji: "🪣" },
  { href: "/letters", label: "Letters", emoji: "💌" },
  { href: "/assistant", label: "Assistant", emoji: "🤖" },
  { href: "/music", label: "Music", emoji: "🎵" },
  { href: "/location", label: "Location", emoji: "📍" },
  { href: "/leaderboard", label: "Leaderboard", emoji: "🏆" },
  { href: "/profile", label: "Profile", emoji: "🧸" },
  { href: "/settings", label: "Settings", emoji: "⚙️" },
];

export const ALL_NAV: NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV];
