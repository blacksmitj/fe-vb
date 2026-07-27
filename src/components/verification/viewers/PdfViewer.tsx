"use client";

import * as React from "react";

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const getEmbedUrl = (src: string) => {
    const match = src.match(/(?:drive|docs)\.google\.com\/(?:[^\/]+\/)*?(?:file\/d\/|open\?id=|uc\?(?:[^\&]*\&)*?id=)([^/\?&#]+)/i);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return src;
  };

  return (
    <div className="flex-1 w-full h-full border rounded-lg overflow-hidden bg-background flex flex-col min-h-[400px]">
      <iframe
        src={getEmbedUrl(url)}
        title="PDF Document Viewer"
        className="w-full h-full flex-1"
        style={{ border: "none" }}
      />
    </div>
  );
}
