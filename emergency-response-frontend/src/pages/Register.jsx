import React, { useState } from "react";
import api from "../services/api";
import { translations } from "../utils/i18n";
import { Globe, UserPlus, Shield, Heart } from "lucide-react";

export default function Register() {
  const [lang, setLang] = useState(localStorage.getItem("app_lang") || "en");
  const t = translations[lang] || translations.en;

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    bloodGroup: "O+",
    emergencyContact: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      await api.post("/users", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: "ROLE_USER", // Public registration is strictly for Victims/Citizens
        bloodGroup: formData.bloodGroup,
        emergencyContact: formData.emergencyContact
      });

      alert("Citizen Account Registered Successfully! Please Login to access your portal.");
      window.location.href = "/login";
    } catch (err) {
      setError(err.response?.data?.message || "Registration Failed. Email or Phone may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: "20px" }}>
      
      {/* Top Navbar */}
      <header style={{ width: "100%", maxWidth: "520px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>🚨</span>
          <strong style={{ color: "#0f172a", fontSize: "18px" }}>{t.title}</strong>
        </div>

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

      {/* Main Light Theme Form Card */}
      <div style={{ backgroundColor: "white", padding: "36px", borderRadius: "20px", maxWidth: "520px", width: "100%", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "24px", fontWeight: 800 }}>🆘 {t.registerTitle} (Citizen Portal)</h2>
          <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#64748b" }}>Create a Victim / Patient Profile with vital medical details</p>
          <div style={{ backgroundColor: "#eff6ff", color: "#1e40af", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "1px solid #bfdbfe" }}>
            ℹ️ Ambulances & Hospitals are provisioned by Emergency System Admin.
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "12px", borderRadius: "10px", fontSize: "14px", marginBottom: "20px", border: "1px solid #fca5a5" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>{t.fullName}</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          {/* Email & Phone Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>{t.email}</label>
              <input
                type="email"
                required
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>{t.phone}</label>
              <input
                type="text"
                required
                placeholder="10 Digits"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Blood Group & Emergency Contact */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#dc2626", marginBottom: "6px" }}>🩸 {t.bloodGroup}</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #fca5a5", backgroundColor: "#fef2f2", fontWeight: 700, color: "#991b1b", boxSizing: "border-box" }}
              >
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>📞 {t.emergencyContact}</label>
              <input
                type="text"
                placeholder="Family Phone Number"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Password Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>🔒 {t.password}</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>🔒 {t.confirmPassword}</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
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
            {loading ? "CREATING ACCOUNT..." : t.createAccountBtn}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a href="/login" style={{ color: "#2563eb", textDecoration: "none", fontSize: "14px", fontWeight: 700 }}>
            {t.alreadyAccount} {t.login}
          </a>
        </div>
      </div>
    </div>
  );
}