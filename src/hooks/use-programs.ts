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



