import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import VictimDashboard from "./pages/VictimDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import AmbulanceDashboard from "./pages/AmbulanceDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VictimDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/victim" element={<VictimDashboard />} />
        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/ambulance" element={<AmbulanceDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;