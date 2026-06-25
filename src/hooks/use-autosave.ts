import { useEffect, useRef } from "react";
import { saveDraft } from "./use-builder-draft";
import type { Section } from "@/components/profile-builder/types";

const AUTOSAVE_DELAY_MS = 1500; // tunggu 1.5 detik setelah perubahan terakhir

export function useAutosave(
  programId: string,
  sections: Section[],
  schemaVersion: number,
  isDirty: boolean // hanya autosave jika ada perubahan yang belum disimpan
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    // Reset timer setiap ada perubahan baru
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      saveDraft(programId, sections, schemaVersion);
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sections, isDirty, programId, schemaVersion]);
}
