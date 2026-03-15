import { useEffect, useState, useCallback, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  serverTimestamp,
  writeBatch,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BubbleItem, defaultBubbles } from "@/data/bubbleData";
import { useAuth } from "@/contexts/AuthContext";

/** Return a copy of the default bubbles with actualWeeklyHours reset to 0 */
const freshSeedBubbles = (): BubbleItem[] =>
  defaultBubbles.map(b => ({
    ...b,
    actualWeeklyHours: 0,
    children: b.children?.map(c => ({ ...c, actualWeeklyHours: 0 })),
  }));

/**
 * Strip undefined values from an object before writing to Firestore.
 * Firestore rejects `undefined` fields in some SDK versions.
 */
const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      clean[k] = v.map(item =>
        typeof item === "object" && item !== null
          ? sanitize(item as Record<string, unknown>)
          : item,
      );
    } else {
      clean[k] = v;
    }
  }
  return clean;
};

export const useFirestoreBubbles = () => {
  const { user } = useAuth();
  const [bubbles, setBubbles] = useState<(BubbleItem & { firestoreId?: string })[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Ref always points to the latest bubbles — avoids stale closures in callbacks
  const bubblesRef = useRef(bubbles);
  bubblesRef.current = bubbles;

  useEffect(() => {
    if (!user) {
      setBubbles([]);
      setLoaded(false);
      return;
    }

    console.log("[Bubbles] Setting up Firestore listener for user:", user.uid);

    const q = query(collection(db, "bubbles"), where("userId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      async (snap) => {
        console.log("[Bubbles] onSnapshot — docs:", snap.size);

        if (snap.empty) {
          console.log("[Bubbles] No bubbles found. Seeding defaults…");
          try {
            const batch = writeBatch(db);
            for (const b of freshSeedBubbles()) {
              const ref = doc(collection(db, "bubbles"));
              batch.set(ref, sanitize({
                ...b,
                userId: user.uid,
                createdAt: serverTimestamp(),
              }));
            }
            await batch.commit();
            console.log("[Bubbles] ✅ Seed committed — listener will re-fire");
            // Don't set state here — onSnapshot re-fires with the seeded data
          } catch (err) {
            console.error("[Bubbles] ❌ Seed FAILED:", err);
            console.error("[Bubbles]   ↳ Check Firestore security rules & that Firestore is enabled.");
            // Fallback to local defaults so the UI isn't empty
            setBubbles(freshSeedBubbles());
            setLoaded(true);
          }
          return;
        }

        const items = snap.docs.map(d => ({
          ...(d.data() as BubbleItem),
          firestoreId: d.id,
        }));
        console.log(
          "[Bubbles] ✅ Loaded from Firestore:",
          items.map(b => `${b.name}(${b.firestoreId?.slice(0, 6)}…)`).join(", "),
        );
        setBubbles(items);
        setLoaded(true);
      },
      (err) => {
        console.error("[Bubbles] ❌ Listener error:", err);
        console.error("[Bubbles]   ↳ Falling back to local defaults. Data will NOT persist.");
        setBubbles(freshSeedBubbles());
        setLoaded(true);
      },
    );
    return unsub;
  }, [user]);

  /** Optimistically update actual hours and persist to Firestore */
  const updateBubbleHours = useCallback(
    async (bubbleId: string, additionalMinutes: number) => {
      if (!user) return;
      console.log(`[Bubbles] updateBubbleHours("${bubbleId}", +${additionalMinutes}min)`);

      // Optimistic UI update
      setBubbles(prev =>
        prev.map(b => {
          if (b.id === bubbleId) {
            return { ...b, actualWeeklyHours: b.actualWeeklyHours + additionalMinutes / 60 };
          }
          if (b.children?.some(c => c.id === bubbleId)) {
            return {
              ...b,
              actualWeeklyHours: b.actualWeeklyHours + additionalMinutes / 60,
              children: b.children.map(c =>
                c.id === bubbleId
                  ? { ...c, actualWeeklyHours: c.actualWeeklyHours + additionalMinutes / 60 }
                  : c,
              ),
            };
          }
          return b;
        }),
      );

      // Use ref for latest bubbles (avoids stale closure)
      const current = bubblesRef.current;
      const target = current.find(
        b => b.id === bubbleId || b.children?.some(c => c.id === bubbleId),
      ) as (BubbleItem & { firestoreId?: string }) | undefined;

      if (!target?.firestoreId) {
        console.warn(`[Bubbles] ⚠️ No firestoreId for "${bubbleId}" — Firestore write SKIPPED.`);
        console.warn("[Bubbles]   ↳ Initial seed likely failed. Check Firestore security rules.");
        return;
      }

      try {
        const isChild = target.children?.some(c => c.id === bubbleId);
        const updates: Record<string, unknown> = {
          // Use atomic increment — avoids race conditions with rapid logging
          actualWeeklyHours: increment(additionalMinutes / 60),
        };
        if (isChild && target.children) {
          // Children array needs a read-modify-write (increment isn't available on array elements)
          updates.children = target.children.map(c =>
            c.id === bubbleId
              ? { ...c, actualWeeklyHours: c.actualWeeklyHours + additionalMinutes / 60 }
              : c,
          );
        }
        await updateDoc(doc(db, "bubbles", target.firestoreId), updates);
        console.log(`[Bubbles] ✅ Firestore write OK: ${target.name} +${(additionalMinutes / 60).toFixed(2)}h`);
      } catch (err) {
        console.error("[Bubbles] ❌ Firestore write FAILED:", err);
      }
    },
    [user], // Only depends on user — uses bubblesRef for latest state
  );

  /** Update the expected weekly hours for a bubble and persist to Firestore */
  const updateExpectedHours = useCallback(
    async (bubbleId: string, newExpected: number) => {
      if (!user) return;
      console.log(`[Bubbles] updateExpectedHours("${bubbleId}", ${newExpected}h)`);

      setBubbles(prev =>
        prev.map(b =>
          b.id === bubbleId ? { ...b, expectedWeeklyHours: newExpected } : b,
        ),
      );

      const current = bubblesRef.current;
      const target = current.find(b => b.id === bubbleId) as
        | (BubbleItem & { firestoreId?: string })
        | undefined;

      if (!target?.firestoreId) {
        console.warn(`[Bubbles] ⚠️ No firestoreId for "${bubbleId}" — Firestore write SKIPPED.`);
        return;
      }

      try {
        await updateDoc(doc(db, "bubbles", target.firestoreId), {
          expectedWeeklyHours: newExpected,
        });
        console.log(`[Bubbles] ✅ Expected hours updated: ${target.name} → ${newExpected}h`);
      } catch (err) {
        console.error("[Bubbles] ❌ Firestore write FAILED:", err);
      }
    },
    [user],
  );

  return { bubbles, setBubbles, updateBubbleHours, updateExpectedHours, loaded };
};
