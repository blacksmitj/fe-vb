"use client";

import * as React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, RefreshCw } from "lucide-react";

interface PhotoViewerProps {
  url: string;
}

export function PhotoViewer({ url }: PhotoViewerProps) {
  const [rotation, setRotation] = React.useState(0);

  // Reset rotation when image URL changes
  React.useEffect(() => {
    setRotation(0);
  }, [url]);

  const rotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const resetRotation = () => {
    setRotation(0);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Main Canvas Panel with Zoom/Pan */}
      <div className="flex-1 border border-dashed rounded-lg bg-slate-900/10 flex items-center justify-center overflow-hidden relative min-h-[300px]">
        <TransformWrapper
          key={url}
          initialScale={1}
          minScale={0.5}
          maxScale={6}
          centerOnInit={true}
          limitToBounds={rotation % 180 === 0}
          panning={{ velocityDisabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Controls overlay inside canvas */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/60 hover:bg-black/70 p-1.5 rounded-lg backdrop-blur-xs z-50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => zoomIn()}
                  className="h-7 w-7 text-white hover:text-white hover:bg-white/10"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => zoomOut()}
                  className="h-7 w-7 text-white hover:text-white hover:bg-white/10"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-white/20 mx-0.5" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={rotateLeft}
                  className="h-7 w-7 text-white hover:text-white hover:bg-white/10"
                  title="Rotate Left"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={rotateRight}
                  className="h-7 w-7 text-white hover:text-white hover:bg-white/10"
                  title="Rotate Right"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-white/20 mx-0.5" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    resetTransform();
                    resetRotation();
                  }}
                  className="h-7 w-7 text-white hover:text-white hover:bg-white/10"
                  title="Reset View"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Pan & Zoom Container */}
              <TransformComponent
                wrapperClass="!w-full !h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                {/* Direct child is controlled by react-zoom-pan-pinch (no transition, no custom transform overrides) */}
                <div className="flex items-center justify-center max-h-full max-w-full">
                  {/* Nested container handles rotation and its transition */}
                  <div
                    className="transition-transform duration-300 ease-out flex items-center justify-center"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <img
                      src={url}
                      alt="Evaluation Attachment"
                      className="max-h-[70vh] max-w-full object-contain select-none pointer-events-none rounded-sm shadow-md"
                    />
                  </div>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
}
