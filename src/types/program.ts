export interface DashboardGlobalStats {
  totalParticipants: number;
  totalVerified: number;
  totalRejected: number;
  totalPending: number;
  activePrograms: number;
}

export interface DashboardActivity {
  id: string;
  action: string;
  details: string;
  programName: string;
  userName: string;
  createdAt: string;
}

export interface DashboardData {
  globalStats: DashboardGlobalStats;
  programs: Program[];
  recentActivity: DashboardActivity[];
}

export interface Participant {
  id: string;
  rowIndex: number;
  uniqueKey: string;
  data: Record<string, any>;
  headers: string[];
  evalStatus: string | null;
  evalDescription: string | null;
  evalByUserName: string | null;
  evalAt: string | null;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  totalRows: number;
  fieldCount: number;
  errorCount: number;
  uniqueKeyColumn: string;
  headers: string[];
  data: Record<string, any>[];
  profileSchema?: any;
  status?: "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL" | "ACTIVE" | "STOPPED";
  userRole?: "ADMIN" | "VERIFIER";
  verifiedCount?: number;
  rejectedCount?: number;
  pendingCount?: number;
}
