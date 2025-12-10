import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Auth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (isSignUp) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirm password is required";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = "You must agree to the terms";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to welcome page for sign-up, properties for login
      navigate(isSignUp ? "/welcome" : "/all-properties");
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Hero Section with Geometric Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Geometric Background Pattern */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
          style={{ zIndex: 0 }}
        >
          {/* Large Navy Triangle - Top Right */}
          <polygon points="800,0 1000,0 1000,400" fill="#003f7f" />

          {/* Medium Navy Triangle - Bottom Left */}
          <polygon points="0,600 0,1000 400,1000" fill="#003f7f" />

          {/* Light Beige Triangle - Center */}
          <polygon points="300,200 600,200 450,500" fill="#e8dcc8" />

          {/* Another Navy Triangle - Bottom Right */}
          <polygon points="900,700 1000,600 1000,1000" fill="#003f7f" opacity="0.8" />

          {/* Accent Navy Triangle - Top Left */}
          <polygon points="0,0 250,0 0,250" fill="#003f7f" opacity="0.6" />
        </svg>

        {/* Content - Relative to overlay the background */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Logo and Company Name */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <img
                alt="AVM Logo"
                src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
                className="w-12 h-12"
              />
              <span className="text-3xl font-semibold text-gray-900">AVM</span>
            </div>
            <p className="text-sm text-gray-600 ml-0">Property Management</p>
          </div>

          {/* Center spacer */}
          <div />

          {/* Footer with Credits */}
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              © 2025 AVM. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs">
              Developed by Reasonable Automations
            </p>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-12 sm:py-0">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img
              alt="AVM Logo"
              src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
              className="w-8 h-8"
            />
            <span className="text-xl font-semibold text-gray-900">AVM</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-600">
              {isSignUp
                ? "Join AVM and start managing your properties efficiently"
                : "Sign in to your AVM account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-2.5 rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-offset-0 ${
                  errors.email
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-300"
                }`}
                style={!errors.email ? { borderColor: "rgb(36, 99, 235)", outlineColor: "rgb(36, 99, 235)" } : {}}
                onFocus={(e) => {
                  if (!errors.email) {
                    e.target.style.boxShadow = "0 0 0 2px rgba(36, 99, 235, 0.1)";
                  }
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "";
                }}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-offset-0 ${
                  errors.password
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-300"
                }`}
                style={!errors.password ? { borderColor: "rgb(36, 99, 235)", outlineColor: "rgb(36, 99, 235)" } : {}}
                onFocus={(e) => {
                  if (!errors.password) {
                    e.target.style.boxShadow = "0 0 0 2px rgba(36, 99, 235, 0.1)";
                  }
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "";
                }}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-offset-0 ${
                    errors.confirmPassword
                      ? "border-red-300 focus:ring-red-200 bg-red-50"
                      : "border-gray-300"
                  }`}
                  style={!errors.confirmPassword ? { borderColor: "rgb(36, 99, 235)", outlineColor: "rgb(36, 99, 235)" } : {}}
                  onFocus={(e) => {
                    if (!errors.confirmPassword) {
                      e.target.style.boxShadow = "0 0 0 2px rgba(36, 99, 235, 0.1)";
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = "";
                  }}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Remember Me / Forgot Password (Login Only) */}
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: "rgb(36, 99, 235)" }}
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium" style={{ color: "rgb(36, 99, 235)" }}>
                  Forgot password?
                </a>
              </div>
            )}

            {/* Terms & Conditions (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 mt-1"
                    style={{ accentColor: "rgb(36, 99, 235)" }}
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{" "}
                    <a href="#" className="font-medium" style={{ color: "rgb(36, 99, 235)" }}>
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="font-medium" style={{ color: "rgb(36, 99, 235)" }}>
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-semibold py-2.5 px-4 rounded-lg transition-colors mt-6 disabled:bg-gray-400"
              style={{
                backgroundColor: "rgb(36, 99, 235)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "rgb(30, 87, 207)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "rgb(36, 99, 235)";
                }
              }}
            >
              {isLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Toggle Sign Up / Login */}
          <div className="mt-8 text-center border-t border-gray-200 pt-8">
            <p className="text-gray-600">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setFormData({
                    email: "",
                    password: "",
                    confirmPassword: "",
                    rememberMe: false,
                    agreeToTerms: false,
                  });
                  setErrors({});
                }}
                className="font-semibold"
                style={{ color: "rgb(36, 99, 235)" }}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-8 space-y-2 text-center text-sm">
            <p>
              <a href="#" className="transition-colors" style={{ color: "rgb(36, 99, 235)" }}>
                Contact Support
              </a>
            </p>
            <p>
              <a href="#" className="transition-colors" style={{ color: "rgb(36, 99, 235)" }}>
                Privacy Policy
              </a>
              {" • "}
              <a href="#" className="transition-colors" style={{ color: "rgb(36, 99, 235)" }}>
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
