import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverDashboard from "./pages/DriverDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import CreateMission from "./pages/CreateMission";
import OpenMissions from "./pages/OpenMissions";
import CompanyDrivers from "./pages/CompanyDrivers";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/driver" element={<DriverDashboard />} />
      <Route
        path="/driver/open-missions"
        element={<OpenMissions />}
      />

      <Route path="/company" element={<CompanyDashboard />} />
      <Route
        path="/company/create-mission"
        element={<CreateMission />}
      />

      <Route
        path="/company/drivers"
        element={<CompanyDrivers />}
      />
    </Routes>
  );
}