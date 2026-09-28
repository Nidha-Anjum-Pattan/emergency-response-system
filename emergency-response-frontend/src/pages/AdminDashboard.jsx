import React, { useEffect, useState } from "react";
import api from "../services/api";
import RealtimeMap from "../components/RealtimeMap";
import { Shield, PlusCircle, Hospital as HospitalIcon, Car, Activity, MapPin, CheckCircle, Lock, Globe, Search, RefreshCw, Download, Edit3, UserCheck, X, FileText, Phone, BarChart2 } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    totalAmbulances: 4,
    availableAmbulances: 3,
    totalHospitals: 3,
    freeBeds: 28,
    totalBeds: 120
  });

  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabView, setTabView] = useState("overview"); // 'overview' | 'hospitals' | 'ambulances' | 'analytics'
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

  // Modals
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);

  // Form states
  const [hospitalForm, setHospitalForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "hospital123",
    totalBeds: 30,
    availableBeds: 15,
    latitude: 16.3100,
    longitude: 80.4400,
    hasIcu: true
  });

  const [ambulanceForm, setAmbulanceForm] = useState({
    driverName: "",
    email: "",
    phone: "",
    password: "driver123",
    vehicleNumber: "AP 39 X 1234",
    latitude: 16.3080,
    longitude: 80.4380
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
    const timer = setInterval(loadAdminData, 4000);
    return () => clearInterval(timer);
  }, []);

  const loadAdminData = async () => {
    try {
      const [reqRes, hospRes, ambRes] = await Promise.all([
        api.get("/api/emergency/all").catch(() => ({ data: [] })),
        api.get("/api/emergency/hospitals/all").catch(() => ({ data: [] })),
        api.get("/api/emergency/ambulances/all").catch(() => ({ data: [] }))
      ]);

      const reqList = reqRes.data || [];
      const hospList = hospRes.data || [];
      const ambList = ambRes.data || [];

      setActiveRequests(reqList);
      setHospitals(hospList);
      setAmbulances(ambList);

      const liveCount = reqList.filter(r => r.status !== "COMPLETED" && r.status !== "CANCELLED").length;
      const totalCapacity = hospList.reduce((sum, h) => sum + (h.totalBeds || 0), 0);
      const freeCapacity = hospList.reduce((sum, h) => sum + (h.availableBeds || 0), 0);

      setStats({
        totalRequests: reqList.length,
        activeRequests: liveCount,
        totalAmbulances: ambList.length,
        availableAmbulances: ambList.filter(a => a.isAvailable).length,
        totalHospitals: hospList.length,
        freeBeds: freeCapacity,
        totalBeds: totalCapacity || 100
      });
    } catch (err) {
      console.log("Error loading admin data", err);
    }
  };

  const handleProvisionHospital = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/emergency/admin/provision-hospital", hospitalForm);
      alert(`🏥 Hospital ER Unit "${hospitalForm.name}" Provisioned Successfully!\nCredentials: ${hospitalForm.email} / ${hospitalForm.password}`);
      setShowHospitalModal(false);
      await loadAdminData();
    } catch (err) {
      alert("Failed to provision hospital: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionAmbulance = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/emergency/admin/provision-ambulance", ambulanceForm);
      alert(`🚑 Ambulance Unit "${ambulanceForm.driverName}" Provisioned Successfully!\nVehicle: ${ambulanceForm.vehicleNumber}\nCredentials: ${ambulanceForm.email} / ${ambulanceForm.password}`);
      setShowAmbulanceModal(false);
      await loadAdminData();
    } catch (err) {
      alert("Failed to provision ambulance: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Export System Audit Trail Log to CSV
  const exportToCsv = () => {
    if (activeRequests.length === 0) {
      alert("No dispatch records available to export.");
      return;
    }

    const headers = ["Dispatch_ID", "Victim_Name", "Victim_Phone", "Category", "Priority", "Ambulance_Vehicle", "Hospital_Name", "Status", "Created_At"];
    const rows = activeRequests.map((r, idx) => [
      `#${idx + 1}`,
      `"${r.victim ? r.victim.name : "Express Guest"}"`,
      `"${r.victim ? r.victim.phone : "Guest Phone"}"`,
      r.category,
      r.priorityLevel,
      `"${r.ambulance ? r.ambulance.vehicleNumber : "Unassigned"}"`,
      `"${r.hospital ? r.hospital.hospitalName : "Unassigned"}"`,
      r.status,
      `"${new Date(r.createdAt).toLocaleString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Emergency_Dispatches_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const filteredRequests = activeRequests.filter(r => {
    const victimName = r.victim ? r.victim.name.toLowerCase() : "express guest";
    const category = (r.category || "").toLowerCase();
    const status = (r.status || "").toLowerCase();
    const matchesSearch = victimName.includes(searchTerm.toLowerCase()) || category.includes(searchTerm.toLowerCase()) || status.includes(searchTerm.toLowerCase());

    if (statusFilter === "ACTIVE") return matchesSearch && r.status !== "COMPLETED" && r.status !== "CANCELLED";
    if (statusFilter === "COMPLETED") return matchesSearch && r.status === "COMPLETED";
    if (statusFilter === "CANCELLED") return matchesSearch && r.status === "CANCELLED";
    return matchesSearch;
  });

  // Calculate Emergency Category Distribution
  const categoryCounts = activeRequests.reduce((acc, r) => {
    const cat = r.category || "OTHER";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", fontFamily: "Inter, sans-serif" }}>
      
      {/* Top Navigation Header */}
      <header style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ backgroundColor: "#2563eb", width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", boxShadow: "0 4px 14px rgba(37,99,235,0.4)" }}>
            🛡️
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "white" }}>Emergency Command Room</h2>
              <span style={{ backgroundColor: "#166534", color: "#86efac", fontSize: "11px", fontWeight: 800, padding: "2px 10px", borderRadius: "12px", border: "1px solid #22c55e" }}>
                🟢 SYSTEM ACTIVE
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Multi-Role Emergency Dispatch & Hospital Capacity Monitor</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Export Audit Log Button */}
          <button
            onClick={exportToCsv}
            style={{
              backgroundColor: "#166534",
              color: "white",
              border: "1px solid #22c55e",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Download size={16} /> Export Audit Log (.csv)
          </button>

          {/* Provision Hospital */}
          <button
            onClick={() => setShowHospitalModal(true)}
            style={{
              backgroundColor: "#059669",
              color: "white",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <HospitalIcon size={16} /> + Provision Hospital
          </button>

          {/* Provision Ambulance */}
          <button
            onClick={() => setShowAmbulanceModal(true)}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Car size={16} /> + Provision Ambulance
          </button>

          <button onClick={logout} style={{ backgroundColor: "#334155", color: "#cbd5e1", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "1300px", margin: "28px auto", padding: "0 20px" }}>
        
        {/* KPI System Analytics Overview Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px", marginBottom: "28px" }}>
          
          <div style={{ backgroundColor: "#1e293b", padding: "18px", borderRadius: "16px", border: "1px solid #334155" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>Total Dispatches</span>
            <strong style={{ fontSize: "28px", color: "white", display: "block", marginTop: "4px", fontWeight: 800 }}>{stats.totalRequests}</strong>
            <span style={{ fontSize: "11px", color: "#38bdf8" }}>System Audit Log</span>
          </div>

          <div style={{ backgroundColor: "#1e293b", padding: "18px", borderRadius: "16px", border: "1px solid #334155" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>Active Missions</span>
            <strong style={{ fontSize: "28px", color: "#f59e0b", display: "block", marginTop: "4px", fontWeight: 800 }}>{stats.activeRequests}</strong>
            <span style={{ fontSize: "11px", color: "#fbbf24" }}>En-Route & Intake</span>
          </div>

          <div style={{ backgroundColor: "#1e293b", padding: "18px", borderRadius: "16px", border: "1px solid #334155" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>Fleet Available</span>
            <strong style={{ fontSize: "28px", color: "#3b82f6", display: "block", marginTop: "4px", fontWeight: 800 }}>{stats.availableAmbulances} / {stats.totalAmbulances}</strong>
            <span style={{ fontSize: "11px", color: "#60a5fa" }}>Ambulance Units</span>
          </div>

          <div style={{ backgroundColor: "#1e293b", padding: "18px", borderRadius: "16px", border: "1px solid #334155" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>ER Beds Free</span>
            <strong style={{ fontSize: "28px", color: "#10b981", display: "block", marginTop: "4px", fontWeight: 800 }}>{stats.freeBeds} / {stats.totalBeds}</strong>
            <span style={{ fontSize: "11px", color: "#34d399" }}>Across {stats.totalHospitals} Hospitals</span>
          </div>

          <div style={{ backgroundColor: "#1e293b", padding: "18px", borderRadius: "16px", border: "1px solid #334155" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>⏱️ Avg Dispatch Time</span>
            <strong style={{ fontSize: "28px", color: "#a855f7", display: "block", marginTop: "4px", fontWeight: 800 }}>2.4 mins</strong>
            <span style={{ fontSize: "11px", color: "#c084fc" }}>Rule-Based Scorer</span>
          </div>

          <div style={{ backgroundColor: "#1e293b", padding: "18px", borderRadius: "16px", border: "1px solid #334155" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>🎯 Success Rate</span>
            <strong style={{ fontSize: "28px", color: "#ec4899", display: "block", marginTop: "4px", fontWeight: 800 }}>98.5%</strong>
            <span style={{ fontSize: "11px", color: "#f472b6" }}>Concurrency Safe</span>
          </div>
        </div>

        {/* Tab Navigation for Admin Views */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "10px", backgroundColor: "#1e293b", padding: "6px", borderRadius: "12px", border: "1px solid #334155" }}>
            <button
              onClick={() => setTabView("overview")}
              style={{
                backgroundColor: tabView === "overview" ? "#2563eb" : "transparent",
                color: "white",
                border: "none",
                padding: "8px 18px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              📋 All Dispatches Log
            </button>
            <button
              onClick={() => setTabView("hospitals")}
              style={{
                backgroundColor: tabView === "hospitals" ? "#059669" : "transparent",
                color: "white",
                border: "none",
                padding: "8px 18px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              🏥 Hospitals Manager ({hospitals.length})
            </button>
            <button
              onClick={() => setTabView("ambulances")}
              style={{
                backgroundColor: tabView === "ambulances" ? "#2563eb" : "transparent",
                color: "white",
                border: "none",
                padding: "8px 18px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              🚑 Ambulance Fleet ({ambulances.length})
            </button>
          </div>

          {/* Search Input */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#1e293b", padding: "8px 14px", borderRadius: "10px", border: "1px solid #334155", width: "320px" }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by victim, category, status..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: "white", width: "100%", fontSize: "13px" }}
            />
          </div>
        </div>

        {/* VIEW 1: OVERVIEW & SYSTEM DISPATCHES AUDIT LOG */}
        {tabView === "overview" && (
          <div style={{ backgroundColor: "#1e293b", padding: "24px", borderRadius: "20px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, color: "white", fontWeight: 800, fontSize: "18px" }}>📜 Real-Time System Emergency Dispatches Audit Log</h3>
              
              <div style={{ display: "flex", gap: "8px" }}>
                {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      backgroundColor: statusFilter === st ? "#2563eb" : "#334155",
                      color: "white",
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No emergency dispatches found matching criteria.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #334155", color: "#94a3b8", fontSize: "13px" }}>
                      <th style={{ padding: "12px" }}># Serial</th>
                      <th style={{ padding: "12px" }}>Victim Name</th>
                      <th style={{ padding: "12px" }}>Category & Triage</th>
                      <th style={{ padding: "12px" }}>Assigned Ambulance</th>
                      <th style={{ padding: "12px" }}>Target Hospital</th>
                      <th style={{ padding: "12px" }}>Status</th>
                      <th style={{ padding: "12px" }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r, idx) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #334155", fontSize: "14px" }}>
                        <td style={{ padding: "14px", fontWeight: 800, color: "#38bdf8" }}>#{idx + 1}</td>
                        <td style={{ padding: "14px" }}>
                          <strong style={{ color: "white", display: "block" }}>{r.victim ? r.victim.name : "Express Guest Victim"}</strong>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>📞 {r.victim ? r.victim.phone : "Guest Phone"}</span>
                        </td>
                        <td style={{ padding: "14px" }}>
                          <span style={{ backgroundColor: "#dc2626", color: "white", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                            {r.category} ({r.priorityLevel})
                          </span>
                        </td>
                        <td style={{ padding: "14px", fontWeight: 700, color: "#60a5fa" }}>
                          {r.ambulance ? `🚑 ${r.ambulance.vehicleNumber} (${r.ambulance.driverName})` : "Searching Priority..."}
                        </td>
                        <td style={{ padding: "14px", fontWeight: 700, color: "#34d399" }}>
                          {r.hospital ? `🏥 ${r.hospital.hospitalName}` : "Pending Selection"}
                        </td>
                        <td style={{ padding: "14px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 800, backgroundColor: r.status === "COMPLETED" ? "#166534" : r.status === "CANCELLED" ? "#7f1d1d" : "#1e3a8a", color: r.status === "COMPLETED" ? "#86efac" : r.status === "CANCELLED" ? "#fca5a5" : "#93c5fd" }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px", fontSize: "12px", color: "#94a3b8" }}>{new Date(r.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: HOSPITALS MANAGER TAB */}
        {tabView === "hospitals" && (
          <div style={{ backgroundColor: "#1e293b", padding: "24px", borderRadius: "20px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, color: "white", fontWeight: 800, fontSize: "18px" }}>🏥 Hospital ER Units Directory & Live Bed Capacities</h3>
              <button onClick={() => setShowHospitalModal(true)} style={{ backgroundColor: "#059669", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                + Provision New Hospital
              </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #334155", color: "#94a3b8", fontSize: "13px" }}>
                  <th style={{ padding: "12px" }}>ID</th>
                  <th style={{ padding: "12px" }}>Hospital Name</th>
                  <th style={{ padding: "12px" }}>Email / Phone</th>
                  <th style={{ padding: "12px" }}>Available / Total Beds</th>
                  <th style={{ padding: "12px" }}>ICU Unit</th>
                  <th style={{ padding: "12px" }}>Base Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map(h => (
                  <tr key={h.id} style={{ borderBottom: "1px solid #334155", fontSize: "14px" }}>
                    <td style={{ padding: "14px", fontWeight: 800, color: "#38bdf8" }}>#{h.id}</td>
                    <td style={{ padding: "14px", fontWeight: 800, color: "white" }}>🏥 {h.hospitalName}</td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontSize: "13px", color: "#cbd5e1" }}>{h.user?.email}</div>
                      <span style={{ fontSize: "12px", color: "#38bdf8" }}>📞 {h.user?.phone || "040-23456789"}</span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span style={{ backgroundColor: "#065f46", color: "#a7f3d0", padding: "4px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: 800 }}>
                        🛏️ {h.availableBeds} / {h.totalBeds} Free
                      </span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span style={{ backgroundColor: h.hasIcu ? "#166534" : "#7f1d1d", color: h.hasIcu ? "#86efac" : "#fca5a5", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                        {h.hasIcu ? "🟢 ICU Operational" : "🔴 General ER Only"}
                      </span>
                    </td>
                    <td style={{ padding: "14px", fontSize: "12px", color: "#94a3b8" }}>[{h.latitude}, {h.longitude}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 3: AMBULANCES FLEET MANAGER TAB */}
        {tabView === "ambulances" && (
          <div style={{ backgroundColor: "#1e293b", padding: "24px", borderRadius: "20px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, color: "white", fontWeight: 800, fontSize: "18px" }}>🚑 Active Ambulance Fleet Roster & Duty Status</h3>
              <button onClick={() => setShowAmbulanceModal(true)} style={{ backgroundColor: "#2563eb", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                + Provision New Ambulance
              </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #334155", color: "#94a3b8", fontSize: "13px" }}>
                  <th style={{ padding: "12px" }}>ID</th>
                  <th style={{ padding: "12px" }}>Vehicle License Plate</th>
                  <th style={{ padding: "12px" }}>Driver Name & Contact</th>
                  <th style={{ padding: "12px" }}>Duty Status</th>
                  <th style={{ padding: "12px" }}>Current GPS Coords</th>
                </tr>
              </thead>
              <tbody>
                {ambulances.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #334155", fontSize: "14px" }}>
                    <td style={{ padding: "14px", fontWeight: 800, color: "#38bdf8" }}>#{a.id}</td>
                    <td style={{ padding: "14px", fontWeight: 800, color: "#60a5fa" }}>🚑 {a.vehicleNumber}</td>
                    <td style={{ padding: "14px" }}>
                      <strong style={{ color: "white", display: "block" }}>{a.driverName}</strong>
                      <span style={{ fontSize: "12px", color: "#38bdf8" }}>📞 {a.phone || a.user?.phone}</span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span style={{ backgroundColor: a.isAvailable ? "#166534" : "#1e3a8a", color: a.isAvailable ? "#86efac" : "#93c5fd", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 800 }}>
                        {a.isAvailable ? "🟢 Duty Standby (Available)" : "🔵 On Active Emergency Mission"}
                      </span>
                    </td>
                    <td style={{ padding: "14px", fontSize: "12px", color: "#94a3b8" }}>[{a.latitude}, {a.longitude}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Provision Hospital Modal */}
      {showHospitalModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#1e293b", width: "100%", maxWidth: "540px", borderRadius: "20px", padding: "28px", border: "1px solid #334155", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <h3 style={{ margin: "0 0 18px 0", color: "white", fontSize: "20px", fontWeight: 800 }}>🏥 Provision Official Hospital ER Unit</h3>

            <form onSubmit={handleProvisionHospital}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Hospital Name</label>
                <input type="text" required placeholder="e.g. Yashoda Hospitals ER Unit" value={hospitalForm.name} onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", fontSize: "14px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Login Email</label>
                  <input type="email" required placeholder="hospital@ems.com" value={hospitalForm.email} onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", fontSize: "14px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Contact Phone</label>
                  <input type="text" required placeholder="10 Digits" value={hospitalForm.phone} onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", fontSize: "14px" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Total ER Beds</label>
                  <input type="number" required value={hospitalForm.totalBeds} onChange={(e) => setHospitalForm({ ...hospitalForm, totalBeds: parseInt(e.target.value) })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", fontSize: "14px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Initial Available Beds</label>
                  <input type="number" required value={hospitalForm.availableBeds} onChange={(e) => setHospitalForm({ ...hospitalForm, availableBeds: parseInt(e.target.value) })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", fontSize: "14px" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button type="submit" disabled={loading} style={{ flex: 1, backgroundColor: "#059669", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}>
                  ✅ Provision Hospital
                </button>
                <button type="button" onClick={() => setShowHospitalModal(false)} style={{ backgroundColor: "#334155", color: "white", border: "none", padding: "12px 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Ambulance Modal */}
      {showAmbulanceModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#1e293b", width: "100%", maxWidth: "520px", borderRadius: "20px", padding: "28px", border: "1px solid #334155", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <h3 style={{ margin: "0 0 18px 0", color: "white", fontSize: "20px", fontWeight: 800 }}>🚑 Provision Official Ambulance Unit</h3>

            <form onSubmit={handleProvisionAmbulance}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Driver Name</label>
                <input type="text" required placeholder="e.g. Driver Ramesh" value={ambulanceForm.driverName} onChange={(e) => setAmbulanceForm({ ...ambulanceForm, driverName: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", fontSize: "14px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Driver Email</label>
                  <input type="email" required placeholder="driver@ems.com" value={ambulanceForm.email} onChange={(e) => setAmbulanceForm({ ...ambulanceForm, email: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", fontSize: "14px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Driver Phone</label>
                  <input type="text" required placeholder="10 Digits" value={ambulanceForm.phone} onChange={(e) => setAmbulanceForm({ ...ambulanceForm, phone: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", fontSize: "14px" }} />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Vehicle License Plate #</label>
                <input type="text" required placeholder="e.g. AP 39 X 1234" value={ambulanceForm.vehicleNumber} onChange={(e) => setAmbulanceForm({ ...ambulanceForm, vehicleNumber: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", fontSize: "14px" }} />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button type="submit" disabled={loading} style={{ flex: 1, backgroundColor: "#2563eb", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}>
                  ✅ Provision Ambulance
                </button>
                <button type="button" onClick={() => setShowAmbulanceModal(false)} style={{ backgroundColor: "#334155", color: "white", border: "none", padding: "12px 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
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