"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { formatLocalDate } from "@/lib/utils/format-date";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  dateMode?: "date-only" | "date-time";
  locale?: "id" | "en";
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  dateMode = "date-only",
  locale = "id",
  disabled = false,
  placeholder = "Pilih tanggal...",
  className,
}: DatePickerProps) {
  // Parse string value into Date object
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }, [value]);

  // Extract time string (HH:MM) from value for input
  const timeValue = React.useMemo(() => {
    if (dateMode !== "date-time" || !value) return "00:00";
    if (value.includes("T")) {
      return value.split("T")[1].substring(0, 5);
    }
    // Handle space separator if any
    const parts = value.split(" ");
    if (parts.length > 1 && parts[1].includes(":")) {
      return parts[1].substring(0, 5);
    }
    return "00:00";
  }, [value, dateMode]);

  const [month, setMonth] = React.useState<Date | undefined>(undefined);

  // Sync display month when dateValue changes (e.g., when popover opens with value)
  React.useEffect(() => {
    if (dateValue) {
      setMonth(dateValue);
    }
  }, [dateValue]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange("");
      return;
    }

    const year = selectedDate.getFullYear();
    const monthStr = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");

    if (dateMode === "date-time") {
      onChange(`${year}-${monthStr}-${day}T${timeValue}`);
    } else {
      onChange(`${year}-${monthStr}-${day}`);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value || "00:00";
    const baseDate = dateValue || new Date();
    const year = baseDate.getFullYear();
    const monthStr = String(baseDate.getMonth() + 1).padStart(2, "0");
    const day = String(baseDate.getDate()).padStart(2, "0");
    onChange(`${year}-${monthStr}-${day}T${newTime}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9 px-3 text-sm rounded-lg border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">
            {value ? formatLocalDate(value, dateMode, locale) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          month={month}
          onMonthChange={setMonth}
        />
        {dateMode === "date-time" && (
          <div className="border-t border-border p-3 flex items-center justify-between gap-4 bg-muted/20">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 select-none">
              <Clock className="h-3.5 w-3.5" />
              Waktu (Time)
            </span>
            <input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              disabled={disabled}
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
