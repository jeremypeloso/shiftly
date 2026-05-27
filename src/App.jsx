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
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";
import SupportTicket from "./pages/SupportTicket";
import AdminNotifications from "./pages/AdminNotifications";
import CompanyProfile from "./pages/CompanyProfile";


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
  path="/notifications"
  element={
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/support/:ticketId"
  element={
    <ProtectedRoute>
      <SupportTicket />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-notifications"
  element={
    <ProtectedRoute>
      <AdminNotifications />
    </ProtectedRoute>
  }
/>

<Route
  path="/company/profile"
  element={
    <ProtectedRoute>
      <CompanyProfile />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}