import React, { useEffect, useState } from "react";
import api from "../services/api";
import { translations } from "../utils/i18n";
import RealtimeMap from "../components/RealtimeMap";
import { Phone, AlertTriangle, ShieldCheck, MapPin, Heart, Activity, Car, CheckCircle, XCircle, Globe, RefreshCw, UserCheck, X, User, Edit3, Droplet } from "lucide-react";

export default function VictimDashboard() {
  const [lang, setLang] = useState(localStorage.getItem("app_lang") || "en");
  const t = translations[lang] || translations.en;

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const [user, setUser] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Express SOS Modal State
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [expressData, setExpressData] = useState({
    phone: "",
    otp: "1234",
    name: "",
    category: "CARDIAC",
    landmark: "",
    description: ""
  });
  const [otpSent, setOtpSent] = useState(false);

  // Registered SOS Category Form
  const [selectedCategory, setSelectedCategory] = useState("CARDIAC");
  const [landmark, setLandmark] = useState("");
  const [description, setDescription] = useState("");

  // Victim Profile View & Safe Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    bloodGroup: "O+",
    emergencyContact: ""
  });

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        bloodGroup: user.bloodGroup || "O+",
        emergencyContact: user.emergencyContact || ""
      });
      const timer = setInterval(loadRequests, 4000);
      return () => clearInterval(timer);
    }
  }, [user]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      }
    } catch (error) {
      console.log("Not logged in as registered user", error);
    }
  };

  const loadRequests = async () => {
    if (!user?.id) return;
    try {
      const response = await api.get(`/api/emergency/victim/${user.id}`);
      const list = response.data || [];
      setHistory(list);
      const active = list.find(r => r.status !== "COMPLETED" && r.status !== "CANCELLED");
      setActiveRequest(active || null);
    } catch (err) {
      console.log("Error loading requests", err);
    }
  };

  const triggerRegisteredSOS = async () => {
    if (!user?.id) {
      setShowExpressModal(true);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/api/emergency/sos/${user.id}?latitude=16.3067&longitude=80.4365&landmark=${encodeURIComponent(landmark)}&category=${selectedCategory}&description=${encodeURIComponent(description)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveRequest(res.data);
      alert(t.sosSuccess);
      loadRequests();
    } catch (err) {
      alert("Failed to send SOS: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (!expressData.phone || expressData.phone.length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }
    setOtpSent(true);
    alert("Demo OTP sent! Use default OTP '1234' to verify.");
  };

  const triggerExpressSOS = async () => {
    if (!expressData.phone || !expressData.otp) {
      alert("Please complete OTP verification");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/emergency/express-sos", {
        phone: expressData.phone,
        otp: expressData.otp,
        name: expressData.name || "Express Guest Victim",
        category: expressData.category,
        landmark: expressData.landmark,
        description: expressData.description,
        latitude: 16.3067,
        longitude: 80.4365
      });
      setActiveRequest(res.data);
      setShowExpressModal(false);
      alert(t.sosSuccess);
    } catch (err) {
      alert("Express SOS Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const cancelSOS = async (reqId) => {
    if (!window.confirm("Are you sure you want to cancel this emergency request?")) return;
    try {
      await api.put(`/api/emergency/victim/cancel/${reqId}`);
      setActiveRequest(null);
      alert("Emergency Request Cancelled.");
      loadRequests();
    } catch (err) {
      alert("Failed to cancel SOS request");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.put(`/users/${user.id}`, {
        name: profileForm.name,
        phone: profileForm.phone,
        bloodGroup: profileForm.bloodGroup,
        emergencyContact: profileForm.emergencyContact
      });
      setUser(res.data);
      setShowProfileModal(false);
      alert("✅ Profile details updated successfully!");
    } catch (err) {
      alert("Failed to update profile: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const categories = [
    { key: "CARDIAC", label: t.cardiac, icon: "🫀", badge: "CRITICAL (Priority 1)" },
    { key: "ACCIDENT", label: t.accident, icon: "🚗", badge: "CRITICAL (Priority 1)" },
    { key: "FRACTURE", label: t.fracture, icon: "🩻", badge: "URGENT (Priority 2)" },
    { key: "FEVER", label: t.fever, icon: "🤒", badge: "URGENT (Priority 2)" },
    { key: "MINOR", label: t.minor, icon: "🩹", badge: "NON_URGENT (Priority 3)" },
    { key: "OTHER", label: t.other, icon: "🚨", badge: "URGENT (Priority 2)" }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "Inter, sans-serif" }}>
      {/* Header Bar */}
      <header style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ backgroundColor: "#ef4444", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "20px" }}>🚨</div>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a", fontWeight: 700 }}>{t.title}</h2>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{t.victimDashboard}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Language Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#f1f5f9", padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
            <Globe size={18} color="#475569" />
            <select value={lang} onChange={(e) => handleLangChange(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
              <option value="en">🇬🇧 English</option>
              <option value="te">🇮🇳 తెలుగు (Telugu)</option>
              <option value="hi">🇮🇳 हिंदी (Hindi)</option>
              <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
            </select>
          </div>

          {!user ? (
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowExpressModal(true)} style={{ backgroundColor: "#dc2626", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                {t.expressSos}
              </button>
              <a href="/login" style={{ textDecoration: "none", backgroundColor: "#0f172a", color: "white", padding: "10px 18px", borderRadius: "8px", fontWeight: 600 }}>
                {t.login}
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setShowProfileModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  color: "#1e40af",
                  cursor: "pointer"
                }}
              >
                <User size={16} /> My Profile
              </button>

              <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>👤 {user.name}</span>
              <button onClick={logout} style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body Container */}
      <div style={{ maxWidth: "1200px", margin: "32px auto", padding: "0 20px" }}>
        
        {/* Express Guest SOS Modal Trigger Banner if not logged in */}
        {!user && (
          <div style={{ backgroundColor: "#fef2f2", border: "2px dashed #f87171", padding: "20px", borderRadius: "16px", marginBottom: "32px", textAlign: "center" }}>
            <h3 style={{ color: "#991b1b", margin: "0 0 8px 0", fontSize: "22px" }}>⚡ Urgent Medical Emergency?</h3>
            <p style={{ color: "#7f1d1d", margin: "0 0 16px 0" }}>No time to register or log in? Trigger an Express SOS with instant 4-digit verification.</p>
            <button onClick={() => setShowExpressModal(true)} style={{ backgroundColor: "#dc2626", color: "white", border: "none", padding: "14px 32px", borderRadius: "12px", fontSize: "18px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(220,38,38,0.4)" }}>
              🚨 TRIGGER EXPRESS SOS (NO LOGIN)
            </button>
          </div>
        )}

        {/* User Info Bar if Logged in */}
        {user && (
          <div style={{ backgroundColor: "white", padding: "16px 24px", borderRadius: "12px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0" }}>
            <div>
              <span style={{ color: "#64748b", fontSize: "14px" }}>Logged In Patient: </span>
              <strong style={{ fontSize: "16px", color: "#0f172a" }}>{user.name} ({user.email || user.phone})</strong>
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <span>🩸 {t.bloodGroup}: <strong>{user.bloodGroup || "O+"}</strong></span>
              <span>📞 {t.emergencyContact}: <strong>{user.emergencyContact || user.phone || "9876543210"}</strong></span>
              <button
                onClick={() => setShowProfileModal(true)}
                style={{ backgroundColor: "#f1f5f9", color: "#2563eb", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Edit3 size={12} /> Edit Profile
              </button>
            </div>
          </div>
        )}

        {/* Active Emergency Status Component */}
        {activeRequest ? (
          <div style={{ backgroundColor: "white", padding: "28px", borderRadius: "16px", marginBottom: "32px", border: "2px solid #ef4444", boxShadow: "0 8px 24px rgba(239,68,68,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ backgroundColor: "#ef4444", color: "white", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 800 }}>LIVE EMERGENCY</span>
                <h3 style={{ margin: 0, color: "#0f172a", fontSize: "20px" }}>Emergency SOS Dispatch — {activeRequest.category}</h3>
              </div>
              <button onClick={() => cancelSOS(activeRequest.id)} style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                ❌ {t.cancelSos}
              </button>
            </div>

            {/* Stepper Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
              {["CREATED", "AMBULANCE_ASSIGNED", "ENROUTE_TO_VICTIM", "ARRIVED_AT_VICTIM", "HOSPITAL_SELECTED"].map((st, idx) => {
                const isCurrent = activeRequest.status === st;
                return (
                  <div key={st} style={{ textAlign: "center", flex: 1, opacity: isCurrent ? 1 : 0.6 }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: isCurrent ? "#ef4444" : "#cbd5e1", color: "white", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: isCurrent ? "#ef4444" : "#64748b" }}>{st.replace(/_/g, " ")}</span>
                  </div>
                );
              })}
            </div>

            {/* Grid details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              {/* Assigned Ambulance Card */}
              <div style={{ backgroundColor: "#eff6ff", padding: "16px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#1e40af", display: "flex", alignItems: "center", gap: "8px" }}>
                  🚑 {t.assignedAmbulance}
                </h4>
                {activeRequest.ambulance ? (
                  <div>
                    <p style={{ margin: "4px 0", fontWeight: 600 }}>Driver: {activeRequest.ambulance.driverName}</p>
                    <p style={{ margin: "4px 0", color: "#1e3a8a" }}>Vehicle #: {activeRequest.ambulance.vehicleNumber}</p>
                    <a href={`tel:${activeRequest.ambulance.phone || "999"}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "10px", backgroundColor: "#2563eb", color: "white", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
                      <Phone size={16} /> {t.callDriver} ({activeRequest.ambulance.phone || "Call"})
                    </a>
                  </div>
                ) : (
                  <p style={{ color: "#64748b", margin: 0 }}>Searching for nearest available ambulance unit...</p>
                )}
              </div>

              {/* Assigned Hospital Card */}
              <div style={{ backgroundColor: "#ecfdf5", padding: "16px", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#065f46", display: "flex", alignItems: "center", gap: "8px" }}>
                  🏥 {t.assignedHospital}
                </h4>
                {activeRequest.hospital ? (
                  <div>
                    <p style={{ margin: "4px 0", fontWeight: 600 }}>Hospital: {activeRequest.hospital.hospitalName}</p>
                    <p style={{ margin: "4px 0", color: "#047857" }}>Available ER Beds: <strong>{activeRequest.hospital.availableBeds} Free</strong></p>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a" }}>
                      Status: 🟢 Hospital Selected & Bed Reserved
                    </span>
                  </div>
                ) : (
                  <p style={{ color: "#64748b", margin: 0 }}>Driver will select hospital after pickup...</p>
                )}
              </div>
            </div>

            {/* Interactive Realtime Map Component */}
            <RealtimeMap
              victimPos={[activeRequest.latitude, activeRequest.longitude]}
              ambulancePos={activeRequest.ambulance ? [activeRequest.ambulance.latitude, activeRequest.ambulance.longitude] : null}
              hospitalPos={activeRequest.hospital ? [activeRequest.hospital.latitude, activeRequest.hospital.longitude] : null}
            />
          </div>
        ) : (
          /* Registered SOS Category Trigger Card */
          user && (
            <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "16px", marginBottom: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "22px", color: "#0f172a" }}>🚨 {t.triggerSos}</h3>
              <p style={{ color: "#64748b", margin: "0 0 24px 0" }}>Select emergency condition. The system automatically calculates priority and dispatches nearest ambulance.</p>

              {/* Category Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {categories.map(c => {
                  const isSel = selectedCategory === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setSelectedCategory(c.key)}
                      style={{
                        backgroundColor: isSel ? "#fef2f2" : "#f8fafc",
                        border: isSel ? "2px solid #ef4444" : "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "16px",
                        textAlign: "left",
                        cursor: "pointer",
                        boxShadow: isSel ? "0 4px 12px rgba(239,68,68,0.15)" : "none"
                      }}
                    >
                      <div style={{ fontSize: "28px", marginBottom: "8px" }}>{c.icon}</div>
                      <strong style={{ fontSize: "16px", color: "#0f172a", display: "block" }}>{c.label}</strong>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: c.badge.includes("CRITICAL") ? "#dc2626" : "#d97706", display: "block", marginTop: "4px" }}>
                        {c.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Form Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>📍 {t.landmarkCoords}</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Main Gate, Opp Apollo Pharmacy"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>📋 {t.details}</label>
                  <input
                    type="text"
                    placeholder="Briefly describe patient status"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              <button
                onClick={triggerRegisteredSOS}
                disabled={loading}
                style={{
                  width: "100%",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "16px",
                  borderRadius: "12px",
                  fontSize: "18px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(220,38,38,0.4)"
                }}
              >
                {loading ? "SENDING SOS..." : `🔴 ${t.triggerSos}`}
              </button>
            </div>
          )
        )}

        {/* Emergency History Table */}
        {user && history.length > 0 && (
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px 0", color: "#0f172a" }}>📋 {t.history}</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px" }}>#</th>
                  <th style={{ padding: "12px" }}>Category</th>
                  <th style={{ padding: "12px" }}>Priority</th>
                  <th style={{ padding: "12px" }}>Status</th>
                  <th style={{ padding: "12px" }}>Ambulance</th>
                  <th style={{ padding: "12px" }}>Hospital</th>
                  <th style={{ padding: "12px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontWeight: 700 }}>#{idx + 1}</td>
                    <td style={{ padding: "12px" }}>{r.category}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, backgroundColor: r.priorityLevel === "CRITICAL" ? "#fef2f2" : "#fffbeb", color: r.priorityLevel === "CRITICAL" ? "#dc2626" : "#d97706" }}>
                        {r.priorityLevel}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontWeight: 600 }}>{r.status}</td>
                    <td style={{ padding: "12px" }}>{r.ambulance ? r.ambulance.vehicleNumber : "—"}</td>
                    <td style={{ padding: "12px" }}>{r.hospital ? r.hospital.hospitalName : "—"}</td>
                    <td style={{ padding: "12px", fontSize: "12px", color: "#64748b" }}>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Express SOS Guest Modal */}
      {showExpressModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "20px", maxWidth: "480px", width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#dc2626", fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                🚨 {t.expressOtpTitle}
              </h3>
              <button onClick={() => setShowExpressModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>📱 {t.enterPhone}</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="10-Digit Mobile Number"
                  value={expressData.phone}
                  onChange={e => setExpressData({ ...expressData, phone: e.target.value })}
                  style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
                <button onClick={handleSendOtp} style={{ backgroundColor: "#0f172a", color: "white", border: "none", padding: "0 16px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
                  Get OTP
                </button>
              </div>
            </div>

            {otpSent && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>🔑 {t.enterOtp}</label>
                <input
                  type="text"
                  placeholder="Default demo OTP: 1234"
                  value={expressData.otp}
                  onChange={e => setExpressData({ ...expressData, otp: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>👤 Patient Name (Optional)</label>
              <input
                type="text"
                placeholder="Guest Victim Name"
                value={expressData.name}
                onChange={e => setExpressData({ ...expressData, name: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>📍 Landmark / Location Details</label>
              <input
                type="text"
                placeholder="e.g. Near City Bus Stop"
                value={expressData.landmark}
                onChange={e => setExpressData({ ...expressData, landmark: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <button
              onClick={triggerExpressSOS}
              disabled={loading}
              style={{
                width: "100%",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                padding: "14px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(220,38,38,0.4)"
              }}
            >
              {loading ? "DISPATCHING..." : `🔴 ${t.verifyAndDispatch}`}
            </button>
          </div>
        </div>
      )}

      {/* Patient Profile View & Safe Editing Modal */}
      {showProfileModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", width: "100%", maxWidth: "520px", borderRadius: "20px", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", position: "relative" }}>
            <button
              onClick={() => setShowProfileModal(false)}
              style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
            >
              <X size={24} />
            </button>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#2563eb", color: "white", width: "56px", height: "56px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800, margin: "0 auto 10px auto", boxShadow: "0 6px 16px rgba(37,99,235,0.3)" }}>
                👤
              </div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "20px", fontWeight: 800 }}>Patient Medical Profile</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>Update your emergency clinical details for hospital ER staff.</p>
            </div>

            <form onSubmit={handleUpdateProfile} style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>👤 Full Patient Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>📱 Phone Number</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>🩸 Blood Group</label>
                  <select
                    value={profileForm.bloodGroup}
                    onChange={e => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "white", fontWeight: 700 }}
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>📞 Emergency Contact Phone</label>
                <input
                  type="text"
                  placeholder="Relative / Kin Contact Phone"
                  value={profileForm.emergencyContact}
                  onChange={e => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ backgroundColor: "#eff6ff", padding: "12px", borderRadius: "10px", border: "1px solid #bfdbfe", fontSize: "12px", color: "#1e40af" }}>
                🛡️ <strong>Clinical Privacy Guarantee:</strong> Your blood group and emergency contact are securely transmitted to the target Hospital ER upon dispatch for instant blood matching & emergency prep.
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, backgroundColor: "#2563eb", color: "white", border: "none", padding: "12px", borderRadius: "10px", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}
                >
                  {loading ? "Saving..." : "💾 Save Profile Details"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "12px 18px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}