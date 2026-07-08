"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useGameScore } from "@/hooks/useGameScore";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { GEOMETRY_GAME } from "@/lib/games/registry";
import { cn } from "@/lib/utils";
import {
  buildTrack, DIFFICULTIES, GRAVITY, GROUND_H, JUMP_V, LEVELS, MAX_FALL,
  overlaps, PLAYER, SKINS, TILE,
  type Difficulty, type LevelDef, type PlayerState, type WorldTile,
} from "./engine";
import { ChipMusic } from "./music";

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string; size: number;
}

interface SaveData {
  bank: number;                              // lifetime coins (skin currency)
  unlocked: string[];
  skin: string;
  best: Record<string, number>;              // `${level}-${difficulty}` -> score
  levelsBeaten: number[];
}

const DEFAULT_SAVE: SaveData = {
  bank: 0, unlocked: ["blush", "lilac"], skin: "blush", best: {}, levelsBeaten: [],
};

type Phase = "menu" | "playing" | "complete";

export function GeometryTrack() {
  const { submitScore, unlockAchievement } = useGameScore(GEOMETRY_GAME);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [save, setSave] = useLocalStorage<SaveData>("duet-geometry", DEFAULT_SAVE);

  const [phase, setPhase] = useState<Phase>("menu");
  const [level, setLevel] = useState<LevelDef>(LEVELS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[0]);
  const [musicOn, setMusicOn] = useState(false);
  const [hud, setHud] = useState({ coins: 0, attempts: 1, progress: 0 });
  const [finalScore, setFinalScore] = useState(0);

  // Mutable game state lives in refs (no re-render per frame).
  const game = useRef({
    player: { x: 0, y: 0, vy: 0, grounded: true, rotation: 0, dead: false, finished: false } as PlayerState,
    tiles: [] as WorldTile[],
    collected: new Set<number>(),
    particles: [] as Particle[],
    checkpointX: 0,
    coins: 0,
    totalCoins: 0,
    attempts: 1,
    deadUntil: 0,
    trackLen: 0,
    running: false,
    jumpQueued: false,
  });
  const music = useRef<ChipMusic | null>(null);
  const raf = useRef(0);

  const getMusic = () => (music.current ??= new ChipMusic());

  /* --------------------------------- control -------------------------------- */

  const startRun = useCallback((lv: LevelDef, diff: Difficulty) => {
    const tiles = buildTrack(lv, diff.density);
    const g = game.current;
    g.tiles = tiles;
    g.collected = new Set();
    g.particles = [];
    g.checkpointX = 0;
    g.coins = 0;
    g.totalCoins = tiles.filter((t) => t.kind === "coin" || t.kind === "coinAir").length;
    g.attempts = 1;
    g.deadUntil = 0;
    g.trackLen = lv.lengthTiles * TILE;
    g.player = { x: 0, y: 0, vy: 0, grounded: true, rotation: 0, dead: false, finished: false };
    g.running = true;
    setHud({ coins: 0, attempts: 1, progress: 0 });
    setLevel(lv);
    setDifficulty(diff);
    setPhase("playing");
    if (musicOn) getMusic().start();
  }, [musicOn]);

  const jump = useCallback(() => {
    const g = game.current;
    if (!g.running || g.player.dead || g.player.finished) return;
    if (g.player.grounded) {
      g.player.vy = JUMP_V;
      g.player.grounded = false;
      getMusic().sfx("jump");
      // dust particles
      for (let i = 0; i < 6; i++) {
        g.particles.push({
          x: g.player.x, y: 0, vx: -80 - Math.random() * 120, vy: -60 * Math.random(),
          life: 0.4, color: "#ffffffaa", size: 3 + Math.random() * 3,
        });
      }
    } else {
      g.jumpQueued = true; // small buffer for landing
    }
  }, []);

  /* --------------------------------- inputs --------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  /* -------------------------------- game loop ------------------------------- */

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let last = performance.now();
    let hudTick = 0;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const skin = SKINS.find((s) => s.id === save.skin) ?? SKINS[0];

    const die = (g: typeof game.current, now: number) => {
      g.player.dead = true;
      g.deadUntil = now + 700;
      g.attempts += 1;
      getMusic().sfx("death");
      for (let i = 0; i < 26; i++) {
        const a = (Math.PI * 2 * i) / 26;
        g.particles.push({
          x: g.player.x + PLAYER / 2, y: g.player.y + PLAYER / 2,
          vx: Math.cos(a) * (150 + Math.random() * 250),
          vy: Math.sin(a) * (150 + Math.random() * 250) - 100,
          life: 0.8, color: i % 2 ? skin.colors[0] : skin.colors[1], size: 4 + Math.random() * 4,
        });
      }
    };

    const finish = (g: typeof game.current) => {
      g.player.finished = true;
      g.running = false;
      getMusic().sfx("win");
      getMusic().stop();

      const completionBonus = 100;
      const score = Math.round((g.coins * 10 + completionBonus) * difficulty.scoreMult);
      setFinalScore(score);

      const key = `${level.id}-${difficulty.id}`;
      setSave((s) => ({
        ...s,
        bank: s.bank + g.coins,
        best: { ...s.best, [key]: Math.max(s.best[key] ?? 0, score) },
        levelsBeaten: s.levelsBeaten.includes(level.id) ? s.levelsBeaten : [...s.levelsBeaten, level.id],
      }));
      submitScore(score, { level: level.name, difficulty: difficulty.id, coins: g.coins, attempts: g.attempts });
      unlockAchievement(`level-${level.id}-${difficulty.id}`, `${level.name} · ${difficulty.label}`, "🚀", 20);
      if (g.coins === g.totalCoins && g.totalCoins > 0) {
        unlockAchievement(`allcoins-${level.id}`, "Coin Magnet", "🪙", 30);
      }
      setTimeout(() => setPhase("complete"), 600);
    };

    const step = (now: number) => {
      const g = game.current;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      const groundY = H - GROUND_H;
      const playerScreenX = Math.min(140, W * 0.22);

      /* physics */
      if (g.running && !g.player.dead) {
        g.player.x += difficulty.speed * dt;
        g.player.vy = Math.min(MAX_FALL, g.player.vy + GRAVITY * dt);
        g.player.y += g.player.vy * dt;

        // ground collision (y is offset above ground: 0 = on ground)
        const py = groundY - PLAYER + g.player.y; // may go negative visually
        void py;
        if (g.player.y >= 0) {
          g.player.y = 0;
          g.player.vy = 0;
          if (!g.player.grounded && g.jumpQueued) {
            g.jumpQueued = false;
            g.player.grounded = true;
            jump();
          } else {
            g.player.grounded = true;
          }
          g.player.rotation = Math.round(g.player.rotation / (Math.PI / 2)) * (Math.PI / 2);
        } else {
          g.player.grounded = false;
          g.player.rotation += 4.4 * dt;
        }

        // tile interactions
        const px = g.player.x;
        const pTop = groundY - PLAYER + g.player.y;
        for (let ti = 0; ti < g.tiles.length; ti++) {
          const tile = g.tiles[ti];
          if (tile.x < px - TILE * 2 || tile.x > px + TILE * 3) continue;

          if (tile.kind === "spike") {
            // Forgiving spike hitbox (inner triangle)
            if (overlaps(px + 6, pTop + 8, PLAYER - 12, PLAYER - 8, tile.x + 10, groundY - TILE + 14, TILE - 20, TILE - 14)) {
              die(g, now);
              break;
            }
          } else if (tile.kind === "block" || tile.kind === "block2") {
            const bh = tile.kind === "block" ? TILE : TILE * 2;
            const bx = tile.x, by = groundY - bh;
            if (overlaps(px, pTop, PLAYER, PLAYER, bx, by, TILE, bh)) {
              const prevBottom = pTop + PLAYER - g.player.vy * dt;
              if (g.player.vy >= 0 && prevBottom <= by + 14) {
                // land on top
                g.player.y = -(bh);
                g.player.vy = 0;
                if (g.jumpQueued) { g.jumpQueued = false; g.player.grounded = true; jump(); }
                else g.player.grounded = true;
                g.player.rotation = Math.round(g.player.rotation / (Math.PI / 2)) * (Math.PI / 2);
              } else {
                die(g, now);
                break;
              }
            }
            // walked off a block? re-enable falling
            if (g.player.grounded && g.player.y < 0) {
              const onAnyBlock = g.tiles.some((t2) =>
                (t2.kind === "block" || t2.kind === "block2") &&
                px + PLAYER > t2.x && px < t2.x + TILE &&
                Math.abs(-(t2.kind === "block" ? TILE : TILE * 2) - g.player.y) < 2,
              );
              if (!onAnyBlock) g.player.grounded = false;
            }
          } else if ((tile.kind === "coin" || tile.kind === "coinAir") && !g.collected.has(ti)) {
            const cy = tile.kind === "coin" ? groundY - TILE * 0.6 : groundY - TILE * 1.9;
            if (overlaps(px, pTop, PLAYER, PLAYER, tile.x + 8, cy, TILE - 16, TILE - 16)) {
              g.collected.add(ti);
              g.coins += 1;
              getMusic().sfx("coin");
              for (let i = 0; i < 8; i++) {
                g.particles.push({
                  x: tile.x + TILE / 2, y: cy + 10, vx: (Math.random() - 0.5) * 260,
                  vy: -Math.random() * 220, life: 0.5, color: "#f59e0b", size: 3,
                });
              }
            }
          } else if (tile.kind === "checkpoint" && px > tile.x && g.checkpointX < tile.x) {
            g.checkpointX = tile.x;
            getMusic().sfx("checkpoint");
          } else if (tile.kind === "finish" && px + PLAYER > tile.x) {
            finish(g);
            break;
          }
        }
      }

      /* respawn */
      if (g.player.dead && now >= g.deadUntil && g.running) {
        g.player = {
          x: Math.max(0, g.checkpointX - TILE * 2), y: 0, vy: 0,
          grounded: true, rotation: 0, dead: false, finished: false,
        };
        g.jumpQueued = false;
      }

      /* particles */
      for (const p of g.particles) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt;
      }
      g.particles = g.particles.filter((p) => p.life > 0);

      /* ------------------------------- render ------------------------------- */
      const camX = g.player.x - playerScreenX;

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, level.palette.sky[0]);
      sky.addColorStop(1, level.palette.sky[1]);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // parallax hearts
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.font = "28px serif";
      for (let i = 0; i < 12; i++) {
        const hx = ((i * 260 - camX * 0.35) % (W + 300) + W + 300) % (W + 300) - 150;
        ctx.fillText("💕", hx, 60 + ((i * 97) % Math.max(1, (H - 200))));
      }
      ctx.restore();

      // ground
      ctx.fillStyle = level.palette.ground;
      ctx.fillRect(0, groundY, W, GROUND_H);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(0, groundY, W, 4);
      // ground stripes
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let sx = -((camX * 0.9) % 80); sx < W; sx += 80) {
        ctx.fillRect(sx, groundY + 10, 40, GROUND_H - 20);
      }

      // tiles
      for (let ti = 0; ti < g.tiles.length; ti++) {
        const tile = g.tiles[ti];
        const sx = tile.x - camX;
        if (sx < -TILE * 2 || sx > W + TILE) continue;
        if (tile.kind === "spike") {
          ctx.fillStyle = level.palette.accent;
          ctx.beginPath();
          ctx.moveTo(sx + 2, groundY);
          ctx.lineTo(sx + TILE / 2, groundY - TILE + 6);
          ctx.lineTo(sx + TILE - 2, groundY);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.beginPath();
          ctx.moveTo(sx + TILE / 2, groundY - TILE + 6);
          ctx.lineTo(sx + TILE / 2 + 8, groundY - TILE / 2);
          ctx.lineTo(sx + TILE / 2 - 8, groundY - TILE / 2);
          ctx.closePath();
          ctx.fill();
        } else if (tile.kind === "block" || tile.kind === "block2") {
          const bh = tile.kind === "block" ? TILE : TILE * 2;
          const grad = ctx.createLinearGradient(sx, groundY - bh, sx, groundY);
          grad.addColorStop(0, "#ffffff55");
          grad.addColorStop(0.12, level.palette.accent);
          grad.addColorStop(1, level.palette.ground);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(sx, groundY - bh, TILE, bh, 8);
          ctx.fill();
        } else if ((tile.kind === "coin" || tile.kind === "coinAir") && !g.collected.has(ti)) {
          const cy = tile.kind === "coin" ? groundY - TILE * 0.6 : groundY - TILE * 1.9;
          const bob = Math.sin(now / 260 + tile.x) * 4;
          ctx.font = "24px serif";
          ctx.textAlign = "center";
          ctx.fillText("🪙", sx + TILE / 2, cy + 22 + bob);
        } else if (tile.kind === "checkpoint") {
          ctx.font = "26px serif";
          ctx.textAlign = "center";
          ctx.fillText(g.checkpointX >= tile.x ? "💖" : "🤍", sx + TILE / 2, groundY - TILE - 6);
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(sx + TILE / 2, groundY);
          ctx.lineTo(sx + TILE / 2, groundY - TILE - 4);
          ctx.stroke();
        } else if (tile.kind === "finish") {
          ctx.font = "34px serif";
          ctx.textAlign = "center";
          ctx.fillText("🏁", sx + TILE / 2, groundY - TILE);
        }
      }

      // player
      if (!g.player.dead) {
        const px = playerScreenX;
        const py = groundY - PLAYER + g.player.y;
        ctx.save();
        ctx.translate(px + PLAYER / 2, py + PLAYER / 2);
        ctx.rotate(g.player.rotation);
        const pg = ctx.createLinearGradient(-PLAYER / 2, -PLAYER / 2, PLAYER / 2, PLAYER / 2);
        pg.addColorStop(0, skin.colors[0]);
        pg.addColorStop(1, skin.colors[1]);
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.roundRect(-PLAYER / 2, -PLAYER / 2, PLAYER, PLAYER, 8);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.rotate(-g.player.rotation);
        ctx.font = "16px serif";
        ctx.textAlign = "center";
        ctx.fillText(skin.face, 0, 6);
        ctx.restore();

        // motion trail
        if (!g.player.grounded) {
          ctx.fillStyle = `${skin.colors[0]}44`;
          ctx.beginPath();
          ctx.roundRect(px - 14, py + 6, 10, PLAYER - 12, 4);
          ctx.fill();
        }
      }

      // particles
      for (const p of g.particles) {
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - camX - p.size / 2, groundY - PLAYER + p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      /* HUD sync ~8x/sec */
      hudTick += dt;
      if (hudTick > 0.12) {
        hudTick = 0;
        setHud({
          coins: g.coins,
          attempts: g.attempts,
          progress: Math.min(1, g.player.x / g.trackLen),
        });
      }

      if (phase === "playing") raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, level, difficulty, save.skin]);

  // Stop music on unmount / when leaving play.
  useEffect(() => () => { music.current?.stop(); }, []);
  useEffect(() => {
    if (phase !== "playing") music.current?.stop();
  }, [phase]);

  const toggleMusic = () => {
    setMusicOn((on) => {
      if (on) getMusic().stop();
      else if (phase === "playing") getMusic().start();
      return !on;
    });
  };

  const buySkin = (id: string) => {
    const skin = SKINS.find((s) => s.id === id)!;
    if (save.unlocked.includes(id)) {
      setSave((s) => ({ ...s, skin: id }));
    } else if (save.bank >= skin.cost) {
      setSave((s) => ({ ...s, bank: s.bank - skin.cost, unlocked: [...s.unlocked, id], skin: id }));
    }
  };

  /* ---------------------------------- UI ----------------------------------- */

  return (
    <div className="mx-auto max-w-4xl">
      {phase === "menu" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass space-y-5 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Choose your track 🚀</h2>
              <p className="text-sm text-ink-soft">Tap / click / space to jump. Don&apos;t kiss the spikes.</p>
            </div>
            <span className="rounded-full bg-peach-100 px-3 py-1.5 text-sm font-bold text-peach-400 dark:bg-peach-400/15">
              🪙 {save.bank}
            </span>
          </div>

          {/* Levels */}
          <div className="grid gap-3 sm:grid-cols-3">
            {LEVELS.map((lv) => (
              <button
                key={lv.id}
                onClick={() => setLevel(lv)}
                aria-pressed={level.id === lv.id}
                className={cn(
                  "rounded-3xl border-2 p-4 text-left transition-all",
                  level.id === lv.id ? "border-blush-400 bg-blush-50 dark:bg-blush-500/10" : "border-transparent bg-white/50 dark:bg-white/5",
                )}
              >
                <p className="text-2xl" aria-hidden>{["🌹", "✈️", "🏝️"][lv.id - 1]}</p>
                <p className="mt-1 text-sm font-bold">
                  {lv.id}. {lv.name} {save.levelsBeaten.includes(lv.id) && "✅"}
                </p>
                <p className="text-xs text-ink-soft">{lv.lengthTiles} tiles</p>
              </button>
            ))}
          </div>

          {/* Difficulty */}
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d)}
                aria-pressed={difficulty.id === d.id}
                className={cn(
                  "flex-1 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors",
                  difficulty.id === d.id ? "gradient-btn text-white" : "bg-white/50 text-ink-soft dark:bg-white/5",
                )}
              >
                {d.emoji} {d.label} <span className="opacity-70">×{d.scoreMult}</span>
              </button>
            ))}
          </div>

          {/* Skins */}
          <div>
            <p className="mb-2 text-xs font-bold text-ink-soft">Skins</p>
            <div className="flex flex-wrap gap-2">
              {SKINS.map((s) => {
                const owned = save.unlocked.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => buySkin(s.id)}
                    title={owned ? s.name : `${s.name} — 🪙 ${s.cost}`}
                    aria-pressed={save.skin === s.id}
                    className={cn(
                      "relative grid size-14 place-items-center rounded-2xl text-xl transition-transform hover:scale-105",
                      save.skin === s.id && "ring-2 ring-blush-500 ring-offset-2 ring-offset-transparent",
                      !owned && save.bank < s.cost && "opacity-50",
                    )}
                    style={{ background: `linear-gradient(135deg, ${s.colors[0]}, ${s.colors[1]})` }}
                  >
                    {s.face}
                    {!owned && (
                      <span className="absolute -bottom-1.5 rounded-full bg-white px-1.5 text-[9px] font-bold text-ink shadow dark:bg-[#2a1e3a] dark:text-white">
                        🪙{s.cost}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Best + music */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-ink-soft">
              Best on {level.name} ({difficulty.label}):{" "}
              <b className="text-blush-500">{save.best[`${level.id}-${difficulty.id}`] ?? "—"}</b>
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleMusic} aria-pressed={musicOn}>
                {musicOn ? "🔊 Music on" : "🔇 Music off"}
              </Button>
              <Button size="lg" onClick={() => startRun(level, difficulty)}>Start run 🚀</Button>
            </div>
          </div>
        </motion.div>
      )}

      {phase !== "menu" && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="h-[62dvh] w-full touch-none select-none rounded-3xl shadow-xl"
            onPointerDown={jump}
            role="application"
            aria-label="Geometry Track game. Tap or press space to jump."
          />
          {/* HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 p-3">
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              🪙 {hud.coins}
            </span>
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              Attempt {hud.attempts}
            </span>
            <div className="ml-auto mr-1 h-2 w-32 overflow-hidden rounded-full bg-black/25 sm:w-48" role="progressbar"
              aria-valuenow={Math.round(hud.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Track progress">
              <div className="h-full rounded-full bg-white/90 transition-[width]" style={{ width: `${hud.progress * 100}%` }} />
            </div>
            <button
              onClick={toggleMusic}
              className="pointer-events-auto rounded-full bg-black/30 px-2.5 py-1 text-xs text-white backdrop-blur"
              aria-label="Toggle music"
            >
              {musicOn ? "🔊" : "🔇"}
            </button>
            <button
              onClick={() => { game.current.running = false; setPhase("menu"); }}
              className="pointer-events-auto rounded-full bg-black/30 px-2.5 py-1 text-xs text-white backdrop-blur"
              aria-label="Exit to menu"
            >
              ✕
            </button>
          </div>

          {phase === "complete" && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 grid place-items-center rounded-3xl bg-black/50 backdrop-blur-sm"
            >
              <div className="glass w-72 rounded-3xl p-6 text-center">
                <p className="text-4xl" aria-hidden>🏆</p>
                <h3 className="mt-2 text-lg font-bold">Track complete!</h3>
                <p className="mt-1 text-3xl font-bold gradient-text tabular-nums">{finalScore}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {hud.coins} coins · {hud.attempts} attempt{hud.attempts === 1 ? "" : "s"} · {difficulty.label}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setPhase("menu")}>Menu</Button>
                  <Button onClick={() => startRun(level, difficulty)}>Again 🔁</Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
