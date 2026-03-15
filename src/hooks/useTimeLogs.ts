import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export interface TimeLog {
  id?: string;
  userId: string;
  bubbleId: string;
  bubbleName: string;
  duration: number; // minutes
  date: string;
  createdAt?: unknown;
  type?: "manual" | "pomodoro";
}

export const useTimeLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TimeLog[]>([]);

  useEffect(() => {
    if (!user) return;

    console.log("[TimeLogs] Setting up Firestore listener for user:", user.uid);

    // Simple query without orderBy — avoids composite index requirement
    const q = query(
      collection(db, "timeLogs"),
      where("userId", "==", user.uid),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        console.log("[TimeLogs] onSnapshot — docs:", snap.size);
        const items = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as TimeLog) }))
          // Sort client-side by date descending (ISO strings sort lexicographically)
          .sort((a, b) => b.date.localeCompare(a.date));
        setLogs(items);
      },
      (err) => {
        console.error("[TimeLogs] ❌ Listener error:", err);
        const msg = (err as Error)?.message ?? "";
        if (msg.includes("index")) {
          console.error("[TimeLogs]   ↳ A composite index may be required. Check the link above to create it.");
        }
      },
    );
    return unsub;
  }, [user]);

  const logTime = async (
    bubbleId: string,
    bubbleName: string,
    duration: number,
    type: "manual" | "pomodoro" = "manual",
  ) => {
    if (!user) return;
    console.log(`[TimeLogs] logTime("${bubbleName}", ${duration}min, ${type})`);

    try {
      const docRef = await addDoc(collection(db, "timeLogs"), {
        userId: user.uid,
        bubbleId,
        bubbleName,
        duration,
        date: new Date().toISOString().split("T")[0],
        type,
        createdAt: serverTimestamp(),
      });
      console.log(`[TimeLogs] ✅ Logged to Firestore: ${docRef.id}`);
    } catch (err) {
      console.error("[TimeLogs] ❌ logTime FAILED:", err);
      console.error("[TimeLogs]   ↳ Check Firestore security rules.");
    }
  };

  return { logs, logTime };
};
