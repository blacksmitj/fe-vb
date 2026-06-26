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
  userRole?: "ADMIN" | "VERIFIER";
}
