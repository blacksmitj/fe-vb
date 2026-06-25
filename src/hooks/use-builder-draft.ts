import type { BuilderDraft, Section } from "@/components/profile-builder/types";

const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari — draft lama otomatis dibuang

const draftKey = (programId: string) => `verif-builder-draft-${programId}`;

// Simpan draft ke localStorage (dipanggil oleh autosave)
export function saveDraft(
  programId: string,
  sections: Section[],
  schemaVersion: number
): void {
  if (typeof window === "undefined") return;
  const draft: BuilderDraft = {
    programId,
    sections,
    savedAt: Date.now(),
    schemaVersion,
  };
  try {
    localStorage.setItem(draftKey(programId), JSON.stringify(draft));
  } catch {
    console.warn("[BuilderDraft] localStorage penuh, draft tidak tersimpan.");
  }
}

// Muat draft — return null jika tidak ada, expired, atau versi tidak cocok
export function loadDraft(
  programId: string,
  currentSchemaVersion: number
): { sections: Section[]; savedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(draftKey(programId));
    if (!raw) return null;

    const draft: BuilderDraft = JSON.parse(raw);

    // Buang draft yang sudah lebih dari 7 hari
    if (Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      clearDraft(programId);
      return null;
    }

    // Buang draft yang dibuat dari versi schema yang sudah usang.
    if (draft.schemaVersion < currentSchemaVersion) {
      clearDraft(programId);
      return null;
    }

    return { sections: draft.sections, savedAt: draft.savedAt };
  } catch {
    return null;
  }
}

// Hapus draft — dipanggil setelah admin berhasil save ke database
export function clearDraft(programId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(draftKey(programId));
}
