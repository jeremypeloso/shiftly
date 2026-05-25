import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverDashboard from "./pages/DriverDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import CreateMission from "./pages/CreateMission";
import OpenMissions from "./pages/OpenMissions";
import CompanyDrivers from "./pages/CompanyDrivers";
import DriverProfile from "./pages/DriverProfile";
import DriverAvailability from "./pages/DriverAvailability";
import DriverMissions from "./pages/DriverMissions";
import CompanyMissions from "./pages/CompanyMissions";
import CompanyBilling from "./pages/CompanyBilling";


import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route
        path="/driver/profile"
        element={
          <ProtectedRoute>
            <DriverProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/open-missions"
        element={
          <ProtectedRoute>
            <OpenMissions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/create-mission"
        element={
          <ProtectedRoute>
            <CreateMission />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/drivers"
        element={
          <ProtectedRoute>
            <CompanyDrivers />
          </ProtectedRoute>
        }
      />
      <Route
  path="/driver/availability"
  element={
    <ProtectedRoute>
      <DriverAvailability />
    </ProtectedRoute>
  }
/>
<Route
  path="/driver/missions"
  element={
    <ProtectedRoute>
      <DriverMissions />
    </ProtectedRoute>
  }
/>

<Route
  path="/driver"
  element={
    <ProtectedRoute>
      <DriverDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/company"
  element={
    <ProtectedRoute>
      <CompanyDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/company/missions"
  element={
    <ProtectedRoute>
      <CompanyMissions />
    </ProtectedRoute>
  }
/>

<Route
  path="/company/billing"
  element={
    <ProtectedRoute>
      <CompanyBilling />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}