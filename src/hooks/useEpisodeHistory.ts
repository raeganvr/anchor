"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import type { Episode } from "@/data/mockData";
import { mockEpisodes } from "@/data/mockData";

const STORAGE_KEY = "anchor_episode_history_v1";

function formatEpisodeDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatEpisodeTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function useEpisodeHistory() {
  const [episodes, setEpisodes] = useState<Episode[]>(mockEpisodes);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (client-only store).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Episode[];
        if (Array.isArray(parsed)) {
          startTransition(() => {
            setEpisodes(parsed);
          });
        }
      }
    } catch {
      // keep default
    }
    startTransition(() => {
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(episodes));
    } catch {
      // ignore quota / private mode
    }
  }, [episodes, hydrated]);

  const addEpisode = useCallback((dateInput: string, notes: string) => {
    const d = new Date(dateInput + "T12:00:00");
    const now = new Date();
    const created: Episode = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `ep-${Date.now()}`,
      date: formatEpisodeDate(d),
      time: formatEpisodeTime(now),
      duration: 5,
      triggerType: "manual",
      engaged: true,
      notes: notes.trim() || undefined,
    };
    setEpisodes((prev) => [created, ...prev]);
  }, []);

  const updateEpisodeNotes = useCallback((id: string, notes: string) => {
    const trimmed = notes.trim();
    setEpisodes((prev) =>
      prev.map((ep) =>
        ep.id === id ? { ...ep, notes: trimmed || undefined } : ep
      )
    );
  }, []);

  const deleteEpisode = useCallback((id: string) => {
    setEpisodes((prev) => prev.filter((ep) => ep.id !== id));
  }, []);

  return { episodes, addEpisode, updateEpisodeNotes, deleteEpisode, hydrated };
}
