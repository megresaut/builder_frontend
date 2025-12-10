import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export const Welcome = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    navigate("/all-properties");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F5A7B] via-[#0A3D54] to-[#051E2C] flex flex-col items-center justify-center px-4 py-12 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className={`relative z-10 max-w-2xl mx-auto text-center transition-all duration-1000 transform ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}>
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-white rounded-full p-4">
              <img
                alt="AVM Logo"
                src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
                className="w-16 h-16"
              />
            </div>
          </div>
        </div>

        {/* Welcome Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Welcome to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AVM</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
          Your property management platform is ready. Let's get you started with managing your properties efficiently.
        </p>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 my-12">
          {[
            {
              icon: "🏢",
              title: "Manage Properties",
              desc: "View and manage all your properties in one place"
            },
            {
              icon: "⚡",
              title: "Track Utilities",
              desc: "Monitor energy usage and costs in real-time"
            },
            {
              icon: "🔧",
              title: "Maintenance",
              desc: "Schedule and track maintenance tasks effortlessly"
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className={`bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20 hover:border-opacity-40 transition-all duration-500 transform hover:scale-105 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${(idx + 1) * 200}ms` }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-blue-100 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 my-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Tips to Get Started</h2>
          <ul className="space-y-4 text-left">
            {[
              "Add your first property from the Properties page",
              "Link your utility accounts to track usage and costs",
              "Set up maintenance schedules for preventive care",
              "Monitor financial insights with detailed reports"
            ].map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-4 text-blue-100"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center mt-1">
                  <span className="text-white text-sm font-bold">{idx + 1}</span>
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleGetStarted}
          className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <span>Go to Properties</span>
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

        {/* Footer text */}
        <p className="mt-12 text-blue-200 text-sm">
          Questions? Check out our{" "}
          <a href="#" className="underline hover:text-white transition-colors">
            documentation
          </a>
          {" "}or{" "}
          <a href="#" className="underline hover:text-white transition-colors">
            contact support
          </a>
        </p>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};
