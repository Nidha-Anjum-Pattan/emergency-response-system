import React, { useEffect, useState } from "react";
import api from "../services/api";
import { translations } from "../utils/i18n";
import RealtimeMap from "../components/RealtimeMap";
import { Phone, Navigation, MapPin, CheckCircle, XCircle, Globe, Shield, Clock, Hospital as HospitalIcon, AlertTriangle, Activity, User, Heart, ChevronRight, History, X, BadgeCheck } from "lucide-react";

export default function AmbulanceDashboard() {
  const [lang, setLang] = useState(localStorage.getItem("app_lang") || "en");
  const t = translations[lang] || translations.en;

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const [user, setUser] = useState(null);
  const [ambulance, setAmbulance] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [topHospitals, setTopHospitals] = useState([]);
  const [history, setHistory] = useState([]);
  const [onDuty, setOnDuty] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dispatch"); // 'dispatch' | 'history'
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [broadcastList, setBroadcastList] = useState([]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadAmbulanceAndTasks();
      const timer = setInterval(loadAmbulanceAndTasks, 3500);
      return () => clearInterval(timer);
    }
  }, [user]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const res = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      }
    } catch (err) {
      console.log("Error loading driver user", err);
    }
  };

  const loadAmbulanceAndTasks = async () => {
    if (!user?.id) return;
    try {
      const ambRes = await api.get(`/api/emergency/ambulance/${user.id}`);
      const requestsList = ambRes.data || [];
      const completedTrips = requestsList.filter(r => r.status === "COMPLETED");
      setHistory(completedTrips);

      const active = requestsList.find(r => r.status !== "COMPLETED" && r.status !== "CANCELLED" && r.status !== "SEARCHING_AMBULANCE");
      setActiveTask(active || null);
      if (active?.ambulance) setAmbulance(active.ambulance);

      if (active && (active.status === "ARRIVED_AT_VICTIM" || active.status === "HOSPITAL_SELECTED")) {
        loadTopHospitals(active.id);
      }

      // Load Broadcast Stream for Top 3 Proximity Notifications
      const broadRes = await api.get(`/api/emergency/ambulance/broadcast/${user.id}`).catch(() => ({ data: [] }));
      setBroadcastList(broadRes.data || []);
    } catch (err) {
      console.log("Error loading ambulance tasks", err);
    }
  };

  const loadTopHospitals = async (requestId) => {
    try {
      const res = await api.get(`/api/emergency/hospitals/top3/${requestId}`);
      setTopHospitals(res.data || []);
    } catch (err) {
      console.log("Error loading top hospitals", err);
    }
  };

  const acceptTask = async (reqId) => {
    setLoading(true);
    try {
      await api.put(`/api/emergency/ambulance/accept/${reqId}/${user?.id || 1}`);
      alert("🚀 Emergency Task Claimed & Accepted! Navigation route activated.");
      loadAmbulanceAndTasks();
    } catch (err) {
      alert("Claim Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const declineTask = async (reqId) => {
    if (!window.confirm("Decline/Cancel this SOS request? It will re-assign to the next nearest driver.")) return;
    setLoading(true);
    try {
      await api.put(`/api/emergency/ambulance/cancel/${reqId}/${user?.id || 1}`);
      setActiveTask(null);
      alert("Task declined. Request forwarded to next nearest ambulance unit.");
      loadAmbulanceAndTasks();
    } catch (err) {
      alert("Error declining task: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const markArrived = async (reqId) => {
    try {
      await api.put(`/api/emergency/ambulance/arrived/${reqId}`);
      alert("Marked Arrived at Victim Site! Top 3 Hospitals Matrix loaded below.");
      loadAmbulanceAndTasks();
    } catch (err) {
      alert("Failed to mark arrival");
    }
  };

  const selectHospital = async (reqId, hospitalId) => {
    setLoading(true);
    try {
      await api.put(`/api/emergency/ambulance/select-hospital/${reqId}/${hospitalId}`);
      alert("Hospital Selected! Pre-Arrival Alert Broadcast sent to Hospital ER Bay.");
      loadAmbulanceAndTasks();
    } catch (err) {
      alert("Failed to select hospital: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const completeHandover = async (reqId) => {
    try {
      await api.put(`/api/emergency/ambulance/completed/${reqId}`);
      setActiveTask(null);
      alert("Patient Handover Completed! Ambulance unit is now free for new emergency dispatches.");
      loadAmbulanceAndTasks();
    } catch (err) {
      alert("Failed to complete handover");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "Inter, sans-serif" }}>
      
      {/* Light Theme Header Bar */}
      <header style={{ backgroundColor: "white", borderBottom: "1px solid #e2e8f0", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ backgroundColor: "#2563eb", width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: "white", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>🚑</div>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a", fontWeight: 800 }}>{t.ambulanceDashboard}</h2>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Driver Unit: {user ? user.name : "Ramesh Kumar (AP 39 X 1234)"}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Duty Switch */}
          <button
            onClick={() => setOnDuty(!onDuty)}
            style={{
              backgroundColor: onDuty ? "#dcfce7" : "#fef2f2",
              color: onDuty ? "#15803d" : "#dc2626",
              border: onDuty ? "1px solid #86efac" : "1px solid #fca5a5",
              padding: "8px 18px",
              borderRadius: "20px",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: onDuty ? "0 2px 8px rgba(22,163,74,0.15)" : "none"
            }}
          >
            ● {onDuty ? t.onDuty : t.offDuty}
          </button>

          {/* Driver Profile Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              padding: "8px 14px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
              color: "#0f172a",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ backgroundColor: "#2563eb", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800 }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "D"}
            </div>
            <span style={{ fontSize: "13px" }}>Driver Profile</span>
          </button>

          {/* Language Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#f1f5f9", padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
            <Globe size={18} color="#475569" />
            <select value={lang} onChange={(e) => handleLangChange(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
              <option value="en">🇬🇧 English</option>
              <option value="te">🇮🇳 తెలుగు</option>
              <option value="hi">🇮🇳 हिंदी</option>
              <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
            </select>
          </div>

          <button onClick={logout} style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
            {t.logout}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ maxWidth: "1200px", margin: "32px auto", padding: "0 20px" }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={() => setActiveTab("dispatch")}
            style={{
              backgroundColor: activeTab === "dispatch" ? "#2563eb" : "white",
              color: activeTab === "dispatch" ? "white" : "#475569",
              border: activeTab === "dispatch" ? "none" : "1px solid #cbd5e1",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            🚨 Live Dispatch Console {activeTask && <span style={{ backgroundColor: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>ACTIVE MISSION</span>}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            style={{
              backgroundColor: activeTab === "history" ? "#2563eb" : "white",
              color: activeTab === "history" ? "white" : "#475569",
              border: activeTab === "history" ? "none" : "1px solid #cbd5e1",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <History size={16} /> Completed Trip Log ({history.length})
          </button>
        </div>

        {activeTab === "dispatch" ? (
          <>
            {/* Active Emergency Dispatch Task Card */}
            {activeTask ? (
              <div style={{ backgroundColor: "white", padding: "28px", borderRadius: "20px", marginBottom: "32px", border: "2px solid #3b82f6", boxShadow: "0 10px 30px rgba(59,130,246,0.12)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
                  <div>
                    <span style={{ backgroundColor: activeTask.priorityLevel === "CRITICAL" ? "#ef4444" : "#f59e0b", color: "white", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 800 }}>
                      🚨 {activeTask.priorityLevel} PRIORITY ({activeTask.category})
                    </span>
                    <h3 style={{ margin: "10px 0 0 0", color: "#0f172a", fontSize: "22px", fontWeight: 800 }}>
                      {t.requestNo} #{activeTask.id} — Emergency SOS
                    </h3>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#2563eb", backgroundColor: "#eff6ff", padding: "6px 14px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                      Status: {activeTask.status}
                    </span>
                  </div>
                </div>

                {/* Victim details card */}
                <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "14px", marginBottom: "24px", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: "20px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, display: "block" }}>👤 {t.victimDetails}</span>
                    <strong style={{ fontSize: "16px", color: "#0f172a", display: "block", marginTop: "2px" }}>{activeTask.victim ? activeTask.victim.name : "Express Guest Victim"}</strong>
                    <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "#2563eb", fontWeight: 700, fontSize: "14px" }}>📞 {activeTask.victim ? activeTask.victim.phone : "9876543210"}</span>
                      {activeTask.victim?.bloodGroup && <span style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 800 }}>🩸 {activeTask.victim.bloodGroup}</span>}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, display: "block" }}>📍 {t.landmarkCoords}</span>
                    <strong style={{ fontSize: "15px", color: "#334155", display: "block", marginTop: "2px" }}>{activeTask.landmark || "GPS Location Broadcast"}</strong>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>Coords: [{activeTask.latitude}, {activeTask.longitude}]</p>
                  </div>

                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, display: "block" }}>📋 {t.details}</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>{activeTask.description || "Medical Emergency SOS Broadcast"}</p>
                  </div>
                </div>

                {/* Realtime Interactive Navigation Map */}
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#334155", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                    🗺️ {t.realtimeMap}
                  </h4>
                  <RealtimeMap
                    victimPos={[activeTask.latitude, activeTask.longitude]}
                    ambulancePos={[16.3080, 80.4380]}
                    hospitalPos={activeTask.hospital ? [activeTask.hospital.latitude, activeTask.hospital.longitude] : null}
                    height="380px"
                  />
                </div>

                {/* Workflow Control Action Buttons */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                  {(activeTask.status === "AMBULANCE_ASSIGNED" || activeTask.status === "SEARCHING_AMBULANCE") && (
                    <>
                      <button onClick={() => acceptTask(activeTask.id)} disabled={loading} style={{ flex: 1, backgroundColor: "#2563eb", color: "white", border: "none", padding: "16px", borderRadius: "12px", fontWeight: 800, fontSize: "16px", cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
                        🚀 {t.acceptTask}
                      </button>
                      <button onClick={() => declineTask(activeTask.id)} disabled={loading} style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", padding: "16px 28px", borderRadius: "12px", fontWeight: 800, cursor: "pointer" }}>
                        ❌ {t.declineTask}
                      </button>
                    </>
                  )}

                  {activeTask.status === "ENROUTE_TO_VICTIM" && (
                    <button onClick={() => markArrived(activeTask.id)} style={{ flex: 1, backgroundColor: "#16a34a", color: "white", border: "none", padding: "16px", borderRadius: "12px", fontWeight: 800, fontSize: "16px", cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}>
                      📍 {t.arrivedVictim}
                    </button>
                  )}

                  {(activeTask.status === "ARRIVED_AT_VICTIM" || activeTask.status === "HOSPITAL_SELECTED") && (
                    <div style={{ flex: 1 }}>
                      {!activeTask.hospital ? (
                        <button disabled style={{ width: "100%", backgroundColor: "#cbd5e1", color: "#475569", border: "none", padding: "16px", borderRadius: "12px", fontWeight: 800, fontSize: "15px", cursor: "not-allowed" }}>
                          🔒 Select Target Hospital Below First
                        </button>
                      ) : (
                        <button onClick={() => completeHandover(activeTask.id)} style={{ width: "100%", backgroundColor: "#059669", color: "white", border: "none", padding: "16px", borderRadius: "12px", fontWeight: 800, fontSize: "16px", cursor: "pointer", boxShadow: "0 4px 14px rgba(5,150,105,0.3)" }}>
                          ✅ {t.completeHandover}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Top 3 Hospitals Matrix Card with 3-Min Delta Rule */}
                {(activeTask.status === "ARRIVED_AT_VICTIM" || activeTask.status === "HOSPITAL_SELECTED") && (
                  <div style={{ backgroundColor: "#f0fdf4", padding: "24px", borderRadius: "16px", border: "2px solid #86efac" }}>
                    <h4 style={{ margin: "0 0 16px 0", color: "#166534", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 800 }}>
                      🏥 {t.topHospitals}
                    </h4>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                      {topHospitals.map(h => {
                        const isSelected = activeTask.hospital && activeTask.hospital.id === h.id;
                        return (
                          <div key={h.id} style={{ backgroundColor: "white", padding: "18px", borderRadius: "14px", border: isSelected ? "2px solid #16a34a" : "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ backgroundColor: h.rank === 1 ? "#dcfce7" : "#fe8a04", color: h.rank === 1 ? "#15803d" : "#9a3412", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                                {h.rank === 1 ? t.firstNearest : h.rank === 2 ? t.secondNearest : t.thirdNearest}
                              </span>
                              <span style={{ fontSize: "13px", fontWeight: 800, color: "#16a34a" }}>🛏️ {h.availableBeds} {t.freeBeds}</span>
                            </div>

                            <strong style={{ fontSize: "16px", color: "#0f172a", display: "block", marginBottom: "4px" }}>{h.hospitalName}</strong>
                            <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748b" }}>Distance: <strong>{h.distanceKm} km</strong> | ETA: <strong>{h.etaMinutes} mins</strong></p>

                            {isSelected ? (
                              <div style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 800, textAlign: "center" }}>
                                {t.hospitalAlertSent}
                              </div>
                            ) : (
                              <button
                                onClick={() => selectHospital(activeTask.id, h.id)}
                                disabled={!h.buttonEnabled}
                                style={{
                                  width: "100%",
                                  backgroundColor: h.buttonEnabled ? "#16a34a" : "#cbd5e1",
                                  color: "white",
                                  border: "none",
                                  padding: "12px",
                                  borderRadius: "8px",
                                  fontWeight: 800,
                                  fontSize: "13px",
                                  cursor: h.buttonEnabled ? "pointer" : "not-allowed"
                                }}
                              >
                                {h.buttonEnabled ? `🏥 ${t.selectHospital}` : h.reason}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Idle Driver Broadcast Stream (Model 1 Top 3 Proximity Notifications) */
              <div>
                <div style={{ backgroundColor: "#eff6ff", padding: "20px 24px", borderRadius: "16px", marginBottom: "24px", border: "1px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#1e40af", fontWeight: 800 }}>🚨 Live Emergency Broadcast Stream (Top 3 Proximity Units)</h3>
                    <p style={{ margin: "4px 0 0 0", color: "#3b82f6", fontSize: "13px", fontWeight: 600 }}>Broadcast notifications ranked by priority & distance. 3-Minute Proximity Delta Rule & 1-Min Unlock Timer enforced.</p>
                  </div>
                  <span style={{ backgroundColor: "#2563eb", color: "white", padding: "6px 14px", borderRadius: "20px", fontWeight: 800, fontSize: "13px" }}>
                    {broadcastList.length} Active SOS Alerts
                  </span>
                </div>

                {broadcastList.length === 0 ? (
                  <div style={{ backgroundColor: "white", padding: "50px", borderRadius: "20px", textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: "56px", marginBottom: "16px" }}>🚑</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "22px", fontWeight: 800 }}>{t.idleDriverTitle}</h3>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>{t.idleDriverSub}</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "20px" }}>
                    {broadcastList.map(req => (
                      <div key={req.id} style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", border: req.priorityLevel === "CRITICAL" ? "2px solid #ef4444" : "1px solid #e2e8f0", boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ backgroundColor: req.priorityLevel === "CRITICAL" ? "#dc2626" : "#d97706", color: "white", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 800 }}>
                              🚨 {req.priorityLevel} PRIORITY ({req.category})
                            </span>
                            <span style={{ backgroundColor: req.rank === 1 ? "#dcfce7" : req.rank === 2 ? "#fe8a04" : "#f1f5f9", color: req.rank === 1 ? "#15803d" : req.rank === 2 ? "#9a3412" : "#64748b", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 800 }}>
                              {req.rank === 1 ? "🥇 1st Nearest Unit" : req.rank === 2 ? "🥈 2nd Nearest Unit" : "🥉 3rd Nearest Unit"}
                            </span>
                          </div>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "#2563eb" }}>
                            Distance: {req.distanceKm} km | ETA: ~{req.etaMinutes} mins
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "16px", alignItems: "center" }}>
                          <div>
                            <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "18px", fontWeight: 800 }}>
                              SOS Request #{req.id} — {req.victimName}
                            </h4>
                            <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>
                              📍 Location: <strong>{req.landmark || "GPS Coordinates"}</strong> | 📞 {req.victimPhone || "Guest Phone"}
                            </p>
                            <span style={{ fontSize: "12px", color: req.buttonEnabled ? "#16a34a" : "#dc2626", fontWeight: 700, marginTop: "6px", display: "block" }}>
                              {req.reason}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => acceptTask(req.id)}
                              disabled={!req.buttonEnabled || loading}
                              style={{
                                flex: 1,
                                backgroundColor: req.buttonEnabled ? "#2563eb" : "#cbd5e1",
                                color: "white",
                                border: "none",
                                padding: "12px 16px",
                                borderRadius: "10px",
                                fontWeight: 800,
                                fontSize: "13px",
                                cursor: req.buttonEnabled ? "pointer" : "not-allowed",
                                boxShadow: req.buttonEnabled ? "0 4px 12px rgba(37,99,235,0.3)" : "none"
                              }}
                            >
                              {req.buttonEnabled ? "🚀 ACCEPT SOS" : `🔒 Locked (${req.unlocksInSeconds}s)`}
                            </button>

                            <button
                              onClick={() => declineTask(req.id)}
                              disabled={loading}
                              style={{
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                border: "1px solid #fca5a5",
                                padding: "12px 14px",
                                borderRadius: "10px",
                                fontWeight: 800,
                                fontSize: "13px",
                                cursor: "pointer"
                              }}
                            >
                              ❌ Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Completed History Log Tab */
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px 0", color: "#0f172a" }}>📋 Completed Dispatch History</h3>
            {history.length === 0 ? (
              <p style={{ color: "#64748b" }}>No past emergency dispatches completed yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px" }}>Req ID</th>
                    <th style={{ padding: "12px" }}>Victim Name</th>
                    <th style={{ padding: "12px" }}>Category</th>
                    <th style={{ padding: "12px" }}>Priority</th>
                    <th style={{ padding: "12px" }}>Status</th>
                    <th style={{ padding: "12px" }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: 700 }}>#{r.id}</td>
                      <td style={{ padding: "12px" }}>{r.victim ? r.victim.name : "Express Guest"}</td>
                      <td style={{ padding: "12px" }}>{r.category}</td>
                      <td style={{ padding: "12px", fontWeight: 700, color: r.priorityLevel === "CRITICAL" ? "#dc2626" : "#d97706" }}>{r.priorityLevel}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 700 }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "#64748b" }}>{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      {/* Driver Profile Details Modal */}
      {showProfileModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", width: "100%", maxWidth: "520px", borderRadius: "20px", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", position: "relative" }}>
            <button
              onClick={() => setShowProfileModal(false)}
              style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
            >
              <X size={24} />
            </button>

            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ backgroundColor: "#2563eb", color: "white", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, margin: "0 auto 12px auto", boxShadow: "0 6px 16px rgba(37,99,235,0.3)" }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "D"}
              </div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "22px", fontWeight: 800 }}>{user?.name || "Ramesh Kumar"}</h3>
              <span style={{ fontSize: "13px", color: "#2563eb", fontWeight: 700, backgroundColor: "#eff6ff", padding: "4px 12px", borderRadius: "20px", display: "inline-block", marginTop: "6px" }}>
                🚑 Official Emergency Driver Unit
              </span>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "grid", gap: "14px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 600 }}>📧 Registered Email</span>
                <strong style={{ color: "#0f172a", fontSize: "13px" }}>{user?.email || "driver1@emergency.com"}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 600 }}>📱 Contact Phone</span>
                <strong style={{ color: "#2563eb", fontSize: "13px" }}>📞 {user?.phone || "9876543211"}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 600 }}>🚑 Vehicle Registration</span>
                <strong style={{ color: "#0f172a", fontSize: "14px", fontWeight: 800 }}>AP 39 X 1234</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 600 }}>🟢 Duty Status</span>
                <span style={{ backgroundColor: onDuty ? "#dcfce7" : "#fef2f2", color: onDuty ? "#15803d" : "#dc2626", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 800 }}>
                  {onDuty ? "ON DUTY (AVAILABLE)" : "OFF DUTY"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 600 }}>📍 Base GPS Coords</span>
                <strong style={{ color: "#475569", fontSize: "13px" }}>[16.3080, 80.4380]</strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#eff6ff", padding: "14px", borderRadius: "12px", textAlign: "center", border: "1px solid #bfdbfe" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#1e40af", display: "block" }}>{history.length}</span>
                <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 700 }}>Completed Trips</span>
              </div>
              <div style={{ backgroundColor: "#f0fdf4", padding: "14px", borderRadius: "12px", textAlign: "center", border: "1px solid #86efac" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#166534", display: "block" }}>100%</span>
                <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>Response Rating</span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              style={{ width: "100%", backgroundColor: "#2563eb", color: "white", border: "none", padding: "12px", borderRadius: "10px", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}
            >
              Close Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}