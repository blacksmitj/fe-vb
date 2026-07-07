import { useQuery } from "@tanstack/react-query";

export function useReverificationCount() {
  return useQuery({
    queryKey: ["re-verification", "count"],
    queryFn: async () => {
      const res = await fetch("/api/re-verification?countOnly=true");
      if (!res.ok) throw new Error("Failed to fetch re-verification count");
      const json = await res.json();
      return json.count as number;
    },
  });
}
