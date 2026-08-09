import React from "react";
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
} from "lucide-react";

import logo from "./assets/logo.jpeg";
import heroBg from "./assets/hero-bg.jpeg";

// ---- Design tokens -------------------------------------------------------
const COLORS = {
  primaryGreen: "#1F5C36",
  accentGreen: "#6BAF3E",
  orange: "#D97A29",
};

// ---- Small building blocks -----------------------------------------------

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
        <span className="text-sm text-gray-600">{value}</span>
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

// ---- Main page -------------------------------------------------------------

export default function MyProfile() {
  const [user, setUser] = React.useState({
    fullName: "Ayush Sharma",
    username: "ayush_sharma23",
    email: "ayush.sharma23@example.com",
    phone: "+91 98765 43210",
    location: "New Delhi, India",
  });
  const [selectedRole, setSelectedRole] = React.useState("Public");
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(user);
  const [photoUrl, setPhotoUrl] = React.useState("");
  const photoInputRef = React.useRef(null);

  const saveProfile = (event) => {
    event.preventDefault();
    setUser(draft);
    setIsEditing(false);
  };

  const changePhoto = (event) => {
    const [file] = event.target.files;
    if (file) setPhotoUrl(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-gray-100 sm:py-8 px-0 sm:px-4 flex justify-center items-start font-sans text-gray-800">
      {/* Container Frame matching mockup proportions */}
      <div className="w-full max-w-4xl bg-[#FAF8F5] shadow-xl sm:rounded-2xl overflow-hidden flex flex-col border border-gray-200/80">
        {/* Navbar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-4">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
            alt="Emblem of India"
            className="h-10 w-10 object-contain"
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
          <div className="h-7 w-px bg-gray-200 mx-1" />
          <img
            src={logo}
            alt="Startup AYUSH Portal"
            className="h-9 sm:h-10 w-auto object-contain"
          />
        </header>

        {/* Hero / Banner strip with right-aligned image blend */}
        <section className="relative overflow-hidden bg-[#F7F4E9] border-b border-amber-100/60 px-5 sm:px-8 py-6 sm:py-8">
          {/* Right Mortar & Pestle Hero Image Layer */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-3/5 pointer-events-none overflow-hidden">
            <img
              src={heroBg}
              alt="AYUSH Herbs"
              className="w-full h-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#F7F4E9] via-[#F7F4E9]/65 to-transparent" />
          </div>

          <div className="relative z-10 max-w-md">
            <div className="text-xs font-medium text-amber-900/70 mb-3 flex items-center gap-1">
              Home <span className="text-amber-900/40 font-normal">&gt;</span> Profile
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold"
              style={{ color: COLORS.primaryGreen }}
            >
              My Profile
            </h1>
            <div
              className="h-1 w-8 mt-1.5 mb-2.5 rounded-full"
              style={{ backgroundColor: COLORS.accentGreen }}
            />
            <p className="text-xs sm:text-sm text-gray-600">
              Manage your personal information and account details
            </p>
          </div>
        </section>

        {/* Content Section */}
        <main className="p-4 sm:p-6 space-y-5 flex-1">
          {/* Profile photo card */}
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
                <p className="font-bold text-gray-800 text-base">[Profile Photo]</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Complete your profile to connect with the AYUSH ecosystem
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDraft(user);
                setIsEditing(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition shrink-0"
              style={{
                borderColor: "#1F5C36",
                color: "#1F5C36",
                backgroundColor: "#F2F7F2",
              }}
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <SectionHeading icon={User}>Personal Information</SectionHeading>
            <div>
              <InfoRow icon={User} label="Full Name" value={user.fullName} />
              <InfoRow icon={User} label="Username" value={user.username} />
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Phone} label="Phone" value={user.phone} />
              <InfoRow
                icon={MapPin}
                label="Location"
                value={user.location}
                isLast
              />
            </div>
          </div>

          {/* How do you use AYUSH */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <SectionHeading icon={Rocket}>How do you use AYUSH?</SectionHeading>
            <div className="flex flex-col gap-3">
              <RoleCard
                icon={Users}
                title="Public"
                description="I am a member of the public exploring the AYUSH ecosystem."
                accent={COLORS.primaryGreen}
                bg="#EEF3EC"
                selected={selectedRole === "Public"}
                onClick={() => setSelectedRole("Public")}
              />
              <RoleCard
                icon={Rocket}
                title="Startup"
                description="I represent a startup building innovative solutions in the AYUSH sector."
                accent="#4753C9"
                bg="#EEEFFA"
                selected={selectedRole === "Startup"}
                onClick={() => setSelectedRole("Startup")}
              />
              <RoleCard
                icon={Briefcase}
                title="Investor"
                description="I am an investor looking to invest in AYUSH startups and ventures."
                accent={COLORS.orange}
                bg="#FBF0E4"
                selected={selectedRole === "Investor"}
                onClick={() => setSelectedRole("Investor")}
              />
            </div>
          </div>
        </main>

        {/* Edit modal */}
        {isEditing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            <form
              onSubmit={saveProfile}
              className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2
                    id="edit-profile-title"
                    className="text-lg font-bold"
                    style={{ color: COLORS.primaryGreen }}
                  >
                    Edit Profile
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Update your account details.
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
                ].map(([field, label]) => (
                  <label
                    key={field}
                    className={field === "location" ? "sm:col-span-2" : ""}
                  >
                    <span className="mb-1 block text-xs font-semibold text-gray-700">
                      {label}
                    </span>
                    <input
                      required
                      type={field === "email" ? "email" : "text"}
                      value={draft[field]}
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

