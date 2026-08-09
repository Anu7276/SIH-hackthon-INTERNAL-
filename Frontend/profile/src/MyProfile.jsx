import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Pencil,
  Users,
  Rocket,
  Briefcase,
  ChevronRight,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  Leaf,
  X,
  Check,
  Lock,
  ArrowRight,
  LogOut,
  Building,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Save,
} from "lucide-react";

import logo from "./assets/logo.jpeg";
import heroBg from "./assets/hero-bg.jpeg";

// ---- Design tokens -------------------------------------------------------
const COLORS = {
  primaryGreen: "#1F5C36",
  accentGreen: "#6BAF3E",
  orange: "#D97A29",
  creamBg: "#FAF8F5",
};

// ---- Helper Components ---------------------------------------------------

function SectionHeading({ icon: Icon, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="w-5 h-5" style={{ color: COLORS.primaryGreen }} />
        )}
        <h2 className="text-lg font-bold" style={{ color: COLORS.primaryGreen }}>
          {children}
        </h2>
      </div>
      <div
        className="h-0.5 w-7 mt-1 rounded-full"
        style={{ backgroundColor: COLORS.accentGreen }}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, isLast }) {
  return (
    <div
      className={`flex items-center gap-4 py-3.5 ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#E8F0E9" }}
      >
        <Icon className="w-4 h-4" style={{ color: COLORS.primaryGreen }} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-8 w-full">
        <span className="text-sm font-semibold text-gray-700 sm:w-32 shrink-0">
          {label}
        </span>
        <span className="text-sm text-gray-600">{value || "Not provided"}</span>
      </div>
    </div>
  );
}

function RoleCard({ icon: Icon, title, description, accent, bg, selected, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        backgroundColor: bg,
        borderColor: selected ? accent : "transparent",
        boxShadow: selected ? `0 0 0 1px ${accent}` : undefined,
      }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm">
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm" style={{ color: accent }}>
          {title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      {selected ? (
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: accent }}
        >
          <Check className="w-3.5 h-3.5 text-white" />
        </span>
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
      )}
    </button>
  );
}

// ---- Main Component -------------------------------------------------------

export default function MyProfile() {
  const queryParams = new URLSearchParams(window.location.search);
  const initialMode = queryParams.get("mode") || "profile";

  // Load saved profile from localStorage if present
  const getSavedProfile = () => {
    try {
      const data = localStorage.getItem("ayush_user_profile");
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  };

  const saved = getSavedProfile();

  // Mode state: 'register' (Step 1) | 'create-profile' (Step 2) | 'profile' (Step 3) | 'login'
  const [authMode, setAuthMode] = useState(
    saved && saved.isLoggedIn
      ? "profile"
      : initialMode === "login"
      ? "login"
      : "register"
  );

  const [isLoggedIn, setIsLoggedIn] = useState(saved ? Boolean(saved.isLoggedIn) : false);

  // User details state
  const [user, setUser] = useState(
    saved && saved.user
      ? saved.user
      : {
          fullName: "Ayush Sharma",
          username: "ayush_sharma23",
          email: "ayush.sharma23@example.com",
          phone: "+91 98765 43210",
          location: "New Delhi, India",
          bio: "Innovator in Ayurveda & Herbal Healthcare solutions.",
        }
  );

  const [selectedRole, setSelectedRole] = useState(
    saved && saved.selectedRole ? saved.selectedRole : "Startup"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const [photoUrl, setPhotoUrl] = useState(saved && saved.photoUrl ? saved.photoUrl : "");
  const photoInputRef = useRef(null);

  // Login form state
  const [loginData, setLoginData] = useState({ emailOrPhone: "", password: "", otpMode: false, otp: "" });
  
  // Register Form (Step 1) State
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "Startup",
  });

  // Create Profile Form (Step 2) State
  const [profileForm, setProfileForm] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    location: user.location || "",
    bio: user.bio || "",
  });

  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const saveToStorage = (updatedUser, updatedRole, updatedPhoto, loggedInStatus) => {
    try {
      localStorage.setItem(
        "ayush_user_profile",
        JSON.stringify({
          user: updatedUser || user,
          selectedRole: updatedRole || selectedRole,
          photoUrl: updatedPhoto !== undefined ? updatedPhoto : photoUrl,
          isLoggedIn: loggedInStatus !== undefined ? loggedInStatus : isLoggedIn,
        })
      );
    } catch (e) {}
  };

  // STEP 1: Registration Form Submit -> Next: Create Profile (Step 2)
  const handleRegisterNext = (e) => {
    e.preventDefault();
    if (!registerData.email || !registerData.password) {
      alert("Please fill in your email address and password.");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      alert("Passwords do not match. Please check and try again.");
      return;
    }

    // Set role and prefill email into user draft
    setSelectedRole(registerData.role);
    setUser((prev) => ({
      ...prev,
      email: registerData.email,
      username: registerData.email.split("@")[0],
    }));
    setProfileForm((prev) => ({
      ...prev,
      email: registerData.email,
    }));

    // Move to Step 2: Create Profile
    setAuthMode("create-profile");
    showToast("Account credentials created! Now complete your profile details.");
  };

  // STEP 2: Profile Details Submit -> Save Profile to LocalStorage & Show Dashboard
  const handleSaveProfileDetails = (e) => {
    e.preventDefault();
    if (!profileForm.fullName || !profileForm.phone) {
      alert("Please provide your Full Name and Phone Number.");
      return;
    }

    const updatedUser = {
      fullName: profileForm.fullName,
      username: registerData.email ? registerData.email.split("@")[0] : user.username,
      email: registerData.email || user.email,
      phone: profileForm.phone,
      location: profileForm.location || "India",
      bio: profileForm.bio || "AYUSH Sector Participant",
    };

    setUser(updatedUser);
    setIsLoggedIn(true);
    setAuthMode("profile");

    saveToStorage(updatedUser, selectedRole, photoUrl, true);
    showToast("Profile created & saved successfully! Welcome to Startup AYUSH.");
  };

  // Login Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginData.emailOrPhone) {
      alert("Please enter your registered email or phone number.");
      return;
    }
    
    // Check if saved profile exists, else prefill
    const savedProf = getSavedProfile();
    if (savedProf && savedProf.user) {
      setUser(savedProf.user);
      if (savedProf.selectedRole) setSelectedRole(savedProf.selectedRole);
      if (savedProf.photoUrl) setPhotoUrl(savedProf.photoUrl);
    } else {
      setUser((prev) => ({
        ...prev,
        email: loginData.emailOrPhone.includes("@") ? loginData.emailOrPhone : prev.email,
        phone: !loginData.emailOrPhone.includes("@") ? loginData.emailOrPhone : prev.phone,
      }));
    }

    setIsLoggedIn(true);
    setAuthMode("profile");
    saveToStorage(savedProf ? savedProf.user : user, savedProf ? savedProf.selectedRole : selectedRole, savedProf ? savedProf.photoUrl : photoUrl, true);
    showToast("Welcome back! You have successfully signed in.");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthMode("login");
    saveToStorage(user, selectedRole, photoUrl, false);
    showToast("You have been signed out.");
  };

  const handleEditModalSave = (event) => {
    event.preventDefault();
    setUser(draft);
    setIsEditing(false);
    saveToStorage(draft, selectedRole, photoUrl, true);
    showToast("Profile details updated successfully!");
  };

  const changePhoto = (event) => {
    const [file] = event.target.files;
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      saveToStorage(user, selectedRole, url, isLoggedIn);
      showToast("Profile photo updated!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 sm:py-8 px-0 sm:px-4 flex justify-center items-start font-sans text-gray-800">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#1F5C36] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-bounce">
          <ShieldCheck className="w-5 h-5 text-[#6BAF3E]" />
          {toastMsg}
        </div>
      )}

      {/* Container Frame */}
      <div className="w-full max-w-4xl bg-[#FAF8F5] shadow-xl sm:rounded-2xl overflow-hidden flex flex-col border border-gray-200/80">
        
        {/* Header Navbar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="Emblem of India"
              className="h-9 sm:h-10 w-auto object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] tracking-wider text-gray-500 font-medium">
                MINISTRY OF
              </span>
              <span className="text-sm font-bold text-gray-800 -mt-0.5">
                AYUSH
              </span>
              <span className="text-[9px] text-gray-400">
                Government of India
              </span>
            </div>
            <div className="h-7 w-px bg-gray-200 mx-1 hidden sm:block" />
            <img
              src={logo}
              alt="Startup AYUSH Portal"
              className="h-8 sm:h-10 w-auto object-contain hidden sm:block"
            />
          </div>

          {/* Header Action Nav */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="../../starting page/index.html?skipIntro=true"
              className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#1F5C36] px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#1F5C36]" />
              Home
            </a>

            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => setAuthMode("profile")}
                  className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition ${
                    authMode === "profile"
                      ? "bg-[#1F5C36] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition ${
                    authMode === "login"
                      ? "bg-[#1F5C36] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition ${
                    authMode === "register" || authMode === "create-profile"
                      ? "bg-[#1F5C36] text-white"
                      : "bg-[#6BAF3E] text-white hover:bg-green-600"
                  }`}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </header>

        {/* Hero / Banner Strip */}
        <section className="relative overflow-hidden bg-[#F7F4E9] border-b border-amber-100/60 px-5 sm:px-8 py-6 sm:py-8">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-3/5 pointer-events-none overflow-hidden">
            <img
              src={heroBg}
              alt="AYUSH Herbs"
              className="w-full h-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#F7F4E9] via-[#F7F4E9]/65 to-transparent" />
          </div>

          <div className="relative z-10 max-w-md">
            <div className="text-xs font-medium text-amber-900/70 mb-2 flex items-center gap-1">
              Home <span className="text-amber-900/40 font-normal">&gt;</span>{" "}
              {authMode === "login"
                ? "Sign In"
                : authMode === "register"
                ? "Register (Step 1)"
                : authMode === "create-profile"
                ? "Create Profile (Step 2)"
                : "My Profile"}
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold"
              style={{ color: COLORS.primaryGreen }}
            >
              {authMode === "login"
                ? "Portal Sign In"
                : authMode === "register"
                ? "Step 1: Account Registration"
                : authMode === "create-profile"
                ? "Step 2: Create Your Profile"
                : "My Profile Dashboard"}
            </h1>
            <div
              className="h-1 w-8 mt-1.5 mb-2.5 rounded-full"
              style={{ backgroundColor: COLORS.accentGreen }}
            />
            <p className="text-xs sm:text-sm text-gray-600">
              {authMode === "login"
                ? "Sign in to access your registered startup profile and government schemes."
                : authMode === "register"
                ? "Register your account credentials and select your stakeholder role."
                : authMode === "create-profile"
                ? "Fill out your profile details so investors, mentors and government agencies can connect with you."
                : "Manage your personal information, role category, and account credentials."}
            </p>
          </div>
        </section>

        {/* MAIN BODY CONTENT AREA */}
        <main className="p-4 sm:p-6 flex-1">
          
          {/* STEP 1: REGISTER ACCOUNT CREDENTIALS */}
          {authMode === "register" && (
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm space-y-5">
              {/* Stepper Progress */}
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 pb-3 border-b border-gray-100">
                <span className="text-green-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Step 1 of 2: Account Details
                </span>
                <span className="text-gray-400">Step 2: Profile Info</span>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
                <p className="text-xs text-gray-500">Choose your stakeholder role & login credentials</p>
              </div>

              <form onSubmit={handleRegisterNext} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Select Stakeholder Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "Startup", label: "Startup Founder", icon: Rocket },
                      { id: "Investor", label: "Investor", icon: Briefcase },
                      { id: "Incubator", label: "Incubator", icon: Building },
                      { id: "Public", label: "Public User", icon: Users },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = registerData.role === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRegisterData({ ...registerData, role: item.id })}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
                            active
                              ? "border-green-700 bg-green-50 text-green-900 shadow-xs"
                              : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="w-4 h-4 text-green-700 shrink-0" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. rajesh@ayushstartup.in"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition hover:opacity-95"
                  style={{ backgroundColor: COLORS.primaryGreen }}
                >
                  Next: Setup Your Profile <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-3 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="font-bold text-green-800 hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: FILL & CREATE PROFILE DETAILS */}
          {authMode === "create-profile" && (
            <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm space-y-5">
              {/* Stepper Progress */}
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 pb-3 border-b border-gray-100">
                <span className="text-gray-400 flex items-center gap-1">
                  ✓ Step 1: Account Created
                </span>
                <span className="text-green-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Step 2 of 2: Create Profile Details
                </span>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-gray-900">Create Your Profile</h2>
                <p className="text-xs text-gray-500">Fill in your information to display on your AYUSH Profile</p>
              </div>

              {/* Profile Photo Upload Section */}
              <div className="flex flex-col items-center justify-center gap-2 pb-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#E2EFE0] flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-[#1F5C36]" strokeWidth={1.75} />
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Upload profile photo"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow border-2 border-white transition hover:scale-105"
                    style={{ backgroundColor: COLORS.primaryGreen }}
                  >
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={changePhoto}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">Upload Profile Photo</span>
              </div>

              <form onSubmit={handleSaveProfileDetails} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajesh Sharma"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Location / City</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. New Delhi, India"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bio / Startup Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your venture, background, or interest in AYUSH sector..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition hover:opacity-95"
                    style={{ backgroundColor: COLORS.primaryGreen }}
                  >
                    <Save className="w-4 h-4" /> Save & Create Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LOGIN VIEW */}
          {authMode === "login" && (
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-xs text-gray-500">Sign in to your Startup AYUSH Portal account</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email address or Mobile Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. ayush@domain.com or 9876543210"
                      value={loginData.emailOrPhone}
                      onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                {!loginData.otpMode ? (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-gray-700">Password</label>
                      <button
                        type="button"
                        onClick={() => setLoginData({ ...loginData, otpMode: true })}
                        className="text-xs text-green-700 hover:underline font-semibold"
                      >
                        Login via OTP
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-gray-700">One-Time Password (OTP)</label>
                      <button
                        type="button"
                        onClick={() => setLoginData({ ...loginData, otpMode: false })}
                        className="text-xs text-green-700 hover:underline font-semibold"
                      >
                        Login via Password
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Enter 6-digit OTP"
                        value={loginData.otp}
                        onChange={(e) => setLoginData({ ...loginData, otp: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition hover:opacity-95"
                  style={{ backgroundColor: COLORS.primaryGreen }}
                >
                  Sign In to Account <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-gray-100 text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className="font-bold text-green-800 hover:underline"
                  >
                    Register Here
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SAVED PROFILE DASHBOARD */}
          {authMode === "profile" && (
            <div className="space-y-5">
              {/* Profile Photo Header Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#E2EFE0] flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-[#1F5C36]" strokeWidth={1.75} />
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Upload profile photo"
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow border-2 border-white transition hover:scale-105"
                      style={{ backgroundColor: COLORS.primaryGreen }}
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={changePhoto}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <p className="font-bold text-gray-900 text-lg">{user.fullName}</p>
                      <span className="bg-green-100 text-green-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {selectedRole}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      {user.email} • {user.phone}
                    </p>
                    {user.bio && (
                      <p className="text-xs text-gray-600 mt-1 font-medium italic">
                        "{user.bio}"
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDraft(user);
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition shrink-0"
                >
                  <Pencil className="w-4 h-4 text-green-700" />
                  Edit Profile
                </button>
              </div>

              {/* Clean User Profile Dashboard */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <SectionHeading icon={User}>Personal Information</SectionHeading>
                <div className="space-y-1">
                  <InfoRow icon={User} label="Full Name" value={user.fullName} />
                  <InfoRow icon={Mail} label="Email Address" value={user.email} />
                  <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
                  <InfoRow icon={MapPin} label="Location" value={user.location} />
                  <InfoRow icon={Users} label="Registered Role" value={selectedRole} isLast />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            <form
              onSubmit={handleEditModalSave}
              className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2
                    id="edit-profile-title"
                    className="text-lg font-bold"
                    style={{ color: COLORS.primaryGreen }}
                  >
                    Edit Profile Details
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Update your account and profile details.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close edit profile"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["fullName", "Full name"],
                  ["username", "Username"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                  ["location", "Location"],
                  ["bio", "Bio / Organization Summary"],
                ].map(([field, label]) => (
                  <label
                    key={field}
                    className={field === "location" || field === "bio" ? "sm:col-span-2" : ""}
                  >
                    <span className="mb-1 block text-xs font-semibold text-gray-700">
                      {label}
                    </span>
                    <input
                      required={field !== "bio"}
                      type={field === "email" ? "email" : "text"}
                      value={draft[field] || ""}
                      onChange={(event) =>
                        setDraft({ ...draft, [field]: event.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: COLORS.primaryGreen }}
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <footer
          className="text-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ backgroundColor: COLORS.primaryGreen }}
        >
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Leaf
              className="w-4 h-4 shrink-0"
              style={{ color: COLORS.accentGreen }}
            />
            <span className="font-medium">
              Empowering AYUSH Startups. Building a Healthy Future.
            </span>
          </div>

          <div className="flex items-center gap-3 text-white/80 font-medium">
            <a href="#" className="hover:text-white transition">
              Privacy Policy
            </a>
            <span className="text-white/30">|</span>
            <a href="#" className="hover:text-white transition">
              Terms of Use
            </a>
            <span className="text-white/30">|</span>
            <a href="#" className="hover:text-white transition">
              Contact Us
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-white/80 hidden sm:inline font-medium">
              Follow Us
            </span>
            {[Twitter, Linkedin, Youtube, Instagram].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
              >
                <Icon className="w-3.5 h-3.5 text-white" />
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
