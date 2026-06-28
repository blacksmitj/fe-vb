"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Eye, Play, Volume2, Maximize, Contact2, FileText, Globe, Link2 } from "lucide-react";
import { detectMediaType, resolveMediaUrl } from "../../../utils/detect-media-type";
import { FieldInputProps } from "../shared";

/** Renders a "media" field — image/video/pdf/link preview or empty state */
export function MediaPreview({ field, sampleRow }: Omit<FieldInputProps, "onUpdateField">) {
  const sampleValue = sampleRow?.[field.label];
  const mediaUrl =
    field.value !== undefined && field.value !== ""
      ? field.value
      : sampleValue !== undefined && sampleValue !== null
      ? String(sampleValue)
      : "";
  const detectedType = detectMediaType(mediaUrl);
  const mediaSub = detectedType !== "link" ? detectedType : field.mediaSubType || "link";

  if (!mediaUrl) {
    return (
      <div className="border border-dashed border-border rounded-lg bg-muted/5 p-2 min-h-[70px] flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted-foreground/10 rounded flex items-center justify-center border border-border/40 shrink-0">
            <Contact2 className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-foreground/75 truncate">
              No Media/Document Source
            </div>
            <div className="h-1 bg-muted-foreground/10 rounded w-2/3 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  switch (mediaSub) {
    case "image":
      return (
        <div className="border border-border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center p-1 min-h-[80px]">
          <img
            src={resolveMediaUrl(mediaUrl)}
            alt={field.label}
            className="max-h-[90px] max-w-full object-contain rounded-md shadow-sm"
          />
        </div>
      );
    case "video":
      return (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-slate-950 flex flex-col justify-between p-1.5 group/video shadow-md min-h-[80px]">
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/video:bg-black/45 transition-colors">
            <button className="h-7 w-7 rounded-full bg-white/90 hover:bg-white text-slate-950 flex items-center justify-center shadow-lg transition-transform transform group-hover/video:scale-105">
              <Play className="h-3 w-3 fill-slate-950 ml-0.5" />
            </button>
          </div>
          <div className="flex items-center justify-between z-10 opacity-0 group-hover/video:opacity-100 transition-opacity duration-200">
            <span className="text-[8px] font-medium text-white/90 truncate bg-slate-900/60 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              {mediaUrl.split("/").pop() || "Video Embed"}
            </span>
          </div>
          <div className="w-full space-y-1 z-10 pt-2 mt-auto">
            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-primary" />
            </div>
            <div className="flex items-center justify-between text-[8px] text-white/80">
              <div className="flex items-center gap-1">
                <Play className="h-2 w-2 fill-white" />
                <span>0:32 / 1:45</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Volume2 className="h-2.5 w-2.5" />
                <Maximize className="h-2 w-2" />
              </div>
            </div>
          </div>
        </div>
      );
    case "pdf": {
      const pdfName = mediaUrl.split("/").pop() || "document_attachment.pdf";
      return (
        <div className="border border-border rounded-lg bg-card p-2 shadow-sm flex flex-col min-h-[80px] justify-between relative group/pdf overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-8 bg-red-500/10 rounded flex items-center justify-center border border-red-500/20 shrink-0">
              <FileText className="h-4.5 w-4.5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-foreground/80 truncate">{pdfName}</span>
                <Badge variant="outline" className="text-[8px] uppercase px-1 py-0 border-red-500/30 text-red-500 bg-red-500/5 scale-90">
                  PDF
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/40 text-[9px] text-muted-foreground">
            <span>Page 1 of 3 (452 KB)</span>
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary/85 flex items-center gap-0.5 hover:underline cursor-pointer">
              <Eye className="h-2.5 w-2.5" /> View
            </a>
          </div>
        </div>
      );
    }
    case "link":
    default:
      return (
        <div className="border border-border rounded-lg bg-card p-2 shadow-sm flex flex-col min-h-[60px] justify-between relative overflow-hidden group/link">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-500/10 rounded flex items-center justify-center border border-indigo-500/20 shrink-0">
              <Globe className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-foreground/80 truncate" title={mediaUrl}>
                  {mediaUrl}
                </span>
                <Badge variant="outline" className="text-[8px] uppercase px-1 py-0 border-indigo-500/30 text-indigo-500 bg-indigo-500/5 scale-90 shrink-0">
                  LINK
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end mt-1 pt-1 border-t border-border/40 text-[9px]">
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary/85 flex items-center gap-0.5 hover:underline cursor-pointer">
              Open <Link2 className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      );
  }
}
