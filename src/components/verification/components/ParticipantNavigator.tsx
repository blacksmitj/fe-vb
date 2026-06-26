"use client";

import * as React from "react";
import { useVerificationStore } from "@/stores";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ParticipantNavigatorProps {
  programId: string;
  onSave?: () => Promise<void> | void;
  isSaving?: boolean;
  evaluationStatus?: string | null;
  verifiedCount?: number;
  rejectedCount?: number;
  pendingCount?: number;
  isPaused?: boolean;
}

interface SearchMatch {
  globalIndex: number;
  row: Record<string, any>;
}

export function ParticipantNavigator({
  programId,
  onSave,
  isSaving = false,
  evaluationStatus = null,
  verifiedCount = 0,
  rejectedCount = 0,
  pendingCount = 0,
  isPaused = false,
}: ParticipantNavigatorProps) {
  const {
    currentRowIndex,
    setCurrentRowIndex,
    totalRows,
  } = useVerificationStore();

  const [searchVal, setSearchVal] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<SearchMatch[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Debounced search logic
  React.useEffect(() => {
    if (!searchVal.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/programs/${programId}/participants?search=${encodeURIComponent(searchVal)}`
        );
        const data = await res.json();
        if (data.matches) {
          setResults(data.matches);
        }
      } catch (err) {
        console.error("Failed to search participants", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal, programId]);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNext = () => {
    if (currentRowIndex < totalRows - 1) {
      setCurrentRowIndex(currentRowIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentRowIndex > 0) {
      setCurrentRowIndex(currentRowIndex - 1);
    }
  };

  const selectParticipant = (globalIndex: number) => {
    setCurrentRowIndex(globalIndex);
    setSearchVal("");
    setResults([]);
    setShowDropdown(false);
  };

  // Helper to extract a display name from row
  const getDisplayName = (row: Record<string, any>) => {
    const keys = Object.keys(row);
    const nameKey = keys.find(k => {
      const lk = k.toLowerCase();
      return lk === "nama" || lk === "name" || lk.includes("nama lengkap") || lk.includes("full name");
    });
    if (nameKey && row[nameKey]) return String(row[nameKey]);
    
    // Fallback: use first string field
    const stringVal = Object.values(row).find(val => typeof val === "string" && val.length > 0 && !val.startsWith("cl") && val.length !== 25);
    return stringVal ? String(stringVal) : `Participant ${keys[0] && row[keys[0]] ? row[keys[0]] : ""}`;
  };

  // Helper to find which field matched the search query
  const getMatchedInfo = (row: Record<string, any>, query: string) => {
    if (!query) return null;
    const q = query.toLowerCase();
    for (const [key, val] of Object.entries(row)) {
      if (key.startsWith("_") || key === "id" || key === "uniqueKey") continue;
      const valStr = String(val);
      if (valStr.toLowerCase().includes(q)) {
        return { key, value: valStr };
      }
    }
    return null;
  };

  return (
    <div className="flex items-center gap-3 w-full justify-between">
      <div className="flex items-center gap-2 flex-1">
        {/* Exit Button */}
        <Button variant="outline" size="sm" asChild className="gap-1.5 h-8 text-xs shrink-0">
          <Link href="/programs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit
          </Link>
        </Button>

        {/* Search Bar (Full width flex-1) */}
        <div className="relative flex-1" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
            <Input
              placeholder="Search participant..."
              value={searchVal}
              onChange={(e) => {
                setSearchVal(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="pl-8 pr-7 h-8 text-xs bg-background"
            />
            {isSearching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground/80" />
            )}
          </div>

          {/* Dropdown Results */}
          {showDropdown && (searchVal.trim() !== "") && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto border rounded-lg bg-popover text-popover-foreground shadow-lg z-50 divide-y">
              {results.length > 0 ? (
                results.map((res) => {
                  const match = getMatchedInfo(res.row, searchVal);
                  return (
                    <button
                      key={res.globalIndex}
                      onClick={() => selectParticipant(res.globalIndex)}
                      className={cn(
                        "flex flex-col w-full text-left p-2.5 hover:bg-accent hover:text-accent-foreground transition-colors",
                        res.globalIndex === currentRowIndex && "bg-accent/50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-semibold text-xs truncate max-w-[70%]">
                          {getDisplayName(res.row)}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded shrink-0">
                          Row {res.globalIndex + 1}
                        </span>
                      </div>
                      {match && (
                        <span className="text-[10px] text-primary mt-1 block font-medium truncate max-w-full">
                          Cocok: <span className="text-muted-foreground font-normal">{match.key}</span> = <span className="font-semibold">"{match.value}"</span>
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-xs text-center text-muted-foreground">
                  {isSearching ? "Searching..." : "No results found"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right aligned items */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Progress stats */}
        <div className="hidden lg:flex items-center gap-3 text-xs bg-muted/45 border px-3 py-1 rounded-lg font-mono select-none">
          <span className="font-semibold text-muted-foreground font-sans text-[10px] uppercase tracking-wider mr-1">Progres:</span>
          <span className="text-emerald-600 font-semibold">{verifiedCount} Verif</span>
          <span className="text-muted-foreground/30">|</span>
          <span className="text-red-600 font-semibold">{rejectedCount} Tolak</span>
          <span className="text-muted-foreground/30">|</span>
          <span className="text-amber-600 font-semibold">{pendingCount} Belum</span>
        </div>

        {/* Nav Buttons & Indicator */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentRowIndex === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold min-w-[70px] text-center select-none text-muted-foreground">
            {totalRows > 0 ? `${currentRowIndex + 1} / ${totalRows}` : "0 / 0"}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentRowIndex >= totalRows - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving || isPaused}
          size="sm"
          className="h-8 text-xs font-semibold px-4 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}
