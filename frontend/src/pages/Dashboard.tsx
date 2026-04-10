import { useEffect, useState } from "react";
import { getApplications, updateApplication, deleteApplication } from "../api/applications";
import AddApplication from "../components/AddApplication";
import { useNavigate } from "react-router-dom";

import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Application {
  _id: string;
  company: string;
  role: string;
  status: string;
  dateApplied?: string;
  createdAt?: string;
  seniority?: string;
  location?: string;
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
}

interface ColumnMeta {
  accent: string;
  darkAccent: string;
  dot: string;
  icon: string;
}

interface CardModalProps {
  app: Application;
  dark: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Application>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface DraggableCardProps {
  app: Application;
  dark: boolean;
  onCardClick: (app: Application) => void;
}

interface ColumnProps {
  status: string;
  apps: Application[];
  dark: boolean;
  onCardClick: (app: Application) => void;
}

interface StatPillProps {
  label: string;
  value: number;
  color: string;
  dark: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────
const columns = [
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
];

const columnMeta: Record<string, ColumnMeta> = {
  "Applied": {
    accent: "rgba(99,102,241,0.08)",
    darkAccent: "rgba(99,102,241,0.12)",
    dot: "#6366f1",
    icon: "📤",
  },
  "Phone Screen": {
    accent: "rgba(14,165,233,0.08)",
    darkAccent: "rgba(14,165,233,0.12)",
    dot: "#0ea5e9",
    icon: "📞",
  },
  "Interview": {
    accent: "rgba(245,158,11,0.08)",
    darkAccent: "rgba(245,158,11,0.12)",
    dot: "#f59e0b",
    icon: "🎯",
  },
  "Offer": {
    accent: "rgba(16,185,129,0.08)",
    darkAccent: "rgba(16,185,129,0.12)",
    dot: "#10b981",
    icon: "🏆",
  },
  "Rejected": {
    accent: "rgba(239,68,68,0.08)",
    darkAccent: "rgba(239,68,68,0.12)",
    dot: "#ef4444",
    icon: "🚫",
  },
};

// ─── HELPER ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── CARD DETAIL MODAL ─────────────────────────────────────────────────────
function CardModal({ app, dark, onClose, onSave, onDelete }: CardModalProps) {
  const [company, setCompany] = useState(app.company || "");
  const [role, setRole] = useState(app.role || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const meta = columnMeta[app.status] ?? { dot: "#6366f1" };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(app._id, { company, role });
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setIsDeleting(true);
    await onDelete(app._id);
    setIsDeleting(false);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(99,102,241,0.18)",
    background: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
    color: dark ? "#f1f5f9" : "#1e1f2e",
    fontSize: "13.5px",
    fontFamily: "'Outfit', sans-serif",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "10.5px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: dark ? "rgba(148,163,184,0.55)" : "rgba(100,116,139,0.7)",
    marginBottom: "6px",
  };

  return (
    <>
      <style>{`
        @keyframes modalBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalCardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-input:focus {
          border-color: rgba(99,102,241,0.5) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
        }
        .modal-save-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #5254e0, #7c3aed) !important;
          box-shadow: 0 6px 20px rgba(99,102,241,0.4) !important;
          transform: translateY(-1px);
        }
        .modal-delete-btn:hover:not(:disabled) {
          background: rgba(239,68,68,0.18) !important;
        }
        .modal-save-btn, .modal-delete-btn {
          transition: all 0.18s cubic-bezier(0.22,1,0.36,1) !important;
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          zIndex: 100,
          animation: "modalBackdropIn 0.2s ease both",
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: "fixed",
          top: "10%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 101,
          width: "100%",
          maxWidth: "440px",
          maxHeight: "80vh",
          overflowY: "auto",
          padding: "0 16px",
          animation: "modalCardIn 0.28s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <div
          style={{
            background: dark
              ? "linear-gradient(135deg, rgba(20,22,38,0.97) 0%, rgba(14,16,28,0.99) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(248,250,255,1) 100%)",
            border: dark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(99,102,241,0.12)",
            borderRadius: "22px",
            padding: "28px",
            boxShadow: dark
              ? "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)"
              : "0 24px 60px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,1)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: 42, height: 42, borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, color: "#fff",
                fontFamily: "'Outfit', sans-serif", letterSpacing: "0.04em",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              }}>
                {app.company?.slice(0, 2).toUpperCase() || "??"}
              </div>
              <div>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 700, fontSize: "18px",
                  color: dark ? "#f1f5f9" : "#1e1f2e",
                  margin: 0, lineHeight: 1.2,
                }}>
                  {app.company}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: meta.dot, display: "inline-block",
                    boxShadow: `0 0 5px ${meta.dot}88`,
                  }} />
                  <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "11px", fontWeight: 600,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    color: meta.dot,
                  }}>
                    {app.status}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "9px",
                border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
                background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                color: dark ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.7)",
                fontSize: "16px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              ✕
            </button>
          </div>

          {/* ── DATE APPLIED ROW (read-only) ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: "7px",
            marginBottom: "18px", padding: "8px 12px", borderRadius: "9px",
            background: dark ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.05)",
            border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(99,102,241,0.10)",
          }}>
            <span style={{ fontSize: "13px" }}>📅</span>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "11px", fontWeight: 600,
              letterSpacing: "0.07em", textTransform: "uppercase",
              color: dark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.65)",
            }}>Applied</span>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "12.5px", fontWeight: 500,
              color: dark ? "rgba(203,213,225,0.85)" : "rgba(51,65,85,0.9)",
              marginLeft: "2px",
            }}>
              {formatDate(app.createdAt || app.dateApplied)}
            </span>
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            marginBottom: "22px",
          }} />

          {/* ── AI EXTRACTED DETAILS (read-only) ── */}
          {(app.seniority || app.location || (app.requiredSkills?.length ?? 0) > 0 || (app.niceToHaveSkills?.length ?? 0) > 0) && (
            <div style={{
              marginBottom: "20px", borderRadius: "12px",
              border: dark ? "1px solid rgba(99,102,241,0.15)" : "1px solid rgba(99,102,241,0.12)",
              background: dark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.03)",
              padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px" }}>✦</span>
                <span style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "10px", fontWeight: 700,
                  letterSpacing: "0.09em", textTransform: "uppercase",
                  color: dark ? "#a5b4fc" : "#6366f1",
                }}>AI Extracted Details</span>
              </div>

              {(app.seniority || app.location) && (
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {app.seniority && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "10.5px", fontWeight: 600,
                        letterSpacing: "0.07em", textTransform: "uppercase",
                        color: dark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.6)",
                      }}>Level</span>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "12px", fontWeight: 500,
                        color: dark ? "#e2e8f0" : "#1e1f2e",
                        background: dark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.25)",
                        borderRadius: "20px", padding: "2px 10px",
                      }}>{app.seniority}</span>
                    </div>
                  )}
                  {app.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px" }}>📍</span>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "12px", fontWeight: 500,
                        color: dark ? "rgba(203,213,225,0.85)" : "rgba(51,65,85,0.9)",
                      }}>{app.location}</span>
                    </div>
                  )}
                </div>
              )}

              {(app.requiredSkills?.length ?? 0) > 0 && (
                <div>
                  <div style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "10.5px", fontWeight: 600,
                    letterSpacing: "0.07em", textTransform: "uppercase",
                    color: dark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.6)",
                    marginBottom: "6px",
                  }}>Required Skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {app.requiredSkills!.map((s, i) => (
                      <span key={i} style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "11.5px", fontWeight: 500,
                        padding: "3px 10px", borderRadius: "20px",
                        background: dark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        color: dark ? "#a5b4fc" : "#6366f1",
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {(app.niceToHaveSkills?.length ?? 0) > 0 && (
                <div>
                  <div style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "10.5px", fontWeight: 600,
                    letterSpacing: "0.07em", textTransform: "uppercase",
                    color: dark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.6)",
                    marginBottom: "6px",
                  }}>Nice to Have</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {app.niceToHaveSkills!.map((s, i) => (
                      <span key={i} style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "11.5px", fontWeight: 500,
                        padding: "3px 10px", borderRadius: "20px",
                        background: dark ? "rgba(14,165,233,0.1)" : "rgba(14,165,233,0.07)",
                        border: "1px solid rgba(14,165,233,0.25)",
                        color: dark ? "#7dd3fc" : "#0ea5e9",
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>Company</label>
              <input
                className="modal-input"
                style={inputStyle}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <input
                className="modal-input"
                style={inputStyle}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Job title"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="modal-save-btn"
              onClick={handleSave}
              disabled={isSaving || (!company && !role)}
              style={{
                flex: 1, padding: "10px", borderRadius: "11px", border: "none",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff", fontSize: "13px",
                fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                letterSpacing: "0.03em",
                cursor: isSaving || (!company && !role) ? "not-allowed" : "pointer",
                opacity: !company && !role ? 0.5 : 1,
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              {isSaving ? "⏳ Saving…" : "✓ Save Changes"}
            </button>

            <button
              className="modal-delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                padding: "10px 16px", borderRadius: "11px",
                border: "1px solid rgba(239,68,68,0.3)",
                background: confirmDelete
                  ? "rgba(239,68,68,0.15)"
                  : dark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)",
                color: "#ef4444", fontSize: "13px",
                fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                cursor: isDeleting ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {isDeleting ? "⏳" : confirmDelete ? "⚠️ Confirm" : "🗑 Delete"}
            </button>
          </div>

          {confirmDelete && (
            <p style={{
              marginTop: "10px", marginBottom: 0,
              fontFamily: "'Outfit', sans-serif",
              fontSize: "11.5px", textAlign: "center",
              color: "rgba(239,68,68,0.7)",
            }}>
              Click Delete again to confirm. This cannot be undone.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── CARD ──────────────────────────────────────────────────────────────────
function DraggableCard({ app, dark, onCardClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app._id,
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
    transition: isDragging ? "none" : "box-shadow 0.2s",
  };

  const initials = app.company ? app.company.slice(0, 2).toUpperCase() : "??";

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: dark
          ? "linear-gradient(135deg, rgba(30,32,48,0.9) 0%, rgba(22,24,38,0.95) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,255,0.98) 100%)",
        border: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
        borderRadius: "14px", padding: "14px 16px", cursor: "pointer",
        boxShadow: dark
          ? "0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", gap: "12px",
      }}
      onClick={() => { if (!isDragging) onCardClick(app); }}
    >
      <div
        {...listeners}
        {...attributes}
        style={{
          width: 36, height: 36, borderRadius: "10px",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: "11px", fontWeight: 700, color: "#fff",
          letterSpacing: "0.04em", fontFamily: "'Outfit', sans-serif",
          cursor: "grab", touchAction: "none",
        }}
        title="Drag to move"
      >
        {initials}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "13.5px",
          color: dark ? "#f1f5f9" : "#1e1f2e", margin: 0,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {app.company}
        </p>
        <p style={{
          fontFamily: "'Outfit', sans-serif", fontSize: "12px",
          color: dark ? "rgba(148,163,184,0.85)" : "rgba(100,116,139,0.9)",
          margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {app.role}
        </p>
        <p style={{
          fontFamily: "'Outfit', sans-serif", fontSize: "11px",
          color: dark ? "rgba(148,163,184,0.45)" : "rgba(148,163,184,0.8)",
          margin: "5px 0 0", display: "flex", alignItems: "center", gap: "4px",
        }}>
          <span style={{ fontSize: "10px" }}>📅</span>
          {formatDate(app.createdAt || app.dateApplied)}
        </p>
      </div>
    </div>
  );
}

// ─── COLUMN ────────────────────────────────────────────────────────────────
function Column({ status, apps, dark, onCardClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = columnMeta[status];

  return (
    <div
      ref={setNodeRef}
      style={{
        background: dark
          ? isOver ? "rgba(30,32,48,0.85)" : "rgba(18,20,33,0.7)"
          : isOver ? "rgba(245,246,255,0.9)" : "rgba(248,249,252,0.7)",
        border: dark
          ? `1px solid ${isOver ? meta.dot + "44" : "rgba(255,255,255,0.06)"}`
          : `1px solid ${isOver ? meta.dot + "44" : "rgba(0,0,0,0.06)"}`,
        borderRadius: "18px", padding: "18px 14px", minHeight: "380px",
        backdropFilter: "blur(16px)",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        boxShadow: isOver
          ? `0 0 0 2px ${meta.dot}33, 0 8px 32px rgba(0,0,0,0.08)`
          : dark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 8, height: 8, borderRadius: "50%",
            background: meta.dot, boxShadow: `0 0 6px ${meta.dot}88`,
          }} />
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "12.5px",
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: dark ? "rgba(203,213,225,0.85)" : "rgba(51,65,85,0.9)",
          }}>
            {status}
          </span>
        </div>
        <span style={{
          background: dark ? meta.darkAccent : meta.accent,
          color: meta.dot, borderRadius: "20px", padding: "2px 9px",
          fontSize: "11px", fontWeight: 700, fontFamily: "'Outfit', sans-serif",
          border: `1px solid ${meta.dot}22`,
        }}>
          {apps.length}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {apps.map((app) => (
          <DraggableCard key={app._id} app={app} dark={dark} onCardClick={onCardClick} />
        ))}
      </div>

      {apps.length === 0 && (
        <div style={{
          height: "80px",
          border: `2px dashed ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
          borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: "11px", fontFamily: "'Outfit', sans-serif",
            color: dark ? "rgba(148,163,184,0.4)" : "rgba(148,163,184,0.7)",
            letterSpacing: "0.05em",
          }}>
            Drop here
          </span>
        </div>
      )}
    </div>
  );
}

// ─── STAT PILL ─────────────────────────────────────────────────────────────
function StatPill({ label, value, color, dark }: StatPillProps) {
  return (
    <div style={{
      background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)",
      border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
      borderRadius: "12px", padding: "10px 18px", backdropFilter: "blur(8px)",
      display: "flex", flexDirection: "column", gap: "2px", minWidth: "80px",
    }}>
      <span style={{
        fontFamily: "'Cormorant Garamond', serif", fontSize: "22px",
        fontWeight: 700, color: color, lineHeight: 1.1,
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: "'Outfit', sans-serif", fontSize: "10.5px",
        letterSpacing: "0.07em", textTransform: "uppercase",
        color: dark ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.8)",
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
function Dashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [dark, setDark] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    const res = await getApplications();
    setApps(res.data);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    await updateApplication(active.id as string, { status: over.id as string });
    fetchApps();
  };

  const handleModalSave = async (id: string, updates: Partial<Application>) => {
    await updateApplication(id, updates);
    fetchApps();
  };

  const handleModalDelete = async (id: string) => {
    await deleteApplication(id);
    fetchApps();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const offerCount = apps.filter((a) => a.status === "Offer").length;
  const interviewCount = apps.filter((a) => a.status === "Interview").length;
  const activeCount = apps.filter((a) => a.status !== "Rejected").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Outfit', sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 99px; }
        .dashboard-card-hover:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0,0,0,0.12) !important; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeSlideIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .fade-in-1 { animation-delay: 0.05s; }
        .fade-in-2 { animation-delay: 0.12s; }
        .fade-in-3 { animation-delay: 0.19s; }
      `}</style>

      <div style={{
        minHeight: "100vh", padding: "28px 32px 48px",
        transition: "background 0.4s, color 0.4s",
        background: dark
          ? "linear-gradient(135deg, #0b0d17 0%, #10121e 40%, #0e1020 100%)"
          : "linear-gradient(135deg, #f0f2ff 0%, #f7f8fe 50%, #eef0fa 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "fixed", top: "-120px", right: "-80px",
          width: "480px", height: "480px", borderRadius: "50%",
          background: dark
            ? "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div aria-hidden style={{
          position: "fixed", bottom: "-100px", left: "-60px",
          width: "420px", height: "420px", borderRadius: "50%",
          background: dark
            ? "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* ── HEADER ── */}
        <div className="fade-in" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "32px", position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: 42, height: 42, borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
            }}>🚀</div>
            <div>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "26px",
                color: dark ? "#f1f5f9" : "#1e1f2e", margin: 0, lineHeight: 1.1, letterSpacing: "-0.01em",
              }}>AI Job Tracker</h1>
              <p style={{
                fontFamily: "'Outfit', sans-serif", fontSize: "11.5px",
                color: dark ? "rgba(148,163,184,0.6)" : "rgba(100,116,139,0.75)",
                margin: 0, letterSpacing: "0.06em", textTransform: "uppercase",
              }}>Career Intelligence Dashboard</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={toggleDark} title="Toggle theme" style={{
              width: 38, height: 38, borderRadius: "10px",
              border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
              background: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
              cursor: "pointer", fontSize: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", backdropFilter: "blur(8px)",
            }}>
              {dark ? "☀️" : "🌙"}
            </button>

            <div style={{
              display: "none", padding: "6px 14px", borderRadius: "20px",
              fontSize: "11px", fontFamily: "'Outfit', sans-serif", letterSpacing: "0.04em",
              background: dark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
              color: dark ? "#a5b4fc" : "#6366f1",
              border: dark ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(99,102,241,0.15)",
            }} className="sm:flex">
              ✦ Track smarter, not harder
            </div>

            <div style={{
              width: 38, height: 38, borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: "14px",
              fontFamily: "'Outfit', sans-serif",
              boxShadow: "0 4px 12px rgba(99,102,241,0.3)", letterSpacing: "0.02em",
            }}>V</div>

            <button
              onClick={handleLogout}
              style={{
                padding: "8px 16px", borderRadius: "10px",
                border: "1px solid rgba(239,68,68,0.25)",
                background: dark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)",
                color: "#ef4444", fontSize: "12.5px",
                fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.03em",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.18)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = dark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)"; }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="fade-in fade-in-1" style={{
          display: "flex", gap: "12px", marginBottom: "24px",
          flexWrap: "wrap", position: "relative", zIndex: 1,
        }}>
          <StatPill label="Total" value={apps.length} color={dark ? "#a5b4fc" : "#6366f1"} dark={dark} />
          <StatPill label="Active" value={activeCount} color={dark ? "#67e8f9" : "#0ea5e9"} dark={dark} />
          <StatPill label="Interviews" value={interviewCount} color={dark ? "#fcd34d" : "#f59e0b"} dark={dark} />
          <StatPill label="Offers" value={offerCount} color={dark ? "#6ee7b7" : "#10b981"} dark={dark} />
        </div>

        {/* ── ADD APPLICATION PANEL ── */}
        <div className="fade-in fade-in-2" style={{
          position: "relative", zIndex: 1,
          background: dark
            ? "linear-gradient(135deg, rgba(20,22,38,0.9) 0%, rgba(16,18,32,0.95) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.98) 100%)",
          border: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(99,102,241,0.12)",
          borderRadius: "20px", padding: "24px 28px", marginBottom: "28px",
          backdropFilter: "blur(16px)",
          boxShadow: dark
            ? "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 4px 24px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{
              width: 20, height: 20, borderRadius: "6px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px",
            }}>＋</span>
            <span style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "12px",
              letterSpacing: "0.07em", textTransform: "uppercase",
              color: dark ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.75)",
            }}>New Application</span>
          </div>
          <AddApplication onSuccess={fetchApps} dark={dark} />
        </div>

        {/* ── BOARD ── */}
        <div className="fade-in fade-in-3" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{
              height: 1, flex: 1,
              background: dark
                ? "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 100%)"
                : "linear-gradient(90deg, rgba(0,0,0,0.07) 0%, transparent 100%)",
            }} />
            <span style={{
              fontFamily: "'Outfit', sans-serif", fontSize: "11px", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: dark ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.5)",
            }}>Pipeline Board</span>
            <div style={{
              height: 1, flex: 1,
              background: dark
                ? "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 100%)"
                : "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.07) 100%)",
            }} />
          </div>

          {apps.length === 0 && (
            <div style={{
              textAlign: "center", padding: "60px 24px", borderRadius: "20px",
              border: dark ? "2px dashed rgba(255,255,255,0.07)" : "2px dashed rgba(99,102,241,0.15)",
              marginBottom: "24px",
            }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 700,
                color: dark ? "#f1f5f9" : "#1e1f2e", margin: "0 0 6px",
              }}>No applications yet</p>
              <p style={{
                fontFamily: "'Outfit', sans-serif", fontSize: "13px",
                color: dark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.65)", margin: 0,
              }}>
                Paste a job description above and click Parse with AI to get started ↑
              </p>
            </div>
          )}

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}>
              {columns.map((col) => (
                <Column
                  key={col}
                  status={col}
                  apps={apps.filter((app) => app.status === col)}
                  dark={dark}
                  onCardClick={setSelectedApp}
                />
              ))}
            </div>
          </DndContext>
        </div>
      </div>

      {/* ── CARD DETAIL MODAL ── */}
      {selectedApp && (
        <CardModal
          app={selectedApp}
          dark={dark}
          onClose={() => setSelectedApp(null)}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
        />
      )}
    </>
  );
}

export default Dashboard;