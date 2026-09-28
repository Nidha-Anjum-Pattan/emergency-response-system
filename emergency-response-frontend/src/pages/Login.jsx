import React, { useState } from "react";
import api from "../services/api";
import { jwtDecode } from "jwt-decode";
import { translations } from "../utils/i18n";
import { Globe } from "lucide-react";

export default function Login() {
  const [lang, setLang] = useState(localStorage.getItem("app_lang") || "en");
  const t = translations[lang] || translations.en;

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        identifier: identifier,
        password: password
      });

      const data = response.data;
      const token = typeof data === "string" ? data : data.token;
      localStorage.setItem("token", token);

      const decoded = jwtDecode(token);
      const role = decoded.role || data.role;

      if (role === "ROLE_AMBULANCE") {
        window.location.href = "/ambulance";
      } else if (role === "ROLE_HOSPITAL") {
        window.location.href = "/hospital";
      } else if (role === "ROLE_ADMIN") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/victim";
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Email/Phone or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: "20px" }}>
      
      {/* Top Navbar Header with Language Switcher */}
      <header style={{ width: "100%", maxWidth: "440px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>🚨</span>
          <strong style={{ color: "#0f172a", fontSize: "18px" }}>{t.title}</strong>
        </div>

        {/* Global Language Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "white", padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
          <Globe size={18} color="#475569" />
          <select value={lang} onChange={(e) => handleLangChange(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <option value="en">🇬🇧 English</option>
            <option value="te">🇮🇳 తెలుగు</option>
            <option value="hi">🇮🇳 हिंदी</option>
            <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
          </select>
        </div>
      </header>

      {/* Main Login Card */}
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "20px", maxWidth: "440px", width: "100%", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ backgroundColor: "#ef4444", width: "56px", height: "56px", borderRadius: "16px", display: "flex", alignItems: "center", justifyCenter: "center", margin: "0 auto 12px", color: "white", fontSize: "28px", boxShadow: "0 4px 14px rgba(239,68,68,0.4)" }}>🚨</div>
          <h2 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "24px", fontWeight: 800 }}>{t.loginTitle}</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>{t.loginSubTitle}</p>
        </div>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "12px", borderRadius: "10px", fontSize: "14px", marginBottom: "20px", border: "1px solid #fca5a5" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
              📧 {t.emailOrPhone}
            </label>
            <input
              type="text"
              required
              placeholder="user@example.com / 9876543210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
              🔒 {t.password}
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              padding: "14px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37,99,235,0.3)"
            }}
          >
            {loading ? "LOGGING IN..." : t.loginBtn}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            {t.noAccount} <a href="/register" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 700 }}>{t.registerHere}</a>
          </p>
          <div style={{ marginTop: "16px" }}>
            <a href="/" style={{ color: "#dc2626", textDecoration: "none", fontSize: "14px", fontWeight: 800 }}>⚡ {t.expressSos}</a>
          </div>
        </div>
      </div>
    </div>
  );
}