import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Program } from "@/types";

const API_URL = "/api/programs";

export function usePrograms() {
  return useQuery<Program[]>({
    queryKey: ["programs"],
    queryFn: async () => {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
  });
}

export function useProgram(id: string | null, includePreview = false) {
  return useQuery<Program>({
    queryKey: ["programs", id, { preview: includePreview }],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      const url = includePreview ? `${API_URL}/${id}?preview=true` : `${API_URL}/${id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch program");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (programData: Omit<Program, "id" | "createdAt" | "updatedAt" | "totalRows" | "fieldCount" | "errorCount">) => {
      const res = await fetch(`${API_URL}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(programData),
      });
      if (!res.ok) throw new Error("Failed to import program data");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete program");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}

export function useUpdateProgramSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sections }: { id: string; sections: any[] }) => {
      const res = await fetch(`${API_URL}/${id}/schema`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      if (!res.ok) throw new Error("Failed to update program profile schema");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["programs", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["builder", variables.id] });
    },
  });
}

export function useProgramsByTemplate(templateId: string | null) {
  return useQuery<Program[]>({
    queryKey: ["programs", "byTemplate", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const res = await fetch(`${API_URL}?templateId=${templateId}`);
      if (!res.ok) throw new Error("Failed to fetch programs by template");
      return res.json();
    },
    enabled: !!templateId,
  });
}

export interface ProgramMembership {
  role: string | null;
  status: string | null;
}

export function useProgramMembership(programId: string | null) {
  return useQuery<ProgramMembership>({
    queryKey: ["program-membership", programId],
    queryFn: async () => {
      if (!programId) throw new Error("Program ID is required");
      const res = await fetch(`${API_URL}/${programId}/membership`);
      if (!res.ok) throw new Error("Failed to fetch membership status");
      return res.json();
    },
    enabled: !!programId,
  });
}

export function useProgramSchema(programId: string | null) {
  return useQuery({
    queryKey: ["program-schema", programId],
    queryFn: async () => {
      if (!programId) throw new Error("Program ID is required");
      const res = await fetch(`${API_URL}/${programId}/schema`);
      if (!res.ok) throw new Error("Failed to fetch program schema");
      return res.json();
    },
    enabled: !!programId,
  });
}

export function useProgramMembers(programId: string | null) {
  return useQuery({
    queryKey: ["program-members", programId],
    queryFn: async () => {
      if (!programId) throw new Error("Program ID is required");
      const res = await fetch(`${API_URL}/${programId}/members`);
      if (!res.ok) throw new Error("Failed to fetch program members");
      return res.json();
    },
    enabled: !!programId,
  });
}

export function useProgramLogs(programId: string | null) {
  return useQuery({
    queryKey: ["program-logs", programId],
    queryFn: async () => {
      if (!programId) throw new Error("Program ID is required");
      const res = await fetch(`${API_URL}/${programId}/logs`);
      if (!res.ok) throw new Error("Failed to fetch program logs");
      return res.json();
    },
    enabled: !!programId,
  });
}

export function useProgramApiKey(programId: string | null) {
  return useQuery({
    queryKey: ["program-api-key", programId],
    queryFn: async () => {
      if (!programId) throw new Error("Program ID is required");
      const res = await fetch(`${API_URL}/${programId}/api-key`);
      if (!res.ok) throw new Error("Failed to fetch API key");
      return res.json();
    },
    enabled: !!programId,
  });
}

export function useProgramParticipant(programId: string | null, pageIndex: number) {
  return useQuery({
    queryKey: ["program-participant", programId, pageIndex],
    queryFn: async () => {
      if (!programId) throw new Error("Program ID is required");
      const res = await fetch(`${API_URL}/${programId}/participants?page=${pageIndex}`);
      if (!res.ok) throw new Error("Failed to fetch participant");
      return res.json();
    },
    enabled: !!programId && pageIndex >= 0,
  });
}




