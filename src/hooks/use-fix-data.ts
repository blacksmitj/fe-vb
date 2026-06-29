import { useQuery } from "@tanstack/react-query";

export interface FixDataEntry {
  programId: string;
  programName: string;
  participantId: string;
  uniqueKey: string;
  rowIndex: number;
  missingFields: string[];
  verifiedBy?: string;
}

export function useFixDataCount() {
  return useQuery({
    queryKey: ["fix-data", "count"],
    queryFn: async () => {
      const res = await fetch("/api/fix-data?countOnly=true");
      if (!res.ok) throw new Error("Failed to fetch fix data count");
      const json = await res.json();
      return json.count as number;
    },
    // Update every 2 minutes or when invalidated
    staleTime: 1000 * 60 * 2,
  });
}

export function useFixData() {
  return useQuery({
    queryKey: ["fix-data", "list"],
    queryFn: async () => {
      const res = await fetch("/api/fix-data");
      if (!res.ok) throw new Error("Failed to fetch fix data");
      const json = await res.json();
      return json.data as FixDataEntry[];
    },
    staleTime: 1000 * 60 * 2,
  });
}
