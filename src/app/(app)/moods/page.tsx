"use client";

import { useState } from "react";
import { MoodBarChart } from "@/components/charts/MoodBarChart";
import { MoodStrip } from "@/components/charts/MoodStrip";
import { MoodWidget } from "@/components/dashboard/MoodWidget";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { where } from "@/lib/firebase/db";
import type { MoodEntry } from "@/lib/types";
import { cn, toISODate } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";

const RANGES = [
  { label: "2 weeks", days: 14 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

export default function MoodsPage() {
  const { user } = useAuth();
  const { couple, partnerUid, partnerName, myName } = useCouple();
  const [range, setRange] = useState(RANGES[1]);

  const since = (() => {
    const d = new Date();
    d.setDate(d.getDate() - range.days);
    return toISODate(d);
  })();

  const { items, loading } = useCoupleCollection<MoodEntry>(
    "moods",
    () => [where("date", ">=", since)],
    [since],
  );

  const mine = items.filter((e) => e.uid === user?.uid);
  const theirs = items.filter((e) => e.uid === partnerUid);

  return (
    <div className="space-y-4">
      <PageHeader emoji="🌈" title="Mood Tracker" subtitle="How you've both been feeling." />

      <MoodWidget />

      {/* Range filter — one row above the charts */}
      <div className="flex gap-2" role="tablist" aria-label="Time range">
        {RANGES.map((r) => (
          <button
            key={r.days}
            role="tab"
            aria-selected={range.days === r.days}
            onClick={() => setRange(r)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              range.days === r.days ? "gradient-btn text-white" : "glass text-ink-soft",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <CardSkeleton rows={5} />
      ) : (
        <>
          <GlassCard>
            <h2 className="mb-3 text-sm font-bold">Mood calendar — last 14 days</h2>
            <MoodStrip
              entries={items}
              uids={[user?.uid ?? "", partnerUid]}
              names={{
                [user?.uid ?? ""]: "You",
                ...(partnerUid ? { [partnerUid]: couple?.memberNames[partnerUid] ?? partnerName } : {}),
              }}
            />
          </GlassCard>

          <div className="grid gap-4 md:grid-cols-2">
            <GlassCard>
              <MoodBarChart entries={mine} title={`${myName} — ${range.label}`} />
            </GlassCard>
            <GlassCard>
              <MoodBarChart entries={theirs} title={`${partnerName} — ${range.label}`} />
            </GlassCard>
          </div>

          {/* Compatibility read-out */}
          <GlassCard className="text-center">
            {(() => {
              const byDate = new Map<string, MoodEntry[]>();
              for (const e of items) {
                byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
              }
              let both = 0, matched = 0;
              for (const [, entries] of byDate) {
                if (entries.length >= 2) {
                  both++;
                  if (entries[0].mood === entries[1].mood) matched++;
                }
              }
              return (
                <>
                  <p className="text-sm font-bold">Mood sync 💞</p>
                  <p className="mt-1 text-3xl font-bold gradient-text tabular-nums">
                    {both ? Math.round((matched / both) * 100) : 0}%
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    On {matched} of {both} shared check-in days you felt the same way.
                  </p>
                </>
              );
            })()}
          </GlassCard>
        </>
      )}
    </div>
  );
}
