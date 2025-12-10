import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export const Welcome = () => {
  const navigate = useNavigate();
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isContinueVisible, setIsContinueVisible] = useState(false);

  useEffect(() => {
    // Mark that user has seen the welcome page
    localStorage.setItem("hasSeenWelcome", "true");

    // Welcome text fades in first
    const welcomeTimer = setTimeout(() => {
      setIsWelcomeVisible(true);
    }, 300);

    // Continue text fades in after welcome
    const continueTimer = setTimeout(() => {
      setIsContinueVisible(true);
    }, 2500);

    return () => {
      clearTimeout(welcomeTimer);
      clearTimeout(continueTimer);
    };
  }, []);

  const handleContinue = () => {
    navigate("/all-properties");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden relative">
      {/* Animated wave gradient background */}
      <svg
        className="absolute inset-0 w-full h-full z-0"
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e5a7f" stopOpacity="1" />
            <stop offset="25%" stopColor="#164a6a" stopOpacity="1" />
            <stop offset="50%" stopColor="#0d3a54" stopOpacity="1" />
            <stop offset="75%" stopColor="#0a2a40" stopOpacity="1" />
            <stop offset="100%" stopColor="#051620" stopOpacity="1" />
          </linearGradient>
          <filter id="waveFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.002" numOctaves="3" result="noise" seed="2" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="50" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <rect width="1200" height="800" fill="url(#waveGradient)" />
        <g opacity="0.3" style={{ animation: "wave 15s ease-in-out infinite" }}>
          <path
            d="M 0,400 Q 300,350 600,400 T 1200,400 L 1200,800 L 0,800 Z"
            fill="#0a4a70"
            style={{ animation: "wavePath 8s ease-in-out infinite" }}
          />
          <path
            d="M 0,450 Q 300,400 600,450 T 1200,450 L 1200,800 L 0,800 Z"
            fill="#062a4a"
            style={{ animation: "wavePath 10s ease-in-out infinite reverse" }}
          />
        </g>
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Welcome Text - Slow fade in */}
        <h1
          className={`text-6xl md:text-8xl font-bold text-white mb-16 leading-tight tracking-tight transition-all duration-[2500ms] ${
            isWelcomeVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
          }}
        >
          Welcome
        </h1>

        {/* Continue Text - Fade in after Welcome */}
        <div
          onClick={handleContinue}
          className={`cursor-pointer text-xl md:text-2xl text-white transition-all duration-[2000ms] hover:opacity-80 ${
            isContinueVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
          }}
        >
          Continue to Platform
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes wavePath {
          0%, 100% {
            d: path('M 0,400 Q 300,350 600,400 T 1200,400 L 1200,800 L 0,800 Z');
          }
          50% {
            d: path('M 0,420 Q 300,360 600,420 T 1200,420 L 1200,800 L 0,800 Z');
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(50px);
          }
        }
      `}</style>
    </div>
  );
};
