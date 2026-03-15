import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { BubbleCategory } from "@/data/bubbleData";

export interface Session {
  id?: string;
  userId: string;
  bubbleId: string;
  bubbleName: string;
  category: BubbleCategory;
  tags: string[];
  parentSessionId?: string;
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
  duration: number;    // minutes
  date: string;        // "YYYY-MM-DD"
  notes?: string;
  createdAt?: unknown;
}

export const useSessions = (date?: string) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const targetDate = date ?? new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    console.log("[Sessions] Listening for", targetDate);

    const q = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid),
      where("date", "==", targetDate),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        console.log("[Sessions] onSnapshot —", snap.size, "docs for", targetDate);
        const items = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as Session) }))
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        setSessions(items);
        setLoading(false);
      },
      (err) => {
        console.error("[Sessions] ❌ Listener error:", err);
        setLoading(false);
      },
    );

    return unsub;
  }, [user, targetDate]);

  const addSession = useCallback(
    async (data: Omit<Session, "id" | "userId" | "createdAt">) => {
      if (!user) return null;
      console.log("[Sessions] addSession:", data.bubbleName, data.startTime, "–", data.endTime);
      try {
        // Strip undefined fields before writing
        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(data)) {
          if (v !== undefined) clean[k] = v;
        }
        const ref = await addDoc(collection(db, "sessions"), {
          ...clean,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        console.log("[Sessions] ✅ Created:", ref.id);
        return ref.id;
      } catch (err) {
        console.error("[Sessions] ❌ addSession FAILED:", err);
        console.error("[Sessions]   ↳ Check Firestore security rules for sessions collection.");
        return null;
      }
    },
    [user],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!user) return;
      try {
        await deleteDoc(doc(db, "sessions", sessionId));
        console.log("[Sessions] ✅ Deleted:", sessionId);
      } catch (err) {
        console.error("[Sessions] ❌ deleteSession FAILED:", err);
      }
    },
    [user],
  );

  return { sessions, loading, addSession, deleteSession };
};
