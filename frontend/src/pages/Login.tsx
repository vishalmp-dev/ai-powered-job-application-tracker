import { useState } from "react";
import { loginUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch {
      alert("Invalid credentials :(");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { font-family: 'Outfit', sans-serif; }

        .auth-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 11px;
          border: 1px solid rgba(99,102,241,0.18);
          background: rgba(255,255,255,0.06);
          color: #f1f5f9;
          font-size: 13.5px;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          backdrop-filter: blur(8px);
        }
        .auth-input::placeholder { color: rgba(148,163,184,0.45); }
        .auth-input:focus {
          border-color: rgba(99,102,241,0.55);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }

        .auth-btn {
          width: 100%;
          padding: 11px;
          border-radius: 11px;
          border: none;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          font-size: 13.5px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(99,102,241,0.35);
          transition: all 0.22s cubic-bezier(0.22,1,0.36,1);
        }
        .auth-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #5254e0 0%, #7c3aed 100%);
          box-shadow: 0 8px 28px rgba(99,102,241,0.45);
          transform: translateY(-1px);
        }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .auth-link {
          color: #a5b4fc;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }
        .auth-link:hover { color: #c4b5fd; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-card { animation: fadeSlideIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .loading-btn {
          background: linear-gradient(90deg, #6366f1 25%, #a78bfa 50%, #6366f1 75%) !important;
          background-size: 200% auto !important;
          animation: shimmer 1.4s linear infinite !important;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b0d17 0%, #10121e 40%, #0e1020 100%)",
          padding: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background blobs */}
        <div aria-hidden style={{
          position: "fixed", top: "-140px", right: "-100px",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div aria-hidden style={{
          position: "fixed", bottom: "-120px", left: "-80px",
          width: "440px", height: "440px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Card */}
        <div
          className="auth-card"
          style={{
            width: "100%",
            maxWidth: "400px",
            background: "linear-gradient(135deg, rgba(20,22,38,0.92) 0%, rgba(14,16,28,0.96) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "24px",
            padding: "40px 36px",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "11px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "19px", boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
            }}>🚀</div>
            <div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 700, fontSize: "20px",
                color: "#f1f5f9", lineHeight: 1.1,
              }}>AI Job Tracker</div>
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "10px", letterSpacing: "0.08em",
                textTransform: "uppercase", color: "rgba(148,163,184,0.5)",
              }}>Career Intelligence</div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 700, fontSize: "30px",
              color: "#f1f5f9", marginBottom: "6px", lineHeight: 1.15,
            }}>
              Welcome back
            </h1>
            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "13px", color: "rgba(148,163,184,0.65)",
            }}>
              Sign in to your dashboard
            </p>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "22px" }}>
            <div>
              <label style={{
                display: "block", fontFamily: "'Outfit', sans-serif",
                fontSize: "10.5px", fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "rgba(148,163,184,0.55)", marginBottom: "6px",
              }}>Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <label style={{
                display: "block", fontFamily: "'Outfit', sans-serif",
                fontSize: "10.5px", fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "rgba(148,163,184,0.55)", marginBottom: "6px",
              }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ paddingRight: "42px" }}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    color: "rgba(148,163,184,0.5)", cursor: "pointer",
                    fontSize: "15px", padding: 0, lineHeight: 1,
                  }}
                  tabIndex={-1}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            className={`auth-btn ${loading ? "loading-btn" : ""}`}
            onClick={handleLogin}
            disabled={loading || !email || !password}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>

          {/* Footer link */}
          <p style={{
            marginTop: "22px", textAlign: "center",
            fontFamily: "'Outfit', sans-serif",
            fontSize: "12.5px", color: "rgba(148,163,184,0.5)",
          }}>
            No account?{" "}
            <a href="/register" className="auth-link">Create one</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;