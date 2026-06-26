export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'media' 
  | 'number' 
  | 'date' 
  | 'badge-status' 
  | 'array-pills'
  | 'dropdown'
  | 'checkbox';

export type MediaSubType = 'image' | 'video' | 'pdf' | 'link';

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string; // Optional helper text shown below the field input
  value?: string;
  locked?: boolean;
  column?: 'left' | 'right';
  isEditable?: boolean; // Toggle between editable and preview mode
  // New customizable properties
  dateMode?: 'date-only' | 'date-time';
  dateLocale?: 'id' | 'en';
  previewFontMode?: 'sans' | 'mono';
  statusStyle?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  pillsSeparator?: string;
  mediaSubType?: MediaSubType;
  options?: string[];
}

export interface Section {
  id: string;
  title: string;
  layout: '1-col' | '2-col';
  fields: Field[];
}

// ─── Builder Payload (BARU) ───────────────────────────────────────────
export interface BuilderPayload {
  program: {
    id: string;
    name: string;
    description: string;
    totalRows: number;
    fieldCount: number;
    errorCount: number;
    createdAt: string;
  };
  headers: string[];
  sampleRow: Record<string, unknown>; // Baris pertama Excel — untuk preview field di sidebar
  schema: Section[];
  schemaVersion: number; // Dipakai untuk validasi draft localStorage
}

// ─── Error Detail (BARU) ──────────────────────────────────────────────
export interface ErrorDetail {
  rowIndex: number; // Nomor baris di Excel asli (0-based)
  column: string; // Nama kolom bermasalah
  value: unknown; // Nilai yang diterima
  message: string; // Penjelasan error yang bisa ditampilkan ke admin
}

// ─── Builder Draft (BARU) ─────────────────────────────────────────────
export interface BuilderDraft {
  programId: string;
  sections: Section[];
  savedAt: number; // timestamp — untuk cek TTL
  schemaVersion: number; // versi schema saat draft dibuat — untuk validasi relevansi
}

