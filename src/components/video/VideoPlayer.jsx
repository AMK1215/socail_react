import React, { useRef, useEffect, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayer = ({ 
  src, 
  poster, 
  autoplay = false, 
  muted = false,
  className = "",
  onReady,
  onPlay,
  onPause,
  onEnded,
  style = {}
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const options = {
    autoplay: autoplay,
    controls: true,
    responsive: true,
    fluid: true,
    muted: muted,
    poster: poster,
    playsinline: true, // Important for mobile
    preload: 'metadata',
    sources: [{
      src: src,
      type: 'video/mp4'
    }],
    // Enhanced options for better UX
    playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
    userActions: {
      hotkeys: true
    },
    // Custom styling
    fill: false,
    aspectRatio: '16:9'
  };

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode
      const videoElement = document.createElement("video-js");
      
      videoElement.classList.add('vjs-big-play-centered');
      videoElement.classList.add('vjs-fluid');
      videoElement.classList.add('vjs-default-skin');
      
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, options, () => {
        console.log('📹 Video.js player is ready');
        onReady && onReady(player);
      });

      // Add event listeners
      if (onPlay) {
        player.on('play', () => {
          console.log('▶️ Video started playing');
          onPlay(player);
        });
      }

      if (onPause) {
        player.on('pause', () => {
          console.log('⏸️ Video paused');
          onPause(player);
        });
      }

      if (onEnded) {
        player.on('ended', () => {
          console.log('🏁 Video ended');
          onEnded(player);
        });
      }

      // Additional useful events
      player.on('loadstart', () => {
        console.log('🔄 Video loading started');
      });

      player.on('canplay', () => {
        console.log('✅ Video can start playing');
      });

      player.on('error', (error) => {
        console.error('❌ Video error:', error);
      });

      // Fullscreen event listeners
      player.on('fullscreenchange', () => {
        const isFullscreenNow = player.isFullscreen();
        setIsFullscreen(isFullscreenNow);
        console.log('🔳 Fullscreen changed:', isFullscreenNow);
      });

      // Mobile-specific optimizations
      player.on('touchstart', () => {
        // Custom touch handling if needed
      });

    } else if (playerRef.current) {
      // Update existing player with new source
      const player = playerRef.current;
      
      if (options.sources[0].src !== player.src()) {
        player.src(options.sources);
        player.poster(poster);
      }
    }
  }, [src, poster, autoplay, muted, onReady, onPlay, onPause, onEnded]);

  // Add keyboard support for ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isFullscreen && playerRef.current) {
        event.preventDefault();
        playerRef.current.exitFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        console.log('🗑️ Disposing Video.js player');
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // Handle close fullscreen
  const handleCloseFullscreen = () => {
    if (playerRef.current && playerRef.current.isFullscreen()) {
      playerRef.current.exitFullscreen();
    }
  };

  return (
    <div 
      data-vjs-player 
      className={`video-js-container ${className}`}
      style={style}
    >
      <div ref={videoRef} className="w-full h-full" />
      
      {/* Custom Fullscreen Close Button */}
      {isFullscreen && (
        <button
          onClick={handleCloseFullscreen}
          className="fullscreen-close-btn"
          title="Exit Fullscreen (ESC)"
          aria-label="Exit Fullscreen"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
      
      {/* Custom overlay for additional controls if needed */}
      <style jsx>{`
        .video-js-container {
          position: relative;
          width: 100%;
          height: auto;
        }
        
        .video-js-container .video-js {
          width: 100% !important;
          height: auto !important;
          font-family: inherit;
        }
        
        /* Custom Video.js theme for social media */
        .video-js-container .vjs-big-play-button {
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          border: 3px solid #fff;
          color: #fff;
          font-size: 2.5em;
          line-height: 1.8;
          height: 80px;
          width: 80px;
          margin-top: -40px;
          margin-left: -40px;
          transition: all 0.3s ease;
        }
        
        .video-js-container .vjs-big-play-button:hover {
          background: rgba(59, 130, 246, 0.9);
          transform: scale(1.1);
        }
        
        /* Control bar styling */
        .video-js-container .vjs-control-bar {
          background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%);
          color: #fff;
        }
        
        /* Progress bar */
        .video-js-container .vjs-play-progress {
          background: #3b82f6;
        }
        
        /* Volume control */
        .video-js-container .vjs-volume-level {
          background: #3b82f6;
        }
        
        /* Custom Fullscreen Close Button */
        .fullscreen-close-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          color: #fff;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        .fullscreen-close-btn:hover {
          background: rgba(239, 68, 68, 0.9);
          border-color: rgba(255, 255, 255, 0.6);
          transform: scale(1.1);
        }
        
        .fullscreen-close-btn:active {
          transform: scale(0.95);
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
          .video-js-container .vjs-big-play-button {
            height: 60px;
            width: 60px;
            margin-top: -30px;
            margin-left: -30px;
            font-size: 2em;
            line-height: 1.7;
          }
          
          .fullscreen-close-btn {
            top: 15px;
            right: 15px;
            width: 44px;
            height: 44px;
          }
          
          .fullscreen-close-btn svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
