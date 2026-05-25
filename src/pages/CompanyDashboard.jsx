import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";


export default function CompanyDashboard() {
  const navigate = useNavigate();

  const [selectedMission, setSelectedMission] = useState(null);
  const [editMission, setEditMission] = useState(null);
  const [createdMissions, setCreatedMissions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [missionInvitations, setMissionInvitations] = useState([]);
  const actionLockRef = useRef(false);
  const [missionToDelete, setMissionToDelete] = useState(null);
const [notifications, setNotifications] = useState([]);


  useEffect(() => {
  if (!selectedMission) return;

  const updatedMission = createdMissions.find(
    (mission) =>
      String(mission.id) === String(selectedMission.id)
  );

  if (updatedMission) {
    setSelectedMission(updatedMission);
  }
}, [createdMissions]);
  
  const loadCompanyData = useCallback(async () => {
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

    setCompanyProfile({
  id: user.id,
  email: user.email,
  companyName:
    profileData.company_name ||
    profileData.full_name ||
    user.email ||
    "Entreprise",
});

    const { data: missionsData, error: missionsError } = await supabase
      .from("missions")
      .select("*")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false });

    if (missionsError) {
      console.error(missionsError);
      return;
    }

    const { data: applicationsData, error: applicationsError } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (applicationsError) {
      console.error(applicationsError);
      return;
    }

    const { data: driversData, error: driversError } = await supabase
  .from("profiles")
  .select("*")
  .eq("role", "driver");

if (driversError) {
  console.error(driversError);
  return;
}

setDrivers(driversData || []);

const {
  data: invitationsData,
  error: invitationsError,
} = await supabase
  .from("mission_invitations")
  .select("*");

if (invitationsError) {
  console.error(invitationsError);
  return;
}

setMissionInvitations(invitationsData || []);

const { data: notificationsData } = await supabase
  .from("notifications")
  .select("*")
  .eq("user_id", user.id);

setNotifications(notificationsData || []);

    const formattedMissions = missionsData.map((mission) => ({
  id: mission.id,
  title: mission.title,
      status: mission.status,
      start: mission.start_time,
      end: mission.end_time,
      color: mission.color || "#2563eb",
      pickup: mission.pickup,
      dropoff: mission.dropoff,
      driver: mission.driver_name || "Non attribué",
      driverId: mission.driver_id,
      vehicle: mission.vehicle,
      type: mission.mission_type,
      passengers: mission.passengers,
      price: mission.price,
      comment: mission.comment,
      documents: mission.documents,
      pickupDepartment: mission.pickup_department,
requiredPermits: mission.required_permits || [],
requiredDocuments: mission.required_documents || [],
    }));

    const formattedApplications = applicationsData.map((app) => ({
      id: app.id,
      missionId: app.mission_id,
      status: app.status,
      driver: {
        id: app.driver_id,
        name: app.driver_name,
        city: app.driver_city,
        permits: app.driver_permits,
        fimo: app.driver_fimo,
        experience: app.driver_experience,
        shiftScore: app.driver_shift_score,
        availability: app.driver_availability,
      },
    }));

    setCreatedMissions(formattedMissions);
    setApplications(formattedApplications);
  }, [navigate]);

  useEffect(() => {
  let reloadTimeout = null;

  const reloadSafely = () => {
    if (actionLockRef.current) return;

    clearTimeout(reloadTimeout);

    reloadTimeout = setTimeout(() => {
      loadCompanyData();
    }, 500);
  };

  const missionsChannel = supabase
    .channel("missions-live-company")
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
    .channel("applications-live-company")
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
    .channel("invitations-live-company")
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

  loadCompanyData();

  return () => {
    clearTimeout(reloadTimeout);

    supabase.removeChannel(missionsChannel);
    supabase.removeChannel(applicationsChannel);
    supabase.removeChannel(invitationsChannel);
  };
}, [loadCompanyData]);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  async function inviteDriver(driver, mission) {
  const { data: sessionData } =
    await supabase.auth.getSession();

  const user = sessionData.session?.user;

  if (!user) return;

  const { error } = await supabase
    .from("mission_invitations")
    .insert([
      {
        mission_id: mission.id,
        company_id: user.id,
        driver_id: driver.id,
        driver_name:
          driver.full_name ||
          "Conducteur",
      },
    ]);

    await supabase.from("notifications").insert([
  {
    user_id: driver.id,
    title: "Nouvelle mission proposée",
    message: `${companyProfile?.companyName || "Une entreprise"} vous propose une mission : ${mission.title}`,
    type: "mission_invitation",
  },
]);

  if (error) {
    console.error(error);
    alert("Erreur invitation");
    return;
  }

  await loadCompanyData();
}

  async function acceptApplication(application) {
    const { error: missionError } = await supabase
      .from("missions")
      .update({
        status: "Pourvue",
        color: "#16a34a",
        driver_name: application.driver.name,
        driver_id: application.driver.id,
      })
      .eq("id", application.missionId);

    if (missionError) {
      console.error(missionError);
      alert("Erreur attribution mission");
      return;
    }

    const { error: appError } = await supabase
      .from("applications")
      .update({
        status: "Acceptée",
      })
      .eq("id", application.id);

    if (appError) {
      console.error(appError);
      alert("Erreur mise à jour candidature");
      return;
    }

    setCreatedMissions((prev) =>
      prev.map((mission) =>
        String(mission.id) === String(application.missionId)
          ? {
              ...mission,
              status: "Pourvue",
              color: "#16a34a",
              driver: application.driver.name,
              driverId: application.driver.id,
            }
          : mission
      )
    );
setSelectedMission(null);
    setApplications((prev) =>
      prev.map((app) =>
        String(app.id) === String(application.id)
          ? { ...app, status: "Acceptée" }
          : app
      )
    );

    setSelectedMission((prev) =>
      prev
        ? {
            ...prev,
            status: "Pourvue",
            color: "#16a34a",
            driver: application.driver.name,
            driverId: application.driver.id,
          }
        : null
    );
  }

  async function detachDriver(mission) {
    const { error } = await supabase
      .from("missions")
      .update({
        status: "Ouverte",
        color: "#2563eb",
        driver_name: "Non attribué",
        driver_id: null,
      })
      .eq("id", mission.id);

    if (error) {
      console.error(error);
      alert("Erreur lors du détachement");
      return;
    }

    await supabase
      .from("applications")
      .delete()
      .eq("mission_id", mission.id)
      .eq("driver_id", mission.driverId)
      .eq("status", "Acceptée");

    setCreatedMissions((prev) =>
      prev.map((item) =>
        item.id === mission.id
          ? {
              ...item,
              status: "Ouverte",
              color: "#2563eb",
              driver: "Non attribué",
              driverId: null,
            }
          : item
      )
    );

    setApplications((prev) =>
      prev.filter(
        (app) =>
          !(
            String(app.missionId) === String(mission.id) &&
            String(app.driver.id) === String(mission.driverId) &&
            app.status === "Acceptée"
          )
      )
    );

    setSelectedMission((prev) =>
      prev
        ? {
            ...prev,
            status: "Ouverte",
            color: "#2563eb",
            driver: "Non attribué",
            driverId: null,
          }
        : null
    );
  }

  async function deleteMission(missionToDelete) {
  if (!missionToDelete?.id) {
    console.error("Mission sans ID", missionToDelete);
    return;
  }

  const { error } = await supabase
    .from("missions")
    .delete()
    .eq("id", missionToDelete.id);

  if (error) {
    console.error(error);
    alert("Erreur suppression mission");
    return;
  }

  setCreatedMissions((prev) =>
    prev.filter(
      (mission) =>
        String(mission.id) !== String(missionToDelete.id)
    )
  );

  setSelectedMission(null);
}

  async function updateMission() {
  if (!editMission?.id) {
    alert("Mission introuvable");
    return;
  }

  const { error } = await supabase
    .from("missions")
    .update({
      title: editMission.title,
      pickup: editMission.pickup,
      dropoff: editMission.dropoff,
      start_time: editMission.start,
      end_time: editMission.end,
      vehicle: editMission.vehicle,
      passengers: editMission.passengers,
      price: editMission.price,
      comment: editMission.comment,
      status: editMission.status,
      color:
        editMission.status === "Ouverte"
          ? "#2563eb"
          : editMission.status === "Pourvue"
          ? "#16a34a"
          : "#64748b",
    })
    .eq("id", editMission.id);

  if (error) {
    console.error(error);
    alert("Erreur modification mission");
    return;
  }

  await loadCompanyData();
  setSelectedMission(editMission);
  setEditMission(null);
}

  function calculateDriverMatch(mission, driver) {
  let score = 0;

  const missionDate = String(mission.start || "").slice(0, 10);

  if (driver.availability_days?.includes(missionDate)) score += 30;

  if (
    driver.preferred_departments?.includes(mission.pickupDepartment) ||
    driver.preferred_departments?.includes("France entière") ||
    driver.preferred_departments?.includes("Europe")
  ) {
    score += 25;
  }

  if (
    mission.requiredPermits?.some((permit) =>
      driver.permits?.includes(permit)
    )
  ) {
    score += 20;
  }

  if (
    mission.requiredDocuments?.includes("FCO") &&
    driver.fco_status === "À jour"
  ) {
    score += 10;
  }

  if (
    mission.requiredDocuments?.includes("RCPRO") &&
    driver.rcpro_status === "Oui"
  ) {
    score += 10;
  }

  if (driver.mission_types?.includes(mission.type)) score += 5;

  return score;
}

function getRecommendedDrivers(mission) {
  return drivers
    .map((driver) => ({
      ...driver,
      matchScore: calculateDriverMatch(mission, driver),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

  const allMissions = createdMissions;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Shiftly</h2>

        <nav>
          <button className="active">Dashboard</button>

          <button onClick={() => navigate("/company/create-mission")}>
            Créer mission
          </button>

          <button
  className="missions-menu-btn"
  onClick={() => navigate("/company/missions")}
>
  <span>Missions</span>

  <div className="menu-badges">
    <span className="assigned-badge">
      {
        createdMissions.filter(
          (mission) =>
            mission.driver &&
            mission.driver !== "Non attribué"
        ).length
      }
    </span>

    <span className="waiting-badge">
      {
        createdMissions.filter(
          (mission) =>
            !mission.driver ||
            mission.driver === "Non attribué"
        ).length
      }
    </span>
  </div>
</button>

<button
  className="notif-btn"
  onClick={() => navigate("/notifications")}
>
  <span>🔔 Notifications</span>

  <span className="notif-badge">
    {notifications.filter((n) => !n.is_read).length}
  </span>
</button>

          <button
  className="billing-menu-btn"
  onClick={() => navigate("/company/billing")}
>
  <span>Facturation</span>

  <span className="billing-badge">
    {
      createdMissions.filter(
        (mission) =>
          mission.status === "Terminée" &&
          mission.invoice_status !== "Payée"
      ).length
    }
  </span>
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
  {companyProfile?.companyName ||
    companyProfile?.email ||
    "entreprise"}{" "}
  👋
</p>
            <h1>Espace entreprise</h1>
          </div>

          <button
            className="create"
            onClick={() => navigate("/company/create-mission")}
          >
            + Publier une mission
          </button>
        </header>

        <section className="cards">
          <div className="card">
            <span>Missions actives</span>
            <strong>{allMissions.length}</strong>
          </div>

          <div className="card">
            <span>Conducteurs proposés</span>
            <strong>
  {createdMissions.length === 0 ? 0 : drivers.length}
</strong>
          </div>

          <div className="card">
            <span>Taux de réponse</span>
            <strong>
  {createdMissions.length === 0
    ? "0%"
    : `${Math.round(
        (createdMissions.filter(
          (mission) =>
            mission.status === "Pourvue"
        ).length /
          createdMissions.length) *
          100
      )}%`}
</strong>
          </div>
        </section>

        <section className="calendar-section">
          <h2>Agenda des missions</h2>

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
              events={allMissions.map((mission) => ({
                title: `${mission.status} · ${mission.title}`,
                start: mission.start,
                end: mission.end,
                color: mission.color,
                extendedProps: mission,
              }))}
              eventClick={(info) => {
                setSelectedMission(info.event.extendedProps);
              }}
            />
          </div>
        </section>

        <section className="mission-grid">
          {allMissions.map((mission) => (
            <div className="mission-tile" key={mission.id || mission.start || mission.title}>
              <span>{mission.status}</span>

              <h3>{mission.title}</h3>

              <p>
                📍 {mission.pickup} → {mission.dropoff}
              </p>

              <p>📅 Départ : {new Date(mission.start).toLocaleString("fr-FR")}</p>

              <p>🔁 Retour : {new Date(mission.end).toLocaleString("fr-FR")}</p>

              <p>💶 {mission.price || "Prix non renseigné"}</p>

              <button onClick={() => setSelectedMission(mission)}>
                Voir détail
              </button>
            </div>
          ))}
        </section>

        {selectedMission && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedMission(null)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-top">
                <div>
                  <span className="status">{selectedMission.status}</span>
                  <h2>{selectedMission.title}</h2>
                </div>

                <button
                  className="close"
                  onClick={() => setSelectedMission(null)}
                >
                  ✕
                </button>
              </div>

              <div className="mission-details">
                <div>
                  <span>Départ</span>
                  <strong>{selectedMission.pickup}</strong>
                </div>

                <div>
                  <span>Arrivée</span>
                  <strong>{selectedMission.dropoff}</strong>
                </div>

                <div>
                  <span>Début</span>
                  <strong>
                    {new Date(selectedMission.start).toLocaleString("fr-FR")}
                  </strong>
                </div>

                <div>
                  <span>Fin</span>
                  <strong>
                    {new Date(selectedMission.end).toLocaleString("fr-FR")}
                  </strong>
                </div>

                <div>
                  <span>Conducteur</span>
                  <strong>{selectedMission.driver}</strong>
                </div>

                <div>
                  <span>Véhicule</span>
                  <strong>{selectedMission.vehicle}</strong>
                </div>

                <div>
                  <span>Type</span>
                  <strong>{selectedMission.type}</strong>
                </div>

                <div>
                  <span>Passagers</span>
                  <strong>{selectedMission.passengers}</strong>
                </div>

                <div>
                  <span>Documents requis</span>
                  <strong>{selectedMission.documents}</strong>
                </div>

                <div>
                  <span>Prix proposé</span>
                  <strong>{selectedMission.price || "Non renseigné"}</strong>
                </div>

                <div className="full-width">
                  <span>Commentaire</span>
                  <strong>
                    {selectedMission.comment || "Aucun commentaire"}
                  </strong>
                </div>
              </div>

<div className="applications-section">
  <h3>Conducteurs recommandés</h3>

  {getRecommendedDrivers(selectedMission).map((driver) => (
    <div className="application-card" key={driver.id}>
      <div>
        <strong>{driver.full_name || "Conducteur"}</strong>

        <p>{driver.city || "Ville non renseignée"}</p>

        <p>
          Match intelligent : {driver.matchScore}%
        </p>
      </div>

      <button
  type="button"
  className={
    missionInvitations.some(
      (invitation) =>
        String(invitation.mission_id) === String(selectedMission.id) &&
        String(invitation.driver_id) === String(driver.id)
    )
      ? "accepted-btn"
      : ""
  }
  disabled={missionInvitations.some(
    (invitation) =>
      String(invitation.mission_id) === String(selectedMission.id) &&
      String(invitation.driver_id) === String(driver.id)
  )}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    inviteDriver(driver, selectedMission);
  }}
>
  {missionInvitations.some(
    (invitation) =>
      String(invitation.mission_id) === String(selectedMission.id) &&
      String(invitation.driver_id) === String(driver.id)
  )
    ? "Invitation envoyée"
    : "Inviter"}
</button>
    </div>
  ))}
</div>

              <div className="applications-section">
                <h3>Candidatures reçues</h3>

                {applications.filter(
                  (app) => String(app.missionId) === String(selectedMission.id)
                ).length === 0 && (
                  <p className="no-app">Aucune candidature pour le moment.</p>
                )}

                {applications
                  .filter(
                    (application) =>
                      String(application.missionId) ===
                      String(selectedMission.id)
                  )
                  .map((application) => (
                    <div className="application-card" key={application.id}>
                      <div>
                        <strong>{application.driver.name}</strong>

                        <p>{application.driver.city}</p>

                        <p>
                          {application.driver.permits} · FCO{" "}
                          {application.driver.fimo}
                        </p>

                        <p>
                          {application.driver.experience} · ShiftScore{" "}
                          {application.driver.shiftScore}
                        </p>
                      </div>

                      {application.status === "Acceptée" ? (
                        <button className="accepted-btn">Acceptée</button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            acceptApplication(application);
                          }}
                        >
                          Accepter
                        </button>
                      )}
                    </div>
                  ))}
              </div>

              <div className="modal-actions">
                {selectedMission.status === "Pourvue" && (
                  <button
                    className="detach-btn"
                    onClick={() => detachDriver(selectedMission)}
                  >
                    Détacher conducteur
                  </button>
                )}

                <button
                  className="secondary-btn"
                  onClick={() => setEditMission(selectedMission)}
                >
                  Modifier
                </button>

                <button
  className="delete-btn"
  onClick={() => setMissionToDelete(selectedMission)}
>
  Supprimer
</button>
              </div>
            </div>
          </div>
        )}

        {editMission && (
          <div className="modal-overlay" onClick={() => setEditMission(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-top">
                <div>
                  <span className="status">Modification</span>
                  <h2>Modifier la mission</h2>
                </div>

                <button className="close" onClick={() => setEditMission(null)}>
                  ✕
                </button>
              </div>

              <div className="edit-grid">
                <input
                  value={editMission.pickup}
                  onChange={(e) =>
                    setEditMission({
                      ...editMission,
                      pickup: e.target.value,
                      title: `${e.target.value} → ${editMission.dropoff}`,
                    })
                  }
                  placeholder="Départ"
                />

                <input
                  value={editMission.dropoff}
                  onChange={(e) =>
                    setEditMission({
                      ...editMission,
                      dropoff: e.target.value,
                      title: `${editMission.pickup} → ${e.target.value}`,
                    })
                  }
                  placeholder="Arrivée"
                />

                <input
  type="datetime-local"
  value={
    editMission.start
      ? editMission.start.slice(0, 16)
      : ""
  }
  onChange={(e) =>
    setEditMission({
      ...editMission,
      start: e.target.value,
    })
  }
/>

<input
  type="datetime-local"
  value={
    editMission.end
      ? editMission.end.slice(0, 16)
      : ""
  }
  onChange={(e) =>
    setEditMission({
      ...editMission,
      end: e.target.value,
    })
  }
/>

                <input
                  value={editMission.vehicle}
                  onChange={(e) =>
                    setEditMission({
                      ...editMission,
                      vehicle: e.target.value,
                    })
                  }
                  placeholder="Véhicule"
                />

                <input
                  value={editMission.passengers}
                  onChange={(e) =>
                    setEditMission({
                      ...editMission,
                      passengers: e.target.value,
                    })
                  }
                  placeholder="Passagers"
                />

                <input
                  value={editMission.price || ""}
                  onChange={(e) =>
                    setEditMission({
                      ...editMission,
                      price: e.target.value,
                    })
                  }
                  placeholder="Prix proposé"
                />

                <textarea
                  value={editMission.comment || ""}
                  onChange={(e) =>
                    setEditMission({
                      ...editMission,
                      comment: e.target.value,
                    })
                  }
                  placeholder="Commentaire / consignes particulières"
                  className="full-width"
                />

                <select
                  value={editMission.status}
                  onChange={(e) =>
                    setEditMission({
                      ...editMission,
                      status: e.target.value,
                      color:
                        e.target.value === "Ouverte"
                          ? "#2563eb"
                          : e.target.value === "Pourvue"
                          ? "#16a34a"
                          : "#64748b",
                    })
                  }
                >
                  <option>Ouverte</option>
                  <option>Pourvue</option>
                  <option>Terminée</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  className="secondary-btn"
                  onClick={() => setEditMission(null)}
                >
                  Annuler
                </button>

                <button onClick={updateMission}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {missionToDelete && (
  <div className="confirm-overlay">
    <div className="confirm-box">
      <h3>Supprimer cette mission ?</h3>

      <p>Cette action est définitive.</p>

      <div className="confirm-actions">
        <button onClick={() => setMissionToDelete(null)}>
          Annuler
        </button>

        <button
          className="delete-btn"
          onClick={() => {
            deleteMission(missionToDelete);
            setMissionToDelete(null);
          }}
        >
          Confirmer
        </button>
      </div>
    </div>
  </div>
)}
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2,6,23,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 20px;
}

.confirm-box {
  width: 100%;
  max-width: 420px;
  padding: 24px;
  border-radius: 24px;
  background: linear-gradient(180deg, #111827, #0f172a);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
}

.billing-menu-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.billing-badge {
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(249,115,22,0.18);
  color: #fdba74;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.missions-menu-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.menu-badges {
  display: flex;
  gap: 8px;
}

.assigned-badge,
.waiting-badge {
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
}

.assigned-badge {
  background: rgba(22,163,74,0.18);
  color: #86efac;
}

.waiting-badge {
  background: rgba(249,115,22,0.18);
  color: #fdba74;
}

.confirm-actions button {
  flex: 1;
  padding: 13px;
  border-radius: 999px;
  border: none;
  color: white;
  font-weight: 800;
  cursor: pointer;
  background: rgba(255,255,255,0.08);
}

        .dashboard {
          min-height: 100svh;
          display: flex;
          color: white;
          font-family: Inter, Arial, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,0.08), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56,189,248,0.08), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%);
        }

        .sidebar {
          width: 260px;
          padding: 32px;
          background: rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
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

        nav .active,
        .create,
        .mission-tile button,
        .modal-actions button {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
        }

        .logout-btn,
        .delete-btn {
          background: linear-gradient(180deg, #dc2626, #991b1b) !important;
          color: white !important;
          border: none !important;
        }

        .notif-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
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

        .detach-btn {
          background: linear-gradient(180deg, #f97316, #c2410c) !important;
          color: white !important;
          border: none !important;
        }

        .accepted-btn {
          background: linear-gradient(180deg, #16a34a, #15803d) !important;
          cursor: default !important;
        }

        .content {
          flex: 1;
          padding: 40px;
          min-width: 0;
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

        .create {
          padding: 14px 18px;
          border-radius: 999px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-top: 40px;
        }

        .card,
        .mission-tile {
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 18px 45px rgba(0,0,0,0.22);
        }

        .card span,
        .mission-tile p {
          color: #94a3b8;
        }

        .card strong {
          display: block;
          font-size: 38px;
          margin-top: 10px;
        }

        .calendar-section {
          margin-top: 40px;
        }

        .calendar-section h2 {
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
          max-width: 100%;
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
          cursor: pointer;
        }

        .mission-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .mission-tile span {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(37,99,235,0.18);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
        }

        .mission-tile h3 {
          margin: 14px 0 10px;
        }

        .mission-tile button {
          margin-top: 14px;
          width: 100%;
          padding: 12px;
          border-radius: 999px;
          font-weight: 800;
          cursor: pointer;
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
          background: linear-gradient(180deg, #111827, #0f172a);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 28px;
          color: white;
          box-shadow: 0 40px 120px rgba(0,0,0,0.45);
          max-height: calc(100svh - 48px);
overflow-y: auto;
        }

        .modal-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 24px;
        }

        .modal-top h2 {
          margin: 8px 0 0;
          font-size: 32px;
          font-weight: 950;
        }

        .status {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(37,99,235,0.18);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
        }

        .close {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: none;
          background: rgba(255,255,255,0.08);
          color: white;
          cursor: pointer;
        }

        .mission-details,
        .edit-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .mission-details div {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 14px;
        }

        .mission-details span {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 6px;
        }

        .mission-details strong {
          font-size: 14px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .edit-grid input,
        .edit-grid select,
        .edit-grid textarea {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(15,23,42,0.9);
          color: white;
          font-size: 14px;
          outline: none;
        }

        .edit-grid textarea {
          min-height: 110px;
          resize: vertical;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-actions button {
          flex: 1;
          padding: 14px;
          border-radius: 999px;
          font-weight: 800;
          cursor: pointer;
        }

        .secondary-btn {
          background: rgba(255,255,255,0.08) !important;
        }

        .applications-section {
          margin-top: 24px;
        }

        .applications-section h3 {
          margin-bottom: 14px;
        }

        .no-app {
          color: #94a3b8;
        }

        .application-card {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .application-card p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 13px;
        }

        .application-card button {
          padding: 10px 14px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(180deg, #16a34a, #15803d);
          color: white;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .dashboard {
            display: block;
          }

          .sidebar {
            width: 100%;
            padding: 18px 14px;
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
            padding: 11px 13px;
            font-size: 13px;
          }

          .content {
            padding: 22px 12px 40px;
          }

          .top {
            flex-direction: column;
            align-items: stretch;
          }

          .top h1 {
            font-size: 32px;
            line-height: 1;
          }

          .create {
            width: 100%;
          }

          .cards,
          .mission-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 24px;
          }

          .card,
          .mission-tile {
            padding: 18px;
            border-radius: 20px;
          }

          .calendar-section {
            margin-top: 28px;
          }

          .calendar-section h2 {
            font-size: 24px;
          }

          .calendar-card {
            padding: 10px;
            border-radius: 18px;
            overflow: hidden;
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

          .fc .fc-daygrid-day-number {
            font-size: 11px;
            padding: 3px;
          }

          .fc .fc-event {
            font-size: 9px !important;
            padding: 2px 4px !important;
            white-space: normal !important;
            line-height: 1.2;
          }

          .modal {
            max-height: 88svh;
            overflow-y: auto;
            padding: 20px;
            border-radius: 22px;
          }

          .modal-top h2 {
            font-size: 24px;
          }

          .mission-details,
          .edit-grid {
            grid-template-columns: 1fr;
          }

          .modal-actions,
          .application-card {
            flex-direction: column;
            align-items: stretch;
          }

          .application-card button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}