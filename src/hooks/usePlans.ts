import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface TimeSlot {
  day: string;       // "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface Plan {
  id?: string;
  userId: string;
  bubbleId: string;
  weeklyTarget: number;
  selectedDays: string[];
  dailyAllocation: number;
  timeSlots: TimeSlot[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const usePlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }

    console.log("[Plans] Setting up Firestore listener for user:", user.uid);
    const q = query(collection(db, "plans"), where("userId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Plan) }));
        console.log("[Plans] Loaded:", items.length, "plans");
        setPlans(items);
        setLoading(false);
      },
      (err) => {
        console.error("[Plans] ❌ Listener error:", err);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  const savePlan = useCallback(
    async (data: Omit<Plan, "id" | "userId" | "createdAt" | "updatedAt">) => {
      if (!user) return null;
      const existing = plans.find(p => p.bubbleId === data.bubbleId);
      try {
        if (existing?.id) {
          await updateDoc(doc(db, "plans", existing.id), {
            ...data,
            updatedAt: serverTimestamp(),
          });
          console.log("[Plans] ✅ Updated plan for bubble:", data.bubbleId);
          return existing.id;
        } else {
          const ref = await addDoc(collection(db, "plans"), {
            ...data,
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log("[Plans] ✅ Created plan:", ref.id);
          return ref.id;
        }
      } catch (err) {
        console.error("[Plans] ❌ savePlan FAILED:", err);
        return null;
      }
    },
    [user, plans],
  );

  const deletePlan = useCallback(
    async (planId: string) => {
      if (!user) return;
      try {
        await deleteDoc(doc(db, "plans", planId));
        console.log("[Plans] ✅ Deleted plan:", planId);
      } catch (err) {
        console.error("[Plans] ❌ deletePlan FAILED:", err);
      }
    },
    [user],
  );

  const getPlanForBubble = useCallback(
    (bubbleId: string) => plans.find(p => p.bubbleId === bubbleId),
    [plans],
  );

  return { plans, loading, savePlan, deletePlan, getPlanForBubble };
};
