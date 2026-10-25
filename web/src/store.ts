// Almacenamiento de la versión abierta: todo vive en el dispositivo (localStorage).
// Usa el mismo formato Store que el resto de KOVA, así las copias y Google Drive son compatibles.
import { useCallback, useEffect, useRef, useState } from "react";
import { Store, Entry, Profile, Plan, emptyStore, mergeStores, validStore } from "../../app/lib/engine";

export const STORE_KEY = "kova-v1-local";
export type Collection = "logs" | "checks" | "marks" | "records" | "nutrition";

function load(): Store {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    const s = raw?.state ?? raw;
    if (s && validStore(s)) return s;
  } catch {
    /* copia dañada: se empieza de cero sin borrar nada */
  }
  return emptyStore();
}

export function useLocalStore() {
  const [state, setState] = useState<Store>(emptyStore);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState("");
  const ref = useRef<Store>(state);

  useEffect(() => {
    ref.current = load();
    setState(ref.current);
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) {
        ref.current = mergeStores(ref.current, load());
        setState(ref.current);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const mutate = useCallback((fn: (s: Store) => Store) => {
    const next = fn(ref.current);
    ref.current = next;
    setState(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ state: next, revision: 0, dirty: false }));
      setSaveError("");
    } catch {
      setSaveError("El almacenamiento del navegador está lleno. Exporta una copia desde Perfil → Datos.");
    }
  }, []);

  const put = useCallback(
    (key: Collection, entry: Entry) =>
      mutate((s) => ({ ...s, [key]: [...((s[key] as Entry[] | undefined) || []).filter((x) => x.id !== entry.id), entry] })),
    [mutate],
  );
  const putProfile = useCallback(
    (p: Profile) => mutate((s) => ({ ...s, profiles: [...s.profiles.filter((x) => x.id !== p.id), p] })),
    [mutate],
  );
  const putPlan = useCallback((p: Plan) => mutate((s) => ({ ...s, plans: [...s.plans.filter((x) => x.id !== p.id), p] })), [mutate]);
  const integrate = useCallback((remote: Store) => mutate((s) => mergeStores(remote, s)), [mutate]);

  return { state, ready, mutate, put, putProfile, putPlan, integrate, snapshot: () => ref.current, saveError };
}
