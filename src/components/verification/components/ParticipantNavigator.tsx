"use client";

import * as React from "react";
import { useVerificationStore } from "@/stores";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Loader2, ArrowLeft, RotateCcw, Wrench, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/auth-client";
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
  onSave?: (status: "VERIFIED" | "REJECTED" | "REVERIFICATION") => Promise<boolean | void> | boolean | void;
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
  verifiedByUserId?: string | null;
  draftStatus?: "idle" | "saving" | "saved";
  isUsingLocalDraft?: boolean;
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
  verifiedByUserId = null,
  draftStatus = "idle",
  isUsingLocalDraft = false,
}: ParticipantNavigatorProps) {
  const { data: session } = useSession();
  const {
    currentRowIndex,
    setCurrentRowIndex,
    totalRows,
  } = useVerificationStore();

  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get("from");

  const handleExit = () => {
    router.push("/programs");
  };

  const [searchVal, setSearchVal] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<SearchMatch[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  
  const [pendingIndex, setPendingIndex] = React.useState<number | null>(null);
  const [pendingRedirectUrl, setPendingRedirectUrl] = React.useState<string | null>(null);
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExit}
            className="gap-1.5 h-8 text-xs shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit
          </Button>

          {/* Statistik Progres (Verification mode) */}
          <div className="flex items-center gap-3 text-xs bg-muted/45 border px-3 py-1 rounded-lg font-mono select-none">
            <span className="font-semibold text-muted-foreground font-sans text-[10px] uppercase tracking-wider mr-1">Progres:</span>
            <span className="text-emerald-600 font-semibold">{verifiedCount} Verif</span>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-red-600 font-semibold">{rejectedCount} Tolak</span>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-amber-600 font-semibold">{pendingCount} Belum</span>
          </div>

          {/* Indikator Status Save Draft */}
          {hasChanges && draftStatus === "saving" && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 text-xs font-semibold py-1 px-2.5 animate-pulse">
              <Loader2 className="size-3 animate-spin text-amber-500 shrink-0" />
              Menyimpan Draft...
            </Badge>
          )}

          {hasChanges && draftStatus === "saved" && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 text-xs font-semibold py-1 px-2.5">
              <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
              Draft Tersimpan
            </Badge>
          )}

          {!hasChanges && isUsingLocalDraft && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1.5 text-xs font-semibold py-1 px-2.5">
              <RotateCcw className="size-3 text-blue-500 shrink-0" />
              Draft Loaded
            </Badge>
          )}
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

          {/* Reject Button */}
          {((originalStatus === null || originalStatus === undefined || originalStatus === "") ||
            (session?.user && verifiedByUserId === session.user.id)) && (
              <Button
                type="button"
                onClick={() => setShowRejectConfirm(true)}
                disabled={!hasChanges || isSaving || isPaused}
                size="sm"
                variant="destructive"
                className="h-8 text-xs font-semibold px-4 shrink-0 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                Reject
              </Button>
            )}

          {/* Verify Button */}
          {(originalStatus === null || originalStatus === undefined || originalStatus === "") && (
            <Button
              type="button"
              onClick={() => onSave?.("VERIFIED")}
              disabled={!hasChanges || isSaving || isPaused}
              size="sm"
              className="h-8 text-xs font-semibold px-4 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
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
          )}

          {/* Tombol Verifikasi Ulang */}
          {(originalStatus === "VERIFIED" || originalStatus === "REJECTED" || originalStatus === "REVERIFICATION") &&
            session?.user && (
              <Button
                type="button"
                onClick={() => onSave?.("REVERIFICATION")}
                disabled={!hasChanges || isSaving || isPaused}
                size="sm"
                className="h-8 text-xs font-semibold px-4 shrink-0 bg-amber-500 hover:bg-amber-600 text-white border-amber-600 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Verifikasi Ulang"
                )}
              </Button>
            )}

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

      {/* Baris Bawah: Search Bar + Prev/Next Navigation */}
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
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchVal.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground rounded-md border shadow-md max-h-60 overflow-y-auto z-50 p-1">
              {results.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground text-center">
                  {isSearching ? "Mencari..." : "Tidak ada peserta ditemukan"}
                </div>
              ) : (
                results.map((res) => {
                  const displayName = getDisplayName(res.row);
                  const matchInfo = getMatchedInfo(res.row, searchVal);
                  return (
                    <button
                      key={res.globalIndex}
                      type="button"
                      onClick={() => selectParticipant(res.globalIndex)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground flex flex-col transition-colors",
                        res.globalIndex === currentRowIndex && "bg-accent/50 font-medium"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate mr-2 font-medium">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          #{res.globalIndex + 1}
                        </span>
                      </div>
                      {matchInfo && (
                        <span className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">
                          {matchInfo.key}: {matchInfo.value}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Sisi Kanan: Prev/Next Navigation */}
        <div className="flex items-center gap-1.5 shrink-0">
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
      <AlertDialog
        open={pendingIndex !== null || pendingRedirectUrl !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingIndex(null);
            setPendingRedirectUrl(null);
          }
        }}
      >
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
            <AlertDialogCancel
              disabled={isNavSaving}
              onClick={() => {
                setPendingIndex(null);
                setPendingRedirectUrl(null);
              }}
              className="h-8 text-xs font-semibold mt-0"
            >
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
                const redirectUrl = pendingRedirectUrl;
                setPendingIndex(null);
                setPendingRedirectUrl(null);
                if (target !== null) {
                  setCurrentRowIndex(target);
                  setSearchVal("");
                  setResults([]);
                  setShowDropdown(false);
                } else if (redirectUrl !== null) {
                  router.push(redirectUrl);
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
                    const redirectUrl = pendingRedirectUrl;
                    setPendingIndex(null);
                    setPendingRedirectUrl(null);
                    if (target !== null) {
                      setCurrentRowIndex(target);
                      setSearchVal("");
                      setResults([]);
                      setShowDropdown(false);
                    } else if (redirectUrl !== null) {
                      router.push(redirectUrl);
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
