"use client";

import * as React from "react";
import { Sparkles, Undo2, Info, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseAndFormatAddress, validateStreetAddress, ParsedAddress } from "@/lib/utils/street-verifier";
import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface StreetAddressInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onParsedChange?: (parsed: ParsedAddress) => void;
  className?: string;
  showHelperText?: boolean;
  helperText?: string;
  /** Tampilkan pesan error internal di bawah input (default: true) */
  showError?: boolean;
  /** Aktifkan validasi otomatis saat input blur / kehilangan fokus */
  validateOnBlur?: boolean;
  /** Custom error message eksternal dari form parent */
  error?: string;
}

export function StreetAddressInput({
  value: valueProp,
  defaultValue = "",
  onChange,
  onParsedChange,
  className,
  showHelperText = false,
  helperText,
  showError = true,
  placeholder = "Masukkan nama jalan, no, blok, RT/RW...",
  disabled,
  validateOnBlur = true,
  error: externalError,
  onBlur,
  ...props
}: StreetAddressInputProps) {
  // Internal state for uncontrolled / controlled fallback
  const [internalValue, setInternalValue] = React.useState<string>(
    valueProp !== undefined ? valueProp : defaultValue
  );

  // Track raw value prior to formatting for toggle/undo
  const [rawBeforeFormat, setRawBeforeFormat] = React.useState<string | null>(null);
  const [isFormatted, setIsFormatted] = React.useState<boolean>(false);

  // Internal validation state
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isTouched, setIsTouched] = React.useState<boolean>(false);

  // Sync internal state when controlled valueProp changes from parent
  React.useEffect(() => {
    if (valueProp !== undefined) {
      setInternalValue(valueProp);
    }
  }, [valueProp]);

  const currentValue = valueProp !== undefined ? valueProp : internalValue;

  const activeError = externalError || validationError;
  const isInvalid = Boolean(activeError);

  const validateInput = (val: string, formattedState: boolean) => {
    if (!val.trim()) {
      setValidationError(null);
      return;
    }
    const result = validateStreetAddress(val, formattedState);
    if (!result.isValid) {
      setValidationError(result.errors[0] || "Format alamat belum sesuai standar.");
    } else {
      setValidationError(null);
    }
  };

  const updateValue = (newValue: string, parsed?: ParsedAddress) => {
    if (valueProp === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);

    if (onParsedChange) {
      const data = parsed || parseAndFormatAddress(newValue);
      onParsedChange(data);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIsFormatted(false);
    setRawBeforeFormat(null);

    // If touched, revalidate on change
    if (isTouched) {
      validateInput(val, false);
    }

    updateValue(val);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsTouched(true);
    if (validateOnBlur) {
      validateInput(currentValue, isFormatted);
    }
    onBlur?.(e);
  };

  const toggleMagicWand = () => {
    if (disabled) return;

    if (isFormatted && rawBeforeFormat !== null) {
      // UNDO / TOGGLE BACK TO ORIGINAL RAW VALUE
      updateValue(rawBeforeFormat);
      setIsFormatted(false);
      setRawBeforeFormat(null);
      // Validate the undone value
      validateInput(rawBeforeFormat, false);
    } else {
      // APPLY FORMATTING
      if (!currentValue.trim()) return;

      const parsed = parseAndFormatAddress(currentValue);
      setRawBeforeFormat(currentValue);
      setIsFormatted(true);
      updateValue(parsed.formattedAddress, parsed);

      // Validate formatted result (clears error if RT/RW exist)
      validateInput(parsed.formattedAddress, true);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-1.5">
        <InputGroup
          aria-invalid={isInvalid}
          className={cn(
            "relative transition-all duration-200",
            isInvalid && "border-destructive ring-destructive/20 ring-2",
            className
          )}
        >
          <InputGroupInput
            value={currentValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={isInvalid}
            {...props}
          />

          <InputGroupAddon align="inline-end" className="flex items-center gap-1 pr-1.5">
            {/* Info Popover for Example Usage */}
            <Popover>
              <PopoverTrigger asChild>
                <InputGroupButton
                  size="icon-xs"
                  variant="ghost"
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  title="Contoh & Aturan Format Alamat"
                >
                  <Info className="size-3.5" />
                  <span className="sr-only">Informasi Format Alamat</span>
                </InputGroupButton>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-4 space-y-3 text-xs shadow-lg border">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <Sparkles className="size-4 text-amber-500" />
                    Format Otomatis Alamat
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    Magic Wand
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Klik tombol tongkat sihir untuk memformat nama jalan otomatis:
                  </p>

                  {/* Example Before / After Box */}
                  <div className="rounded-md border bg-muted/40 p-2.5 space-y-2 font-mono text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-sans font-medium uppercase tracking-wider">Sebelum (Input Mentah):</span>
                      <span className="text-rose-600 dark:text-rose-400 break-all">jl. blok. a no, 5, rt 1 rw 2</span>
                    </div>
                    <div className="border-t pt-1.5">
                      <span className="text-muted-foreground block text-[10px] font-sans font-medium uppercase tracking-wider">Sesudah (Format Magic):</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold break-all">Jl. Blok A No. 5 RT. 001 RW. 002</span>
                    </div>
                  </div>

                  {/* Rule highlights */}
                  <div className="space-y-1 pt-1 text-[11px] text-muted-foreground">
                    <div className="flex items-start gap-1.5">
                      <Check className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span><b>Singkatan:</b> <code className="bg-muted px-1 py-0.5 rounded">Jl.</code>, <code className="bg-muted px-1 py-0.5 rounded">No.</code>, <code className="bg-muted px-1 py-0.5 rounded">Gg.</code>, <code className="bg-muted px-1 py-0.5 rounded">Komp.</code>, <code className="bg-muted px-1 py-0.5 rounded">Kav.</code></span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span><b>Kata Blok:</b> Titik dibelakang Blok dihapus (<i>Blok A</i>)</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span><b>Romawi:</b> Angka Romawi tetap kapital (<i>XV, IV, XII</i>)</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span><b>Tanda Koma:</b> Seluruh tanda koma (,) dibersihkan</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span><b>RT / RW:</b> Ekstraksi otomatis 3 digit (<i>RT. 001 RW. 002</i>)</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span><b>Capital:</b> Format alamat diperbolehkan huruf KAPITAL (FULL CAPITAL)</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Magic Wand Toggle Button with Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  size="xs"
                  variant={isFormatted ? "secondary" : isInvalid ? "destructive" : "ghost"}
                  type="button"
                  onClick={toggleMagicWand}
                  disabled={disabled || (!currentValue.trim() && !isFormatted)}
                  className={cn(
                    "gap-1 font-medium transition-all",
                    isFormatted
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30"
                      : isInvalid
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 animate-pulse"
                      : "text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                  )}
                >
                  {isFormatted ? (
                    <>
                      <Undo2 className="size-3.5" />
                      <span className="text-xs">Batal</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                      <span className="text-xs">Format</span>
                    </>
                  )}
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isFormatted
                  ? "Diformat (klik \"Batal\" jika tidak pas)"
                  : isInvalid
                  ? "Klik Magic Wand untuk memperbaiki format otomatis"
                  : "Klik tombol Format Magic untuk penataan otomatis & RT/RW"}
              </TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>

        {/* FieldError Message milik shadcn */}
        {showError && isInvalid && (
          <FieldError className="flex items-center gap-1 text-xs">
            <AlertCircle className="size-3.5 text-destructive shrink-0" />
            <span>{activeError}</span>
          </FieldError>
        )}

        {/* Custom Helper Text jika dipassing dari prop parent */}
        {showHelperText && helperText && !isInvalid && (
          <div className="text-[11px] text-muted-foreground px-0.5">
            {helperText}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
