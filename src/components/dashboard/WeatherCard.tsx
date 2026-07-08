"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

interface Weather {
  temp: number;
  code: number;
  city?: string;
  at: number;
}

/** Map WMO weather codes to emoji + label. */
function describe(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "Clear sky" };
  if (code <= 2) return { emoji: "🌤️", label: "Partly cloudy" };
  if (code === 3) return { emoji: "☁️", label: "Overcast" };
  if (code <= 48) return { emoji: "🌫️", label: "Foggy" };
  if (code <= 57) return { emoji: "🌦️", label: "Drizzle" };
  if (code <= 67) return { emoji: "🌧️", label: "Rainy" };
  if (code <= 77) return { emoji: "🌨️", label: "Snowy" };
  if (code <= 82) return { emoji: "🌧️", label: "Showers" };
  if (code <= 86) return { emoji: "❄️", label: "Snow showers" };
  return { emoji: "⛈️", label: "Stormy" };
}

/** Local weather via open-meteo (no API key). Cached for 30 minutes. */
export function WeatherCard() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "denied" | "ready" | "error">("idle");

  const load = () => {
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude.toFixed(3)}&longitude=${coords.longitude.toFixed(3)}&current=temperature_2m,weather_code`,
          );
          const json = await res.json();
          const w: Weather = {
            temp: Math.round(json.current.temperature_2m),
            code: json.current.weather_code,
            at: Date.now(),
          };
          localStorage.setItem("duet-weather", JSON.stringify(w));
          setWeather(w);
          setState("ready");
        } catch {
          setState("error");
        }
      },
      () => setState("denied"),
      { maximumAge: 600_000, timeout: 8000 },
    );
  };

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("duet-weather") ?? "null") as Weather | null;
      if (cached && Date.now() - cached.at < 30 * 60_000) {
        setWeather(cached);
        setState("ready");
        return;
      }
    } catch { /* ignore */ }
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((p) => {
        if (p.state === "granted") load();
      }).catch(() => {});
    }
  }, []);

  const desc = weather ? describe(weather.code) : null;

  return (
    <GlassCard className="flex items-center justify-between">
      {state === "ready" && weather && desc ? (
        <>
          <div>
            <p className="text-sm font-bold">Date-night weather</p>
            <p className="text-xs text-ink-soft">{desc.label}</p>
          </div>
          <p className="flex items-center gap-2 text-3xl font-bold">
            <span aria-hidden>{desc.emoji}</span>
            <span className="tabular-nums">{weather.temp}°</span>
          </p>
        </>
      ) : (
        <>
          <div>
            <p className="text-sm font-bold">Weather 🌤️</p>
            <p className="text-xs text-ink-soft">
              {state === "denied" ? "Location permission needed." :
               state === "error" ? "Couldn't fetch — try again." :
               "See if tonight is picnic-worthy."}
            </p>
          </div>
          <Button size="sm" variant="soft" loading={state === "loading"} onClick={load}>
            {state === "denied" ? "Retry" : "Enable"}
          </Button>
        </>
      )}
    </GlassCard>
  );
}
