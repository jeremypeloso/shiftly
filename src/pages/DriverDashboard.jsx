import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export default function DriverDashboard() {
  const navigate = useNavigate();

  const [openMissions, setOpenMissions] = useState([]);
  const [myMissions, setMyMissions] = useState([]);
  const [driverProfile, setDriverProfile] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  

  const actionLockRef = useRef(false);
  const loadIdRef = useRef(0);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function safeNavigate(path) {
  if (actionLockRef.current) return;

  actionLockRef.current = true;

  setTimeout(() => {
    navigate(path);
    actionLockRef.current = false;
  }, 150);
}

async function loadNotifications() {
  const user = await getCurrentUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setNotifications(data || []);
}

  function calculateMatchScore(mission, driver) {
    let score = 0;
    const missionDate = String(mission.start_time || "").slice(0, 10);

    if (driver.availabilityDays?.includes(missionDate)) score += 30;

    if (
      driver.preferredDepartments?.includes(mission.pickup_department) ||
      driver.preferredDepartments?.includes("France entière") ||
      driver.preferredDepartments?.includes("Europe")
    ) {
      score += 25;
    }

    if (
      mission.required_permits?.some((permit) =>
        driver.permits?.includes(permit)
      )
    ) {
      score += 20;
    }

    if (
      mission.required_documents?.includes("FCO") &&
      driver.fcoStatus === "À jour"
    ) {
      score += 10;
    }

    if (
      mission.required_documents?.includes("RCPRO") &&
      driver.rcproStatus === "Oui"
    ) {
      score += 10;
    }

    if (driver.missionTypes?.includes(mission.mission_type)) score += 5;

    return score;
  }

  const loadDriverData = useCallback(async () => {
    const loadId = ++loadIdRef.current;

    const user = await getCurrentUser();

    if (!user) {
  console.warn("Session absente temporairement");
  return;
}

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(profileError);
      return;
    }

    const currentDriver = {
      id: user.id,
      fullName: profileData.full_name || "Conducteur",
name: profileData.full_name || "Conducteur",
      city: profileData.city || "",
      permits: profileData.permits || [],
      fcoStatus: profileData.fco_status || "",
      rcproStatus: profileData.rcpro_status || "",
      experience: profileData.experience || "",
      availability: profileData.availability || "",
      availabilityDays: profileData.availability_days || [],
      preferredDepartments: profileData.preferred_departments || [],
      missionTypes: profileData.mission_types || [],
      shiftScore: profileData.shift_score ?? 0
    };

    const { data: missionsData, error: missionsError } = await supabase
      .from("missions")
      .select("*")
      .order("created_at", { ascending: false });

    if (missionsError) {
      console.error(missionsError);
      return;
    }

    const { data: applicationsData, error: applicationsError } = await supabase
      .from("applications")
      .select("*");

    if (applicationsError) {
      console.error(applicationsError);
      return;
    }

    const { data: invitationsData, error: invitationsError } = await supabase
      .from("mission_invitations")
      .select(`
        *,
        missions (*)
      `)
      .eq("driver_id", currentDriver.id)
      .order("created_at", { ascending: false });

    if (invitationsError) {
      console.error(invitationsError);
      return;
    }

    const formattedMissions = missionsData.map((mission) => ({
      companyName: mission.company_name,
companyVerified: mission.company_verified,
      id: mission.id,
      title: mission.title,
      status: mission.status,
      start: mission.start_time,
      end: mission.end_time,
      color: mission.color,
      pickup: mission.pickup,
      dropoff: mission.dropoff,
      pickupDepartment: mission.pickup_department,
      requiredPermits: mission.required_permits || [],
      requiredDocuments: mission.required_documents || [],
      driver: mission.driver_name,
      driverId: mission.driver_id,
      companyId: mission.company_id,
      vehicle: mission.vehicle,
      type: mission.mission_type,
      passengers: mission.passengers,
      price: mission.price,
      comment: mission.comment,
      documents: mission.documents,
      matchScore: calculateMatchScore(mission, currentDriver),
      applied: applicationsData.some(
        (app) =>
          String(app.mission_id) === String(mission.id) &&
          String(app.driver_id) === String(currentDriver.id) &&
          (app.status === "En attente" || app.status === "Acceptée")
      ),
    }));

    if (loadId !== loadIdRef.current) return;

    setDriverProfile(currentDriver);
    setInvitations(invitationsData || []);

    setOpenMissions(
      formattedMissions
        .filter((mission) => mission.status === "Ouverte")
        .sort((a, b) => b.matchScore - a.matchScore)
    );

    setMyMissions(
      formattedMissions.filter(
        (mission) =>
          String(mission.driverId) === String(currentDriver.id) &&
          mission.status === "Pourvue"
      )
    );
  }, []);

  useEffect(() => {
  let reloadTimeout = null;

  loadDriverData();
  loadNotifications();

  const interval = setInterval(() => {
    loadNotifications();
  }, 5000);

  const reloadSafely = () => {
    if (actionLockRef.current) return;

    clearTimeout(reloadTimeout);

    reloadTimeout = setTimeout(() => {
      loadDriverData();
    }, 500);
  };

  const missionsChannel = supabase
    .channel("missions-live-driver")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "missions",
      },
      reloadSafely
    )
    .subscribe();

  const applicationsChannel = supabase
    .channel("applications-live-driver")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "applications",
      },
      reloadSafely
    )
    .subscribe();

  const invitationsChannel = supabase
    .channel("invitations-live-driver")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "mission_invitations",
      },
      reloadSafely
    )
    .subscribe();

  return () => {
    clearInterval(interval);
    clearTimeout(reloadTimeout);

    supabase.removeChannel(missionsChannel);
    supabase.removeChannel(applicationsChannel);
    supabase.removeChannel(invitationsChannel);
  };
}, [loadDriverData]);

  async function applyToMission(mission) {
    if (actionLockRef.current) return;

    actionLockRef.current = true;
    setActionLoading(true);

    try {
      if (!driverProfile) {
        alert("Profil conducteur non chargé");
        return;
      }

      const alreadyApplied = openMissions.find(
        (item) => item.id === mission.id && item.applied
      );

      if (alreadyApplied) return;

      const { error } = await supabase.from("applications").insert([
        {
          mission_id: mission.id,
          status: "En attente",
          driver_id: driverProfile.id,
          driver_name: driverProfile.name,
          driver_city: driverProfile.city,
          driver_permits: driverProfile.permits.join(", "),
          driver_fimo: driverProfile.fcoStatus,
          driver_experience: driverProfile.experience,
          driver_shift_score: driverProfile.shiftScore,
          driver_availability: driverProfile.availability,
        },
      ]);

      await supabase
  .from("notifications")
  .insert([
    {
      user_id: mission.companyId,
      title: "Nouvelle candidature",
      message: `${
        driverProfile?.name ||
        "Un conducteur"
      } a postulé à votre mission : ${
        mission.title
      }`,
      type: "application",
    },
  ]);

      if (error) {
        console.error(error);
        alert("Erreur candidature");
        return;
      }

      await loadDriverData();
    } finally {
      actionLockRef.current = false;
      setActionLoading(false);
    }
  }

  async function acceptInvitation(invitation) {
  if (actionLockRef.current) return;

  actionLockRef.current = true;
  setActionLoading(true);

  try {
    if (!driverProfile) return;

    const { error: applicationError } = await supabase
      .from("applications")
      .insert([
        {
          mission_id: invitation.mission_id,
          status: "Acceptée",
          driver_id: driverProfile.id,
          driver_name: driverProfile.name,
          driver_city: driverProfile.city,
          driver_permits: driverProfile.permits.join(", "),
          driver_fimo: driverProfile.fcoStatus,
          driver_experience: driverProfile.experience,
          driver_shift_score: driverProfile.shiftScore,
          driver_availability: driverProfile.availability,
        },
      ]);

    if (applicationError) {
      console.error(applicationError);
      alert("Erreur candidature");
      return;
    }

    const { error: missionError } = await supabase
      .from("missions")
      .update({
        status: "Pourvue",
        color: "#16a34a",
        driver_id: driverProfile.id,
        driver_name: driverProfile.name,
      })
      .eq("id", invitation.mission_id);

    if (missionError) {
      console.error(missionError);
      alert("Erreur passage mission en pourvue");
      return;
    }

    const newShiftScore = Math.min(
  100,
  (driverProfile.shiftScore ?? 70) + 5
);

console.log("Nouveau ShiftScore :", newShiftScore);

const { error: scoreError } = await supabase
  .from("profiles")
  .update({
    shift_score: newShiftScore,
  })
  .eq("id", driverProfile.id);

if (scoreError) {
  console.error(scoreError);
  alert("Erreur mise à jour ShiftScore");
  return;
}

await supabase.from("shift_score_events").insert([
  {
    driver_id: driverProfile.id,
    mission_id: invitation.mission_id,
    event_type: "Invitation acceptée",
    points: 5,
  },
]);

    const { error: invitationError } = await supabase
      .from("mission_invitations")
      .update({
        status: "Acceptée",
      })
      .eq("id", invitation.id);

    if (invitationError) {
      console.error(invitationError);
      alert("Erreur invitation");
      return;
    }

    await loadDriverData();
  } finally {
    actionLockRef.current = false;
    setActionLoading(false);
  }
}

  async function refuseInvitation(invitation) {
    if (actionLockRef.current) return;

    actionLockRef.current = true;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("mission_invitations")
        .update({ status: "Refusée" })
        .eq("id", invitation.id);

      if (error) {
        console.error(error);
        alert("Erreur refus invitation");
        return;
      }

      await loadDriverData();
    } finally {
      actionLockRef.current = false;
      setActionLoading(false);
    }
  }

  const pendingInvitations = invitations.filter(
    (invitation) =>
      invitation.status !== "Acceptée" && invitation.status !== "Refusée"
  );

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Shiftly</h2>

        <div className="mobile-actions">

  <button
    className="notif-pill"
    onClick={() => navigate("/notifications")}
  >
    <div className="notif-left">
      <span className="notif-icon">🔔</span>
    </div>

    {notifications.filter((n) => !n.is_read).length > 0 && (
      <div className="notif-count">
        {
          notifications.filter(
            (n) => !n.is_read
          ).length
        }
      </div>
    )}
  </button>

  <button
    className="mobile-logout"
    onClick={logout}
  >
    ⇦
  </button>

</div>

        <nav>
          <button
  className="menu-btn"
  onClick={() => safeNavigate("/driver/missions")}
>
  Missions

  {myMissions.length > 0 && (
    <span className="badge">
      {myMissions.length}
    </span>
  )}
</button>

<button onClick={() => safeNavigate("/driver/availability")}>
  Disponibilités
</button>

<button onClick={() => safeNavigate("/driver/profile")}>
  Profil
</button>

          <button className="logout-btn" onClick={logout}>
            Déconnexion
          </button>
        </nav>
      </aside>

      <main className="content">
       <header className="top">

  <div>
    <p>
      Bonjour{" "}
      {driverProfile?.name ||
        driverProfile?.fullName ||
        "conducteur"} 👋
    </p>

    <h1>Tableau conducteur</h1>
  </div>

  <div className="driver-top-right">

    <div className="score">
      ⭐ ShiftScore {driverProfile?.shiftScore ?? 0}
    </div>

    <button
      className="notif-pill"
      onClick={() => navigate("/notifications")}
    >
      <div className="notif-left">
        <span className="notif-icon">🔔</span>
      </div>

      {notifications.filter((n) => !n.is_read).length > 0 && (
        <div className="notif-count">
          {
            notifications.filter(
              (n) => !n.is_read
            ).length
          }
        </div>
      )}
    </button>

  </div>

</header>


        <section className="cards">
          <div className="card">
            <span>Missions disponibles</span>
            <strong>{openMissions.length}</strong>
          </div>

          <div className="card">
            <span>Missions attribuées</span>
            <strong>{myMissions.length}</strong>
          </div>

          <div className="card">
            <span>Invitations reçues</span>
            <strong>{pendingInvitations.length}</strong>
          </div>

        </section>

        <section className="calendar-section">
          <h2>Mon agenda</h2>

          <div className="calendar-card">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="fr"
              height="auto"
              headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "today",
              }}
              buttonText={{
                today: "Aujourd’hui",
              }}
              events={myMissions.map((mission) => ({
                title: mission.title,
                start: mission.start,
                end: mission.end,
                color: "#16a34a",
                extendedProps: mission,
              }))}
              eventClick={(info) => {
                setSelectedMission(info.event.extendedProps);
              }}
            />
          </div>
        </section>

        {selectedMission && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedMission(null)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="close" onClick={() => setSelectedMission(null)}>
                ✕
              </button>

              <h2>{selectedMission.title}</h2>

              <p>📍 {selectedMission.pickup} → {selectedMission.dropoff}</p>
              <p>📅 {new Date(selectedMission.start).toLocaleString("fr-FR")}</p>
              <p>🔁 {new Date(selectedMission.end).toLocaleString("fr-FR")}</p>
              <p>🚍 {selectedMission.vehicle}</p>
              <p>👥 {selectedMission.passengers}</p>
              <p>💶 {selectedMission.price || "Prix non renseigné"}</p>
              <p>📝 {selectedMission.comment || "Aucune consigne particulière"}</p>
            </div>
          </div>
        )}

        <section className="missions">
          <div className="section-title">
            <h2>Invitations entreprises</h2>
            <span>{pendingInvitations.length} invitation(s)</span>
          </div>

          <div className="mission-list">
            {pendingInvitations.length === 0 && (
              <div className="empty">Aucune invitation reçue.</div>
            )}

            {pendingInvitations.map((invitation) => {
              const mission = invitation.missions;

              return (
                <div className="mission" key={invitation.id}>
                  <div>
                    <strong>{mission?.title || "Mission"}</strong>
                    <p>📍 {mission?.pickup} → {mission?.dropoff}</p>
                    <p>
                      📅{" "}
                      {mission?.start_time
                        ? new Date(mission.start_time).toLocaleString("fr-FR")
                        : "Date non renseignée"}
                    </p>
                    <p>💶 {mission?.price || "Non renseigné"}</p>
                  </div>

                  <div className="mission-actions">
                    <button
                      disabled={actionLoading}
                      onClick={() => acceptInvitation(invitation)}
                    >
                      {actionLoading ? "Chargement..." : "Accepter"}
                    </button>

                    <button
                      disabled={actionLoading}
                      className="refuse-btn"
                      onClick={() => refuseInvitation(invitation)}
                    >
                      {actionLoading ? "Chargement..." : "Refuser"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="missions">
          <div className="section-title">
            <h2>Missions ouvertes</h2>
            <span>{openMissions.length} disponibles</span>
          </div>

          <div className="mission-list">
            {openMissions.length === 0 && (
              <div className="empty">Aucune mission ouverte pour le moment.</div>
            )}

            {openMissions.map((mission) => (
              <div className="mission" key={mission.id}>
                <div>
                  
                  <p className="company-name">
  {mission.companyName}
</p>

{mission.companyVerified && (
  <div className="verified-company">
    ✅ Entreprise vérifiée
  </div>
)}

<div className="mission-title">
  {mission.title}
</div>
                  <p>📍 {mission.pickup} → {mission.dropoff}</p>
                  <p>📅 Départ : {new Date(mission.start).toLocaleString("fr-FR")}</p>
                  <p>🔁 Retour : {new Date(mission.end).toLocaleString("fr-FR")}</p>
                  <p>🚍 {mission.vehicle} · 👥 {mission.passengers}</p>
                  <p>💶 {mission.price || "Prix non renseigné"}</p>
                  <p>📝 {mission.comment || "Aucune consigne particulière"}</p>
                 
                </div>

                <div className="mission-actions">
                  <button
                    className={
                      mission.matchScore >= 75
                        ? "match-btn excellent"
                        : mission.matchScore >= 45
                        ? "match-btn good"
                        : "match-btn weak"
                    }
                    disabled
                  >
                    {mission.matchScore >= 75
                      ? "Excellent match"
                      : mission.matchScore >= 45
                      ? "Compatible"
                      : "Faible match"}{" "}
                    {mission.matchScore}%
                  </button>

                  {mission.applied ? (
  <button className="applied-btn" disabled>
    ✓ Candidature envoyée
  </button>
) : (
  <>
    <button
      disabled={actionLoading}
      onClick={() => applyToMission(mission)}
    >
      {actionLoading ? "Chargement..." : "Postuler"}
    </button>
  </>
)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        .dashboard {
          min-height: 100svh;
          display: flex;
          color: white;
          font-family: Inter, Arial, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,0.1), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56,189,248,0.1), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }

        .menu-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.notif-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.mobile-actions {
  display: none;
}

.company-name {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}

.verified-company {
  display: inline-flex;
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(22,163,74,.15);
  color: #86efac;
  font-size: 12px;
  font-weight: 800;
}

.mission-title {
  margin-top: 14px;
  font-size: 20px;
  font-weight: 900;
  color: white;
}

.sidebar {
  position: relative;
}

.mobile-logout {
  display: none;

  width: 42px;
  height: 42px;

  border-radius: 999px;

  border:
    1px solid rgba(248,113,113,0.25);

  background:
    rgba(127,29,29,0.25);

  color: #f87171;

  align-items: center;
  justify-content: center;

  font-size: 20px;
  font-weight: 900;

  cursor: pointer;
}

.notif-badge {
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(239,68,68,0.18);
  color: #fca5a5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
}

.badge {
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: #16a34a;
  color: white;
  font-size: 12px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

        .sidebar {
          width: 260px;
          padding: 32px;
          background: rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

.notif-pill {
  display: inline-flex;

  align-items: center;
  justify-content: space-between;

  gap: 12px;

  padding: 10px 14px;

  border: 1px solid rgba(255,255,255,0.08);

  border-radius: 999px;

  background:
    rgba(255,255,255,0.05);

  color: white;

  cursor: pointer;

  transition: 0.2s;
}

.notif-pill:hover {
  background:
    rgba(255,255,255,0.08);
}

.notif-left {
  display: flex;
  align-items: center;
  gap: 8px;

  font-weight: 700;
  font-size: 14px;
}

.driver-top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notif-icon {
  font-size: 15px;
}

.notif-count {
  min-width: 22px;
  height: 22px;

  padding: 0 6px;

  border-radius: 999px;

  background:
    rgba(239,68,68,0.18);

  color: #fca5a5;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 11px;
  font-weight: 900;
}

        .sidebar h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 950;
        }

        nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 40px;
        }

        nav button {
          background: transparent;
          color: #cbd5e1;
          border: 1px solid rgba(255,255,255,0.08);
          padding: 14px;
          border-radius: 14px;
          text-align: left;
          cursor: pointer;
          font-weight: 700;
        }

        nav .active {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
        }

        .logout-btn {
          background: linear-gradient(180deg, #dc2626, #991b1b) !important;
          color: white !important;
          border: none !important;
        }

        .content {
          flex: 1;
          padding: 40px;
          min-width: 0;
          overflow-y: auto;
          height: 100svh;
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 18px 0 26px;
        }

        .top p {
          color: #94a3b8;
          margin: 0;
        }

        .top h1 {
          margin: 8px 0 0;
          font-size: 42px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .score {
          background: rgba(37,99,235,0.18);
          color: #bfdbfe;
          padding: 12px 18px;
          border-radius: 999px;
          font-weight: 800;
          white-space: nowrap;
        }

        .cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 40px;
}

        .card {
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 18px 45px rgba(0,0,0,0.22);
        }

        .card span {
          display: block;
          color: #94a3b8;
          margin-bottom: 10px;
        }

        .card strong {
          display: block;
          font-size: 38px;
          font-weight: 950;
        }

        .calendar-section,
        .missions {
          margin-top: 40px;
        }

        .calendar-section h2,
        .missions h2 {
          font-size: 28px;
          margin-bottom: 22px;
        }

        .calendar-card {
          background: #f8fafc;
          color: #0f172a;
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.28);
          overflow: hidden;
        }

        .fc {
          font-family: Inter, Arial, sans-serif;
        }

        .fc .fc-toolbar-title {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
        }

        .fc .fc-button {
          background: #0f172a !important;
          border: none !important;
          border-radius: 999px !important;
          padding: 10px 16px !important;
          font-weight: 800 !important;
        }

        .fc .fc-daygrid-day-number,
        .fc .fc-col-header-cell-cushion {
          text-decoration: none;
          color: #334155;
          font-weight: 800;
        }

        .fc .fc-day-today {
          background: rgba(37,99,235,0.08) !important;
        }

        .fc .fc-event {
          border: none !important;
          border-radius: 999px !important;
          padding: 4px 8px !important;
          font-size: 12px !important;
          font-weight: 800 !important;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
        }

        .section-title h2 {
          margin: 0;
        }

        .section-title span {
          color: #94a3b8;
        }

        .mission {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 14px;
        }

        .mission p {
          color: #94a3b8;
          margin: 6px 0 0;
        }

        .mission-actions {
          display: flex;
          flex-direction: row;
          gap: 10px;
          align-items: center;
          min-width: 190px;
        }

        .mission button,
        .applied-btn,
        .match-btn {
          min-width: 190px;
          padding: 12px 18px;
          border-radius: 999px;
          border: none;
          color: white;
          font-weight: 800;
        }

        .mission button {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          cursor: pointer;
        }

        .applied-btn {
          background: linear-gradient(180deg, #16a34a, #15803d);
          cursor: default;
        }

        .refuse-btn {
          background: linear-gradient(180deg, #dc2626, #991b1b) !important;
          color: white;
        }

        .match-btn {
          font-weight: 900;
          cursor: default;
        }

        .match-btn.excellent {
          background: linear-gradient(180deg, #16a34a, #15803d);
        }

        .match-btn.good {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
        }

        .match-btn.weak {
          background: linear-gradient(180deg, #f97316, #c2410c);
        }

        .empty {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 20px;
          color: #cbd5e1;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2,6,23,0.72);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          z-index: 999;
          padding: 24px 20px;
          overflow-y: auto;
        }

        .modal {
          width: 100%;
          max-width: 620px;
          max-height: calc(100svh - 48px);
          overflow-y: auto;
          background: linear-gradient(180deg, #111827, #0f172a);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 28px;
          color: white;
          box-shadow: 0 40px 120px rgba(0,0,0,0.45);
        }

        .close {
          float: right;
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: none;
          background: rgba(255,255,255,0.08);
          color: white;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .dashboard {
            display: block;
            overflow-x: hidden;
          }
            

          .mobile-actions {
  display: flex;

  position: absolute;

  top: 14px;
  right: 14px;

  gap: 10px;

  align-items: center;
}

.mobile-actions .mobile-logout {
  display: flex !important;
  position: relative;
}

.mobile-actions .notif-pill {
  padding: 8px 10px;
}

.driver-top-right .notif-pill {
  display: none;
}

.logout-btn {
  display: none;
}

          .sidebar {
            width: 100%;
            padding: 20px 16px;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }

          nav {
            margin-top: 18px;
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            gap: 10px;
            padding-bottom: 14px;
            scrollbar-width: none;
          }

          nav::-webkit-scrollbar {
            display: none;
          }

          nav button {
            white-space: nowrap;
            padding: 12px 14px;
            font-size: 13px;
          }

          .content {
            padding: 24px 16px 40px;
            overflow-y: auto;
            height: auto;
          }

          .top {
            flex-direction: column;
            align-items: flex-start;
          }

          .top h1 {
            font-size: 34px;
            line-height: 1;
          }

          .score {
            width: 100%;
            text-align: center;
          }

          .cards {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            margin-top: 28px;
          }

          .calendar-card {
            padding: 10px;
            border-radius: 18px;
          }

          .fc {
            font-size: 11px;
          }

          .fc .fc-toolbar {
            flex-direction: column;
            gap: 8px;
          }

          .fc .fc-toolbar-title {
            font-size: 19px;
          }

          .fc .fc-button {
            padding: 7px 10px !important;
            font-size: 11px !important;
          }

          .fc .fc-event {
            font-size: 9px !important;
            padding: 2px 4px !important;
            white-space: normal !important;
            line-height: 1.2;
          }

          .section-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .mission {
            flex-direction: column;
            align-items: flex-start;
          }

          .mission-actions {
            width: 100%;
            flex-direction: row;
          }

          .mission button,
          .applied-btn,
          .match-btn {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}