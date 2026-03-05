import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BubbleItem, defaultBubbles } from "@/data/bubbleData";
import { useAuth } from "@/contexts/AuthContext";

export const useFirestoreBubbles = () => {
  const { user } = useAuth();
  const [bubbles, setBubbles] = useState<BubbleItem[]>(defaultBubbles);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "bubbles"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, async (snap) => {
      if (snap.empty) {
        // Seed defaults for new user
        const batch = writeBatch(db);
        defaultBubbles.forEach(b => {
          const ref = doc(collection(db, "bubbles"));
          batch.set(ref, {
            ...b,
            userId: user.uid,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
        return;
      }
      const items: BubbleItem[] = snap.docs.map(d => ({
        ...(d.data() as BubbleItem),
        firestoreId: d.id,
      }));
      setBubbles(items);
      setLoaded(true);
    });
    return unsub;
  }, [user]);

  const updateBubbleHours = async (bubbleId: string, additionalMinutes: number) => {
    if (!user) return;
    // optimistic local update
    setBubbles(prev => prev.map(b => {
      if (b.id === bubbleId) return { ...b, actualWeeklyHours: b.actualWeeklyHours + additionalMinutes / 60 };
      const child = b.children?.find(c => c.id === bubbleId);
      if (child) return { ...b, actualWeeklyHours: b.actualWeeklyHours + additionalMinutes / 60 };
      return b;
    }));
  };

  return { bubbles, setBubbles, updateBubbleHours, loaded };
};
