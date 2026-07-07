"use client";

import * as React from "react";

export interface DraftEntry {
  key: string;
  programId: string;
  participantId: string;
  participant: Record<string, any>;
  evaluationStatus: "VERIFIED" | "REJECTED" | null;
  approvalDescription: string;
  rowIndex: number;
  updatedAt: number;
}

// Custom event name for local updates within the same tab
export const DRAFT_UPDATED_EVENT = "draft-updated";

// Helper to get all drafts from localStorage
export function getAllDrafts(): DraftEntry[] {
  if (typeof window === "undefined") return [];
  
  const drafts: DraftEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("draft_")) {
        const parts = key.split("_");
        // Format: draft_${programId}_${participantId}
        if (parts.length >= 3) {
          const programId = parts[1];
          const participantId = parts.slice(2).join("_"); // handle potential underscores in ID
          
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const data = JSON.parse(raw);
              drafts.push({
                key,
                programId: data.programId || programId,
                participantId: data.participantId || participantId,
                participant: data.participant || {},
                evaluationStatus: data.evaluationStatus || null,
                approvalDescription: data.approvalDescription || "",
                rowIndex: typeof data.rowIndex === "number" ? data.rowIndex : 0,
                updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
              });
            } catch (e) {
              console.error("Failed to parse draft for key:", key, e);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to read from localStorage", error);
  }
  
  // Sort by updatedAt descending (newest first)
  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}

// Reactive hook to get the count of drafts
export function useDraftsCount() {
  const [count, setCount] = React.useState<number>(0);

  const updateCount = React.useCallback(() => {
    const all = getAllDrafts();
    setCount(all.length);
  }, []);

  React.useEffect(() => {
    updateCount();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("draft_")) {
        updateCount();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(DRAFT_UPDATED_EVENT, updateCount);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(DRAFT_UPDATED_EVENT, updateCount);
    };
  }, [updateCount]);

  return { data: count, refetch: updateCount };
}

// Reactive hook to get all drafts list and management actions
export function useDrafts() {
  const [drafts, setDrafts] = React.useState<DraftEntry[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const refreshDrafts = React.useCallback(() => {
    setDrafts(getAllDrafts());
    setIsLoaded(true);
  }, []);

  React.useEffect(() => {
    refreshDrafts();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("draft_")) {
        refreshDrafts();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(DRAFT_UPDATED_EVENT, refreshDrafts);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(DRAFT_UPDATED_EVENT, refreshDrafts);
    };
  }, [refreshDrafts]);

  const deleteDraft = React.useCallback((programId: string, participantId: string) => {
    if (typeof window === "undefined") return;
    const key = `draft_${programId}_${participantId}`;
    localStorage.removeItem(key);
    // Dispatch events to trigger reactive updates in all components
    window.dispatchEvent(new Event(DRAFT_UPDATED_EVENT));
  }, []);

  return {
    data: drafts,
    isLoaded,
    deleteDraft,
    refetch: refreshDrafts,
  };
}
