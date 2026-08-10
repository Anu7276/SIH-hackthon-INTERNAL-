import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Bookmark,
  Share2,
  Sparkles,
  Clock3,
  Wallet,
  BadgeCheck,
  Leaf,
  Sun,
  Droplets,
  FlaskConical,
  Flower2,
  Building2,
  ChevronRight,
  X,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

/**
 * Startup AYUSH Portal — Government Schemes Feed
 * -------------------------------------------------
 * Mobile-First, Highly Responsive Twitter/X-style feed for Government Schemes.
 */

const theme = {
  creamBg: "#FBF7EC",
  creamCard: "#FFFFFF",
  creamAlt: "#F1EAD6",
  line: "#E6DEC7",
  green900: "#1E3B22",
  green700: "#255C34",
  green500: "#3D7A47",
  greenTint: "#E8F1E3",
  gold600: "#B8863B",
  goldTint: "#F7EEDC",
  terracotta600: "#C1652E",
  terracottaTint: "#FBEADE",
  teal700: "#2C6B68",
  tealTint: "#E4F1EF",
  ink900: "#232921",
  ink600: "#5B6058",
  ink400: "#8B8F84",
};

const INTERESTS = [
  { id: "ayurveda", label: "Ayurveda", icon: Leaf, hue: "green" },
  { id: "yoga", label: "Yoga & Naturopathy", icon: Sun, hue: "gold" },
  { id: "unani", label: "Unani", icon: Droplets, hue: "terracotta" },
  { id: "siddha", label: "Siddha", icon: FlaskConical, hue: "teal" },
  { id: "homeopathy", label: "Homeopathy", icon: Flower2, hue: "green" },
  { id: "funding", label: "Funding", icon: Wallet, hue: "gold" },
  { id: "incubation", label: "Incubation", icon: Building2, hue: "terracotta" },
  { id: "rnd", label: "R&D Grants", icon: FlaskConical, hue: "teal" },
];

const HUES = {
  green: { tint: theme.greenTint, text: theme.green700, dot: theme.green500 },
  gold: { tint: theme.goldTint, text: theme.gold600, dot: theme.gold600 },
  terracotta: { tint: theme.terracottaTint, text: theme.terracotta600, dot: theme.terracotta600 },
  teal: { tint: theme.tealTint, text: theme.teal700, dot: theme.teal700 },
};

const SCHEMES = [
  {
    id: 1,
    agency: "Ministry of AYUSH",
    initials: "MoA",
    verified: true,
    category: "ayurveda",
    title: "AYUSH Startup Seed Grant 2026",
    body:
      "Seed-stage funding of up to ₹25 lakh for Ayurveda product and formulation startups with a working prototype. Rolling applications, mentorship included.",
    timeAgo: "2h",
    deadline: "30 Sep 2026",
    funding: "Up to ₹25L",
    interested: 812,
    tags: ["ayurveda", "funding"],
    details: {
      eligibility: "DPIIT Recognized Startups working in Ayurveda stream with prototype.",
      benefits: "₹25 Lakh equity-free grant + 6 months access to AYUSH research labs.",
      application: "Submit pitch deck, prototype demo video, and DPIIT registration certificate."
    }
  },
  {
    id: 2,
    agency: "National Yoga Board",
    initials: "NYB",
    verified: true,
    category: "yoga",
    title: "Yoga & Wellness Incubation Cohort",
    body:
      "A 6-month incubation programme for Yoga and Naturopathy startups building wellness-tech products. Includes co-working access and investor demo day.",
    timeAgo: "5h",
    deadline: "12 Oct 2026",
    funding: "Non-monetary",
    interested: 431,
    tags: ["yoga", "incubation"],
    details: {
      eligibility: "Early-stage Yoga, Meditation & Naturopathy app/hardware startups.",
      benefits: "Dedicated mentor, legal compliance aid, and direct pitch to top VC investors.",
      application: "Fill online questionnaire and submit 2-min video pitch."
    }
  },
  {
    id: 3,
    agency: "Unani Research Council",
    initials: "URC",
    verified: true,
    category: "unani",
    title: "Unani Formulation R&D Grant",
    body:
      "Grants for clinical validation and standardisation of Unani formulations. Open to startups partnered with a recognised research institute.",
    timeAgo: "1d",
    deadline: "05 Nov 2026",
    funding: "Up to ₹40L",
    interested: 268,
    tags: ["unani", "rnd"],
    details: {
      eligibility: "R&D startups partnered with CSIR/AYUSH accredited research lab.",
      benefits: "Up to ₹40 Lakh research subsidy for clinical trials and standardisation.",
      application: "Joint proposal submission with research institute endorsement."
    }
  },
  {
    id: 4,
    agency: "Siddha Development Trust",
    initials: "SDT",
    verified: false,
    category: "siddha",
    title: "Siddha Startup Export Readiness Program",
    body:
      "Helps Siddha-based product startups meet export documentation and quality-certification requirements for international markets.",
    timeAgo: "1d",
    deadline: "20 Oct 2026",
    funding: "Advisory support",
    interested: 154,
    tags: ["siddha", "incubation"],
    details: {
      eligibility: "Siddha medicine & herbal product exporters and manufacturing startups.",
      benefits: "Subsidised US-FDA/EU compliance certification and export trade show stall.",
      application: "Submit IEC code, product testing report, and firm registration."
    }
  },
  {
    id: 5,
    agency: "Central Homeopathy Council",
    initials: "CHC",
    verified: true,
    category: "homeopathy",
    title: "Homeopathy Digital Health Grant",
    body:
      "Funding for startups digitising Homeopathy consultation, records, and remedy-tracking tools. Priority given to rural-access solutions.",
    timeAgo: "2d",
    deadline: "18 Nov 2026",
    funding: "Up to ₹15L",
    interested: 297,
    tags: ["homeopathy", "funding"],
    details: {
      eligibility: "HealthTech & Tele-medicine platforms supporting Homeopathy doctors.",
      benefits: "₹15 Lakh technology grant + integration with National Digital Health Mission.",
      application: "Live MVP demo submission and architecture document."
    }
  },
  {
    id: 6,
    agency: "Ministry of AYUSH",
    initials: "MoA",
    verified: true,
    category: "ayurveda",
    title: "AYUSH Global Incubator Partnership",
    body:
      "Startups get matched with one of 150+ partner incubators for mentorship, lab access, and go-to-market support across all AYUSH streams.",
    timeAgo: "3d",
    deadline: "Rolling",
    funding: "Non-monetary",
    interested: 903,
    tags: ["ayurveda", "yoga", "unani", "siddha", "homeopathy", "incubation"],
    details: {
      eligibility: "All AYUSH sector startups registered in India.",
      benefits: "Pan-India incubator matching, free IP filing assistance, state tax rebates.",
      application: "Single-window online registration on Startup AYUSH Portal."
    }
  },
];

function Chip({ active, icon: Icon, label, hue, onClick }) {
  const c = HUES[hue];
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? c.text : theme.line}`,
        background: active ? c.tint : theme.creamCard,
        color: active ? c.text : theme.ink600,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.15s ease",
      }}
    >
      <Icon size={13} strokeWidth={2.25} />
      {label}
    </button>
  );
}

function SchemeCard({ scheme, saved, onToggleSave, onViewDetails }) {
  const categoryItem = INTERESTS.find((i) => i.id === scheme.category) || INTERESTS[0];
  const c = HUES[categoryItem.hue];
  const CategoryIcon = categoryItem.icon;

  return (
    <article
      style={{
        background: theme.creamCard,
        border: `1px solid ${theme.line}`,
        borderRadius: 12,
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: theme.green900,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {scheme.initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: theme.ink900,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {scheme.agency}
              </span>
              {scheme.verified && (
                <span
                  title="Government verified"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 15,
                    height: 15,
                    borderRadius: "50%",
                    border: `1.5px dashed ${theme.green700}`,
                    flexShrink: 0,
                  }}
                >
                  <BadgeCheck size={10} color={theme.green700} strokeWidth={2.5} />
                </span>
              )}
              <span style={{ color: theme.ink400, fontSize: 11.5, flexShrink: 0 }}>
                · {scheme.timeAgo}
              </span>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: c.tint,
                color: c.text,
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <CategoryIcon size={10} strokeWidth={2.5} />
              {categoryItem.label}
            </span>
          </div>

          <h3
            style={{
              margin: "5px 0 4px",
              fontSize: 14.5,
              fontWeight: 700,
              color: theme.ink900,
              lineHeight: 1.35,
            }}
          >
            {scheme.title}
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: theme.ink600,
              lineHeight: 1.5,
            }}
          >
            {scheme.body}
          </p>

          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                color: theme.green700,
                background: theme.greenTint,
                padding: "3px 8px",
                borderRadius: 6,
                whiteSpace: "nowrap",
              }}
            >
              <Clock3 size={11} /> Deadline: {scheme.deadline}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                color: theme.terracotta600,
                background: theme.terracottaTint,
                padding: "3px 8px",
                borderRadius: 6,
                whiteSpace: "nowrap",
              }}
            >
              <Wallet size={11} /> {scheme.funding}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${theme.line}`,
          paddingTop: 8,
          marginTop: 4,
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => onToggleSave(scheme.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: saved ? theme.terracotta600 : theme.ink400,
              fontSize: 12,
              fontWeight: 600,
              padding: 0,
            }}
          >
            <Bookmark size={14} fill={saved ? theme.terracotta600 : "none"} strokeWidth={2} />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: scheme.title, text: scheme.body, url: window.location.href });
              } else {
                alert('Scheme link copied to clipboard!');
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.ink400,
              fontSize: 12,
              fontWeight: 600,
              padding: 0,
            }}
          >
            <Share2 size={14} strokeWidth={2} />
            Share
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <span style={{ fontSize: 11, color: theme.ink400, whiteSpace: "nowrap" }}>
            {scheme.interested.toLocaleString()} interested
          </span>
          <button
            onClick={() => onViewDetails(scheme)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              background: theme.green700,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "5px 11px",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            View scheme
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </article>
  );
}

function FeedView({ onBack }) {
  const [activeInterests, setActiveInterests] = useState([]);
  const [tab, setTab] = useState("forYou");
  const [saved, setSaved] = useState(new Set([1]));
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScheme, setSelectedScheme] = useState(null);

  const toggleInterest = (id) =>
    setActiveInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSave = (id) =>
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    let list = SCHEMES.slice();
    if (tab === "saved") list = list.filter((s) => saved.has(s.id));
    if (activeInterests.length > 0) {
      list = list.filter((s) => s.tags.some((t) => activeInterests.includes(t)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.body.toLowerCase().includes(q) ||
          s.agency.toLowerCase().includes(q)
      );
    }
    if (tab === "forYou" && activeInterests.length > 0) {
      list.sort(
        (a, b) =>
          b.tags.filter((t) => activeInterests.includes(t)).length -
          a.tags.filter((t) => activeInterests.includes(t)).length
      );
    }
    return list;
  }, [tab, activeInterests, saved, searchQuery]);

  return (
    <div style={{ background: theme.creamBg, minHeight: "100vh" }}>
      {/* Container wrapper for mobile responsiveness */}
      <div style={{ maxWidth: 640, margin: "0 auto", minHeight: "100vh" }}>
        {/* Sticky Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: theme.creamBg,
            borderBottom: `1px solid ${theme.line}`,
            padding: "12px 14px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <button
              onClick={onBack || (() => { window.location.href = '/?skipIntro=true'; })}
              aria-label="Back"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: `1px solid ${theme.line}`,
                background: theme.creamCard,
                cursor: "pointer",
                color: theme.green900,
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 800,
                  color: theme.green900,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Government Schemes
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  color: theme.ink600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Scroll for new schemes, curated to your interests
              </p>
            </div>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search schemes"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: `1px solid ${theme.line}`,
                background: searchOpen ? theme.green700 : theme.creamCard,
                cursor: "pointer",
                color: searchOpen ? "#fff" : theme.green900,
                flexShrink: 0,
              }}
            >
              <Search size={15} />
            </button>
          </div>

          {/* Search bar input drawer */}
          {searchOpen && (
            <div style={{ marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Search by keyword, scheme name, or agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${theme.green700}`,
                  outline: "none",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 18 }}>
            {[
              { id: "forYou", label: "For you", icon: Sparkles },
              { id: "latest", label: "Latest", icon: Clock3 },
              { id: "saved", label: `Saved (${saved.size})`, icon: Bookmark },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 2px 8px",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    color: isActive ? theme.green900 : theme.ink400,
                    borderBottom: `2.5px solid ${isActive ? theme.green700 : "transparent"}`,
                  }}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Interest Chips */}
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "10px 14px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {INTERESTS.map((i) => (
            <Chip
              key={i.id}
              icon={i.icon}
              label={i.label}
              hue={i.hue}
              active={activeInterests.includes(i.id)}
              onClick={() => toggleInterest(i.id)}
            />
          ))}
        </div>

        {/* Schemes Feed List */}
        <div style={{ padding: "0 14px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 16px",
                color: theme.ink400,
                fontSize: 13,
                background: theme.creamCard,
                borderRadius: 12,
                border: `1px dashed ${theme.line}`,
              }}
            >
              {tab === "saved"
                ? "You haven't saved any schemes yet. Click the 'Save' button on any scheme to bookmark it!"
                : "No schemes match your criteria. Try adjusting your search or filters."}
            </div>
          ) : (
            filtered.map((s) => (
              <SchemeCard
                key={s.id}
                scheme={s}
                saved={saved.has(s.id)}
                onToggleSave={toggleSave}
                onViewDetails={setSelectedScheme}
              />
            ))
          )}
        </div>
      </div>

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setSelectedScheme(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 600,
              maxHeight: "85vh",
              background: theme.creamCard,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: "20px",
              overflowY: "auto",
              boxSizing: "border-box",
              boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    background: theme.green900,
                    color: "#fff",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {selectedScheme.initials}
                </span>
                <span style={{ fontWeight: 700, fontSize: 13, color: theme.ink900 }}>
                  {selectedScheme.agency}
                </span>
              </div>
              <button
                onClick={() => setSelectedScheme(null)}
                style={{
                  background: theme.creamBg,
                  border: `1px solid ${theme.line}`,
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <h2 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: theme.ink900 }}>
              {selectedScheme.title}
            </h2>

            <p style={{ margin: "0 0 14px", fontSize: 13.5, color: theme.ink600, lineHeight: 1.5 }}>
              {selectedScheme.body}
            </p>

            <div style={{ background: theme.creamBg, padding: 12, borderRadius: 10, border: `1px solid ${theme.line}`, marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: theme.green900 }}>
                Scheme Highlights
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                <div>
                  <strong style={{ color: theme.ink900, display: "block" }}>Funding:</strong>
                  <span style={{ color: theme.terracotta600, fontWeight: 600 }}>{selectedScheme.funding}</span>
                </div>
                <div>
                  <strong style={{ color: theme.ink900, display: "block" }}>Application Deadline:</strong>
                  <span style={{ color: theme.green700, fontWeight: 600 }}>{selectedScheme.deadline}</span>
                </div>
              </div>
            </div>

            {selectedScheme.details && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: theme.ink900, display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle2 size={14} color={theme.green700} /> Eligibility Criteria
                  </h4>
                  <p style={{ margin: 0, fontSize: 12.5, color: theme.ink600, lineHeight: 1.4 }}>
                    {selectedScheme.details.eligibility}
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: theme.ink900, display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle2 size={14} color={theme.green700} /> Key Benefits
                  </h4>
                  <p style={{ margin: 0, fontSize: 12.5, color: theme.ink600, lineHeight: 1.4 }}>
                    {selectedScheme.details.benefits}
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: theme.ink900, display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle2 size={14} color={theme.green700} /> Application Process
                  </h4>
                  <p style={{ margin: 0, fontSize: 12.5, color: theme.ink600, lineHeight: 1.4 }}>
                    {selectedScheme.details.application}
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  alert("Redirecting to National AYUSH Portal for official scheme submission...");
                }}
                style={{
                  flex: 1,
                  background: theme.green700,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                Apply on Official Portal <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchemeFeedDemo() {
  const [view, setView] = useState("feed");

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/?skipIntro=true";
    }
  };

  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: theme.creamBg,
        minHeight: "100vh",
        color: theme.ink900,
      }}
    >
      <FeedView onBack={handleBack} />
    </div>
  );
}
