"use client";

import * as React from "react";

interface VideoViewerProps {
  url: string;
}

export function VideoViewer({ url }: VideoViewerProps) {
  // Check if it's a YouTube URL
  const getYoutubeId = (videoUrl: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = getYoutubeId(url);

  // Check if it's a Google Drive URL
  const getGoogleDriveEmbed = (driveUrl: string) => {
    const match = driveUrl.match(/(?:drive|docs)\.google\.com\/(?:[^\/]+\/)*?(?:file\/d\/|open\?id=|uc\?(?:[^\&]*\&)*?id=)([^/\?&#]+)/i);
    return match && match[1] ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
  };

  const gdriveEmbed = getGoogleDriveEmbed(url);

  if (gdriveEmbed) {
    return (
      <div className="flex-1 w-full h-full border rounded-lg bg-black overflow-hidden flex items-center justify-center min-h-[300px]">
        <iframe
          src={gdriveEmbed}
          title="Google Drive Video Viewer"
          width="100%"
          height="100%"
          allow="autoplay"
          allowFullScreen
          className="w-full h-full aspect-video border-0"
        />
      </div>
    );
  }

  if (youtubeId) {
    return (
      <div className="flex-1 w-full h-full border rounded-lg bg-black overflow-hidden flex items-center justify-center min-h-[300px]">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full aspect-video"
        />
      </div>
    );
  }

  // Fallback to standard HTML5 video tag
  return (
    <div className="flex-1 w-full h-full border rounded-lg bg-black overflow-hidden flex items-center justify-center min-h-[300px]">
      <video
        src={url}
        controls
        autoPlay
        playsInline
        className="w-full h-full max-h-[70vh] object-contain"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
