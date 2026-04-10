import { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { createApplication } from "../api/applications";

// ─── Types ─────────────────────────────────────────────────────────────────
interface ParsedForm {
  company: string;
  role: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority: string;
  location: string;
}

interface AddApplicationProps {
  onSuccess: () => void;
  dark: boolean;
}

interface ChipListProps {
  items: string[];
  color: string;
}

type ResumeResponse =
  | string[]
  | { bullets: string[] }
  | { points: string[] };

// ─── Component ─────────────────────────────────────────────────────────────
function AddApplication({ onSuccess, dark }: AddApplicationProps) {
  const [jd, setJd] = useState("");
  const [form, setForm] = useState<ParsedForm>({
    company: "",
    role: "",
    requiredSkills: [],
    niceToHaveSkills: [],
    seniority: "",
    location: "",
  });
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [bullets, setBullets] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const token = localStorage.getItem("token");

  const handleParse = async () => {
    if (jd.trim().length < 50) {
      toast.error("Please paste a full job description (at least 50 characters).", {
        style: {
          background: dark ? "#1e2030" : "#fff",
          color: dark ? "#f1f5f9" : "#1e1f2e",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "12px",
          fontSize: "13px",
          fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        },
        iconTheme: { primary: "#ef4444", secondary: "#fff" },
      });
      return;
    }
    setIsParsing(true);
    setBullets([]);
    try {
     // STEP 1: Parse JD
const parseRes = await axios.post<ParsedForm>(
  "http://localhost:5000/api/ai/parse",
  { jd },
  { headers: { Authorization: `Bearer ${token}` } }
);

setForm(parseRes.data);
setParsed(true);

// STEP 2: Resume (safe + retry)
let resumeData: ResumeResponse | null = null;

try {
  const resumeRes = await axios.post<ResumeResponse>(
    "http://localhost:5000/api/ai/resume",
    { jd },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  resumeData = resumeRes.data;
} catch {
  await new Promise(res => setTimeout(res, 2000));

  try {
    const retryRes = await axios.post<ResumeResponse>(
      "http://localhost:5000/api/ai/resume",
      { jd },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    resumeData = retryRes.data;
  } catch {
    console.log("Resume API failed, skipping...");
  }
}

// STEP 3: Safe bullets
if (resumeData) {
  const raw = resumeData;
  const points: string[] = Array.isArray(raw)
    ? raw
    : "bullets" in raw && Array.isArray(raw.bullets)
    ? raw.bullets
    : "points" in raw && Array.isArray(raw.points)
    ? raw.points
    : [];

  setBullets(points);
} else {
  setBullets([]);
}

      toast.success("Job description parsed!", {
        style: {
          background: dark ? "#1e2030" : "#fff",
          color: dark ? "#f1f5f9" : "#1e1f2e",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "12px",
          fontSize: "13px",
          fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        },
        iconTheme: { primary: "#10b981", secondary: "#fff" },
      });
   } catch (err: unknown) {
      const isRateLimit =
        axios.isAxiosError(err) && err.response?.status === 429;
      if (isRateLimit) {
        let secs = 60;
        setCooldown(secs);
        const interval = setInterval(() => {
          secs -= 1;
          setCooldown(secs);
          if (secs <= 0) clearInterval(interval);
        }, 1000);
      }
      toast.error(
        isRateLimit
          ? "Rate limit hit. Please wait 60 seconds and try again."
          : "AI parsing failed. Try again.",
        {
        style: {
          background: dark ? "#1e2030" : "#fff",
          color: dark ? "#f1f5f9" : "#1e1f2e",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "12px",
          fontSize: "13px",
          fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        },
        iconTheme: { primary: "#ef4444", secondary: "#fff" },
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleCopyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1800);
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await createApplication(form);
      setForm({
        company: "",
        role: "",
        requiredSkills: [],
        niceToHaveSkills: [],
        seniority: "",
        location: "",
      });
      setJd("");
      setParsed(false);
      setBullets([]);
      onSuccess();
      toast.success("Application saved!", {
        style: {
          background: dark ? "#1e2030" : "#fff",
          color: dark ? "#f1f5f9" : "#1e1f2e",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "12px",
          fontSize: "13px",
          fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        },
        iconTheme: { primary: "#10b981", secondary: "#fff" },
      });
    } catch {
      toast.error("Error saving application.", {
        style: {
          background: dark ? "#1e2030" : "#fff",
          color: dark ? "#f1f5f9" : "#1e1f2e",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "12px",
          fontSize: "13px",
          fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        },
        iconTheme: { primary: "#ef4444", secondary: "#fff" },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: dark
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(99,102,241,0.15)",
    background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
    color: dark ? "#f1f5f9" : "#1e1f2e",
    fontSize: "13.5px",
    fontFamily: "'Outfit', sans-serif",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    backdropFilter: "blur(8px)",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "10.5px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: dark ? "rgba(148,163,184,0.6)" : "rgba(100,116,139,0.7)",
    marginBottom: "6px",
  };

  const ChipList = ({ items, color }: ChipListProps) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "11.5px",
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: "20px",
            background: dark ? `${color}18` : `${color}12`,
            border: `1px solid ${color}33`,
            color: color,
            letterSpacing: "0.02em",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );

  const hasExtraFields =
    parsed &&
    (form.seniority ||
      form.location ||
      form.requiredSkills.length > 0 ||
      form.niceToHaveSkills.length > 0);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <style>{`
        .add-app-input:focus {
          border-color: rgba(99,102,241,0.45) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
        }
        .add-app-textarea:focus {
          border-color: rgba(99,102,241,0.45) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
        }
        .btn-parse:hover:not(:disabled) {
          background: linear-gradient(135deg, #5558e8 0%, #7c3aed 100%) !important;
          box-shadow: 0 6px 20px rgba(99,102,241,0.4) !important;
          transform: translateY(-1px);
        }
        .btn-save:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #0891b2 100%) !important;
          box-shadow: 0 6px 20px rgba(16,185,129,0.35) !important;
          transform: translateY(-1px);
        }
        .btn-parse, .btn-save {
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1) !important;
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .parsing-shimmer {
          background: linear-gradient(90deg, #6366f1 25%, #a78bfa 50%, #6366f1 75%);
          background-size: 200% auto;
          animation: shimmer 1.4s linear infinite;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .parsed-fields {
          animation: fadeSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        .bullet-item {
          animation: fadeSlideUp 0.3s cubic-bezier(0.22,1,0.36,1) both;
        }
        .copy-btn:hover {
          background: rgba(99,102,241,0.15) !important;
          border-color: rgba(99,102,241,0.35) !important;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>

        {/* ── JD Textarea ── */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Job Description</label>
          <div style={{ position: "relative" }}>
            <textarea
              className="add-app-textarea"
              rows={4}
              placeholder="Paste a job description and let AI extract the details…"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "96px",
                lineHeight: "1.6",
              }}
            />
            {jd.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "12px",
                  fontSize: "10px",
                  fontFamily: "'Outfit', sans-serif",
                  color: dark ? "rgba(148,163,184,0.35)" : "rgba(148,163,184,0.6)",
                  pointerEvents: "none",
                }}
              >
                {jd.length} chars
              </span>
            )}
          </div>
        </div>

        {/* ── Parse button ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <button
            className={`btn-parse ${isParsing ? "parsing-shimmer" : ""}`}
            onClick={handleParse}
          disabled={isParsing || !jd.trim() || cooldown > 0}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              border: "none",
              background: isParsing
                ? undefined
                : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#fff",
              fontSize: "12.5px",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: isParsing || !jd.trim() ? "not-allowed" : "pointer",
             opacity: !jd.trim() || cooldown > 0 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "14px" }}>{isParsing ? "⏳" : "✦"}</span>
           {isParsing ? "Parsing…" : cooldown > 0 ? `Wait ${cooldown}s…` : "Parse with AI"}
          </button>

          <div style={{ flex: 1, height: 1, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)" }} />
          <div style={{ flex: 1, height: 1, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)" }} />
        </div>

        {/* ── Company + Role fields ── */}
        <div
          className={parsed ? "parsed-fields" : ""}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}
        >
          <div>
            <label style={labelStyle}>Company</label>
            <input
              className="add-app-input"
              placeholder="e.g. Anthropic"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <input
              className="add-app-input"
              placeholder="e.g. Frontend Engineer"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* ── AI Extracted Details ── */}
        {hasExtraFields && (
          <div
            className="parsed-fields"
            style={{
              marginBottom: "18px",
              borderRadius: "14px",
              border: dark
                ? "1px solid rgba(99,102,241,0.15)"
                : "1px solid rgba(99,102,241,0.12)",
              background: dark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.03)",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px" }}>✦</span>
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "10px", fontWeight: 700,
                letterSpacing: "0.09em", textTransform: "uppercase",
                color: dark ? "#a5b4fc" : "#6366f1",
              }}>AI Extracted Details</span>
            </div>

            {(form.seniority || form.location) && (
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {form.seniority && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "10.5px", fontWeight: 600,
                      letterSpacing: "0.07em", textTransform: "uppercase",
                      color: dark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.6)",
                    }}>Level</span>
                    <span style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "12.5px", fontWeight: 500,
                      color: dark ? "#e2e8f0" : "#1e1f2e",
                      background: dark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.25)",
                      borderRadius: "20px", padding: "2px 10px",
                    }}>{form.seniority}</span>
                  </div>
                )}
                {form.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px" }}>📍</span>
                    <span style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "12.5px", fontWeight: 500,
                      color: dark ? "#e2e8f0" : "#1e1f2e",
                    }}>{form.location}</span>
                  </div>
                )}
              </div>
            )}

            {form.requiredSkills.length > 0 && (
              <div>
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "10.5px", fontWeight: 600,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: dark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.6)",
                  marginBottom: "6px",
                }}>Required Skills</div>
                <ChipList items={form.requiredSkills} color="#6366f1" />
              </div>
            )}

            {form.niceToHaveSkills.length > 0 && (
              <div>
                <div style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "10.5px", fontWeight: 600,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: dark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.6)",
                  marginBottom: "6px",
                }}>Nice to Have</div>
                <ChipList items={form.niceToHaveSkills} color="#0ea5e9" />
              </div>
            )}
          </div>
        )}

        {/* ── Resume Bullet Suggestions ── */}
        {bullets.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
              borderRadius: "14px",
              border: dark
                ? "1px solid rgba(99,102,241,0.2)"
                : "1px solid rgba(99,102,241,0.15)",
              background: dark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)",
              padding: "16px",
              animation: "fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px" }}>✦</span>
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "10.5px", fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: dark ? "#a5b4fc" : "#6366f1",
              }}>AI Resume Suggestions</span>
              <span style={{
                marginLeft: "auto",
                fontFamily: "'Outfit', sans-serif",
                fontSize: "10px",
                color: dark ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.6)",
              }}>Click to copy</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {bullets.map((bullet, i) => (
                <div
                  key={i}
                  className="bullet-item"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
                    border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <span style={{
                    marginTop: "5px", width: 6, height: 6,
                    borderRadius: "50%", background: "#6366f1",
                    flexShrink: 0, display: "inline-block",
                    boxShadow: "0 0 6px rgba(99,102,241,0.5)",
                  }} />
                  <p style={{
                    flex: 1, margin: 0,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "12.5px", lineHeight: "1.6",
                    color: dark ? "rgba(226,232,240,0.9)" : "rgba(30,31,46,0.85)",
                  }}>{bullet}</p>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopyBullet(bullet, i)}
                    title="Copy to clipboard"
                    style={{
                      flexShrink: 0, padding: "4px 10px",
                      borderRadius: "7px",
                      border: dark
                        ? "1px solid rgba(255,255,255,0.1)"
                        : "1px solid rgba(99,102,241,0.2)",
                      background: "transparent",
                      color: copiedIndex === i ? "#10b981" : dark ? "rgba(148,163,184,0.7)" : "#6366f1",
                      fontSize: "11px",
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 600, cursor: "pointer",
                      transition: "all 0.18s",
                      letterSpacing: "0.03em", whiteSpace: "nowrap",
                    }}
                  >
                    {copiedIndex === i ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Save button ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={isSaving || (!form.company && !form.role)}
            style={{
              padding: "9px 22px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #10b981 0%, #0891b2 100%)",
              color: "#fff",
              fontSize: "12.5px",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: isSaving || (!form.company && !form.role) ? "not-allowed" : "pointer",
              opacity: !form.company && !form.role ? 0.45 : 1,
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
            }}
          >
            <span style={{ fontSize: "14px" }}>{isSaving ? "⏳" : "✓"}</span>
            {isSaving ? "Saving…" : "Save Application"}
          </button>

          {parsed && (
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "11px", fontWeight: 500,
              color: "#10b981",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "20px", padding: "4px 12px",
              letterSpacing: "0.03em",
              animation: "fadeSlideUp 0.3s ease both",
            }}>✦ AI parsed</span>
          )}
        </div>
      </div>
    </>
  );
}

export default AddApplication;