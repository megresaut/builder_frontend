import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSignUpTooltip, setShowSignUpTooltip] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

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
      navigate("/all-properties");
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

  const handleForgotPasswordClick = () => {
    setShowForgotPasswordModal(true);
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);
    setForgotPasswordEmail("");
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);
    setForgotPasswordEmail("");
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");

    // Validate email
    if (!forgotPasswordEmail) {
      setForgotPasswordError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      setForgotPasswordError("Invalid email format");
      return;
    }

    setForgotPasswordLoading(true);
    // Simulate API call
    setTimeout(() => {
      setForgotPasswordLoading(false);
      setForgotPasswordSuccess(true);
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        closeForgotPasswordModal();
      }, 3000);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Hero Section with Background Image */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden">
        {/* Background Image */}
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F2b245f83eda342b5a4ad43495095989f?format=webp&width=800"
          alt="AVM Branding"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />

        {/* Overlay for content visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" style={{ zIndex: 1 }} />

        {/* Content - Relative to overlay the background */}
        <div className="relative z-20 flex flex-col justify-between h-full p-8">
          {/* Empty top section */}
          <div />

          {/* Center Branding with Icon - Off-centered */}
          <div className="flex flex-col items-start justify-center gap-6 mb-12 ml-8">
            {/* AVM Icon */}
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2Fcfcebb746e114b489185ee38a951cabb?format=webp&width=800"
              alt="AVM Icon"
              className="w-40 h-40"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            {/* Text */}
            <div>
              <h1 className="text-8xl font-bold text-white mb-2 leading-tight">AVM</h1>
              <p className="text-3xl text-gray-100">Property Management</p>
            </div>
          </div>

          {/* Footer with Credits */}
          <div className="space-y-1 text-xs">
            <p className="text-gray-200">
              © 2025 AVM. All rights reserved.
            </p>
            <p className="text-gray-300">
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
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome Back
            </h2>
            <p className="text-xl text-gray-600">
              Sign in to your AVM account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
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
              <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
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

            {/* Remember Me / Forgot Password */}
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
                <span className="text-base text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-base font-medium hover:opacity-80 transition-opacity"
                style={{ color: "rgb(36, 99, 235)" }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-semibold py-3 px-4 text-lg rounded-lg transition-colors mt-6 disabled:bg-gray-400"
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
              {isLoading ? "Loading..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Info */}
          <div className="mt-8 text-center border-t border-gray-200 pt-8">
            <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
              Don't have an account?
              <div className="relative">
                <button
                  onMouseEnter={() => setShowSignUpTooltip(true)}
                  onMouseLeave={() => setShowSignUpTooltip(false)}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-400 text-gray-600 hover:border-gray-500 hover:text-gray-700 transition-colors"
                  type="button"
                >
                  <span className="text-xs font-semibold">?</span>
                </button>
                {showSignUpTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-10">
                    Contact your administrator to create an account
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-8 space-y-2 text-center text-base">
            <p>
              <a href="mailto:matt@reasonableautomations.com" className="transition-colors" style={{ color: "rgb(36, 99, 235)" }}>
                Contact Support
              </a>
            </p>
            <p>
              <a href="/privacy-policy" className="transition-colors" style={{ color: "rgb(36, 99, 235)" }}>
                Privacy Policy
              </a>
              {" • "}
              <a href="/terms-of-service" className="transition-colors" style={{ color: "rgb(36, 99, 235)" }}>
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-600 mb-6">
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            {forgotPasswordSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-center">
                  Check your email for password reset instructions!
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => {
                      setForgotPasswordEmail(e.target.value);
                      setForgotPasswordError("");
                    }}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-offset-0 ${
                      forgotPasswordError
                        ? "border-red-300 focus:ring-red-200 bg-red-50"
                        : "border-gray-300"
                    }`}
                    style={!forgotPasswordError ? { borderColor: "rgb(36, 99, 235)", outlineColor: "rgb(36, 99, 235)" } : {}}
                    onFocus={(e) => {
                      if (!forgotPasswordError) {
                        e.target.style.boxShadow = "0 0 0 2px rgba(36, 99, 235, 0.1)";
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = "";
                    }}
                  />
                  {forgotPasswordError && (
                    <p className="mt-1 text-sm text-red-600">{forgotPasswordError}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForgotPasswordModal}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="flex-1 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:bg-gray-400"
                    style={{
                      backgroundColor: forgotPasswordLoading ? "rgb(156, 163, 175)" : "rgb(36, 99, 235)",
                    }}
                    onMouseEnter={(e) => {
                      if (!forgotPasswordLoading) {
                        e.currentTarget.style.backgroundColor = "rgb(30, 87, 207)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!forgotPasswordLoading) {
                        e.currentTarget.style.backgroundColor = "rgb(36, 99, 235)";
                      }
                    }}
                  >
                    {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
