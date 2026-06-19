import confetti from "canvas-confetti";
import { Maximize, Minimize } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Guest = {
  id: number;
  name: string;
  isFather: boolean;
};

const GUESTS: Guest[] = [
  { id: 1, name: "Pek Teck Huat", isFather: true },
  { id: 2, name: "Yap Geok Hong", isFather: false },
  { id: 3, name: "Pek Yun Bi", isFather: false },
  { id: 4, name: "Tan Hsien Zhe", isFather: true },
  { id: 5, name: "Mercer", isFather: false },
  { id: 6, name: "Pek Fu Ren", isFather: false },
  { id: 7, name: "Pek Ai Wah", isFather: false },
  { id: 8, name: "Leow Kee Teck", isFather: true },
  { id: 9, name: "Gigi", isFather: false },
  { id: 10, name: "Wong Woon Mei", isFather: false },
  { id: 11, name: "Leow Tong Le", isFather: false },
  { id: 12, name: "Bo Bo", isFather: false },
  { id: 13, name: "Pek Jiamin", isFather: false },
  { id: 14, name: "Zephyr Loh", isFather: true },
  { id: 15, name: "Naomi Loh", isFather: false },
  { id: 16, name: "Mr Peh Kok Kheng", isFather: true },
  { id: 17, name: "Mrs Peh Kok Kheng", isFather: false },
  { id: 18, name: "Mr Peh Kok Heng", isFather: true },
  { id: 19, name: "Mrs Peh Kok Heng", isFather: false },
  { id: 20, name: "Kenneth Tan", isFather: true },
  { id: 21, name: "Mr Tan Ming Tong", isFather: true },
  { id: 22, name: "Mrs Tan Ming Tong", isFather: false },
  { id: 23, name: "Mr Yap Ee", isFather: true },
  { id: 24, name: "Mrs Yap Ee", isFather: false },
  { id: 25, name: "Mr Yap Bock Suan", isFather: true },
  { id: 26, name: "Mrs Yap Bock Suan", isFather: false },
  { id: 27, name: "Mr Yap Bock Kee", isFather: true },
  { id: 28, name: "Mrs Yap Bock Kee", isFather: false },
  { id: 29, name: "Mr Yap Eng Khoon", isFather: true },
  { id: 30, name: "Mrs Yap Eng Khoon", isFather: false },
  { id: 31, name: "Go Bong Meng", isFather: true },
  { id: 32, name: "Hedges Go", isFather: false },
  { id: 33, name: "Yap Geok Moy", isFather: false },
  { id: 34, name: "Pauline / Victor", isFather: false },
  { id: 35, name: "Yap Geok Hwa", isFather: false },
  { id: 36, name: "Tan Kim Yam", isFather: true },
  { id: 37, name: "Mr Tan Sok Kwang", isFather: true },
  { id: 38, name: "Mrs Tan Sok Kwang", isFather: false },
  { id: 39, name: "Mr Tan Cheng Guan", isFather: true },
  { id: 40, name: "Mrs Tan Cheng Guan", isFather: false },
  { id: 41, name: "Mr Willie Tan", isFather: true },
  { id: 42, name: "Mrs Willie Tan", isFather: false },
  { id: 43, name: "Tan Swee Tee", isFather: true },
  { id: 44, name: "Tan Kok Wah", isFather: true },
  { id: 45, name: "Hannah", isFather: false },
  { id: 46, name: "Wayne Tan", isFather: false },
  { id: 47, name: "Ziilia", isFather: false },
  { id: 48, name: "Yeo Khee", isFather: false },
  { id: 49, name: "Jermine", isFather: false },
  { id: 50, name: "Keith", isFather: true },
  { id: 51, name: "Jia Jia", isFather: false },
  { id: 52, name: "Yolanda", isFather: false },
  { id: 53, name: "Yin Jun Hao", isFather: false },
  { id: 54, name: "Pei Han", isFather: false },
  { id: 55, name: "Li Ting", isFather: false },
  { id: 56, name: "Amelia", isFather: false },
  { id: 57, name: "Zarchi", isFather: false },
  { id: 58, name: "Ming Yuan", isFather: false },
  { id: 59, name: "Darren Oh", isFather: true },
  { id: 60, name: "Ying Jia", isFather: false },
  { id: 61, name: "Wei An", isFather: false },
  { id: 62, name: "Lenise", isFather: false },
  { id: 63, name: "Lester", isFather: false },
  { id: 64, name: "Ying Hui", isFather: false },
  { id: 65, name: "Li Hui", isFather: false },
  { id: 66, name: "Willie Lum", isFather: true },
  { id: 67, name: "Ellie Lum", isFather: false },
  { id: 68, name: "Hui Hui", isFather: false },
  { id: 69, name: "Choon Keat", isFather: true },
  { id: 70, name: "Clarice", isFather: false },
  { id: 71, name: "Alson", isFather: false },
  { id: 72, name: "Caleb", isFather: false },
  { id: 73, name: "Stephanie", isFather: false },
  { id: 74, name: "Wayne Wee", isFather: false },
  { id: 75, name: "Nicholas Ong", isFather: true },
  { id: 76, name: "Reine", isFather: false },
  { id: 77, name: "Tyler", isFather: false },
  { id: 78, name: "Kah Lun", isFather: false },
  { id: 79, name: "Jing Ci", isFather: false },
  { id: 80, name: "Norris", isFather: true },
  { id: 81, name: "Shi Jie", isFather: true },
  { id: 82, name: "Yue Jiao", isFather: false },
  { id: 83, name: "Noelle", isFather: false },
  { id: 84, name: "Weng Yi", isFather: false },
  { id: 85, name: "Douglas", isFather: true },
  { id: 86, name: "Wan Chin", isFather: false },
  { id: 87, name: "Tina", isFather: false },
  { id: 88, name: "Jing Ting", isFather: false },
  { id: 89, name: "Xindi", isFather: false },
  { id: 90, name: "Valerie", isFather: false },
  { id: 91, name: "Jolin", isFather: false },
  { id: 92, name: "Yu Jing", isFather: false },
  { id: 93, name: "Wei Yang", isFather: false },
  { id: 94, name: "Hoon Kai", isFather: true },
  { id: 95, name: "May Lee", isFather: false },
  { id: 96, name: "Hui Lynn", isFather: false },
  { id: 97, name: "Li Hiang", isFather: false },
  { id: 98, name: "Kee Teck", isFather: true },
  { id: 99, name: "Edwin", isFather: true },
  { id: 100, name: "Sharon", isFather: false },
  { id: 101, name: "Tobias", isFather: false },
  { id: 102, name: "Talia", isFather: false },
  { id: 103, name: "Eleanor", isFather: false },
  { id: 104, name: "Kai Rong", isFather: true },
  { id: 105, name: "Courtney", isFather: false },
  { id: 106, name: "Emily", isFather: false },
  { id: 107, name: "Hoon Kwang", isFather: true },
  { id: 108, name: "Hui Chun", isFather: false },
  { id: 109, name: "Hui Xuan", isFather: false },
  { id: 110, name: "Hoon Hwee", isFather: true },
  { id: 111, name: "Jana", isFather: false },
  { id: 112, name: "Justin", isFather: true },
  { id: 113, name: "Irene", isFather: false },
  { id: 114, name: "Mindy", isFather: false },
  { id: 115, name: "老姑", isFather: false },
  { id: 116, name: "Norman", isFather: false },
  { id: 117, name: "Wai Po", isFather: false },
  { id: 118, name: "Khin Lin", isFather: false },
  { id: 119, name: "Bee Yong", isFather: false },
  { id: 120, name: "Pheng Yee", isFather: true },
  { id: 121, name: "Roy", isFather: true },
  { id: 122, name: "Matthias", isFather: false },
  { id: 123, name: "See Hian", isFather: false },
  { id: 124, name: "Joy Soon", isFather: false },
  { id: 125, name: "Clinton", isFather: false },
  { id: 126, name: "Sam", isFather: true },
  { id: 127, name: "Serene", isFather: false },
  { id: 128, name: "Jamie", isFather: false },
  { id: 129, name: "大舅舅", isFather: true },
  { id: 130, name: "Darren", isFather: false },
  { id: 131, name: "Cherie", isFather: false },
  { id: 132, name: "Lyn", isFather: false },
  { id: 133, name: "Chuan Woo", isFather: true },
  { id: 134, name: "Poay Wah", isFather: false },
  { id: 135, name: "Seng Hiong", isFather: true },
  { id: 136, name: "Li Li", isFather: false },
  { id: 137, name: "Cheng Joo", isFather: true },
  { id: 138, name: "Jasmine", isFather: false },
  { id: 139, name: "Wan Xin", isFather: true },
  { id: 140, name: "Dorothy", isFather: false },
  { id: 141, name: "Max", isFather: false },
  { id: 142, name: "Samantha", isFather: false },
  { id: 143, name: "Zuan", isFather: false },
  { id: 144, name: "Chong Wei", isFather: true },
  { id: 145, name: "Kai Qi", isFather: false },
  { id: 146, name: "Vivek", isFather: false },
  { id: 147, name: "Joel", isFather: true },
  { id: 148, name: "Siong Gim", isFather: true },
  { id: 149, name: "Annabel", isFather: false },
  { id: 151, name: "Bryan Lim", isFather: false },
  { id: 152, name: "Yeow Xiang", isFather: false },
  { id: 153, name: "Nicky", isFather: false },
  { id: 154, name: "Clara", isFather: false },
  { id: 155, name: "Victor", isFather: false },
  { id: 156, name: "Shaun", isFather: false },
  { id: 157, name: "Yiting", isFather: false },
  { id: 158, name: "Hui Wen", isFather: false },
  { id: 159, name: "Wong Chong", isFather: false },
  { id: 160, name: "Chee Kiat", isFather: true },
  { id: 161, name: "Wei Loong", isFather: true },
  { id: 162, name: "Mei Ling", isFather: false },
  { id: 163, name: "Kenny", isFather: true },
  { id: 164, name: "Alan", isFather: true },
  { id: 165, name: "David", isFather: true },
  { id: 166, name: "Sio Peng", isFather: false },
  { id: 167, name: "Shu Mun", isFather: false },
  { id: 168, name: "Lien Feng", isFather: true },
  { id: 169, name: "Caroline", isFather: false },
  { id: 170, name: "Kevin", isFather: true },
  { id: 171, name: "Khang Jin", isFather: true },
  { id: 172, name: "Kwang Yi", isFather: false },
  { id: 173, name: "Mr.Yee", isFather: true },
  { id: 174, name: "Nagarajan", isFather: true },
  { id: 175, name: "Alexis", isFather: false },
  { id: 176, name: "Xiao Kang", isFather: false },
  { id: 177, name: "Bryan Ong", isFather: false },
  { id: 178, name: "Sheng Leong", isFather: true },
  { id: 179, name: "Dickson", isFather: true },
];

// Prize names — edit the text here; add/remove entries to change how many prizes.
const PRIZE_NAMES: string[] = ["First Prize", "Second Prize", "Third Prize"];
const FATHER_ONLY_PRIZE_INDEX = PRIZE_NAMES.length - 1;

const COUNTDOWN_SECONDS = 20;
const RING_RADIUS = 66;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Spin tuning: more flashes / bigger tail constant = longer suspense.
const SPIN_FLASHES = 38;
const SPIN_BASE_MS = 45;
const SPIN_TAIL_MS = 620;

type Phase = "idle" | "spinning" | "locked" | "countdown" | "result";

const COLORS = {
  bg: "#f3ece0", // warm ivory
  bg2: "#fbf6ec",
  ink: "#2b2419", // deep espresso
  muted: "#8a8170",
  gold: "#bd9648",
  goldDeep: "#8a6a2e",
  goldLight: "#e7cf94",
  line: "#dccfb4",
  green: "#5a7d56",
  red: "#a8503f",
};

const CONFETTI_COLORS = ["#bd9648", "#e7cf94", "#8a6a2e", "#fbf6ec", "#cdb275", "#5a7d56"];

export default function WeddingLuckyDraw() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [excludedGuestIds, setExcludedGuestIds] = useState<Set<number>>(() => new Set());
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayName, setDisplayName] = useState("");
  const [winner, setWinner] = useState<Guest | null>(null);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [resultText, setResultText] = useState("");
  const [resultKind, setResultKind] = useState<"win" | "late" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const spinTimeout = useRef<number | null>(null);
  const countdownInterval = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireRef = useRef<confetti.CreateTypes | null>(null);
  const isFatherOnlyPrize = prizeIndex === FATHER_ONLY_PRIZE_INDEX;
  const currentPool = useMemo(() => {
    const eligibleGuests = isFatherOnlyPrize ? GUESTS.filter((guest) => guest.isFather) : GUESTS;
    return eligibleGuests.filter((guest) => !excludedGuestIds.has(guest.id));
  }, [excludedGuestIds, isFatherOnlyPrize]);

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
          // Timer reaches zero but we DON'T auto-decide. Stay in countdown so the
          // MC can still award a late arrival (or redraw) at their discretion.
          if (countdownInterval.current) window.clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const lockIn = useCallback(
    (chosen: Guest) => {
      setDisplayName(chosen.name);
      setWinner(chosen);
      setPhase("locked");
      launchConfetti(800); // quick pop as the name locks in
      window.setTimeout(startCountdown, 900);
    },
    [launchConfetti, startCountdown],
  );

  const draw = useCallback(() => {
    if (currentPool.length === 0 || prizeIndex >= PRIZE_NAMES.length) return;
    setResultText("");
    setResultKind(null);
    setPhase("spinning");

    const chosen = currentPool[Math.floor(Math.random() * currentPool.length)];
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
      const showing = step === SPIN_FLASHES - 1 ? chosen : currentPool[Math.floor(Math.random() * currentPool.length)];
      setDisplayName(showing.name);
      step += 1;
      spinTimeout.current = window.setTimeout(tick, nextDelay(step));
    };
    tick();
  }, [currentPool, lockIn, prizeIndex]);

  const removeWinnerFromPool = useCallback(() => {
    if (!winner) return;
    setExcludedGuestIds((prev) => {
      const next = new Set(prev);
      next.add(winner.id);
      return next;
    });
  }, [winner]);

  const award = useCallback(() => {
    if (!winner) return;
    if (countdownInterval.current) window.clearInterval(countdownInterval.current);
    const prize = PRIZE_NAMES[prizeIndex] ?? `Prize ${prizeIndex + 1}`;
    removeWinnerFromPool();
    setResultText(`🎉 ${winner.name} wins the ${prize}!`);
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

  const noPrizesRemaining = prizeIndex >= PRIZE_NAMES.length;
  const currentPoolEmpty = currentPool.length === 0;
  const allDrawn = noPrizesRemaining || currentPoolEmpty;
  const drawDisabled = phase === "spinning" || phase === "locked" || phase === "countdown";
  const currentPrizeLabel = PRIZE_NAMES[prizeIndex] ?? "all prizes";
  const poolDescription = isFatherOnlyPrize ? "father names" : "names";
  const metaText = noPrizesRemaining
    ? "All prizes have been drawn"
    : currentPoolEmpty
      ? "No eligible names left in this draw"
      : `${currentPool.length} ${currentPool.length === 1 ? poolDescription.replace("s", "") : poolDescription} still in the draw`;

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

      {/* atmospheric layers */}
      <div className="wd-bg" aria-hidden="true" />
      <div className="wd-grain" aria-hidden="true" />
      <div className="wd-deco-frame" aria-hidden="true" />

      {/* Top-right hover zone: keeps the toggle hidden until the cursor approaches
          the corner — works the same windowed or fullscreen. */}
      <div className="wd-fs-zone">
        <button
          type="button"
          className="wd-fs-btn"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
          title={isFullscreen ? "Exit full screen" : "Full screen"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      <div className="wd-stage">
        <header className="wd-head">
          <div className="wd-eyebrow">The Lucky Draw</div>
          <h1 className="wd-names">
            Kang Raye <span className="wd-amp">&amp;</span> Qiong Dan
          </h1>
          <Ornament className="wd-head-rule" />
        </header>

        <div className="wd-prizebar">
          {PRIZE_NAMES.map((p, i) => {
            const cls =
              i < prizeIndex ? "wd-chip wd-chip--done" : i === prizeIndex ? "wd-chip wd-chip--active" : "wd-chip";
            return (
              <span key={p} className={cls}>
                <span className="wd-chip-dot" />
                {p}
              </span>
            );
          })}
        </div>

        <div
          className={`wd-frame${phase === "locked" || phase === "countdown" || (phase === "result" && resultKind === "win") ? " wd-frame--locked" : ""}`}
        >
          <div className="wd-wash" />
          <div className="wd-corner wd-corner--tl" />
          <div className="wd-corner wd-corner--tr" />
          <div className="wd-corner wd-corner--bl" />
          <div className="wd-corner wd-corner--br" />
          <div className={nameClass} key={displayName || "idle"} data-text={displayName}>
            {allDrawn && phase === "idle" ? "Every prize has found its winner" : displayName || "Draw to begin"}
          </div>
        </div>

        <div className="wd-belt">
          {phase === "countdown" && timeLeft === 0 ? (
            <p className="wd-toolate">
              Too late<span className="wd-toolate-sub">— award anyway, or redraw</span>
            </p>
          ) : phase === "countdown" ? (
            <div className="wd-ringwrap">
              <div className={`wd-ring${timeLeft <= 5 ? " wd-ring--warn" : ""}`}>
                <svg width="156" height="156" aria-hidden="true">
                  <circle cx="78" cy="78" r={RING_RADIUS} fill="none" stroke={COLORS.line} strokeWidth="4" />
                  <circle
                    className="wd-ring-fill"
                    cx="78"
                    cy="78"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={RING_CIRCUMFERENCE * (1 - timeLeft / COUNTDOWN_SECONDS)}
                  />
                </svg>
                <div className="wd-num">{Math.max(timeLeft, 0)}</div>
                <div className="wd-num-label">seconds</div>
              </div>
            </div>
          ) : resultText ? (
            <div className={`wd-result${resultKind ? ` wd-result--${resultKind}` : ""}`}>{resultText}</div>
          ) : (
            <p className="wd-prompt-line">
              Now drawing for the <em>{currentPrizeLabel}</em>
            </p>
          )}
        </div>

        <div className="wd-controls">
          <button type="button" className="wd-btn wd-btn--draw" onClick={draw} disabled={drawDisabled || allDrawn}>
            <span>{phase === "result" && resultKind === "win" ? "Draw Next" : "Draw"}</span>
          </button>
          <button type="button" className="wd-btn wd-btn--claim" onClick={award} disabled={phase !== "countdown"}>
            Award Prize
          </button>
          <button type="button" className="wd-btn wd-btn--late" onClick={tooLate} disabled={phase !== "countdown"}>
            Redraw
          </button>
        </div>

        <div className="wd-meta">{metaText}</div>
      </div>

      <canvas ref={canvasRef} className="wd-confetti-canvas" tabIndex={-1} aria-hidden="true" />
    </div>
  );
}

// Small deco rule: a hairline with a center diamond ornament.
function Ornament({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 12" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <line x1="6" y1="6" x2="92" y2="6" stroke="currentColor" strokeWidth="1" />
      <line x1="128" y1="6" x2="214" y2="6" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="6" r="2" fill="currentColor" />
      <circle cx="120" cy="6" r="2" fill="currentColor" />
      <path d="M110 1 L114 6 L110 11 L106 6 Z" fill="currentColor" />
    </svg>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cinzel:wght@400;500;600&display=swap');

.wd-root{
  --gold:${COLORS.gold};--gold-deep:${COLORS.goldDeep};--gold-light:${COLORS.goldLight};
  --ink:${COLORS.ink};--muted:${COLORS.muted};--line:${COLORS.line};
  --foil:linear-gradient(105deg,#7a5d28 0%,#a9842f 24%,#caa44e 44%,#e3c878 50%,#caa44e 56%,#a9842f 76%,#7a5d28 100%);
  position:relative;overflow:hidden;
  min-height:100vh;width:100%;
  display:flex;align-items:center;justify-content:center;
  font-family:'Cormorant Garamond',Georgia,serif;
  color:var(--ink);
  background:${COLORS.bg};
  isolation:isolate;
}
.wd-root:fullscreen{width:100vw;height:100vh}

/* ——— atmosphere ——— */
.wd-bg{position:absolute;inset:0;z-index:-2;
  background:
    radial-gradient(120% 80% at 50% -10%, #fdf8ee 0%, ${COLORS.bg2} 38%, ${COLORS.bg} 72%, #e9e0cf 100%),
    radial-gradient(60% 50% at 50% 42%, rgba(231,207,148,.35), transparent 70%);}
.wd-grain{position:absolute;inset:0;z-index:-1;opacity:.05;pointer-events:none;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
.wd-deco-frame{position:absolute;inset:22px;z-index:0;pointer-events:none;border-radius:2px;
  border:1px solid color-mix(in srgb, var(--gold) 38%, transparent);
  box-shadow:inset 0 0 0 4px ${COLORS.bg2}, inset 0 0 0 5px color-mix(in srgb, var(--gold) 22%, transparent);}
.wd-deco-frame::before,.wd-deco-frame::after{content:"";position:absolute;width:22px;height:22px;}
.wd-deco-frame::before{top:-1px;left:-1px;border-top:2px solid var(--gold);border-left:2px solid var(--gold)}
.wd-deco-frame::after{bottom:-1px;right:-1px;border-bottom:2px solid var(--gold);border-right:2px solid var(--gold)}

/* ——— fullscreen toggle ——— */
.wd-fs-zone{position:absolute;top:0;right:0;width:140px;height:120px;z-index:20}
.wd-fs-btn{
  position:absolute;top:38px;right:38px;
  width:44px;height:44px;display:flex;align-items:center;justify-content:center;
  border:1px solid color-mix(in srgb, var(--gold) 45%, transparent);border-radius:50%;
  background:rgba(255,255,255,.55);color:var(--gold-deep);cursor:pointer;backdrop-filter:blur(6px);
  opacity:0;transform:translateY(-6px);
  transition:opacity .25s ease,transform .25s ease,background .18s ease,box-shadow .18s ease;
  pointer-events:none;
}
/* Reveal only when the cursor is near the corner (or the button is focused). */
.wd-fs-zone:hover .wd-fs-btn,.wd-fs-btn:focus-visible{opacity:1;transform:translateY(0);pointer-events:auto}
.wd-fs-btn:hover{background:#fff;box-shadow:0 6px 20px rgba(138,106,46,.22)}

/* ——— stage / entrance ——— */
.wd-stage{position:relative;z-index:1;width:min(1080px,90vw);text-align:center;padding:48px 32px}
.wd-stage>*{animation:wd-rise .8s cubic-bezier(.2,.7,.3,1) both}
.wd-head{animation-delay:.05s}.wd-prizebar{animation-delay:.16s}
.wd-frame{animation-delay:.26s}.wd-belt{animation-delay:.36s}
.wd-controls{animation-delay:.44s}.wd-meta{animation-delay:.52s}
@keyframes wd-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* ——— header ——— */
.wd-head{margin-bottom:26px}
.wd-eyebrow{font-family:'Cinzel',serif;letter-spacing:.46em;text-transform:uppercase;
  font-size:13px;font-weight:500;color:var(--gold-deep);margin:0 0 12px;padding-left:.46em}
.wd-names{margin:0;font-weight:500;font-size:clamp(30px,4.4vw,52px);line-height:1.05;color:var(--ink);
  letter-spacing:.01em}
.wd-amp{font-style:italic;font-weight:400;
  background:var(--foil);-webkit-background-clip:text;background-clip:text;color:transparent;
  padding:0 .12em}
.wd-head-rule{display:block;width:240px;max-width:60%;height:14px;margin:16px auto 0;color:var(--gold)}

/* ——— prize progress ——— */
.wd-prizebar{display:inline-flex;gap:10px;margin-bottom:34px;flex-wrap:wrap;justify-content:center}
.wd-chip{display:inline-flex;align-items:center;gap:9px;
  font-family:'Cinzel',serif;font-size:12px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;
  padding:9px 20px;border-radius:2px;color:var(--muted);
  border:1px solid var(--line);background:rgba(255,255,255,.35);
  transition:all .3s ease}
.wd-chip-dot{width:6px;height:6px;border-radius:50%;background:var(--line);transition:all .3s ease}
.wd-chip--active{color:var(--ink);border-color:var(--gold);background:#fff;
  box-shadow:0 6px 18px rgba(138,106,46,.14)}
.wd-chip--active .wd-chip-dot{background:var(--gold);box-shadow:0 0 0 3px color-mix(in srgb,var(--gold) 28%,transparent)}
.wd-chip--done{color:var(--gold-deep);border-color:color-mix(in srgb,var(--gold) 40%,transparent)}
.wd-chip--done .wd-chip-dot{background:var(--gold)}

/* ——— name frame: the hero ——— */
.wd-frame{position:relative;height:clamp(220px,34vh,330px);display:flex;align-items:center;justify-content:center;
  padding:0 40px;border-radius:3px;overflow:hidden;
  background:linear-gradient(180deg,#fffdf8,#f6efe1);
  border:1px solid color-mix(in srgb,var(--gold) 26%,transparent);
  box-shadow:inset 0 1px 0 #fff, 0 30px 70px -28px rgba(80,60,24,.4), 0 2px 0 #fff}
.wd-frame::before,.wd-frame::after{content:"";position:absolute;left:50%;transform:translateX(-50%);
  width:62%;height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--gold) 55%,transparent),transparent)}
.wd-frame::before{top:20px}.wd-frame::after{bottom:20px}
.wd-corner{position:absolute;width:16px;height:16px;border:1.5px solid color-mix(in srgb,var(--gold) 55%,transparent);opacity:.7}
.wd-corner--tl{top:12px;left:12px;border-right:0;border-bottom:0}
.wd-corner--tr{top:12px;right:12px;border-left:0;border-bottom:0}
.wd-corner--bl{bottom:12px;left:12px;border-right:0;border-top:0}
.wd-corner--br{bottom:12px;right:12px;border-left:0;border-top:0}
.wd-wash{position:absolute;inset:0;opacity:0;transition:opacity .7s ease;
  background:radial-gradient(60% 75% at 50% 50%, rgba(231,207,148,.55), transparent 70%)}
.wd-frame--locked .wd-wash{opacity:1;animation:wd-flare 1s ease}
@keyframes wd-flare{0%{opacity:0;transform:scale(.85)}40%{opacity:.95}100%{opacity:1;transform:scale(1)}}

.wd-name{position:relative;z-index:1;line-height:1.04;font-weight:500;
  font-size:clamp(40px,8vw,100px);color:var(--ink);
  max-width:100%;word-break:break-word}
.wd-name--rolling{color:color-mix(in srgb,var(--ink) 72%,transparent);opacity:.9;filter:blur(.4px);transition:none}
.wd-name--idle{font-style:italic;font-weight:400;font-size:clamp(24px,3.6vw,40px);color:color-mix(in srgb,var(--ink) 55%,transparent)}
.wd-name--locked{font-weight:600;letter-spacing:.005em;
  background:var(--foil);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;
  -webkit-text-fill-color:transparent;
  animation:wd-lockpop .6s cubic-bezier(.2,.8,.3,1.25), wd-shimmer 3.5s linear .6s infinite;
  filter:drop-shadow(0 2px 1px rgba(120,90,30,.18))}
@keyframes wd-lockpop{0%{transform:scale(.88);opacity:.3}60%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes wd-shimmer{0%{background-position:0% center}100%{background-position:200% center}}

/* ——— belt: countdown / result / prompt all share this row ——— */
.wd-belt{min-height:172px;display:flex;align-items:center;justify-content:center;margin-top:22px}
.wd-prompt-line{margin:0;font-size:clamp(18px,2.4vw,24px);color:var(--muted)}
.wd-prompt-line em{font-style:italic;color:var(--gold-deep)}

.wd-ringwrap{display:flex;align-items:center;justify-content:center}
.wd-ring{position:relative;width:156px;height:156px}
.wd-ring svg circle{transform:rotate(-90deg);transform-origin:center}
.wd-ring-fill{stroke:var(--gold);transition:stroke-dashoffset 1s linear, stroke .4s ease;
  filter:drop-shadow(0 0 6px color-mix(in srgb,var(--gold) 55%,transparent))}
.wd-ring--warn .wd-ring-fill{stroke:${COLORS.red};filter:drop-shadow(0 0 7px color-mix(in srgb,${COLORS.red} 55%,transparent))}
.wd-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-family:'Cinzel',serif;font-variant-numeric:lining-nums tabular-nums;
  font-size:52px;font-weight:500;color:var(--gold-deep);line-height:1;
  transform:translateY(-15px)}
.wd-ring--warn .wd-num{color:${COLORS.red};animation:wd-pulse 1s ease-in-out infinite}
@keyframes wd-pulse{0%,100%{transform:translateY(-15px) scale(1)}50%{transform:translateY(-15px) scale(1.12)}}
.wd-num-label{position:absolute;left:0;right:0;bottom:38px;font-family:'Cinzel',serif;
  font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--muted);padding-left:.28em}

.wd-result{font-size:clamp(22px,3.2vw,34px);font-style:italic;font-weight:500;animation:wd-rise .5s ease both}
.wd-result--win{background:var(--foil);background-size:200% auto;-webkit-background-clip:text;background-clip:text;
  color:transparent;animation:wd-rise .5s ease both, wd-shimmer 3.5s linear infinite}
.wd-result--late{color:${COLORS.red}}
.wd-toolate{margin:0;display:flex;flex-direction:column;align-items:center;gap:8px;
  font-size:clamp(30px,4.6vw,52px);font-weight:500;color:${COLORS.red};animation:wd-rise .4s ease both}
.wd-toolate-sub{font-family:'Cinzel',serif;font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;
  color:var(--muted)}

/* ——— controls ——— */
.wd-controls{margin-top:30px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.wd-btn{font-family:'Cinzel',serif;font-size:14px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;
  padding:16px 30px;border-radius:2px;cursor:pointer;
  border:1px solid var(--line);background:rgba(255,255,255,.55);color:var(--ink);
  transition:transform .18s ease,box-shadow .22s ease,background .2s ease,opacity .2s ease,border-color .2s ease}
.wd-btn:hover:not(:disabled){transform:translateY(-2px)}
.wd-btn:disabled{opacity:.3;cursor:not-allowed}
.wd-btn--draw{position:relative;overflow:hidden;color:#fff8e8;border:0;
  font-size:16px;letter-spacing:.18em;padding:18px 48px;
  background:linear-gradient(135deg,var(--gold-deep),var(--gold) 55%,var(--gold-deep));
  box-shadow:0 12px 30px -8px rgba(138,106,46,.6), inset 0 1px 0 rgba(255,255,255,.45)}
.wd-btn--draw::after{content:"";position:absolute;top:0;left:-120%;width:60%;height:100%;
  background:linear-gradient(105deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-18deg)}
.wd-btn--draw:hover:not(:disabled){box-shadow:0 16px 36px -8px rgba(138,106,46,.7), inset 0 1px 0 rgba(255,255,255,.5)}
.wd-btn--draw:hover:not(:disabled)::after{animation:wd-sheen .9s ease}
@keyframes wd-sheen{from{left:-120%}to{left:160%}}
.wd-btn--claim{border-color:color-mix(in srgb,${COLORS.green} 55%,transparent);color:${COLORS.green};background:rgba(255,255,255,.7)}
.wd-btn--claim:hover:not(:disabled){background:${COLORS.green};color:#fff;border-color:${COLORS.green};box-shadow:0 12px 26px -10px rgba(90,125,86,.7)}
.wd-btn--late{border-color:color-mix(in srgb,${COLORS.red} 45%,transparent);color:${COLORS.red};background:rgba(255,255,255,.7)}
.wd-btn--late:hover:not(:disabled){background:${COLORS.red};color:#fff;border-color:${COLORS.red};box-shadow:0 12px 26px -10px rgba(168,80,63,.6)}

.wd-meta{margin-top:24px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:.22em;text-transform:uppercase;
  color:var(--muted);padding-left:.22em}

.wd-confetti-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:10}

@media (prefers-reduced-motion:reduce){
  .wd-stage>*{animation:none}
  .wd-name--locked,.wd-result--win{animation:none}
  .wd-num{animation:none}
}
`;
