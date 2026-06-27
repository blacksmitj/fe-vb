import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ProfileBuilder } from "@/types";

const API_URL = "/api/profile-builders";

export function useProfileBuilders() {
  return useQuery<ProfileBuilder[]>({
    queryKey: ["profile-builders"],
    queryFn: async () => {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch profile builders");
      return res.json();
    },
  });
}

export function useProfileBuilder(id: string | null) {
  return useQuery<ProfileBuilder>({
    queryKey: ["profile-builders", id],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch profile builder");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateProfileBuilder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description: string; programId?: string | null }) => {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create profile builder");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-builders"] });
    },
  });
}

export function useUpdateProfileBuilder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      sections,
      programId,
    }: {
      id: string;
      name?: string;
      description?: string;
      sections?: any[];
      programId?: string | null;
    }) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, sections, programId }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update profile builder");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile-builders"] });
      queryClient.invalidateQueries({ queryKey: ["profile-builders", variables.id] });
    },
  });
}

export function useDeleteProfileBuilder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete profile builder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-builders"] });
    },
  });
}

export function useDuplicateProfileBuilder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/${id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to duplicate profile builder");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-builders"] });
    },
  });
}

