import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export const Welcome = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mark that user has seen the welcome page
    localStorage.setItem("hasSeenWelcome", "true");

    // Start fade-in animation after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    navigate("/all-properties");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0 animate-gradient-shift">
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, #1e5a7f 0%, #164a6a 25%, #0d3a54 50%, #0a2a40 75%, #051620 100%)",
          animation: "colorShift 8s ease-in-out infinite"
        }}></div>
      </div>

      {/* Overlay for depth */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(5,22,32,0.4)]"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Welcome Text - Slow fade in */}
        <h1
          className={`text-6xl md:text-8xl font-bold text-white mb-12 leading-tight tracking-tight transition-all duration-[2000ms] transform ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          style={{
            transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
          }}
        >
          Welcome
        </h1>

        {/* Continue Button - Fade in after text */}
        <button
          onClick={handleContinue}
          className={`inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-[#0d3a54] font-semibold py-3 px-8 rounded-lg transition-all duration-1000 transform hover:scale-105 shadow-lg hover:shadow-2xl ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <span>Continue to Platform</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes colorShift {
          0% {
            background: linear-gradient(135deg, #1e5a7f 0%, #164a6a 25%, #0d3a54 50%, #0a2a40 75%, #051620 100%);
          }
          50% {
            background: linear-gradient(135deg, #2d7ba8 0%, #1a5a7a 25%, #0f4a60 50%, #0a3a50 75%, #051e30 100%);
          }
          100% {
            background: linear-gradient(135deg, #1e5a7f 0%, #164a6a 25%, #0d3a54 50%, #0a2a40 75%, #051620 100%);
          }
        }
      `}</style>
    </div>
  );
};
