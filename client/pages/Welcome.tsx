import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export const Welcome = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleContinue = () => {
    navigate("/all-properties");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1e5a7f] via-[#164a6a] to-[#0d3a54] z-0">
        <div className="absolute inset-0 opacity-50">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2d7ba8" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#1a4d68" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0d2a3a" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad1)" />
          </svg>
        </div>
      </div>

      {/* Animated color shift effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-[rgba(13,42,84,0.3)]"></div>
      </div>

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center transition-all duration-1000 transform ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}>
        {/* Welcome Text */}
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-12 leading-tight tracking-tight">
          Welcome
        </h1>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className={`inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-[#0d3a54] font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          style={{ transitionDelay: "300ms" }}
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
    </div>
  );
};
