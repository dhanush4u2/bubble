import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "firebase/firestore";
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
    const q = query(
      collection(db, "timeLogs"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...(d.data() as TimeLog) })));
    });
    return unsub;
  }, [user]);

  const logTime = async (bubbleId: string, bubbleName: string, duration: number, type: "manual" | "pomodoro" = "manual") => {
    if (!user) return;
    await addDoc(collection(db, "timeLogs"), {
      userId: user.uid,
      bubbleId,
      bubbleName,
      duration,
      date: new Date().toISOString().split("T")[0],
      type,
      createdAt: serverTimestamp(),
    });
  };

  return { logs, logTime };
};
