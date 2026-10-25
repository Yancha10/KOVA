import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { celebrate } from "../../../app/lib/fx";

export type TimerMode = "amrap" | "fortime" | "emom" | "tabata" | "intervals" | "rest" | "stopwatch";
export type TimerPreset = { mode: TimerMode; minutes?: number; rounds?: number; work?: number; rest?: number; seconds?: number; title?: string; sessionId?: string; label?: string };

const MODES: [TimerMode, string][] = [
  ["amrap", "AMRAP"],
  ["fortime", "For time"],
  ["emom", "EMOM"],
  ["tabata", "Tabata"],
  ["intervals", "Intervalos"],
  ["rest", "Descanso"],
  ["stopwatch", "Libre"],
];
const pref = (k: string, d: boolean) => {
  try {
    const v = localStorage.getItem("kova-timer-" + k);
    return v === null ? d : v === "1";
  } catch {
    return d;
  }
};
const setPref = (k: string, v: boolean) => {
  try {
    localStorage.setItem("kova-timer-" + k, v ? "1" : "0");
  } catch {
    /* sin almacenamiento */
  }
};
const pad = (n: number) => String(n).padStart(2, "0");
const clockUp = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${pad(Math.floor(Math.max(0, s) % 60))}`;
const clockDown = (s: number) => {
  const n = Math.max(0, Math.ceil(s - 1e-6));
  return `${Math.floor(n / 60)}:${pad(n % 60)}`;
};
const STARS = Array.from({ length: 46 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453, b = Math.sin(i * 78.233) * 12345.678;
  return [(a - Math.floor(a)) * 100, (b - Math.floor(b)) * 100, (i % 7) * 0.4];
});

type Cfg = { mode: TimerMode; minutes: number; rounds: number; work: number; rest: number; restSecs: number };
const total = (c: Cfg) => (c.mode === "tabata" || c.mode === "intervals" ? c.rounds * (c.work + c.rest) : c.mode === "rest" ? c.restSecs : c.mode === "stopwatch" ? Infinity : c.minutes * 60);

function stateAt(c: Cfg, e: number, laps: number) {
  const T = total(c);
  const t = Math.min(e, T);
  if (c.mode === "amrap") return { main: T - t, up: false, sub: `Ronda ${laps + 1}`, frac: t / T, inner: (t % 60) / 60, seg: 0, left: T - t, rest: false };
  if (c.mode === "fortime") return { main: t, up: true, sub: `Cap ${c.minutes}′ · ronda ${laps + 1}`, frac: t / T, inner: (t % 60) / 60, seg: 0, left: T - t, rest: false };
  if (c.mode === "stopwatch") return { main: e, up: true, sub: `Ronda ${laps + 1}`, frac: (e % 60) / 60, inner: (e % 60) / 60, seg: 0, left: Infinity, rest: false };
  if (c.mode === "emom") {
    const m = Math.min(Math.floor(t / 60), c.minutes - 1), inMin = t - m * 60, left = t >= T ? 0 : 60 - inMin;
    return { main: left, up: false, sub: `Minuto ${m + 1} de ${c.minutes}`, frac: t / T, inner: inMin / 60, seg: m, left, rest: false };
  }
  if (c.mode === "tabata" || c.mode === "intervals") {
    const cyc = c.work + c.rest, k = Math.min(Math.floor(t / cyc), c.rounds - 1), inC = t - k * cyc, work = inC < c.work || t >= T;
    const left = t >= T ? 0 : work ? c.work - inC : cyc - inC;
    return { main: left, up: false, sub: `${work ? "Trabajo" : "Descanso"} · ${k + 1}/${c.rounds}`, frac: t / T, inner: work ? inC / c.work : (inC - c.work) / Math.max(1, c.rest), seg: k * 2 + (work ? 0 : 1), left, rest: !work };
  }
  return { main: T - t, up: false, sub: "Respira y recupera", frac: t / T, inner: t / T, seg: 0, left: T - t, rest: true };
}

export default function TimerView({
  visible,
  preset,
  presetKey,
  originLabel,
  clearOrigin,
  onRunning,
  onResult,
}: {
  visible: boolean;
  preset: TimerPreset | null;
  presetKey: number;
  originLabel: string | null;
  clearOrigin: () => void;
  onRunning: (r: boolean) => void;
  onResult: (text: string) => void;
}) {
  const [cfg, setCfg] = useState<Cfg>({ mode: "amrap", minutes: 15, rounds: 8, work: 20, rest: 10, restSecs: 90 });
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [sound, setSound] = useState(true);
  const [voice, setVoice] = useState(true);
  const [focusPref, setFocusPref] = useState(false);
  const [focus, setFocus] = useState(false);
  const [result, setResult] = useState("");
  const run = useRef({ acc: 0, start: 0, lead: 0, leadStart: 0, running: false, lastBeep: "", lastSeg: -1, spoke: {} as Record<string, boolean>, uiSec: -1, uiSeg: -99, digits: "", ticks: -1 });
  const stage = useRef<HTMLDivElement>(null), ring = useRef<HTMLDivElement>(null), digits = useRef<HTMLDivElement>(null), sub = useRef<HTMLDivElement>(null);
  const out = useRef<SVGCircleElement>(null), inn = useRef<SVGCircleElement>(null), comet = useRef<SVGCircleElement>(null), pulse = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null), msg = useRef<HTMLDivElement>(null), roundsEl = useRef<HTMLElement>(null), hint = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null), wake = useRef<{ release: () => Promise<void> } | null>(null), raf = useRef(0);
  const lapsRef = useRef<number[]>([]);
  const cfgRef = useRef(cfg);
  useEffect(() => {
    cfgRef.current = cfg;
  }, [cfg]);
  useEffect(() => {
    setSound(pref("sound", true));
    setVoice(pref("voice", true));
    setFocusPref(pref("focus", false));
  }, []);

  const beep = useCallback(
    (freq = 880, dur = 0.15) => {
      if (!sound) return;
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audio.current) audio.current = new Ctx();
        const a = audio.current;
        if (a.state === "suspended") void a.resume();
        const o = a.createOscillator(), g = a.createGain();
        o.type = "square";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.09, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
        o.connect(g);
        g.connect(a.destination);
        o.start();
        o.stop(a.currentTime + dur + 0.02);
      } catch {
        /* audio no disponible */
      }
    },
    [sound],
  );
  const say = useCallback(
    (text: string) => {
      if (!voice || !("speechSynthesis" in window)) return;
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "es-ES";
        u.rate = 1.08;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch {
        /* voz no disponible */
      }
    },
    [voice],
  );
  const buzz = (p: number | number[]) => {
    try {
      navigator.vibrate?.(p);
    } catch {
      /* sin vibración */
    }
  };
  const elapsed = () => run.current.acc + (run.current.running && run.current.lead <= 0 ? (performance.now() - run.current.start) / 1000 : 0);

  const sizeRing = useCallback(() => {
    const st = stage.current, r = ring.current;
    if (!st || !r) return;
    const sz = Math.max(170, Math.min(st.clientWidth * 0.82, st.clientHeight * 0.74, 380));
    r.style.width = r.style.height = sz + "px";
    if (pulse.current) pulse.current.style.width = pulse.current.style.height = sz * 0.98 + "px";
    if (digits.current) digits.current.style.fontSize = (run.current.lead > 0 ? sz * 0.42 : sz * 0.25) + "px";
  }, []);
  const setDigits = (str: string) => {
    const el = digits.current;
    if (!el) return;
    const R = run.current;
    if (str === R.digits && el.childElementCount) return;
    const prev = R.digits;
    R.digits = str;
    if (el.childElementCount !== str.length) {
      el.innerHTML = [...str].map((c) => `<span class="${c === ":" ? "sep " : ""}in">${c}</span>`).join("");
      return;
    }
    [...str].forEach((c, i) => {
      if (prev[i] !== c) {
        const sp = el.children[i] as HTMLElement;
        sp.textContent = c;
        sp.classList.remove("in");
        void sp.offsetWidth;
        sp.classList.add("in");
      }
    });
  };
  const retrigger = (el: Element | null, cls: string) => {
    if (!el) return;
    el.classList.remove(cls);
    void (el as HTMLElement).offsetWidth;
    el.classList.add(cls);
  };

  const paint = useCallback(
    (done = false) => {
      const R = run.current, c = cfgRef.current, st = stage.current;
      if (!st || !digits.current) return;
      if (R.lead > 0) {
        const left = R.running ? Math.max(0, R.lead - (performance.now() - R.leadStart) / 1000) : R.lead;
        if (!digits.current.classList.contains("lead")) {
          digits.current.classList.add("lead");
          sizeRing();
        }
        setDigits(String(Math.ceil(left)));
        if (sub.current) sub.current.textContent = "Prepárate";
        if (out.current) out.current.style.strokeDashoffset = "295.3";
        if (inn.current) inn.current.style.strokeDashoffset = (219.9 * (left / 10)).toFixed(1);
        const sec = Math.ceil(left);
        if (R.running && sec !== R.uiSec) {
          R.uiSec = sec;
          retrigger(pulse.current, "go");
        }
        return;
      }
      if (digits.current.classList.contains("lead")) {
        digits.current.classList.remove("lead");
        R.digits = "";
        sizeRing();
      }
      const e = elapsed(), s = stateAt(c, e, lapsRef.current.length);
      setDigits(s.up ? clockUp(s.main) : clockDown(s.main));
      if (sub.current) sub.current.textContent = done ? (c.mode === "amrap" ? `${lapsRef.current.length} rondas` : "¡Listo!") : s.sub;
      const f = Math.min(1, s.frac);
      if (out.current) {
        out.current.style.strokeDashoffset = (295.3 * (1 - f)).toFixed(2);
        out.current.setAttribute("stroke", s.rest || c.mode === "rest" ? "url(#k-grc)" : "url(#k-gr)");
      }
      if (inn.current) inn.current.style.strokeDashoffset = (219.9 * (1 - Math.min(1, s.inner))).toFixed(2);
      if (comet.current) {
        comet.current.setAttribute("cx", (50 + 47 * Math.cos(f * 2 * Math.PI)).toFixed(2));
        comet.current.setAttribute("cy", (50 + 47 * Math.sin(f * 2 * Math.PI)).toFixed(2));
      }
      st.classList.toggle("rest", !!s.rest || c.mode === "rest");
      st.classList.toggle("alert", R.running && s.left <= 3.05 && s.left > 0);
      const sec = Math.floor(e);
      if (R.running && sec !== R.uiSec) {
        R.uiSec = sec;
        retrigger(pulse.current, "go");
      }
      if (R.uiSeg !== -99 && s.seg !== R.uiSeg && R.running && flash.current) {
        flash.current.classList.toggle("cool", !!s.rest);
        retrigger(flash.current, "go");
      }
      R.uiSeg = s.seg;
      const on = done ? 60 : Math.floor(e % 60);
      if (on !== R.ticks) {
        R.ticks = on;
        st.querySelectorAll(".tick").forEach((t) => t.classList.toggle("on", Number((t as SVGElement).dataset.i) < on));
      }
      if (hint.current) hint.current.hidden = !(R.running && !done && (c.mode === "amrap" || c.mode === "fortime" || c.mode === "stopwatch"));
    },
    [sizeRing],
  );

  const releaseWake = () => {
    try {
      void wake.current?.release();
    } catch {
      /* sin bloqueo de pantalla */
    }
    wake.current = null;
  };
  const finish = useCallback(
    (forTimeDone: boolean) => {
      const R = run.current, c = cfgRef.current;
      R.acc = c.mode === "stopwatch" ? elapsed() : Math.min(elapsed(), total(c));
      R.running = false;
      cancelAnimationFrame(raf.current);
      releaseWake();
      setRunning(false);
      setFinished(true);
      setFocus(false);
      onRunning(false);
      beep(1200, 0.7);
      buzz([120, 60, 120]);
      say(c.mode === "rest" ? "A por la siguiente" : "¡Tiempo!");
      if (c.mode !== "rest") celebrate(160);
      paint(true);
      if (msg.current) {
        msg.current.textContent = c.mode === "rest" ? "¡A por ello!" : forTimeDone ? "¡Hecho!" : "¡Tiempo!";
        retrigger(msg.current, "show");
      }
      setResult(c.mode === "amrap" ? `${lapsRef.current.length}+` : c.mode === "fortime" ? (forTimeDone ? clockUp(R.acc) : "CAP+") : c.mode === "stopwatch" ? clockUp(R.acc) : "");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [beep, say, paint, onRunning],
  );

  const tick = useCallback(() => {
    const R = run.current, c = cfgRef.current;
    if (!R.running) return;
    const now = performance.now();
    if (R.lead > 0) {
      const left = R.lead - (now - R.leadStart) / 1000, sec = Math.ceil(left);
      if (sec <= 3 && sec > 0 && R.lastBeep !== "L" + sec) {
        R.lastBeep = "L" + sec;
        beep(660);
        say(["", "uno", "dos", "tres"][sec]);
      }
      if (left <= 0) {
        R.lead = 0;
        R.start = now;
        R.acc = 0;
        R.lastSeg = -1;
        beep(1100, 0.4);
        say(c.mode === "rest" ? "Descansa" : "¡Ya!");
      }
      paint();
      raf.current = requestAnimationFrame(tick);
      return;
    }
    const T = total(c), e = elapsed(), s = stateAt(c, e, lapsRef.current.length);
    if (s.seg !== R.lastSeg) {
      if (R.lastSeg >= 0) {
        if (c.mode === "emom") {
          beep(1000, 0.3);
          say("Minuto " + (s.seg + 1));
          buzz(80);
        }
        if (c.mode === "tabata" || c.mode === "intervals") {
          beep(s.rest ? 520 : 1100, 0.3);
          say(s.rest ? "Descansa" : "¡Dale!");
          buzz(80);
        }
      }
      R.lastSeg = s.seg;
    }
    const sl = Math.ceil(s.left);
    if (Number.isFinite(sl) && sl <= 3 && sl > 0 && R.lastBeep !== s.seg + ":" + sl && c.mode !== "fortime") {
      R.lastBeep = s.seg + ":" + sl;
      beep(700, 0.12);
    }
    if ((c.mode === "amrap" || c.mode === "fortime") && T > 120) {
      if (T - e <= 60 && !R.spoke.last) {
        R.spoke.last = true;
        say("Último minuto");
      }
      if (e >= T / 2 && !R.spoke.half) {
        R.spoke.half = true;
        say("Mitad");
      }
    }
    if (e >= T) {
      finish(false);
      return;
    }
    paint();
    raf.current = requestAnimationFrame(tick);
  }, [beep, say, paint, finish]);

  const reset = useCallback(() => {
    cancelAnimationFrame(raf.current);
    run.current = { ...run.current, acc: 0, lead: 0, running: false, lastBeep: "", lastSeg: -1, spoke: {}, uiSec: -1, uiSeg: -99, digits: "", ticks: -1 };
    lapsRef.current = [];
    setLaps([]);
    setRunning(false);
    setFinished(false);
    setFocus(false);
    setResult("");
    releaseWake();
    onRunning(false);
    requestAnimationFrame(() => {
      sizeRing();
      paint();
    });
  }, [onRunning, paint, sizeRing]);

  const toggle = async () => {
    const R = run.current, now = performance.now();
    if (finished) return reset();
    if (R.running) {
      if (R.lead > 0) R.lead = Math.max(0, R.lead - (now - R.leadStart) / 1000);
      else R.acc = elapsed();
      R.running = false;
      cancelAnimationFrame(raf.current);
      releaseWake();
      setRunning(false);
      setFocus(false);
      onRunning(false);
      return;
    }
    if (!R.acc && !R.lead) R.lead = cfg.mode === "rest" ? 0 : 10;
    R.running = true;
    R.start = now;
    R.leadStart = now;
    beep(440, 0.05);
    setRunning(true);
    setFocus(focusPref);
    onRunning(true);
    try {
      const nav = navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } };
      if (nav.wakeLock) wake.current = await nav.wakeLock.request("screen");
    } catch {
      /* sin bloqueo de pantalla */
    }
    raf.current = requestAnimationFrame(tick);
  };

  const lap = () => {
    const R = run.current, c = cfgRef.current;
    if (!R.running || R.lead > 0 || !(c.mode === "amrap" || c.mode === "fortime" || c.mode === "stopwatch")) return;
    lapsRef.current = [...lapsRef.current, elapsed()];
    setLaps(lapsRef.current);
    if (roundsEl.current) {
      roundsEl.current.textContent = String(lapsRef.current.length);
      retrigger(roundsEl.current, "pop");
    }
    retrigger(flash.current, "go");
    beep(990, 0.06);
    buzz(30);
  };

  const toggleRef = useRef(toggle);
  useEffect(() => {
    toggleRef.current = toggle;
  });
  // Aplicar un preset que llega desde una sesión.
  useEffect(() => {
    if (!preset || run.current.running) return;
    setCfg((c) => ({
      ...c,
      mode: preset.mode,
      minutes: preset.minutes ?? c.minutes,
      rounds: preset.rounds ?? c.rounds,
      work: preset.work ?? c.work,
      rest: preset.rest ?? c.rest,
      restSecs: preset.seconds ?? c.restSecs,
    }));
    reset();
    if (preset.mode === "rest") setTimeout(() => void toggleRef.current(), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetKey]);

  useEffect(() => {
    if (visible)
      requestAnimationFrame(() => {
        sizeRing();
        run.current.digits = "";
        paint(finished);
      });
  }, [visible, cfg, finished, sizeRing, paint]);
  useEffect(() => {
    const r = () => sizeRing();
    window.addEventListener("resize", r);
    const vis = async () => {
      if (!document.hidden && run.current.running) {
        try {
          const nav = navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } };
          if (nav.wakeLock) wake.current = await nav.wakeLock.request("screen");
        } catch {
          /* sin bloqueo */
        }
      }
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("resize", r);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [sizeRing]);
  useEffect(() => {
    document.body.classList.toggle("k-focus", focus && visible);
  }, [focus, visible]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const idle = !running && !finished && !run.current.acc && !run.current.lead;
  const step = (k: keyof Cfg, d: number, min: number, max: number) => setCfg((c) => ({ ...c, [k]: Math.min(max, Math.max(min, (c[k] as number) + d)) }));
  const stepper = (k: keyof Cfg, label: string, val: string, d: number, min: number, max: number) => (
    <div className="k-stepper">
      <button className="k-icon" aria-label={"Menos " + label} onClick={() => step(k, -d, min, max)}>
        −
      </button>
      <div>
        <b>{val}</b>
        <small>{label.toUpperCase()}</small>
      </div>
      <button className="k-icon" aria-label={"Más " + label} onClick={() => step(k, d, min, max)}>
        +
      </button>
    </div>
  );
  const ticks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * 2 * Math.PI, r1 = 39, r2 = i % 5 ? 41.5 : 43;
        return <line key={i} className="tick" data-i={i} x1={50 + r1 * Math.cos(a)} y1={50 + r1 * Math.sin(a)} x2={50 + r2 * Math.cos(a)} y2={50 + r2 * Math.sin(a)} />;
      }),
    [],
  );
  const counting = cfg.mode === "amrap" || cfg.mode === "fortime" || cfg.mode === "stopwatch";
  const name = MODES.find((m) => m[0] === cfg.mode)![1];

  return (
    <section className="k-tpage" hidden={!visible} aria-label="Cronómetro">
      {originLabel && (
        <div className="k-origin k-hide">
          <span>{originLabel}</span>
          <button className="k-icon" style={{ width: 32, height: 32 }} aria-label="Quitar sesión" onClick={clearOrigin}>
            <X size={14} />
          </button>
        </div>
      )}
      <div className="ios-seg scroll k-hide" role="group" aria-label="Formato">
        {MODES.map(([m, l]) => (
          <button
            key={m}
            aria-pressed={cfg.mode === m}
            disabled={running}
            onClick={() => {
              setCfg((c) => ({ ...c, mode: m, minutes: m === "emom" && c.minutes === 15 ? 10 : m !== "emom" && c.minutes === 10 ? 15 : c.minutes }));
              reset();
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div className={"k-stage-t" + (running ? " running" : "")} ref={stage} onClick={counting ? lap : undefined}>
        <div className="k-stars" aria-hidden="true">
          {STARS.map(([x, y, d], i) => (
            <i key={i} style={{ left: x + "%", top: y + "%", animationDelay: d + "s" }} />
          ))}
        </div>
        <div className="k-sun" aria-hidden="true" />
        <svg className="k-mts" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="b" d="M0 100V62l40-22 38 18 46-34 44 30 34-16 52 36 40-26 46 20 60-30v62z" />
          <path className="f" d="M0 100V78l60-24 50 22 60-30 50 26 46-14 54 24 80-26v44z" />
          <path className="e" d="M0 78l60-24 50 22 60-30 50 26 46-14 54 24 80-26" />
        </svg>
        <div className="k-grid" aria-hidden="true" />
        <div className="k-pulse" ref={pulse} />
        <div className="k-tring" ref={ring}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <linearGradient id="k-gr" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FFE08A" />
                <stop offset=".5" stopColor="#FF86BC" />
                <stop offset="1" stopColor="#B39BFF" />
              </linearGradient>
              <linearGradient id="k-grc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#E8FAFF" />
                <stop offset="1" stopColor="#7DD6FF" />
              </linearGradient>
            </defs>
            <circle className="gl" cx="50" cy="50" r="37" />
            <circle className="tk" cx="50" cy="50" r="47" fill="none" strokeWidth="4" />
            <circle className="pg" ref={out} cx="50" cy="50" r="47" fill="none" stroke="url(#k-gr)" strokeWidth="4" strokeLinecap="round" strokeDasharray="295.3" strokeDashoffset="295.3" />
            <circle className="pg2" ref={inn} cx="50" cy="50" r="35" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="219.9" strokeDashoffset="219.9" />
            {ticks}
            <circle className="comet" ref={comet} cx="97" cy="50" r="2.6" />
          </svg>
        </div>
        <div className="k-face">
          <div className="k-mname">{name}</div>
          <div className="k-digits" ref={digits} role="timer" aria-live="off" />
          <div className="k-sub" ref={sub} />
        </div>
        {counting && (
          <div className="k-rounds">
            <small>RONDAS</small>
            <b ref={roundsEl as React.RefObject<HTMLElement>}>{laps.length}</b>
          </div>
        )}
        {counting && (
          <div className="k-hint" ref={hint} hidden>
            Toca la pantalla al cerrar cada ronda
          </div>
        )}
        <div className="k-flash" ref={flash} />
        <div className="k-bigmsg" ref={msg} />
      </div>
      {idle && (
        <div className="k-cfg k-hide">
          {cfg.mode === "tabata" || cfg.mode === "intervals" ? (
            <>
              {stepper("work", "trabajo", cfg.work + "″", 5, 5, 600)}
              {stepper("rest", "descanso", cfg.rest + "″", 5, 0, 600)}
              {stepper("rounds", "rondas", String(cfg.rounds), 1, 1, 60)}
            </>
          ) : cfg.mode === "rest" ? (
            <div className="ios-seg">
              {[60, 90, 120, 180].map((s) => (
                <button key={s} aria-pressed={cfg.restSecs === s} onClick={() => setCfg((c) => ({ ...c, restSecs: s }))}>
                  {s < 120 ? s + "″" : s / 60 + "′"}
                </button>
              ))}
            </div>
          ) : cfg.mode === "stopwatch" ? null : (
            stepper("minutes", "minutos", cfg.minutes + "′", 1, 1, 90)
          )}
        </div>
      )}
      <div className="k-laps">
        {laps.slice(-10).map((t, i, arr) => {
          const idx = laps.length - arr.length + i, prev = idx ? laps[idx - 1] : 0;
          return <span key={idx}>R{idx + 1} · {clockUp(t - prev)}</span>;
        })}
      </div>
      {finished && result !== "" && (
        <div className="ios-card ios-stack k-hide">
          <label className="ios-field">
            <span>{cfg.mode === "amrap" ? "Rondas + reps sueltas" : "Tiempo"}</span>
            <input value={result} onChange={(e) => setResult(e.target.value)} />
          </label>
          {originLabel ? (
            <button className="k-btn primary block" onClick={() => { onResult(result); reset(); }}>
              Guardar en la sesión
            </button>
          ) : (
            <p className="ios-foot">Empieza el cronómetro desde una sesión para guardar el resultado en tu registro.</p>
          )}
        </div>
      )}
      <div className="k-ctl">
        <button className="k-icon" aria-label="Reiniciar" onClick={reset}>
          <RotateCcw size={20} />
        </button>
        <button className={"k-play" + (running ? " pause" : "")} onClick={() => void toggle()}>
          {finished ? <><RotateCcw /> OTRA</> : running ? <><Pause /> PAUSA</> : <><Play /> {run.current.acc || run.current.lead ? "SEGUIR" : "EMPEZAR"}</>}
        </button>
        <button
          className="k-icon"
          aria-pressed={sound}
          aria-label={sound ? "Silenciar" : "Activar sonido"}
          onClick={() => {
            setSound(!sound);
            setPref("sound", !sound);
          }}
        >
          {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
      {focus && visible && (
        <button className="k-icon k-focus-x" aria-label="Salir de pantalla completa" onClick={() => setFocus(false)}>
          <X size={18} />
        </button>
      )}
    </section>
  );
}

export function setTimerPref(k: "voice" | "focus" | "sound", v: boolean) {
  setPref(k, v);
}
export function getTimerPref(k: "voice" | "focus" | "sound", d: boolean) {
  return pref(k, d);
}
export function presetFromBlock(title: string, text: string, minutes: number, interval?: { rounds: number; work: number; rest: number } | null, cap?: number): TimerPreset {
  const t = (title + " " + text).toLowerCase();
  if (interval) return { mode: "intervals", rounds: interval.rounds, work: interval.work, rest: interval.rest };
  const n = (re: RegExp) => {
    const m = t.match(re);
    return m ? Number(m[1]) : null;
  };
  if (/tabata/.test(t)) return { mode: "tabata", rounds: 8, work: 20, rest: 10 };
  const emom = n(/e(?:2)?mom\s*(\d+)/);
  if (emom) return { mode: "emom", minutes: emom };
  const amrap = n(/amrap\s*(\d+)/);
  if (amrap) return { mode: "amrap", minutes: amrap };
  if (/for time|por tiempo/.test(t)) return { mode: "fortime", minutes: n(/cap\s*(\d+)/) || cap || minutes };
  return { mode: "amrap", minutes };
}
