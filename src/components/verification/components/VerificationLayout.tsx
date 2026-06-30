"use client";

import React from "react";
import { useVerificationStore } from "@/stores";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { PhotoViewer } from "../viewers/PhotoViewer";
import { VideoViewer } from "../viewers/VideoViewer";
import { PdfViewer } from "../viewers/PdfViewer";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface VerificationLayoutProps {
  children: React.ReactNode;
}

export function VerificationLayout({ children }: VerificationLayoutProps) {
  const { isMediaViewerOpen, closeMediaViewer, mediaType, mediaUrl } = useVerificationStore();
  const [leftSize, setLeftSize] = React.useState(65);

  React.useEffect(() => {
    try {
      const storedSize = localStorage.getItem("media_viewer_left_size");
      if (storedSize) {
        const parsed = parseFloat(storedSize);
        if (!isNaN(parsed) && parsed >= 30 && parsed <= 80) {
          setLeftSize(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to read media viewer layout size from localStorage", e);
    }
  }, []);

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden bg-background">
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        {/* Left Area: Participant List & Evaluation Form */}
        <ResizablePanel
          defaultSize={isMediaViewerOpen ? leftSize : 100}
          minSize={30}
          onResize={(size) => {
            if (!isMediaViewerOpen) return;
            const sizePct = (size as any).asPercentage ?? size;
            setLeftSize(sizePct);
            try {
              localStorage.setItem("media_viewer_left_size", sizePct.toString());
            } catch (e) {
              console.warn("Failed to write media viewer layout size to localStorage", e);
            }
          }}
          className="flex flex-col h-full overflow-y-auto"
        >
          {children}
        </ResizablePanel>

        {isMediaViewerOpen && (
          <>
            {/* Drag Handle */}
            <ResizableHandle
              withHandle
              className="hover:bg-primary/20 transition-colors"
            />

            {/* Right Area: Media Viewer Panel */}
            <ResizablePanel
              defaultSize={100 - leftSize}
              minSize={20}
              className="h-full overflow-hidden bg-muted/10"
            >
              <div className="flex flex-col h-full w-full min-w-[300px]">
                <div className="flex items-center justify-between p-4 border-b bg-background">
                  <h3 className="font-semibold text-sm">
                    Media Viewer: <span className="capitalize font-medium text-muted-foreground">{mediaType}</span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeMediaViewer}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden relative p-4 flex flex-col">
                  {mediaUrl ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                      {mediaType === "photo" && <PhotoViewer url={mediaUrl} />}
                      {mediaType === "video" && <VideoViewer url={mediaUrl} />}
                      {mediaType === "pdf" && <PdfViewer url={mediaUrl} />}
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center border border-dashed rounded-lg bg-muted/30 text-muted-foreground text-sm">
                      Select a media attachment to preview.
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
