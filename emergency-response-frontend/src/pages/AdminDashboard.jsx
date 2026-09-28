import React, { useEffect, useState } from "react";
import api from "../services/api";
import RealtimeMap from "../components/RealtimeMap";
import { 
  Shield, 
  PlusCircle, 
  Hospital as HospitalIcon, 
  Car, 
  Activity, 
  MapPin, 
  CheckCircle, 
  Lock, 
  Globe, 
  Search, 
  RefreshCw, 
  Download, 
  Edit3, 
  UserCheck, 
  X, 
  FileText, 
  Phone, 
  BarChart2,
  BedDouble,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  SlidersHorizontal,
  TrendingUp,
  UserPlus
} from "lucide-react";

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
  const [tabView, setTabView] = useState("overview"); // 'overview' | 'hospitals' | 'ambulances'
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
      alert(`Hospital ER Unit "${hospitalForm.name}" Provisioned Successfully!\nCredentials: ${hospitalForm.email} / ${hospitalForm.password}`);
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
      alert(`Ambulance Unit "${ambulanceForm.driverName}" Provisioned Successfully!\nVehicle: ${ambulanceForm.vehicleNumber}\nCredentials: ${ambulanceForm.email} / ${ambulanceForm.password}`);
      setShowAmbulanceModal(false);
      await loadAdminData();
    } catch (err) {
      alert("Failed to provision ambulance: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fixed Export System Audit Trail Log to CSV using Blob
  const exportToCsv = () => {
    if (activeRequests.length === 0) {
      alert("No dispatch records available to export.");
      return;
    }

    const headers = [
      "Dispatch_ID", 
      "Victim_Name", 
      "Victim_Phone", 
      "Category", 
      "Priority", 
      "Ambulance_Vehicle", 
      "Hospital_Name", 
      "Status", 
      "Created_At"
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const stringified = String(val).replace(/"/g, '""');
      return `"${stringified}"`;
    };

    const rows = activeRequests.map((r, idx) => [
      escapeCsv(`DISP-${idx + 1}`),
      escapeCsv(r.victim ? r.victim.name : "Express Guest"),
      escapeCsv(r.victim ? r.victim.phone : "N/A"),
      escapeCsv(r.category || "GENERAL"),
      escapeCsv(r.priorityLevel || "STANDARD"),
      escapeCsv(r.ambulance ? r.ambulance.vehicleNumber : "Unassigned"),
      escapeCsv(r.hospital ? r.hospital.hospitalName : "Unassigned"),
      escapeCsv(r.status || "UNKNOWN"),
      escapeCsv(r.createdAt ? new Date(r.createdAt).toLocaleString() : new Date().toLocaleString())
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Emergency_Dispatches_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Emergency Command Center</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  SYSTEM ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Multi-Role Emergency Dispatch & Hospital Infrastructure Monitor</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Export Audit Log Button */}
            <button
              onClick={exportToCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 rounded-lg font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Audit Log (.csv)
            </button>

            {/* Provision Hospital */}
            <button
              onClick={() => setShowHospitalModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <HospitalIcon className="w-4 h-4 text-emerald-400" /> + Provision Hospital
            </button>

            {/* Provision Ambulance */}
            <button
              onClick={() => setShowAmbulanceModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <Car className="w-4 h-4" /> + Provision Ambulance
            </button>

            <button 
              onClick={logout} 
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* KPI System Analytics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Dispatches</span>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">{stats.totalRequests}</div>
            <span className="text-[11px] text-slate-500 font-medium">System Audit Log</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Missions</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600">{stats.activeRequests}</div>
            <span className="text-[11px] text-amber-700 font-medium">En-Route & Intake</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Fleet Units</span>
              <Car className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-600">{stats.availableAmbulances} / {stats.totalAmbulances}</div>
            <span className="text-[11px] text-slate-500 font-medium">Available Units</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">ER Capacity</span>
              <BedDouble className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600">{stats.freeBeds} / {stats.totalBeds}</div>
            <span className="text-[11px] text-slate-500 font-medium">{stats.totalHospitals} Hospitals</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Avg Dispatch</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-600">2.4m</div>
            <span className="text-[11px] text-slate-500 font-medium">Rule Engine</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600">98.5%</div>
            <span className="text-[11px] text-slate-500 font-medium">Atomic Lock</span>
          </div>
        </div>

        {/* Tab Navigation for Admin Views */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div className="inline-flex p-1 bg-slate-200/60 rounded-xl">
            <button
              onClick={() => setTabView("overview")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                tabView === "overview" 
                  ? "bg-white text-slate-900 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4 text-slate-500" /> Dispatches Audit Log
            </button>
            <button
              onClick={() => setTabView("hospitals")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                tabView === "hospitals" 
                  ? "bg-white text-slate-900 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HospitalIcon className="w-4 h-4 text-emerald-600" /> Hospitals ({hospitals.length})
            </button>
            <button
              onClick={() => setTabView("ambulances")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                tabView === "ambulances" 
                  ? "bg-white text-slate-900 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Car className="w-4 h-4 text-indigo-600" /> Ambulances ({ambulances.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search victim, category, status..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* VIEW 1: OVERVIEW & SYSTEM DISPATCHES AUDIT LOG */}
        {tabView === "overview" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Real-Time System Emergency Dispatches Log</h2>
                <p className="text-xs text-slate-500 font-medium">Central record of all triage requests, driver assignments, and hospital telemetry</p>
              </div>
              
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === st 
                        ? "bg-slate-900 text-white shadow-xs" 
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No emergency dispatches found matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Dispatch ID</th>
                      <th className="py-3 px-4">Victim Details</th>
                      <th className="py-3 px-4">Category & Priority</th>
                      <th className="py-3 px-4">Assigned Ambulance</th>
                      <th className="py-3 px-4">Target Hospital</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredRequests.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#DISP-{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block font-semibold">{r.victim ? r.victim.name : "Express Guest Victim"}</strong>
                          <span className="text-xs text-slate-500 font-mono">📞 {r.victim ? r.victim.phone : "N/A"}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            {r.category || "GENERAL"} ({r.priorityLevel || "HIGH"})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {r.ambulance ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Car className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="font-mono">{r.ambulance.vehicleNumber}</span> ({r.ambulance.driverName})
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">Searching Unit...</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {r.hospital ? (
                            <span className="inline-flex items-center gap-1.5">
                              <HospitalIcon className="w-3.5 h-3.5 text-emerald-600" />
                              {r.hospital.hospitalName}
                            </span>
                          ) : (
                            <span className="text-slate-400">Pending Assignment</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            r.status === "COMPLETED" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : r.status === "CANCELLED" 
                              ? "bg-red-50 text-red-700 border border-red-200" 
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Hospital ER Directory & Capacities</h2>
                <p className="text-xs text-slate-500 font-medium">Manage hospital infrastructure, total beds, and ICU operational status</p>
              </div>
              <button 
                onClick={() => setShowHospitalModal(true)} 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
              >
                + Provision New Hospital
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Hospital Name</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Available / Total Beds</th>
                    <th className="py-3 px-4">ICU Status</th>
                    <th className="py-3 px-4">Coordinates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {hospitals.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#HOSP-{h.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{h.hospitalName}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 text-xs font-medium">{h.user?.email}</div>
                        <span className="text-xs text-slate-500 font-mono">📞 {h.user?.phone || "040-23456789"}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <BedDouble className="w-3.5 h-3.5" />
                          <span className="font-mono">{h.availableBeds} / {h.totalBeds} Free</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          h.hasIcu 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {h.hasIcu ? "ICU Operational" : "General ER Only"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500">[{h.latitude}, {h.longitude}]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: AMBULANCES FLEET MANAGER TAB */}
        {tabView === "ambulances" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Ambulance Fleet Roster</h2>
                <p className="text-xs text-slate-500 font-medium">Real-time driver availability, vehicle numbers, and duty assignment</p>
              </div>
              <button 
                onClick={() => setShowAmbulanceModal(true)} 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
              >
                + Provision New Ambulance
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Unit ID</th>
                    <th className="py-3 px-4">Vehicle Plate #</th>
                    <th className="py-3 px-4">Driver & Contact</th>
                    <th className="py-3 px-4">Duty Status</th>
                    <th className="py-3 px-4">Current Coordinates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {ambulances.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#AMB-{a.id}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{a.vehicleNumber}</td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block font-semibold">{a.driverName}</strong>
                        <span className="text-xs text-slate-500 font-mono">📞 {a.phone || a.user?.phone || "N/A"}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          a.isAvailable 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {a.isAvailable ? "Duty Standby (Available)" : "On Emergency Mission"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500">[{a.latitude}, {a.longitude}]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Provision Hospital Modal */}
      {showHospitalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HospitalIcon className="w-5 h-5 text-emerald-600" /> Provision Hospital ER Unit
              </h3>
              <button onClick={() => setShowHospitalModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProvisionHospital} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Yashoda Hospitals ER Unit" 
                  value={hospitalForm.name} 
                  onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Login Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="hospital@ems.com" 
                    value={hospitalForm.email} 
                    onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="10 Digits" 
                    value={hospitalForm.phone} 
                    onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total ER Beds</label>
                  <input 
                    type="number" 
                    required 
                    value={hospitalForm.totalBeds} 
                    onChange={(e) => setHospitalForm({ ...hospitalForm, totalBeds: parseInt(e.target.value) || 0 })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Available Beds</label>
                  <input 
                    type="number" 
                    required 
                    value={hospitalForm.availableBeds} 
                    onChange={(e) => setHospitalForm({ ...hospitalForm, availableBeds: parseInt(e.target.value) || 0 })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-xs cursor-pointer"
                >
                  Provision Hospital
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowHospitalModal(false)} 
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-all border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Ambulance Modal */}
      {showAmbulanceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-600" /> Provision Ambulance Unit
              </h3>
              <button onClick={() => setShowAmbulanceModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProvisionAmbulance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Driver Ramesh" 
                  value={ambulanceForm.driverName} 
                  onChange={(e) => setAmbulanceForm({ ...ambulanceForm, driverName: e.target.value })} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="driver@ems.com" 
                    value={ambulanceForm.email} 
                    onChange={(e) => setAmbulanceForm({ ...ambulanceForm, email: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Phone</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="10 Digits" 
                    value={ambulanceForm.phone} 
                    onChange={(e) => setAmbulanceForm({ ...ambulanceForm, phone: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle License Plate #</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. AP 39 X 1234" 
                  value={ambulanceForm.vehicleNumber} 
                  onChange={(e) => setAmbulanceForm({ ...ambulanceForm, vehicleNumber: e.target.value })} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-slate-400 focus:outline-none" 
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-xs cursor-pointer"
                >
                  Provision Ambulance
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAmbulanceModal(false)} 
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-all border border-slate-300 cursor-pointer"
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