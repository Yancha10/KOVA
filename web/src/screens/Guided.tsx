import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, RotateCcw } from "lucide-react";
import { guideSteps } from "../extras";
import { getTimerPref } from "./TimerView";

/** Recorre un bloque paso a paso, leyendo cada ejercicio en voz alta con su cuenta atrás. */
export default function Guided({ title, text, minutes, done }: { title: string; text: string; minutes: number; done: () => void }) {
  const steps = useRef(guideSteps(text, minutes)).current;
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(steps[0].seconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const say = (t: string) => {
    if (!getTimerPref("voice", true) || !("speechSynthesis" in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "es-ES";
      u.rate = 1.02;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch {
      /* voz no disponible */
    }
  };
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setI((cur) => {
            const nx = cur + 1;
            if (nx >= steps.length) {
              setRunning(false);
              setFinished(true);
              say("Bloque terminado. ¡Buen trabajo!");
              return cur;
            }
            setLeft(steps[nx].seconds);
            say(steps[nx].text);
            try {
              navigator.vibrate?.(80);
            } catch {
              /* sin vibración */
            }
            return nx;
          });
          return 0;
        }
        if (l === 4) say("Tres, dos, uno");
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  useEffect(() => () => speechSynthesis?.cancel?.(), []);
  const cur = steps[i], next = steps[i + 1];
  const frac = cur.seconds ? 1 - left / cur.seconds : 1;
  const C = 2 * Math.PI * 54;
  return (
    <div className="ios-stack k-guided">
      <p className="k-kicker">
        {title} · paso {i + 1} de {steps.length}
      </p>
      <div className="k-guided-card">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="54" className="tr" />
          <circle cx="60" cy="60" r="54" className="vl" strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - frac)).toFixed(1)} />
        </svg>
        <b className="k-guided-time">{finished ? "✓" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}</b>
      </div>
      <p className="k-guided-now">{finished ? "¡Bloque terminado!" : cur.text}</p>
      {next && !finished && <p className="ios-foot center">Después: {next.text}</p>}
      <div className="k-ctl">
        <button
          className="k-icon"
          aria-label="Reiniciar"
          onClick={() => {
            setI(0);
            setLeft(steps[0].seconds);
            setFinished(false);
            setRunning(false);
          }}
        >
          <RotateCcw size={20} />
        </button>
        {finished ? (
          <button className="k-play" onClick={done}>
            Siguiente bloque
          </button>
        ) : (
          <button
            className={"k-play" + (running ? " pause" : "")}
            onClick={() => {
              if (!running && i === 0 && left === steps[0].seconds) say(cur.text);
              setRunning(!running);
            }}
          >
            {running ? <><Pause /> PAUSA</> : <><Play /> {i || left !== steps[0].seconds ? "SEGUIR" : "EMPEZAR"}</>}
          </button>
        )}
        <button
          className="k-icon"
          aria-label="Saltar paso"
          disabled={finished}
          onClick={() => {
            if (i + 1 >= steps.length) {
              setRunning(false);
              setFinished(true);
              return;
            }
            setI(i + 1);
            setLeft(steps[i + 1].seconds);
            say(steps[i + 1].text);
          }}
        >
          <SkipForward size={20} />
        </button>
      </div>
      <ol className="k-guided-list">
        {steps.map((s, k) => (
          <li key={k} className={k < i || finished ? "done" : k === i ? "on" : ""}>
            <span>{s.text}</span>
            <small>{s.seconds >= 60 ? Math.round(s.seconds / 60) + "′" : s.seconds + "″"}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}
