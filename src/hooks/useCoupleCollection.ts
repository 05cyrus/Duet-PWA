"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { QueryConstraint } from "firebase/firestore";
import { listenToCollection } from "@/lib/firebase/db";
import { useCouple } from "@/providers/CoupleProvider";

/**
 * Realtime subscription to a couple sub-collection.
 * `constraints` are memoised by the `deps` array (query objects are not stable).
 */
export function useCoupleCollection<T>(
  sub: string,
  makeConstraints: () => QueryConstraint[],
  deps: unknown[] = [],
): { items: T[]; loading: boolean } {
  const { coupleId } = useCouple();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const makeRef = useRef(makeConstraints);
  makeRef.current = makeConstraints;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const constraints = useMemo(() => makeRef.current(), deps);

  useEffect(() => {
    if (!coupleId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return listenToCollection<T>(
      coupleId, sub, constraints,
      (data) => { setItems(data); setLoading(false); },
      () => setLoading(false),
    );
  }, [coupleId, sub, constraints]);

  return { items, loading };
}
