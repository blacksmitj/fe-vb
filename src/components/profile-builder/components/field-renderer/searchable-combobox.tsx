"use client";

import React from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { dropdownColorMap } from "./shared";

export interface SearchableComboboxProps {
  value: string;
  options: string[];
  optionColors?: Record<string, string>;
  placeholder?: string;
  onValueChange: (val: string) => void;
  disabled?: boolean;
}

export function SearchableCombobox({
  value,
  options,
  optionColors,
  placeholder,
  onValueChange,
  disabled,
}: SearchableComboboxProps) {
  const [searchValue, setSearchValue] = React.useState(value);

  // Sync input display when the selected value changes from outside (e.g. participant navigation)
  React.useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const filteredOptions = React.useMemo(() => {
    if (!searchValue || searchValue === value) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue, value]);

  const colorKey = optionColors?.[value];
  const dotClass = colorKey ? dropdownColorMap[colorKey] : undefined;

  return (
    <Combobox
      value={value}
      onValueChange={(val) => {
        if (val !== null) {
          onValueChange(val);
          // Tampilkan nilai yang dipilih di input setelah seleksi
          setSearchValue(val);
        }
      }}
      // Kontrol teks input melalui Root sesuai API @base-ui/react
      inputValue={searchValue}
      onInputValueChange={(val, { reason }) => {
        setSearchValue(val);
        // Saat item dipilih, library sudah handle — jangan overwrite lagi
        if (reason === "item-press") return;
      }}
      // Reset teks search ke nilai terpilih saat popup ditutup tanpa memilih
      onOpenChange={(open) => {
        if (!open) setSearchValue(value);
      }}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={placeholder || "Select option..."}
        className="w-full text-xs"
        leftAddon={
          dotClass ? (
            <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotClass)} />
          ) : null
        }
      />
      <ComboboxContent>
        <ComboboxList>
          {filteredOptions.map((opt) => {
            const optColorKey = optionColors?.[opt];
            const optDotClass = optColorKey ? dropdownColorMap[optColorKey] : undefined;
            return (
              <ComboboxItem key={opt} value={opt} className="flex items-center gap-2">
                {optDotClass && <span className={cn("h-2 w-2 rounded-full shrink-0", optDotClass)} />}
                <span>{opt}</span>
              </ComboboxItem>
            );
          })}
          {filteredOptions.length === 0 && (
            <ComboboxEmpty className="text-[10px] text-muted-foreground p-2 text-center">
              Tidak ditemukan
            </ComboboxEmpty>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
