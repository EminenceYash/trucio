import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

const MUX_STREAM_URL =
  'https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8';

interface BackgroundVideoProps {
  className?: string;
}

export function BackgroundVideo({ className = '' }: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prefersReducedMotion = useReducedMotionPreference();
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let cancelled = false;

    const handleCanPlay = () => {
      if (!cancelled) {
        setVideoReady(true);
        video.play().catch(() => {
          // Autoplay blocked silently; fallback remains visible
        });
      }
    };

    const handleError = () => {
      if (!cancelled) {
        setVideoFailed(true);
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = MUX_STREAM_URL;
      video.load();
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal && !cancelled) {
          setVideoFailed(true);
          hls?.destroy();
          hls = null;
        }
      });
      hls.loadSource(MUX_STREAM_URL);
      hls.attachMedia(video);
    } else {
      setVideoFailed(true);
    }

    return () => {
      cancelled = true;
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      if (hls) {
        hls.destroy();
        hls = null;
      }
    };
  }, [prefersReducedMotion]);

  const shouldRenderVideo = !prefersReducedMotion && !videoFailed;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* Cool subtle atmospheric tint */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 72% 56% at 50% 28%, rgba(226, 232, 240, 0.42) 0%, transparent 100%)',
        }}
      />

      {/* Ambient Mux HLS video softly diffused behind frosted glass */}
      {shouldRenderVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 h-full w-full object-cover invert hue-rotate-180 saturate-125 blur-[4px] mix-blend-multiply transition-opacity duration-1000 ${
            videoReady ? 'opacity-14' : 'opacity-0'
          }`}
        />
      )}

      {/* Soft-edged architectural vertical glass flutes */}
      <div className="absolute inset-0 fluted-ribs opacity-70" />
    </div>
  );
}
