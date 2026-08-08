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
} from "lucide-react";

/**
 * Startup AYUSH Portal — Government Schemes Feed
 * -------------------------------------------------
 * A Twitter/X-style scrollable feed for the "Government Schemes" section.
 * Users pick the AYUSH streams / interests they care about, and the feed
 * filters + reorders scheme "posts" accordingly.
 *
 * Color tokens are pulled from the Startup AYUSH Portal screenshot:
 * deep government green, warm cream backgrounds, and the portal's
 * signature terracotta/orange accent.
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
        gap: 6,
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? c.text : theme.line}`,
        background: active ? c.tint : theme.creamCard,
        color: active ? c.text : theme.ink600,
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      <Icon size={14} strokeWidth={2.25} />
      {label}
    </button>
  );
}

function SchemeCard({ scheme, saved, onToggleSave }) {
  const c = HUES[INTERESTS.find((i) => i.id === scheme.category).hue];
  const CategoryIcon = INTERESTS.find((i) => i.id === scheme.category).icon;

  return (
    <article
      style={{
        background: theme.creamCard,
        border: `1px solid ${theme.line}`,
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: theme.green900,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {scheme.initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: theme.ink900 }}>
              {scheme.agency}
            </span>
            {scheme.verified && (
              <span
                title="Government verified"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: `1.5px dashed ${theme.green700}`,
                }}
              >
                <BadgeCheck size={11} color={theme.green700} strokeWidth={2.5} />
              </span>
            )}
            <span style={{ color: theme.ink400, fontSize: 13 }}>· {scheme.timeAgo}</span>
            <span
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: c.tint,
                color: c.text,
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 9px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              <CategoryIcon size={11} strokeWidth={2.5} />
              {INTERESTS.find((i) => i.id === scheme.category).label}
            </span>
          </div>

          <h3
            style={{
              margin: "6px 0 4px",
              fontSize: 16,
              fontWeight: 700,
              color: theme.ink900,
              lineHeight: 1.35,
            }}
          >
            {scheme.title}
          </h3>

          <p style={{ margin: 0, fontSize: 13.5, color: theme.ink600, lineHeight: 1.55 }}>
            {scheme.body}
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                color: theme.green700,
                background: theme.greenTint,
                padding: "5px 10px",
                borderRadius: 8,
              }}
            >
              <Clock3 size={12} /> Deadline: {scheme.deadline}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                color: theme.terracotta600,
                background: theme.terracottaTint,
                padding: "5px 10px",
                borderRadius: 8,
              }}
            >
              <Wallet size={12} /> {scheme.funding}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${theme.line}`,
          paddingTop: 10,
          marginTop: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => onToggleSave(scheme.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: saved ? theme.terracotta600 : theme.ink400,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Bookmark size={16} fill={saved ? theme.terracotta600 : "none"} strokeWidth={2} />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.ink400,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Share2 size={15} strokeWidth={2} />
            Share
          </button>
          <span style={{ fontSize: 12.5, color: theme.ink400 }}>
            {scheme.interested.toLocaleString()} interested
          </span>
        </div>

        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: theme.green700,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          View scheme
          <ChevronRight size={14} />
        </button>
      </div>
    </article>
  );
}

function FeedView({ onBack }) {
  const [activeInterests, setActiveInterests] = useState([]);
  const [tab, setTab] = useState("forYou");
  const [saved, setSaved] = useState(new Set());

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
    if (tab === "forYou" && activeInterests.length > 0) {
      list.sort(
        (a, b) =>
          b.tags.filter((t) => activeInterests.includes(t)).length -
          a.tags.filter((t) => activeInterests.includes(t)).length
      );
    }
    return list;
  }, [tab, activeInterests, saved]);

  return (
    <div style={{ background: theme.creamBg, minHeight: "100%" }}>
      {/* header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: theme.creamBg,
          borderBottom: `1px solid ${theme.line}`,
          padding: "14px 20px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button
            onClick={onBack}
            aria-label="Back"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: `1px solid ${theme.line}`,
              background: theme.creamCard,
              cursor: "pointer",
              color: theme.green900,
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={17} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: theme.green900 }}>
              Government Schemes
            </h1>
            <p style={{ margin: 0, fontSize: 12.5, color: theme.ink600 }}>
              Scroll for new schemes, curated to your interests
            </p>
          </div>
          <button
            aria-label="Search schemes"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: `1px solid ${theme.line}`,
              background: theme.creamCard,
              cursor: "pointer",
              color: theme.green900,
              flexShrink: 0,
            }}
          >
            <Search size={16} />
          </button>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 22 }}>
          {[
            { id: "forYou", label: "For you", icon: Sparkles },
            { id: "latest", label: "Latest", icon: Clock3 },
            { id: "saved", label: "Saved", icon: Bookmark },
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
                  padding: "0 2px 10px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: isActive ? theme.green900 : theme.ink400,
                  borderBottom: `2px solid ${isActive ? theme.green700 : "transparent"}`,
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* interest chips */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "14px 20px",
          overflowX: "auto",
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

      {/* feed */}
      <div style={{ padding: "0 20px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 16px",
              color: theme.ink400,
              fontSize: 13.5,
            }}
          >
            {tab === "saved"
              ? "You haven't saved any schemes yet."
              : "No schemes match these interests yet — try selecting fewer tags."}
          </div>
        ) : (
          filtered.map((s) => (
            <SchemeCard key={s.id} scheme={s} saved={saved.has(s.id)} onToggleSave={toggleSave} />
          ))
        )}
      </div>
    </div>
  );
}

function LandingTile({ onOpen }) {
  return (
    <div
      style={{
        maxWidth: 380,
        margin: "60px auto",
        background: theme.creamCard,
        border: `1px solid ${theme.line}`,
        borderRadius: 14,
        padding: 24,
        textAlign: "center",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          margin: "0 auto 14px",
          borderRadius: "50%",
          background: theme.terracottaTint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Building2 size={24} color={theme.terracotta600} />
      </div>
      <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: theme.ink900 }}>
        Government Agencies
      </h2>
      <p style={{ margin: "0 0 18px", fontSize: 13.5, color: theme.ink600, lineHeight: 1.5 }}>
        Access insights, monitor initiatives, and support the AYUSH startup ecosystem.
      </p>
      <button
        onClick={onOpen}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: theme.terracotta600,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 18px",
          fontSize: 13.5,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Explore Schemes
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

export default function SchemeFeedDemo() {
  const [view, setView] = useState("landing");

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
      {view === "landing" ? (
        <LandingTile onOpen={() => setView("feed")} />
      ) : (
        <FeedView onBack={() => setView("landing")} />
      )}
    </div>
  );
}
