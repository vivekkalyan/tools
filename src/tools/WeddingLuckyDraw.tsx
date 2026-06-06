import confetti from "canvas-confetti";
import { Maximize, Minimize } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ——— EDIT THESE LATER ———
// Placeholder list = football legends, 2006–2025 era (Chelsea + Liverpool).
// Swap for the real guest names closer to the day.
const GUESTS: string[] = [
  // Chelsea (for the groom)
  "John Terry",
  "Frank Lampard",
  "Didier Drogba",
  "Petr Čech",
  "Ashley Cole",
  "Michael Essien",
  "Eden Hazard",
  "N'Golo Kanté",
  "Cesc Fàbregas",
  "Branislav Ivanović",
  "Gianfranco Zola",
  "Thiago Silva",
  "Reece James",
  "Cole Palmer",
  "José Mourinho",
  // Liverpool (for the bride)
  "Steven Gerrard",
  "Fernando Torres",
  "Mohamed Salah",
  "Virgil van Dijk",
  "Sadio Mané",
  "Luis Suárez",
  "Jamie Carragher",
  "Xabi Alonso",
  "Trent Alexander-Arnold",
  "Alisson Becker",
  "Roberto Firmino",
  "Pepe Reina",
  "Dirk Kuyt",
  "Jürgen Klopp",
];

// Prize names — edit the text here; add/remove entries to change how many prizes.
const PRIZE_NAMES: string[] = ["First Prize", "Second Prize", "Third Prize"];

const COUNTDOWN_SECONDS = 20;
const RING_RADIUS = 66;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Spin tuning: more flashes / bigger tail constant = longer suspense.
const SPIN_FLASHES = 38;
const SPIN_BASE_MS = 45;
const SPIN_TAIL_MS = 620;

type Phase = "idle" | "spinning" | "locked" | "countdown" | "result";

const COLORS = {
  bg: "#f7f3ec",
  bg2: "#fdfbf6",
  ink: "#3a342b",
  muted: "#8a8170",
  gold: "#b08d4f",
  goldDeep: "#8a6d36",
  line: "#e3dac8",
  green: "#5c8a5c",
  red: "#b05a4f",
};

const CONFETTI_COLORS = ["#b08d4f", "#e9d7ad", "#8a6d36", "#ffffff", "#d8c79b"];

export default function WeddingLuckyDraw() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pool, setPool] = useState<string[]>(() => [...GUESTS]);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayName, setDisplayName] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [resultText, setResultText] = useState("");
  const [resultKind, setResultKind] = useState<"win" | "late" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const spinTimeout = useRef<number | null>(null);
  const countdownInterval = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireRef = useRef<confetti.CreateTypes | null>(null);

  // Bind canvas-confetti to our own canvas (inside rootRef) so it still renders
  // when the element is fullscreened — the default global canvas sits on body.
  useEffect(() => {
    if (!canvasRef.current) return;
    fireRef.current = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });
    return () => {
      fireRef.current?.reset();
      fireRef.current = null;
    };
  }, []);

  // Keep the fullscreen icon in sync even when the user exits via Esc.
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    return () => {
      if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
      if (countdownInterval.current) window.clearInterval(countdownInterval.current);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      rootRef.current?.requestFullscreen?.();
    }
  }, []);

  // Physics-based confetti via canvas-confetti — two angled fountains from the
  // bottom corners aimed inward, optionally sustained over a few seconds.
  const launchConfetti = useCallback((durationMs = 1200) => {
    const fire = fireRef.current;
    if (!fire) return;

    const shoot = () => {
      // left corner, aimed up-right
      fire({
        particleCount: 28,
        startVelocity: 55,
        spread: 55,
        angle: 60,
        origin: { x: 0, y: 1 },
        colors: CONFETTI_COLORS,
        gravity: 1.1,
        scalar: 1.05,
        ticks: 260,
      });
      // right corner, aimed up-left
      fire({
        particleCount: 28,
        startVelocity: 55,
        spread: 55,
        angle: 120,
        origin: { x: 1, y: 1 },
        colors: CONFETTI_COLORS,
        gravity: 1.1,
        scalar: 1.05,
        ticks: 260,
      });
    };

    shoot();
    const end = Date.now() + durationMs;
    const interval = window.setInterval(() => {
      if (Date.now() >= end) {
        window.clearInterval(interval);
        return;
      }
      shoot();
    }, 320);
  }, []);

  const startCountdown = useCallback(() => {
    setPhase("countdown");
    setTimeLeft(COUNTDOWN_SECONDS);
    if (countdownInterval.current) window.clearInterval(countdownInterval.current);
    countdownInterval.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (countdownInterval.current) window.clearInterval(countdownInterval.current);
          // time's up — handled by effect below
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const lockIn = useCallback(
    (chosen: string) => {
      setDisplayName(chosen);
      setWinner(chosen);
      setPhase("locked");
      launchConfetti(800); // quick pop as the name locks in
      window.setTimeout(startCountdown, 900);
    },
    [launchConfetti, startCountdown],
  );

  const draw = useCallback(() => {
    if (pool.length === 0) return;
    setResultText("");
    setResultKind(null);
    setPhase("spinning");

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    let step = 0;

    const nextDelay = (s: number) => {
      const t = s / SPIN_FLASHES;
      return SPIN_BASE_MS + t ** 3 * SPIN_TAIL_MS; // cubic ease-out
    };

    const tick = () => {
      if (step >= SPIN_FLASHES) {
        lockIn(chosen);
        return;
      }
      const showing = step === SPIN_FLASHES - 1 ? chosen : pool[Math.floor(Math.random() * pool.length)];
      setDisplayName(showing);
      step += 1;
      spinTimeout.current = window.setTimeout(tick, nextDelay(step));
    };
    tick();
  }, [pool, lockIn]);

  const removeWinnerFromPool = useCallback(() => {
    setPool((prev) => prev.filter((n) => n !== winner));
  }, [winner]);

  const award = useCallback(() => {
    if (countdownInterval.current) window.clearInterval(countdownInterval.current);
    const prize = PRIZE_NAMES[prizeIndex] ?? `Prize ${prizeIndex + 1}`;
    removeWinnerFromPool();
    setResultText(`🎉 ${winner} wins the ${prize}!`);
    setResultKind("win");
    setPhase("result");
    setPrizeIndex((p) => p + 1);
    launchConfetti(3000); // sustained celebration on the win
  }, [prizeIndex, removeWinnerFromPool, winner, launchConfetti]);

  const tooLate = useCallback(() => {
    if (countdownInterval.current) window.clearInterval(countdownInterval.current);
    removeWinnerFromPool(); // out permanently
    setResultText("Too late — drawing again…");
    setResultKind("late");
    setPhase("result");
  }, [removeWinnerFromPool]);

  // Fire "too late" when the countdown hits zero.
  useEffect(() => {
    if (phase === "countdown" && timeLeft === 0) {
      tooLate();
    }
  }, [phase, timeLeft, tooLate]);

  const allDrawn = pool.length === 0;
  const drawDisabled = phase === "spinning" || phase === "locked" || phase === "countdown";

  const nameClass = (() => {
    if (phase === "idle" || (phase === "result" && resultKind === "late")) {
      return displayName ? "wd-name" : "wd-name wd-name--idle";
    }
    if (phase === "spinning") return "wd-name wd-name--rolling";
    if (phase === "locked" || phase === "countdown" || phase === "result") return "wd-name wd-name--locked";
    return "wd-name";
  })();

  return (
    <div ref={rootRef} className="wd-root">
      <style>{styles}</style>

      <button
        type="button"
        className="wd-fs-btn"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
        title={isFullscreen ? "Exit full screen" : "Full screen"}
      >
        {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
      </button>

      <div className="wd-stage">
        <div className="wd-eyebrow">Wedding Lucky Draw</div>
        <div className="wd-names">Kangraye &amp; Qiongdan</div>

        <div className="wd-prizebar">
          {PRIZE_NAMES.map((p, i) => {
            const cls =
              i < prizeIndex ? "wd-chip wd-chip--done" : i === prizeIndex ? "wd-chip wd-chip--active" : "wd-chip";
            return (
              <span key={p} className={cls}>
                {i < prizeIndex ? "✓ " : ""}
                {p}
              </span>
            );
          })}
        </div>

        <div className={`wd-frame${phase === "locked" || phase === "countdown" ? " wd-frame--locked" : ""}`}>
          <div className="wd-wash" />
          <div className={nameClass} key={displayName || "idle"}>
            {allDrawn && phase === "idle" ? "All prizes awarded 🎊" : displayName || "Press “Draw” to begin"}
          </div>
        </div>

        {phase === "countdown" && (
          <div className="wd-ringwrap">
            <div className="wd-ring">
              <svg width="150" height="150" aria-hidden="true">
                <circle cx="75" cy="75" r={RING_RADIUS} fill="none" stroke={COLORS.line} strokeWidth="7" />
                <circle
                  cx="75"
                  cy="75"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={COLORS.gold}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - timeLeft / COUNTDOWN_SECONDS)}
                  style={{
                    transition: "stroke-dashoffset 1s linear",
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                  }}
                />
              </svg>
              <div className={`wd-num${timeLeft <= 5 ? " wd-num--warn" : ""}`}>{Math.max(timeLeft, 0)}</div>
            </div>
          </div>
        )}

        {resultText && <div className={`wd-result${resultKind ? ` wd-result--${resultKind}` : ""}`}>{resultText}</div>}

        <div className="wd-controls">
          <button type="button" className="wd-btn wd-btn--draw" onClick={draw} disabled={drawDisabled || allDrawn}>
            Draw
          </button>
          <button type="button" className="wd-btn wd-btn--claim" onClick={award} disabled={phase !== "countdown"}>
            ✓ On stage — Award prize
          </button>
          <button type="button" className="wd-btn wd-btn--late" onClick={tooLate} disabled={phase !== "countdown"}>
            Too late — Redraw
          </button>
        </div>

        <div className="wd-meta">{pool.length} names remaining</div>
      </div>

      <canvas ref={canvasRef} className="wd-confetti-canvas" tabIndex={-1} aria-hidden="true" />
    </div>
  );
}

const styles = `
.wd-root{
  position:relative;
  font-family:Georgia,'Times New Roman',serif;
  background:radial-gradient(circle at 50% 18%, ${COLORS.bg2}, ${COLORS.bg} 75%);
  color:${COLORS.ink};
  min-height:100vh;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;
}
.wd-root:fullscreen{width:100vw;height:100vh}
.wd-fs-btn{
  position:absolute;top:18px;right:18px;z-index:20;
  width:48px;height:48px;display:flex;align-items:center;justify-content:center;
  border:1px solid ${COLORS.line};border-radius:8px;background:rgba(255,255,255,.7);
  color:${COLORS.goldDeep};cursor:pointer;backdrop-filter:blur(4px);
  opacity:0;transform:translateY(-6px);transition:opacity .22s ease,transform .22s ease,background .18s ease,box-shadow .18s ease;
  pointer-events:none;
}
/* Reveal on hovering anywhere in the app, or when the button itself is focused. */
.wd-root:hover .wd-fs-btn,
.wd-fs-btn:focus-visible{opacity:1;transform:translateY(0);pointer-events:auto}
.wd-fs-btn:hover{background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.08)}
.wd-stage{width:min(1100px,94vw);text-align:center;padding:40px 28px;position:relative;z-index:1}
.wd-eyebrow{letter-spacing:.4em;text-transform:uppercase;font-size:14px;color:${COLORS.goldDeep};
  font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;margin-bottom:8px}
.wd-names{font-size:20px;color:${COLORS.muted};font-style:italic;margin-bottom:8px}
.wd-prizebar{display:inline-flex;gap:12px;margin:18px 0 30px;flex-wrap:wrap;justify-content:center}
.wd-chip{padding:7px 20px;border-radius:999px;border:1px solid ${COLORS.line};
  font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;letter-spacing:.08em;color:${COLORS.muted}}
.wd-chip--active{border-color:${COLORS.gold};color:${COLORS.goldDeep};background:#fff;box-shadow:0 0 0 3px rgba(176,141,79,.12)}
.wd-chip--done{border-color:${COLORS.green};color:${COLORS.green}}
.wd-frame{
  position:relative;height:300px;display:flex;align-items:center;justify-content:center;
  border:1px solid ${COLORS.line};border-radius:10px;
  background:linear-gradient(180deg,#fff,${COLORS.bg});
  box-shadow:inset 0 2px 0 #fff,0 22px 60px rgba(58,52,43,.08);overflow:hidden;
}
.wd-frame::before,.wd-frame::after{content:"";position:absolute;left:24px;right:24px;height:1px;
  background:${COLORS.gold};opacity:.3}
.wd-frame::before{top:18px}.wd-frame::after{bottom:18px}
.wd-wash{position:absolute;inset:0;opacity:0;transition:opacity .6s ease;
  background:radial-gradient(circle at 50% 50%, rgba(233,215,173,.45), transparent 60%)}
.wd-frame--locked .wd-wash{opacity:1}
.wd-name{font-size:clamp(44px,8.5vw,104px);line-height:1.05;color:${COLORS.ink};
  position:relative;z-index:1;padding:0 16px}
.wd-name--rolling{color:${COLORS.muted};opacity:.92}
.wd-name--idle{font-size:clamp(26px,4vw,40px);color:${COLORS.muted};font-style:italic}
.wd-name--locked{color:${COLORS.goldDeep};animation:wd-lockpop .55s cubic-bezier(.2,.8,.3,1.2)}
@keyframes wd-lockpop{0%{transform:scale(.9);opacity:.4}60%{transform:scale(1.08)}100%{transform:scale(1)}}
.wd-ringwrap{margin:26px auto 0;height:150px;display:flex;align-items:center;justify-content:center}
.wd-ring{position:relative;width:150px;height:150px}
.wd-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-size:56px;color:${COLORS.goldDeep}}
.wd-num--warn{color:${COLORS.red}}
.wd-controls{margin-top:34px;display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.wd-btn{font-family:inherit;font-size:19px;padding:17px 36px;border-radius:6px;border:1px solid ${COLORS.line};
  background:#fff;color:${COLORS.ink};cursor:pointer;transition:all .18s ease;letter-spacing:.03em}
.wd-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 22px rgba(0,0,0,.08)}
.wd-btn:disabled{opacity:.32;cursor:not-allowed}
.wd-btn--draw{background:${COLORS.gold};color:#fff;border-color:${COLORS.goldDeep};font-size:22px;padding:19px 52px;
  box-shadow:0 8px 28px rgba(176,141,79,.3)}
.wd-btn--claim{background:${COLORS.green};color:#fff;border-color:#4a7a4a}
.wd-btn--late{background:#fff;color:${COLORS.red};border-color:${COLORS.red}}
.wd-result{margin-top:22px;font-size:24px;min-height:1.4em}
.wd-result--win{color:${COLORS.green}}
.wd-result--late{color:${COLORS.red};font-style:italic}
.wd-meta{margin-top:14px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;
  color:${COLORS.muted};letter-spacing:.12em;text-transform:uppercase}
.wd-confetti-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:10}
`;
