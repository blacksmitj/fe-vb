export interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  totalRows: number;
  fieldCount: number;
  errorCount: number;
  headers: string[];
  data: Record<string, any>[];
  profileSchema?: any;
  status?: "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL";

  // Google Sheet Config fields
  sheetId?: string | null;
  sheetName?: string | null;
  sheetUniqueKey?: string | null;
  sheetEvalStatusCol?: string | null;
  sheetEvalDescCol?: string | null;
  sheetLastSyncAt?: string | null;
}
