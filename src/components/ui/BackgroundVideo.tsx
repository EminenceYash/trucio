import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { motion } from 'motion/react';
import glassBackdropUrl from '../../assets/images/glass-backdrop.jpg';
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
          // Autoplay blocked silently; static glass backdrop remains visible
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
      {/* Translucent porcelain fluted glass artwork blended into the canvas */}
      <motion.img
        src={glassBackdropUrl}
        alt=""
        loading="eager"
        decoding="async"
        initial={prefersReducedMotion ? { opacity: 0.62 } : { opacity: 0, scale: 1.025 }}
        animate={{ opacity: 0.62, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 h-full w-full object-cover object-center will-change-transform select-none"
      />

      {/* Luminous airy veil over the center focal zone for crisp headline & input contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 58% at 50% 48%, rgba(248, 250, 252, 0.78) 0%, rgba(248, 250, 252, 0.44) 55%, rgba(248, 250, 252, 0.14) 100%)',
        }}
      />

      {/* Ambient Mux HLS video softly diffused behind frosted glass when active */}
      {shouldRenderVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 h-full w-full object-cover invert hue-rotate-180 saturate-125 blur-[4px] mix-blend-multiply transition-opacity duration-1000 ${
            videoReady ? 'opacity-10' : 'opacity-0'
          }`}
        />
      )}

      {/* Soft-edged architectural vertical glass flutes */}
      <div className="absolute inset-0 fluted-ribs opacity-60" />

      {/* Gentle bottom fade into clean porcelain footer bar */}
      <div
        className="absolute inset-x-0 bottom-0 h-28"
        style={{
          background:
            'linear-gradient(to top, rgba(248, 250, 252, 0.9) 0%, rgba(248, 250, 252, 0) 100%)',
        }}
      />
    </div>
  );
}
