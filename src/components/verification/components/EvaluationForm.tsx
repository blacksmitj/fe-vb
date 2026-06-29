"use client";

import * as React from "react";
import { useVerificationStore } from "@/stores";
import { Section, Field, detectMediaType, resolveMediaUrl } from "@/components/profile-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import DatePicker from "@/components/date-picker";
import { Field as ShadcnField, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Calendar, FileText, Image as ImageIcon, Video, Tag, Bookmark, Hash, ArrowUpRight, Eye, Play, Globe, X } from "lucide-react";
import { safeParseDate } from "@/lib/utils/format-date";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";

function formatDateForInput(valueStr: string, isDateTime: boolean = false): string {
  if (!valueStr) return "";
  
  const str = valueStr.trim();
  
  // 1. If it's already in the expected format, return as is
  if (!isDateTime && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  if (isDateTime && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  
  // 2. Handle DD/MM/YYYY or DD-MM-YYYY (with optional time)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dmyMatch) {
    const [_, d, m, y, hr, min] = dmyMatch;
    const formattedDay = d.padStart(2, '0');
    const formattedMonth = m.padStart(2, '0');
    if (isDateTime) {
      const formattedHr = (hr || "00").padStart(2, '0');
      const formattedMin = (min || "00").padStart(2, '0');
      return `${y}-${formattedMonth}-${formattedDay}T${formattedHr}:${formattedMin}`;
    }
    return `${y}-${formattedMonth}-${formattedDay}`;
  }

  // 3. Handle Indonesian month names (e.g. "26 Juni 2026" or "26 Jun 2026")
  let normalizedStr = str.toLowerCase();
  const monthsIndonesian = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
  const monthsIndonesianShort = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
  const monthsEnglish = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  
  let foundMonthIdx = -1;
  // Look for long names
  for (let i = 0; i < 12; i++) {
    if (normalizedStr.includes(monthsIndonesian[i])) {
      foundMonthIdx = i;
      normalizedStr = normalizedStr.replace(monthsIndonesian[i], monthsEnglish[i]);
      break;
    }
  }
  // If not found, look for short names
  if (foundMonthIdx === -1) {
    for (let i = 0; i < 12; i++) {
      if (normalizedStr.includes(monthsIndonesianShort[i])) {
        foundMonthIdx = i;
        normalizedStr = normalizedStr.replace(monthsIndonesianShort[i], monthsEnglish[i]);
        break;
      }
    }
  }

  // 4. Try JS Date parsing
  const dateObj = safeParseDate(normalizedStr);
  if (dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    if (isDateTime) {
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    return `${year}-${month}-${day}`;
  }

  return "";
}

function formatDisplayDate(valueStr: string, isDateTime: boolean = false): string {
  if (!valueStr) return "";
  
  // If it contains Indonesian month names, it's already localized, so return it
  const monthsIndonesian = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember", "jan", "feb", "mar", "apr", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
  const lower = valueStr.toLowerCase();
  if (monthsIndonesian.some(m => lower.includes(m))) {
    return valueStr;
  }

  const inputFormatted = formatDateForInput(valueStr, isDateTime);
  if (!inputFormatted) return valueStr;

  const dateObj = safeParseDate(inputFormatted);
  if (!dateObj) return valueStr;

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  if (isDateTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return dateObj.toLocaleDateString("id-ID", options);
}

import { cn } from "@/lib/utils";

const dropdownColorMap: Record<string, string> = {
  gray: "bg-slate-400 dark:bg-slate-500",
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-sky-500",
  purple: "bg-violet-500",
};

interface SearchableComboboxProps {
  value: string;
  options: string[];
  optionColors?: Record<string, string>;
  placeholder?: string;
  onValueChange: (val: string) => void;
  disabled?: boolean;
}

function SearchableCombobox({ value, options, optionColors, placeholder, onValueChange, disabled }: SearchableComboboxProps) {
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
        className="w-full text-sm"
        leftAddon={
          dotClass ? (
            <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotClass)} />
          ) : null
        }
      />
      <ComboboxContent>
        <ComboboxList>
          {filteredOptions.map((opt) => {
            const colorKey = optionColors?.[opt];
            const dotClass = colorKey ? dropdownColorMap[colorKey] : undefined;
            return (
              <ComboboxItem key={opt} value={opt} className="flex items-center gap-2 text-sm">
                {dotClass && <span className={cn("h-2 w-2 rounded-full shrink-0", dotClass)} />}
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

interface PillsInputProps {
  value: string;
  separator: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function PillsInput({ value, separator, onValueChange, placeholder, disabled }: PillsInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const items = React.useMemo(() => {
    if (!value) return [];
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(i => String(i).trim()).filter(Boolean);
      } catch (e) {}
    }
    return value.split(separator).map(i => i.trim()).filter(Boolean);
  }, [value, separator]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim().replace(/,/g, "");
      if (trimmed && !items.includes(trimmed)) {
        const newItems = [...items, trimmed];
        onValueChange(newItems.join(separator));
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && items.length > 0) {
      e.preventDefault();
      const newItems = items.slice(0, -1);
      onValueChange(newItems.join(separator));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const pastedItems = pastedText
      .split(new RegExp(`[\\s,${separator}]+`))
      .map(i => i.trim())
      .filter(i => i.length > 0);

    if (pastedItems.length > 0) {
      const uniqueNewItems = Array.from(new Set([...items, ...pastedItems]));
      onValueChange(uniqueNewItems.join(separator));
    }
  };

  const handleBlur = () => {
    const trimmed = inputValue.trim().replace(/,/g, "");
    if (trimmed && !items.includes(trimmed)) {
      const newItems = [...items, trimmed];
      onValueChange(newItems.join(separator));
    }
    setInputValue("");
  };

  const removeItem = (itemToRemove: string) => {
    const newItems = items.filter(i => i !== itemToRemove);
    onValueChange(newItems.join(separator));
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center p-1.5 w-full rounded-lg border border-input bg-background text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring">
      {items.map((item, idx) => (
        <Badge key={idx} variant="secondary" className="flex items-center gap-1 text-[10px] px-2 py-0.5 font-medium border pr-1">
          <span>{item}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => removeItem(item)}
            className="rounded-full outline-hidden hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={items.length === 0 ? (placeholder || "Ketik dan tekan Spasi/Enter...") : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-hidden text-sm py-0.5 px-1 placeholder:text-muted-foreground/60 disabled:opacity-50"
      />
    </div>
  );
}

interface EvaluationFormProps {
  sections: Section[];
  participant: Record<string, any>;
  onFieldChange?: (label: string, value: any) => void;
  errors?: Record<string, string>;
}

export function EvaluationForm({ sections, participant, onFieldChange, errors }: EvaluationFormProps) {
  const { openMediaViewer } = useVerificationStore();

  const renderFieldValue = (field: Field) => {
    const value = participant[field.label];
    const valueStr = value !== undefined && value !== null ? String(value) : "";

    if (!field.isEditable && (value === undefined || value === null || value === "")) {
      return <span className="text-muted-foreground italic text-xs">Empty</span>;
    }

    switch (field.type) {
      case "media":
        const detectedType = detectMediaType(valueStr);
        const mediaSub = detectedType !== "link" ? detectedType : (field.mediaSubType || "link");
        if (!valueStr) {
          return <span className="text-muted-foreground italic text-xs">Empty</span>;
        }

        switch (mediaSub) {
          case "image":
            const resolvedUrl = resolveMediaUrl(valueStr);
            return (
              <div 
                onClick={() => openMediaViewer("photo", resolvedUrl)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 transition-all duration-300 shadow-sm hover:shadow-md hover:border-purple-500/50 dark:hover:border-purple-500/30 w-full max-w-md"
              >
                <div className="aspect-video w-full relative overflow-hidden bg-slate-950/5 dark:bg-slate-950/40 flex items-center justify-center">
                  <img 
                    src={resolvedUrl} 
                    alt="Image attachment"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const fallback = document.getElementById(`fallback-img-${resolvedUrl}`);
                      if (fallback) {
                        fallback.classList.remove('hidden');
                        fallback.classList.add('flex');
                      }
                    }}
                  />
                  <div 
                    id={`fallback-img-${resolvedUrl}`} 
                    className="hidden absolute inset-0 flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center"
                  >
                    <ImageIcon className="h-8 w-8 text-purple-500/70" />
                    <span className="text-[10px] font-medium max-w-[80%] truncate">Image Preview</span>
                  </div>
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-xs">
                    <span className="flex items-center gap-1.5 text-white bg-purple-600/90 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <Eye className="h-3.5 w-3.5" />
                      Preview Image
                    </span>
                  </div>
                </div>
              </div>
            );
          case "video":
            const getYoutubeId = (videoUrl: string) => {
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
              const match = videoUrl.match(regExp);
              return match && match[2].length === 11 ? match[2] : null;
            };
            const ytId = getYoutubeId(valueStr);
            const ytThumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;

            return (
              <div 
                onClick={() => openMediaViewer("video", valueStr)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 transition-all duration-300 shadow-sm hover:shadow-md hover:border-teal-500/50 dark:hover:border-teal-500/30 w-full max-w-md"
              >
                <div className="aspect-video w-full relative overflow-hidden bg-slate-950/5 dark:bg-slate-950/40 flex items-center justify-center">
                  {ytThumbnailUrl ? (
                    <img 
                      src={ytThumbnailUrl} 
                      alt="YouTube Video Thumbnail"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <video 
                      src={valueStr} 
                      preload="metadata"
                      muted
                      className="w-full h-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const fallback = document.getElementById(`fallback-vid-${valueStr}`);
                        if (fallback) {
                          fallback.classList.remove('hidden');
                          fallback.classList.add('flex');
                        }
                      }}
                    />
                  )}
                  <div 
                    id={`fallback-vid-${valueStr}`} 
                    className="hidden absolute inset-0 flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center"
                  >
                    <Video className="h-8 w-8 text-teal-500/70" />
                    <span className="text-[10px] font-medium max-w-[80%] truncate">Video Preview</span>
                  </div>

                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-teal-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          case "pdf":
            return (
              <div className="flex items-center">
                <Button 
                  onClick={() => openMediaViewer("pdf", valueStr)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-red-200 dark:border-red-950/50 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <FileText className="h-4 w-4" />
                  <span>Open PDF Document</span>
                </Button>
              </div>
            );
          case "link":
          default:
            return (
              <div className="flex items-center">
                <Button 
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-indigo-200 dark:border-indigo-950/50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                >
                  <a href={valueStr} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                    <span>Open Link</span>
                  </a>
                </Button>
              </div>
            );
        }
      case "badge-status":
        if (field.isEditable) {
          return (
            <Input
              value={valueStr}
              onChange={(e) => onFieldChange?.(field.label, e.target.value)}
              className="w-full text-sm"
              placeholder="Enter status..."
            />
          );
        }
        const getBadgeStyle = (style?: string) => {
          switch (style) {
            case "success": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
            case "warning": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
            case "danger": return "bg-red-500/10 text-red-600 border-red-500/20";
            case "info": return "bg-sky-500/10 text-sky-600 border-sky-500/20";
            default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
          }
        };
        return (
          <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getBadgeStyle(field.statusStyle)}`}>
            {valueStr}
          </Badge>
        );
      case "array-pills":
        if (field.isEditable) {
          return (
            <PillsInput
              value={valueStr}
              separator={field.pillsSeparator || ","}
              onValueChange={(val) => onFieldChange?.(field.label, val)}
              placeholder={field.placeholder || `Ketik item...`}
            />
          );
        }
        const parseArrayPills = (val: any, sep: string = ",") => {
          if (val === undefined || val === null || val === "") return [];
          if (Array.isArray(val)) return val.map(i => String(i).trim()).filter(Boolean);
          if (typeof val === "string") {
            const trimmed = val.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
              try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.map(i => String(i).trim()).filter(Boolean);
              } catch (e) {}
            }
            return trimmed.split(sep).map(i => i.trim()).filter(Boolean);
          }
          return [String(val).trim()].filter(Boolean);
        };
        const items = parseArrayPills(value, field.pillsSeparator || ",");
        return (
          <div className="flex flex-wrap gap-1.5">
            {items.map((item, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px] px-2 py-0.5 font-medium border">
                {item}
              </Badge>
            ))}
          </div>
        );
      case "date":
        const formattedDateValue = formatDateForInput(valueStr, field.dateMode === "date-time");
        if (field.isEditable) {
          return (
            <DatePicker
              value={formattedDateValue}
              dateMode={field.dateMode}
              locale={field.dateLocale}
              onChange={(val) => onFieldChange?.(field.label, val)}
              className="w-full text-sm"
            />
          );
        }
        return (
          <div className="flex items-center gap-1.5 text-sm font-medium bg-muted/40 border px-3 py-2 rounded-lg text-foreground/80">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{formatDisplayDate(valueStr, field.dateMode === "date-time") || valueStr}</span>
          </div>
        );
      case "number":
        if (field.isEditable) {
          return (
            <Input
              type="number"
              value={valueStr}
              onChange={(e) => onFieldChange?.(field.label, e.target.value)}
              className="w-full text-sm font-mono"
            />
          );
        }
        return (
          <div className="flex items-center gap-1.5 text-sm font-mono font-medium bg-muted/40 border px-3 py-2 rounded-lg text-foreground/80">
            <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{valueStr}</span>
          </div>
        );
      case "textarea":
        const isTextareaMono = field.previewFontMode === "mono";
        if (field.isEditable) {
          return (
            <Textarea
              value={valueStr}
              onChange={(e) => onFieldChange?.(field.label, e.target.value)}
              className={cn("w-full text-sm min-h-[80px]", isTextareaMono && "font-mono")}
            />
          );
        }
        return (
          <div className={cn("py-2.5 px-3 bg-muted/40 border border-border/50 rounded-lg text-sm select-all whitespace-pre-wrap text-foreground/80 font-medium", isTextareaMono && "font-mono")}>
            {valueStr}
          </div>
        );
      case "checkbox":
        const isChecked = valueStr === "true";
        if (field.isEditable) {
          return (
            <div className="flex items-center gap-2 py-1">
              <Checkbox
                id={`eval-checkbox-${field.id}`}
                checked={isChecked}
                onCheckedChange={(checked) => {
                  onFieldChange?.(field.label, checked ? "true" : "false");
                }}
              />
              <label
                htmlFor={`eval-checkbox-${field.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none text-foreground/80"
              >
                {field.placeholder || "Ceklis item ini"}
              </label>
            </div>
          );
        }
        const isCheckedPreview = valueStr === "true";
        return (
          <div className="flex items-center gap-2 py-2 px-3 bg-muted/40 border border-border/50 rounded-lg text-sm w-full">
            <Checkbox
              checked={isCheckedPreview}
              disabled
              className="opacity-70"
            />
            <span className={`text-sm ${isCheckedPreview ? "text-foreground font-medium" : "text-muted-foreground/50 italic"}`}>
              {isCheckedPreview ? (field.placeholder || "Terceklis") : (field.placeholder || "Tidak terceklis")}
            </span>
          </div>
        );
      case "dropdown":
        const selectedColorKey = field.optionColors?.[valueStr];
        const selectedDotClass = selectedColorKey ? dropdownColorMap[selectedColorKey] : undefined;
        if (field.isEditable) {
          const selectOptions = field.options || [];
          return (
            <SearchableCombobox
              value={valueStr}
              options={selectOptions}
              optionColors={field.optionColors}
              placeholder={field.placeholder}
              onValueChange={(val) => onFieldChange?.(field.label, val)}
            />
          );
        }
        return (
          <div className="py-2.5 px-3 bg-muted/40 border border-border/50 rounded-lg text-sm select-all whitespace-pre-wrap text-foreground/80 font-medium flex items-center gap-2">
            {valueStr && selectedDotClass && (
              <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", selectedDotClass)} />
            )}
            <span>{valueStr || (field.placeholder || "Belum diisi")}</span>
          </div>
        );
      default:
        const isMono = field.previewFontMode === "mono";
        if (field.isEditable) {
          return (
            <Input
              value={valueStr}
              onChange={(e) => onFieldChange?.(field.label, e.target.value)}
              className={cn("w-full text-sm", isMono && "font-mono")}
            />
          );
        }
        return (
          <div className={cn("py-2.5 px-3 bg-muted/40 border border-border/50 rounded-lg text-sm select-all whitespace-pre-wrap text-foreground/80 font-medium", isMono && "font-mono")}>
            {valueStr}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 w-full">
      {sections.map((section) => (
        <div key={section.id} className="border rounded-xl p-5 bg-card shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2 uppercase tracking-wide">
            {section.title}
          </h3>
          {section.layout === "2-col" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                {section.fields
                  .filter((field) => field.column !== "right")
                  .map((field) => (
                    <ShadcnField key={field.id} data-invalid={!!errors?.[field.label]}>
                      <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                        {field.label} {field.isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                      </FieldLabel>
                      {renderFieldValue(field)}
                      {errors?.[field.label] && (
                        <FieldError className="mt-1 pl-0.5 font-semibold text-xs">
                          {errors[field.label]}
                        </FieldError>
                      )}
                      {field.description && (
                        <FieldDescription className="text-xs italic text-muted-foreground/80 mt-1 pl-0.5 leading-relaxed">
                          {field.description}
                        </FieldDescription>
                      )}
                    </ShadcnField>
                  ))}
              </div>
              {/* Right Column */}
              <div className="space-y-5">
                {section.fields
                  .filter((field) => field.column === "right")
                  .map((field) => (
                    <ShadcnField key={field.id} data-invalid={!!errors?.[field.label]}>
                      <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                        {field.label} {field.isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                      </FieldLabel>
                      {renderFieldValue(field)}
                      {errors?.[field.label] && (
                        <FieldError className="mt-1 pl-0.5 font-semibold text-xs">
                          {errors[field.label]}
                        </FieldError>
                      )}
                      {field.description && (
                        <FieldDescription className="text-xs italic text-muted-foreground/80 mt-1 pl-0.5 leading-relaxed">
                          {field.description}
                        </FieldDescription>
                      )}
                    </ShadcnField>
                  ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {section.fields.map((field) => (
                <ShadcnField key={field.id} data-invalid={!!errors?.[field.label]}>
                  <FieldLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                    {field.label} {field.isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                  </FieldLabel>
                  {renderFieldValue(field)}
                  {errors?.[field.label] && (
                    <FieldError className="mt-1 pl-0.5 font-semibold text-xs">
                      {errors[field.label]}
                    </FieldError>
                  )}
                  {field.description && (
                    <FieldDescription className="text-xs italic text-muted-foreground/80 mt-1 pl-0.5 leading-relaxed">
                      {field.description}
                    </FieldDescription>
                  )}
                </ShadcnField>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
