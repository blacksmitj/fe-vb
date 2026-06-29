"use client";

import * as React from "react";
import { useVerificationStore } from "@/stores";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ParticipantNavigatorProps {
  programId: string;
  onSave?: (status: "VERIFIED" | "REJECTED") => Promise<boolean | void> | boolean | void;
  onUnverify?: () => Promise<void> | void;
  onSaveDraft?: () => void;
  onReset?: () => void;
  hasChanges?: boolean;
  isSaving?: boolean;
  evaluationStatus?: string | null;
  originalStatus?: string | null;
  canUnverify?: boolean;
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
  onUnverify,
  onSaveDraft,
  onReset,
  hasChanges = false,
  isSaving = false,
  evaluationStatus = null,
  originalStatus = null,
  canUnverify = false,
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
  
  const [pendingIndex, setPendingIndex] = React.useState<number | null>(null);
  const [isNavSaving, setIsNavSaving] = React.useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = React.useState(false);

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
        if (!res.ok) throw new Error("Search failed");
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

  const navigateTo = (targetIndex: number) => {
    if (hasChanges) {
      setPendingIndex(targetIndex);
    } else {
      setCurrentRowIndex(targetIndex);
      setSearchVal("");
      setResults([]);
      setShowDropdown(false);
    }
  };

  const handleNext = () => {
    if (currentRowIndex < totalRows - 1) {
      navigateTo(currentRowIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentRowIndex > 0) {
      navigateTo(currentRowIndex - 1);
    }
  };

  const selectParticipant = (globalIndex: number) => {
    navigateTo(globalIndex);
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
    <div className="flex flex-col gap-3 w-full">
      {/* Baris Atas: Exit, Info Progres, Reset & Save */}
      <div className="flex items-center justify-between w-full gap-3">
        {/* Sisi Kiri: Exit & Statistik Progres */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="gap-1.5 h-8 text-xs shrink-0">
            <Link href="/programs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Exit
            </Link>
          </Button>

          {/* Statistik Progres (Selalu tampil di semua ukuran layar) */}
          <div className="flex items-center gap-3 text-xs bg-muted/45 border px-3 py-1 rounded-lg font-mono select-none">
            <span className="font-semibold text-muted-foreground font-sans text-[10px] uppercase tracking-wider mr-1">Progres:</span>
            <span className="text-emerald-600 font-semibold">{verifiedCount} Verif</span>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-red-600 font-semibold">{rejectedCount} Tolak</span>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-amber-600 font-semibold">{pendingCount} Belum</span>
          </div>
        </div>

        {/* Sisi Paling Kanan: Reset & Save */}
        <div className="flex items-center gap-2 shrink-0">
          {onReset && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasChanges || isSaving || isPaused}
                  size="sm"
                  className="h-8 text-xs font-semibold px-3 shrink-0 gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Reset Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin membatalkan semua perubahan lokal untuk data peserta ini? Perubahan Anda akan dikembalikan ke data terakhir yang tersimpan di database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={onReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Reset Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Unverif Button */}
          {onUnverify && (originalStatus === "VERIFIED" || originalStatus === "REJECTED") && canUnverify && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  disabled={isSaving || isPaused}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold px-3 shrink-0 gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Unverif
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Pembatalan Verifikasi</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin membatalkan status verifikasi/penolakan data peserta ini? Data peserta ini akan dikembalikan ke status "Belum Diverifikasi".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={onUnverify} className="bg-rose-600 text-white hover:bg-rose-700">
                    Batalkan Verifikasi
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Reject Button */}
          <Button
            type="button"
            onClick={() => setShowRejectConfirm(true)}
            disabled={isSaving || isPaused}
            size="sm"
            variant="destructive"
            className="h-8 text-xs font-semibold px-4 shrink-0 bg-red-600 hover:bg-red-700 text-white"
          >
            Reject
          </Button>

          {/* Verify Button */}
          <Button
            type="button"
            onClick={() => onSave?.("VERIFIED")}
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
              "Verify"
            )}
          </Button>

          {/* Reject Confirmation Dialog */}
          <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Penolakan Data</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menolak data peserta ini? Status evaluasi akan disimpan sebagai "REJECTED".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (onSave) {
                      await onSave("REJECTED");
                    }
                  }}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Tolak Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Baris Bawah: Search Bar & Pagination */}
      <div className="flex items-center justify-between w-full gap-3">
        {/* Sisi Kiri: Search Bar */}
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

        {/* Sisi Kanan: Nav Buttons & Indicator */}
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
      </div>

      {/* Alert Dialog untuk konfirmasi perubahan belum disimpan saat navigasi */}
      <AlertDialog open={pendingIndex !== null} onOpenChange={(open) => { if (!open) setPendingIndex(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">Simpan Perubahan?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              <span className="block">Anda memiliki perubahan data yang belum disimpan untuk peserta saat ini. Apakah Anda ingin menyimpannya ke database sekarang?</span>
              <span className="block font-medium text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900 mt-1 leading-relaxed">
                Jika dilewati (Skip), data Anda tetap aman dan tersimpan sementara sebagai draf di browser ini (Local Storage) dan akan otomatis dipulihkan kembali saat Anda membuka peserta ini lagi.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel disabled={isNavSaving} onClick={() => setPendingIndex(null)} className="h-8 text-xs font-semibold mt-0">
              Batal
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={isNavSaving}
              onClick={() => {
                if (onSaveDraft) {
                  onSaveDraft();
                }
                const target = pendingIndex;
                setPendingIndex(null);
                if (target !== null) {
                  setCurrentRowIndex(target);
                  setSearchVal("");
                  setResults([]);
                  setShowDropdown(false);
                }
              }}
              className="h-8 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              Lewati (Simpan Draf)
            </Button>
            <Button
              type="button"
              disabled={isNavSaving}
              onClick={async () => {
                setIsNavSaving(true);
                try {
                  let success = true;
                  if (onSave) {
                    const res = await onSave("VERIFIED");
                    if (res === false) {
                      success = false;
                    }
                  }
                  if (success) {
                    const target = pendingIndex;
                    setPendingIndex(null);
                    if (target !== null) {
                      setCurrentRowIndex(target);
                      setSearchVal("");
                      setResults([]);
                      setShowDropdown(false);
                    }
                  }
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsNavSaving(false);
                }
              }}
              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isNavSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Menyimpan...
                </>
              ) : (
                "Simpan & Lanjutkan"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
