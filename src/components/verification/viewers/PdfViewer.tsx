"use client";

import * as React from "react";

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  return (
    <div className="flex-1 w-full h-full border rounded-lg overflow-hidden bg-background flex flex-col min-h-[400px]">
      <iframe
        src={url}
        title="PDF Document Viewer"
        className="w-full h-full flex-1"
        style={{ border: "none" }}
      />
    </div>
  );
}
