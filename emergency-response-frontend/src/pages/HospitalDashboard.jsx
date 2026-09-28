import React, { useEffect, useState } from "react";
import api from "../services/api";
import { translations } from "../utils/i18n";
import { 
  Activity, 
  BedDouble, 
  PhoneCall, 
  Hospital as HospitalIcon, 
  ShieldAlert, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  User, 
  X, 
  Droplet, 
  Shield, 
  MapPin, 
  Save, 
  RefreshCw, 
  Globe, 
  LogOut, 
  SlidersHorizontal, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  Siren,
  UserPlus,
  FileText
} from "lucide-react";

export default function HospitalDashboard() {
  const [lang, setLang] = useState(localStorage.getItem("app_lang") || "en");
  const t = translations[lang] || translations.en;

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState("ALL"); // 'ALL' | 'INCOMING' | 'ADMITTED'
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Manual Bed Capacity & ICU Input Form State
  const [capacityForm, setCapacityForm] = useState({
    availableBeds: 12,
    totalBeds: 30,
    hasIcu: true
  });
  const [showManualEditModal, setShowManualEditModal] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadHospitalData();
      const timer = setInterval(loadHospitalData, 3500);
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
      console.log("Not logged in as hospital staff", err);
    }
  };

  const loadHospitalData = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/api/emergency/hospital/${user.id}`);
      const list = res.data || [];
      setRequests(list);

      // Load hospital details from backend
      const hospRes = await api.get("/api/emergency/hospitals/all");
      const myHosp = (hospRes.data || []).find(h => h.user && h.user.id === user.id);
      if (myHosp) {
        setHospital(myHosp);
        setCapacityForm({
          availableBeds: myHosp.availableBeds,
          totalBeds: myHosp.totalBeds,
          hasIcu: myHosp.hasIcu
        });
      } else if (list.length > 0 && list[0].hospital) {
        setHospital(list[0].hospital);
        setCapacityForm({
          availableBeds: list[0].hospital.availableBeds,
          totalBeds: list[0].hospital.totalBeds,
          hasIcu: list[0].hospital.hasIcu
        });
      }
    } catch (err) {
      console.log("Error loading hospital data", err);
    }
  };

  // Quick increment/decrement bed count (persisted to DB)
  const updateBedsQuick = async (delta) => {
    if (!hospital?.id) return;
    const currentBeds = hospital.availableBeds;
    const newBeds = currentBeds + delta;
    if (newBeds < 0 || newBeds > hospital.totalBeds) return;

    try {
      const res = await api.put(`/api/emergency/hospital/capacity/${hospital.id}?availableBeds=${newBeds}`);
      setHospital(res.data);
      setCapacityForm(prev => ({ ...prev, availableBeds: newBeds }));
    } catch (err) {
      alert("Error updating bed count: " + (err.response?.data?.message || err.message));
    }
  };

  // Manual Input Save to Database
  const saveManualCapacity = async (e) => {
    e.preventDefault();
    if (!hospital?.id) return;
    setLoading(true);
    try {
      const res = await api.put(`/api/emergency/hospital/capacity/${hospital.id}?availableBeds=${capacityForm.availableBeds}&totalBeds=${capacityForm.totalBeds}&hasIcu=${capacityForm.hasIcu}`);
      setHospital(res.data);
      setShowManualEditModal(false);
      alert("ER Bed Capacity and ICU status updated in database.");
    } catch (err) {
      alert("Failed to update capacity: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Toggle ICU Status Directly
  const toggleIcuStatus = async () => {
    if (!hospital?.id) return;
    const nextIcu = !hospital.hasIcu;
    try {
      const res = await api.put(`/api/emergency/hospital/capacity/${hospital.id}?hasIcu=${nextIcu}`);
      setHospital(res.data);
      setCapacityForm(prev => ({ ...prev, hasIcu: nextIcu }));
    } catch (err) {
      alert("Error updating ICU status");
    }
  };

  const triggerEmergencyDivert = async (reqId) => {
    if (!window.confirm("Trigger Emergency Divert? This will release the reserved ER bed and alert the ambulance driver to re-route to another hospital.")) return;
    setLoading(true);
    try {
      await api.put(`/api/emergency/hospital/divert/${reqId}`);
      loadHospitalData();
    } catch (err) {
      alert("Failed to divert emergency: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const pendingAlerts = requests.filter(r => r.status === "HOSPITAL_SELECTED");
  
  const filteredRequests = requests.filter(r => {
    if (filterTab === "INCOMING") return r.status === "HOSPITAL_SELECTED" || r.status === "ARRIVED_AT_VICTIM";
    if (filterTab === "ADMITTED") return r.status === "COMPLETED";
    return true;
  });

  // Calculate ER Load Status
  const availBeds = hospital ? hospital.availableBeds : 12;
  const loadBadge = availBeds === 0 
    ? { label: "CAPACITY CRITICAL", bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" }
    : availBeds <= 3 
    ? { label: "HIGH ER LOAD", bg: "#fffbeb", color: "#d97706", border: "#fde68a" }
    : { label: "NORMAL INTAKE", bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* 56px Height Top App Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white p-2 rounded-lg flex items-center justify-center">
            <HospitalIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                {user ? user.name : "Trauma Center ER Bay"}
              </h1>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase border" style={{ backgroundColor: loadBadge.bg, color: loadBadge.color, borderColor: loadBadge.border }}>
                {loadBadge.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SYSTEM ONLINE • LATENCY 12ms
              </span>
              <span>•</span>
              <span className="font-mono text-slate-600">UNIT-ID: ER-{hospital?.id || 102}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Badge */}
          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md uppercase tracking-wider hidden sm:inline-block">
            CLINICAL ER BAY CONSOLE
          </span>

          {/* Hospital Profile */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <HospitalIcon className="w-3.5 h-3.5 text-slate-600" /> Profile
          </button>

          {/* Language Picker */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <select 
              value={lang} 
              onChange={(e) => handleLangChange(e.target.value)} 
              className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="te">TE (తెలుగు)</option>
              <option value="hi">HI (हिंदी)</option>
              <option value="ta">TA (தமிழ்)</option>
            </select>
          </div>

          <button 
            onClick={logout} 
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Command Center Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          
          {/* Available ER Beds Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-emerald-600" /> Available ER Beds
              </span>
              <button
                onClick={() => setShowManualEditModal(true)}
                className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
              >
                <SlidersHorizontal className="w-3 h-3 text-slate-600" /> Set Capacity
              </button>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono text-slate-900">{hospital ? hospital.availableBeds : 12}</span>
                <span className="text-sm font-semibold text-slate-500 ml-2">/ {hospital ? hospital.totalBeds : 30} Total</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" /> +2 cleared (15m)
              </span>
            </div>

            {/* Quick Intake / Discharge Actions */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => updateBedsQuick(-1)}
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 py-2 rounded-lg transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" /> Walk-In (-1)
              </button>
              <button
                onClick={() => updateBedsQuick(1)}
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Discharge (+1)
              </button>
            </div>
          </div>

          {/* ICU Unit & Trauma Facility Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" /> ICU Trauma Facility
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${hospital?.hasIcu ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                {hospital?.hasIcu ? "OPERATIONAL" : "OFFLINE"}
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-extrabold font-mono text-slate-900">
                  {hospital?.hasIcu ? "READY" : "FULL"}
                </span>
                <span className="text-xs text-slate-500 block font-medium mt-0.5">Ventilators & CT Scanner Active</span>
              </div>
            </div>

            <button
              onClick={toggleIcuStatus}
              className={`w-full py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                hospital?.hasIcu 
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> 
              {hospital?.hasIcu ? "Mark ICU Offline / Maintenance" : "Activate ICU Trauma Facility"}
            </button>
          </div>

          {/* Incoming En-Route Ambulances Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Siren className="w-4 h-4 text-amber-600" /> Incoming Dispatches
              </span>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                EN-ROUTE
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono text-slate-900">{pendingAlerts.length}</span>
                <span className="text-xs text-slate-500 ml-2 font-medium">Units In-Transit</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Beds Pre-Reserved</span>
            </div>

            <div className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>Est. Transit Time: <strong>4–8 mins</strong> to ER Bay</span>
            </div>
          </div>
        </section>

        {/* Pre-Arrival High Priority Emergency Alerts Banner */}
        {pendingAlerts.length > 0 && (
          <section className="mb-6 bg-amber-50/60 border border-amber-300 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-amber-950 uppercase tracking-wider">
                  Pre-Arrival Ambulance Intake Alerts ({pendingAlerts.length})
                </h2>
              </div>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded">
                ER BAY PREPARATION REQUIRED
              </span>
            </div>

            <div className="space-y-4">
              {pendingAlerts.map(r => (
                <div key={r.id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider border ${
                        r.priorityLevel === "CRITICAL" || r.category === "CARDIAC" || r.category === "ACCIDENT"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        PRIORITY 1 • {r.priorityLevel || "CRITICAL"}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        Emergency Dispatch — {r.category}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        #DISP-{r.id}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bed Reserved
                    </span>
                  </div>

                  {/* Victim Clinical Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Patient Details
                      </span>
                      <strong className="text-slate-900 text-sm block">
                        {r.victim ? r.victim.name : "Express Guest Victim"}
                      </strong>
                      <span className="font-mono text-indigo-600 font-semibold block mt-0.5">
                        <PhoneCall className="w-3 h-3 inline mr-1" />
                        {r.victim ? r.victim.phone : "Guest Contact"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Blood & Kin Data
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          <Droplet className="w-3 h-3 inline mr-1" />
                          {r.victim?.bloodGroup || "O+"}
                        </span>
                        {r.victim?.emergencyContact && (
                          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                            Kin: {r.victim.emergencyContact}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Assigned Ambulance
                      </span>
                      <strong className="font-mono text-indigo-700 text-sm block">
                        {r.ambulance ? r.ambulance.vehicleNumber : "AP 39 X 1234"}
                      </strong>
                      <span className="text-slate-600 font-medium">
                        Driver: {r.ambulance ? r.ambulance.driverName : "On Duty"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Pickup Location
                      </span>
                      <strong className="text-slate-900 block truncate">
                        {r.landmark || "GPS Coordinates Location"}
                      </strong>
                      <span className="text-slate-500 truncate block">
                        {r.description || "Medical SOS Triage"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Bed reserved automatically. Trigger divert only if ER unit experiences catastrophic outage.
                    </span>
                    <button
                      onClick={() => triggerEmergencyDivert(r.id)}
                      disabled={loading}
                      className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      Trigger Emergency Divert (Re-route)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Emergency Patient Admissions Log Data Table */}
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Emergency Patient Admissions & Clinical Log
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time tracking of patient intake, bed allocation, and trauma history
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">Filter:</span>
              {["ALL", "INCOMING", "ADMITTED"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    filterTab === tab
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No emergency intake records found for selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4"># Dispatch ID</th>
                    <th className="py-3 px-4">Patient Profile</th>
                    <th className="py-3 px-4">Blood Data</th>
                    <th className="py-3 px-4">Triage Category</th>
                    <th className="py-3 px-4">Ambulance Unit</th>
                    <th className="py-3 px-4">Intake Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        #DISP-{r.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 text-xs block font-bold">
                          {r.victim ? r.victim.name : "Express Guest"}
                        </strong>
                        <span className="font-mono text-slate-500 text-[11px]">
                          <PhoneCall className="w-3 h-3 inline mr-1 text-slate-400" />
                          {r.victim ? r.victim.phone : "Guest Phone"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          <Droplet className="w-3 h-3 inline mr-1 text-red-600" />
                          {r.victim?.bloodGroup || "O+"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {r.category}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {r.ambulance ? r.ambulance.vehicleNumber : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded text-[11px] font-bold border uppercase tracking-wider ${
                          r.status === "COMPLETED" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}>
                          {r.status === "COMPLETED" ? "ADMITTED" : r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => alert(`Patient Admissions Record #DISP-${r.id}\nName: ${r.victim?.name || "Guest"}\nBlood Group: ${r.victim?.bloodGroup || "O+"}\nKin: ${r.victim?.emergencyContact || "N/A"}`)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors"
                        >
                          View Record
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* Manual ER Bed Capacity Override Modal */}
      {showManualEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg p-6 border border-slate-200 shadow-xl relative">
            <button
              onClick={() => setShowManualEditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-700">
                <BedDouble className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Manual Bed Capacity Override</h3>
                <p className="text-xs text-slate-500 font-medium">Direct database update for non-portal walk-in patients</p>
              </div>
            </div>

            <form onSubmit={saveManualCapacity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currently Available Free ER Beds
                </label>
                <input
                  type="number"
                  min="0"
                  max={capacityForm.totalBeds}
                  required
                  value={capacityForm.availableBeds}
                  onChange={e => setCapacityForm({ ...capacityForm, availableBeds: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Hospital ER Bed Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={capacityForm.totalBeds}
                  onChange={e => setCapacityForm({ ...capacityForm, totalBeds: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">ICU Trauma Facility Status:</span>
                <label className="flex items-center cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    checked={capacityForm.hasIcu}
                    onChange={e => setCapacityForm({ ...capacityForm, hasIcu: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-900">Operational</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Capacity to Database
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualEditModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hospital Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-lg p-6 border border-slate-200 shadow-xl relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="bg-indigo-100 text-indigo-700 p-3 rounded-lg">
                <HospitalIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{user?.name || "City Emergency General Hospital"}</h3>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mt-1">
                  VERIFIED CLINICAL ER BAY FACILITY
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Registered Email</span>
                <strong className="text-slate-900 font-mono">{user?.email || "hospital1@emergency.com"}</strong>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">ER Duty Line</span>
                <strong className="text-indigo-600 font-mono">{user?.phone || "040-23456789"}</strong>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Total Bed Capacity</span>
                <strong className="text-slate-900 font-mono">{hospital?.totalBeds || 30} Beds</strong>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Available ER Beds</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {hospital?.availableBeds || 12} Beds Free
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Special Facilities</span>
                <strong className="text-slate-900">{hospital?.hasIcu ? "ICU, CT Scanner, Ventilators" : "General Trauma Unit"}</strong>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">GPS Coordinates</span>
                <strong className="text-slate-700 font-mono">[16.3100, 80.4400]</strong>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

    </div>
  );
}