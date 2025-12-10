import { useState } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Auth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    profilePhoto: null as File | null,
    rememberMe: false,
    agreeToTerms: false,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

      if (!formData.phone) {
        newErrors.phone = "Phone number is required";
      } else if (!/^[\d\-\+\(\)\s]{10,}$/.test(formData.phone.replace(/\s/g, ""))) {
        newErrors.phone = "Invalid phone number format";
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          profilePhoto: "Please select a valid image file",
        }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profilePhoto: "File size must be less than 5MB",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        profilePhoto: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      if (errors.profilePhoto) {
        setErrors((prev) => ({
          ...prev,
          profilePhoto: "",
        }));
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Hero Section with Geometric Background */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden">
        {/* Background with Primary Navy Color */}
        <div className="absolute inset-0 bg-[#033763]" />

        {/* Geometric Background Pattern - Diagonal Lines Only */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          style={{ zIndex: 1 }}
        >
          {/* Background base */}
          <rect width="1000" height="1000" fill="#033763" />

          {/* Large diagonal stripe - Light Beige */}
          <polygon points="0,200 400,0 1000,0 1000,600 200,1000 0,1000" fill="#DBD7CA" />

          {/* Diagonal line - creates definition on top */}
          <line x1="0" y1="200" x2="400" y2="0" stroke="#033763" strokeWidth="35" />

          {/* Diagonal line - creates definition on bottom */}
          <line x1="200" y1="1000" x2="1000" y2="600" stroke="#033763" strokeWidth="35" />

          {/* Additional subtle diagonal accent lines */}
          <line x1="0" y1="350" x2="350" y2="0" stroke="white" strokeWidth="8" opacity="0.15" />
          <line x1="150" y1="1000" x2="950" y2="150" stroke="white" strokeWidth="8" opacity="0.15" />
        </svg>

        {/* Content - Relative to overlay the background */}
        <div className="relative z-20 flex flex-col justify-between h-full p-8">
          {/* Logo and Company Name */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <img
                alt="AVM Logo"
                src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
                className="w-10 h-10"
              />
              <span className="text-2xl font-bold text-white">AVM</span>
            </div>
            <p className="text-xs text-gray-200 ml-0">Property Management</p>
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

            {/* Phone Number Field (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-offset-0 ${
                    errors.phone
                      ? "border-red-300 focus:ring-red-200 bg-red-50"
                      : "border-gray-300"
                  }`}
                  style={!errors.phone ? { borderColor: "rgb(36, 99, 235)", outlineColor: "rgb(36, 99, 235)" } : {}}
                  onFocus={(e) => {
                    if (!errors.phone) {
                      e.target.style.boxShadow = "0 0 0 2px rgba(36, 99, 235, 0.1)";
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = "";
                  }}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            )}

            {/* Profile Photo Field (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label htmlFor="profilePhoto" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Photo (Optional)
                </label>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <input
                      id="profilePhoto"
                      name="profilePhoto"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      style={{
                        colorScheme: "light",
                      }}
                    />
                    {errors.profilePhoto && (
                      <p className="mt-1 text-sm text-red-600">{errors.profilePhoto}</p>
                    )}
                  </div>
                  {photoPreview && (
                    <div className="flex-shrink-0">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-16 h-16 rounded-lg object-cover border border-gray-300"
                      />
                    </div>
                  )}
                </div>
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
                    <a href="/terms-of-service" className="font-medium" style={{ color: "rgb(36, 99, 235)" }}>
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy-policy" className="font-medium" style={{ color: "rgb(36, 99, 235)" }}>
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
                    phone: "",
                    profilePhoto: null,
                    rememberMe: false,
                    agreeToTerms: false,
                  });
                  setPhotoPreview(null);
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
    </div>
  );
};
