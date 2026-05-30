import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Building2,
  Bus,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";
import { sendNotificationEmail } from "../lib/notifications";
import { sendAdminNotificationEmail } from "../lib/notifications";

const acceptedStatuses = ["Acceptée", "AcceptÃ©e"];

export default function CompanyDashboard() {
  const navigate = useNavigate();

  const [selectedMission, setSelectedMission] = useState(null);
  const [editMission, setEditMission] = useState(null);
  const [createdMissions, setCreatedMissions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [missionInvitations, setMissionInvitations] = useState([]);
  const [missionToDelete, setMissionToDelete] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [missionSearch, setMissionSearch] = useState("");
  const [missionFilter, setMissionFilter] = useState("all");
  const [popup, setPopup] = useState(null);
  const [compactCalendar, setCompactCalendar] = useState(false);

  const actionLockRef = useRef(false);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");

    const updateCalendarMode = () => setCompactCalendar(mediaQuery.matches);
    updateCalendarMode();

    mediaQuery.addEventListener("change", updateCalendarMode);
    return () => mediaQuery.removeEventListener("change", updateCalendarMode);
  }, []);

  const stats = useMemo(() => {
    const open = createdMissions.filter((mission) => mission.status === "Ouverte").length;
    const assigned = createdMissions.filter((mission) => mission.status === "Pourvue").length;
    const pendingApplications = applications.filter((application) => application.status === "En attente").length;

    return {
      total: createdMissions.length,
      open,
      assigned,
      pendingApplications,
      responseRate: createdMissions.length ? Math.round((assigned / createdMissions.length) * 100) : 0,
    };
  }, [createdMissions, applications]);

  const filteredMissions = createdMissions.filter((mission) => {
    const value = `${mission.title || ""} ${mission.pickup || ""} ${mission.dropoff || ""} ${mission.driver || ""}`.toLowerCase();
    const matchesSearch = value.includes(missionSearch.toLowerCase());
    const status = statusKey(mission.status);

    if (missionFilter === "open") return matchesSearch && status === "open";
    if (missionFilter === "assigned") return matchesSearch && status === "assigned";
    if (missionFilter === "completed") return matchesSearch && status === "completed";
    return matchesSearch;
  });


  const calendarMissions = useMemo(() => {
    return createdMissions.filter((mission) => {
      const status = statusKey(mission.status);
      const text = normalize(`${mission.status || ""} ${mission.title || ""} ${mission.pickup || ""} ${mission.dropoff || ""}`);

      return status !== "cancelled" && !text.includes("annul");
    });
  }, [createdMissions]);

  useEffect(() => {
    if (!selectedMission) return;

    const updatedMission = createdMissions.find(
      (mission) => String(mission.id) === String(selectedMission.id)
    );

    if (updatedMission) setSelectedMission(updatedMission);
  }, [createdMissions, selectedMission]);

  const loadCompanyData = useCallback(async () => {
    const user = await getCurrentUser();

    if (!user) return;

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
      companyName: profileData.company_name || profileData.full_name || user.email || "Entreprise",
      verified: profileData.company_verified || profileData.is_verified || profileData.verified || false,
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

    const { data: invitationsData, error: invitationsError } = await supabase
      .from("mission_invitations")
      .select("*");

    if (invitationsError) {
      console.error(invitationsError);
      return;
    }

    const { data: notificationsData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id);

    const formattedMissions = (missionsData || []).map((mission) => ({
      id: mission.id,
      title: mission.title,
      status: normalizeStatus(mission.status),
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

    const formattedApplications = dedupeApplications((applicationsData || []).map((application) => ({
      id: application.id,
      missionId: application.mission_id,
      status: normalizeStatus(application.status),
      driver: {
        id: application.driver_id,
        name: application.driver_name,
        city: application.driver_city,
        permits: application.driver_permits,
        fimo: application.driver_fimo,
        experience: application.driver_experience,
        shiftScore: application.driver_shift_score,
        availability: application.driver_availability,
        verified: isDriverVerified(
          driversData?.find((driver) => String(driver.id) === String(application.driver_id))
        ),
      },
    })));

    setCreatedMissions(formattedMissions);
    setApplications(formattedApplications);
    setDrivers(driversData || []);
    setMissionInvitations(invitationsData || []);
    setNotifications(notificationsData || []);
  }, []);

  useEffect(() => {
    let reloadTimeout = null;

    const reloadSafely = () => {
      if (actionLockRef.current) return;

      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(loadCompanyData, 500);
    };

    const missionsChannel = supabase
      .channel("missions-live-company")
      .on("postgres_changes", { event: "*", schema: "public", table: "missions" }, reloadSafely)
      .subscribe();

    const applicationsChannel = supabase
      .channel("applications-live-company")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, reloadSafely)
      .subscribe();

    const invitationsChannel = supabase
      .channel("invitations-live-company")
      .on("postgres_changes", { event: "*", schema: "public", table: "mission_invitations" }, reloadSafely)
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
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    const { error } = await supabase.from("mission_invitations").insert([
      {
        mission_id: mission.id,
        company_id: user.id,
        driver_id: driver.id,
        driver_name: driver.full_name || "Conducteur",
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erreur invitation");
      return;
    }

    const notification = {
  user_id: driver.id,
  title: "Nouvelle mission proposée",
  message: `${companyProfile?.companyName || "Une entreprise"} vous propose une mission : ${mission.title}`,
  type: "mission_invitation",
};

await supabase.from("notifications").insert([notification]);
await sendNotificationEmail({
  userId: notification.user_id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
});

    setPopup({
      type: "success",
      title: "Invitation envoyée",
      message: `${driver.full_name || "Le conducteur"} recevra la proposition.`,
    });

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
      .update({ status: "Acceptée" })
      .eq("id", application.id);

    if (appError) {
      console.error(appError);
      alert("Erreur mise à jour candidature");
      return;
    }

    const notification = {
  user_id: application.driver.id,
  title: "Candidature acceptée",
  message: `Votre candidature a été acceptée pour la mission : ${selectedMission?.title || "Mission"}`,
  type: "application_accepted",
};

await supabase.from("notifications").insert([notification]);
await sendNotificationEmail({
  userId: notification.user_id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
});

    setPopup({
      type: "success",
      title: "Mission attribuée",
      message: `${application.driver.name || "Le conducteur"} est maintenant affecté à la mission.`,
    });

    setSelectedMission(null);
    await loadCompanyData();
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
      .in("status", acceptedStatuses);

    setPopup({
      type: "success",
      title: "Conducteur détaché",
      message: "La mission est de nouveau ouverte.",
    });

    await loadCompanyData();
  }

  async function deleteMission(target) {
    if (!target?.id) return;

    const { error } = await supabase
      .from("missions")
      .update({
        status: "Annulée",
        color: "#ef4444",
      })
      .eq("id", target.id);

    if (error) {
      console.error("Erreur annulation mission :", error);
      alert("Erreur annulation mission");
      return;
    }

    setPopup({
      type: "success",
      title: "Mission annulée",
      message: "La mission a été déplacée dans les missions annulées.",
    });

    setSelectedMission(null);
    await loadCompanyData();
  }

  async function updateMission() {
    if (!editMission?.id) {
      alert("Mission introuvable");
      return;
    }

    const { error } = await supabase
      .from("missions")
      .update({
        title: editMission.title || "",
        pickup: editMission.pickup || "",
        dropoff: editMission.dropoff || "",
        start_time: editMission.start,
        end_time: editMission.end,
        vehicle: editMission.vehicle || "",
        passengers: editMission.passengers || "",
        price: editMission.price || "",
        comment: editMission.comment || "",
        status: editMission.status || "Ouverte",
        color: editMission.status === "Ouverte" ? "#2563eb" : editMission.status === "Pourvue" ? "#16a34a" : "#64748b",
        driver_name: editMission.driver || "Non attribué",
      })
      .eq("id", editMission.id);

    if (error) {
      console.error("Erreur Supabase complète :", JSON.stringify(error, null, 2));
      alert("Erreur modification mission");
      return;
    }

    setPopup({
      type: "success",
      title: "Mission modifiée",
      message: "Les informations de mission ont été enregistrées.",
    });

    await loadCompanyData();
    setSelectedMission(editMission);
    setEditMission(null);
  }

  function calculateDriverMatch(mission, driver) {
    let score = 0;
    const missionDepartment = normalize(mission.pickupDepartment || mission.pickup_department || "");
    const missionType = normalize(mission.type || mission.mission_type || "");
    const driverZones = driver.mobility_zones || driver.preferred_departments || [];
    const driverPermits = driver.permits || [];
    const driverMissionTypes = driver.mission_types || [];
    const requiredPermits = mission.requiredPermits || mission.required_permits || [];
    const requiredDocuments = mission.requiredDocuments || mission.required_documents || [];

    const zoneMatch = driverZones.some((zone) => {
      const normalizedZone = normalize(zone);
      return (
        missionDepartment.includes(normalizedZone) ||
        normalizedZone.includes(missionDepartment) ||
        normalizedZone === "france entiere" ||
        normalizedZone === "europe"
      );
    });

    if (zoneMatch) score += 30;
    if (requiredPermits.some((permit) => driverPermits.includes(permit))) score += 25;
    if (requiredDocuments.includes("FCO") && normalize(driver.fco_status) === "a jour") score += 20;
    if (requiredDocuments.includes("RCPRO") && driver.rcpro_status === "Oui") score += 10;
    if (driverMissionTypes.some((type) => normalize(type) === missionType)) score += 15;

    return score === 0 ? 10 : score;
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

  return (
    <main className="companyPage">
      <aside className="companySidebar">
        <div className="brandBlock">
          <div className="mark">S</div>
          <div>
            <strong>Shiftly</strong>
            <span>Company</span>
          </div>
        </div>

        <nav className="sideNav">
          <button className="active">Dashboard</button>
          <button onClick={() => navigate("/company/profile")}>Profil entreprise</button>
          <button onClick={() => navigate("/company/create-mission")}>Créer mission</button>
          <button onClick={() => navigate("/company/missions")}>Missions</button>
        </nav>

        <button className="logoutButton" onClick={logout}>
          <ArrowLeft size={18} />
          Déconnexion
        </button>
      </aside>

      <section className="companyContent">
        <header className="companyTopbar">
          <div>
            <span className="eyebrow">Espace entreprise</span>
            <h1>
              Bonjour {companyProfile?.companyName || companyProfile?.email || "entreprise"}
              {companyProfile?.verified && <VerifiedCheck label="Entreprise vérifiée" />}
            </h1>
            <p>Pilotez vos missions, candidatures et conducteurs depuis un seul tableau de bord.</p>
          </div>

          <div className="topActions">
            <button className="createButton" onClick={() => navigate("/company/create-mission")}>
              <Plus size={18} />
              Publier une mission
            </button>
            <button className="notificationButton" onClick={() => navigate("/notifications")}>
              <Bell size={20} />
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </button>
          </div>
        </header>

        <section className="statsGrid">
          <StatCard icon={Bus} label="Missions" value={stats.total} />
          <StatCard icon={CalendarDays} label="Ouvertes" value={stats.open} />
          <StatCard icon={UserCheck} label="Pourvues" value={stats.assigned} />
          <StatCard icon={Users} label="Candidatures" value={stats.pendingApplications} />
          <StatCard icon={BadgeCheck} label="Taux de réponse" value={`${stats.responseRate}%`} />
        </section>

        <section className="controlGrid">
          <div className="calendarPanel">
            <div className="panelHeader">
              <div>
                <h2>Agenda des missions</h2>
                <span>{calendarMissions.length} mission(s)</span>
              </div>
            </div>

            <div className="calendarCard">
              <FullCalendar
                key={`${compactCalendar ? "compact" : "desktop"}-${calendarMissions.map((mission) => `${mission.id}:${mission.status}`).join("|")}`}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView={compactCalendar ? "dayGridWeek" : "dayGridMonth"}
                locale="fr"
                height="auto"
                aspectRatio={compactCalendar ? 0.95 : 1.6}
                dayMaxEventRows={compactCalendar ? 2 : 3}
                headerToolbar={{
                  left: "prev,next",
                  center: "title",
                  right: compactCalendar ? "" : "today",
                }}
                buttonText={{ today: "Aujourd'hui" }}
                events={calendarMissions.map((mission) => ({
                  title: `${mission.status} · ${mission.title}`,
                  start: mission.start,
                  end: mission.end,
                  color: mission.status === "Pourvue" ? "#16a34a" : "#2563eb",
                  extendedProps: mission,
                }))}
                eventClick={(info) => setSelectedMission(info.event.extendedProps)}
              />
            </div>
          </div>

          <div className="quickPanel">
            <div className="panelHeader">
              <div>
                <h2>Actions rapides</h2>
                <span>Suivi opérationnel</span>
              </div>
            </div>

            <button onClick={() => navigate("/company/create-mission")}>
              <Plus size={18} />
              Créer une mission
            </button>
            <button onClick={() => navigate("/company/drivers")}>
              <Users size={18} />
              Voir les conducteurs
            </button>
            <button onClick={() => setMissionFilter("open")}>
              <Search size={18} />
              Missions à pourvoir
            </button>
          </div>
        </section>

        <section className="missionsPanel">
          <div className="panelHeader">
            <div>
              <h2>Missions récentes</h2>
              <span>{filteredMissions.length} résultat(s)</span>
            </div>

            <div className="filters">
              <label>
                <Search size={17} />
                <input
                  placeholder="Rechercher une mission..."
                  value={missionSearch}
                  onChange={(event) => setMissionSearch(event.target.value)}
                />
              </label>
              <select value={missionFilter} onChange={(event) => setMissionFilter(event.target.value)}>
                <option value="all">Toutes</option>
                <option value="open">Ouvertes</option>
                <option value="assigned">Pourvues</option>
                <option value="completed">Terminées</option>
              </select>
            </div>
          </div>

          <div className="missionList">
            {filteredMissions.length === 0 && <div className="emptyState">Aucune mission trouvée.</div>}

            {filteredMissions.map((mission) => (
              <MissionRow key={mission.id} mission={mission} onOpen={setSelectedMission} />
            ))}
          </div>
        </section>
      </section>

      {selectedMission && (
        <MissionModal
          mission={selectedMission}
          applications={applications.filter((application) => String(application.missionId) === String(selectedMission.id))}
          recommendedDrivers={getRecommendedDrivers(selectedMission)}
          missionInvitations={missionInvitations}
          onClose={() => setSelectedMission(null)}
          onEdit={() => navigate(`/company/create-mission?missionId=${selectedMission.id}`)}
          onDelete={() => setMissionToDelete(selectedMission)}
          onDetach={() => detachDriver(selectedMission)}
          onAcceptApplication={acceptApplication}
          onInviteDriver={inviteDriver}
        />
      )}

      {editMission && (
        <EditMissionModal
          mission={editMission}
          onChange={setEditMission}
          onClose={() => setEditMission(null)}
          onSave={updateMission}
        />
      )}

      {missionToDelete && (
        <ConfirmModal
          title="Annuler cette mission ?"
          text="Elle ne sera plus proposée aux conducteurs, mais restera visible dans l'historique des missions annulées."
          onCancel={() => setMissionToDelete(null)}
          onConfirm={() => {
            deleteMission(missionToDelete);
            setMissionToDelete(null);
          }}
        />
      )}

      {popup && (
        <div className="modalOverlay">
          <div className="popup">
            <div className="popupIcon">
              <CheckCircle2 size={38} />
            </div>
            <h3>{popup.title}</h3>
            <p>{popup.message}</p>
            <button onClick={() => setPopup(null)}>Fermer</button>
          </div>
        </div>
      )}

      <CompanyStyles />
    </main>
  );
}

function MissionRow({ mission, onOpen }) {
  return (
    <article className="missionRow">
      <div className="rowIcon">
        <Bus size={22} />
      </div>

      <div className="rowMain">
        <strong>{mission.title || "Mission"}</strong>
        <span>{mission.pickup || "Départ"} → {mission.dropoff || "Arrivée"}</span>
        <small>{formatDate(mission.start)} · {mission.price || "Prix non renseigné"}</small>
      </div>

      <div className="rowActions">
        <span className={mission.status === "Pourvue" ? "badge success" : "badge"}>
          {mission.status || "Statut"}
        </span>
        <button onClick={() => onOpen(mission)}>
          <Eye size={17} />
          Piloter
        </button>
      </div>
    </article>
  );
}

function MissionModal({
  mission,
  applications,
  recommendedDrivers,
  missionInvitations,
  onClose,
  onEdit,
  onDelete,
  onDetach,
  onAcceptApplication,
  onInviteDriver,
}) {
  return (
    <div className="modalOverlay">
      <div className="missionModal">
        <button className="closeButton" onClick={onClose}>
          <X size={20} />
        </button>

        <span className="modalEyebrow">{mission.status}</span>
        <h2>{mission.title}</h2>

        <div className="detailGrid">
          <Detail icon={MapPin} label="Trajet" value={`${mission.pickup || "Départ"} → ${mission.dropoff || "Arrivée"}`} />
          <Detail icon={CalendarDays} label="Départ" value={formatDate(mission.start)} />
          <Detail icon={CalendarDays} label="Retour" value={formatDate(mission.end)} />
          <Detail icon={Bus} label="Véhicule" value={mission.vehicle || "Non renseigné"} />
          <Detail icon={Users} label="Passagers" value={mission.passengers || "Non renseigné"} />
          <Detail icon={ShieldCheck} label="Conducteur" value={mission.driver || "Non attribué"} />
        </div>

        <div className="modalActions">
          <button className="primaryAction" onClick={onEdit}>
            <Edit3 size={18} />
            Modifier
          </button>
          {mission.driverId && (
            <button className="warningAction" onClick={onDetach}>
              Détacher conducteur
            </button>
          )}
          <button className="dangerAction" onClick={onDelete}>
            <Trash2 size={18} />
            Annuler
          </button>
        </div>

        <section className="modalSection">
          <h3>Candidatures reçues</h3>
          {applications.length === 0 && <p className="emptyText">Aucune candidature pour cette mission.</p>}
          {applications.map((application) => (
            <div className="candidateCard" key={application.id}>
              <div>
                <strong>{application.driver.name || "Conducteur"}</strong>
                {application.driver.verified && <span className="verifiedDriverBadge">Profil vérifié</span>}
                <span>{application.driver.city || "Ville non renseignée"} · Score {application.driver.shiftScore ?? 0}</span>
              </div>
              {acceptedStatuses.includes(application.status) ? (
                <span className="badge success">Acceptée</span>
              ) : (
                <button onClick={() => onAcceptApplication(application)}>Accepter</button>
              )}
            </div>
          ))}
        </section>

        <section className="modalSection">
          <h3>Conducteurs recommandés</h3>
          {recommendedDrivers.length === 0 && <p className="emptyText">Aucun conducteur disponible.</p>}
          {recommendedDrivers.map((driver) => {
            const alreadyInvited = missionInvitations.some(
              (invitation) =>
                String(invitation.mission_id) === String(mission.id) &&
                String(invitation.driver_id) === String(driver.id)
            );

            return (
              <div className="candidateCard" key={driver.id}>
                <div>
                  <strong>{driver.full_name || "Conducteur"}</strong>
                  {isDriverVerified(driver) && <span className="verifiedDriverBadge">Profil vérifié</span>}
                  <span>{driver.city || "Ville non renseignée"} · Match {driver.matchScore}%</span>
                </div>
                <button disabled={alreadyInvited} onClick={() => onInviteDriver(driver, mission)}>
                  {alreadyInvited ? "Déjà invité" : "Inviter"}
                </button>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

function EditMissionModal({ mission, onChange, onClose, onSave }) {
  function patch(field, value) {
    const next = { ...mission, [field]: value };

    if (field === "pickup" || field === "dropoff") {
      next.title = `${field === "pickup" ? value : mission.pickup} → ${field === "dropoff" ? value : mission.dropoff}`;
    }

    onChange(next);
  }

  return (
    <div className="modalOverlay">
      <div className="missionModal">
        <button className="closeButton" onClick={onClose}>
          <X size={20} />
        </button>
        <span className="modalEyebrow">Modification</span>
        <h2>Modifier la mission</h2>

        <div className="editGrid">
          <input value={mission.pickup || ""} onChange={(event) => patch("pickup", event.target.value)} placeholder="Départ" />
          <input value={mission.dropoff || ""} onChange={(event) => patch("dropoff", event.target.value)} placeholder="Arrivée" />
          <input type="datetime-local" value={mission.start ? mission.start.slice(0, 16) : ""} onChange={(event) => patch("start", event.target.value)} />
          <input type="datetime-local" value={mission.end ? mission.end.slice(0, 16) : ""} onChange={(event) => patch("end", event.target.value)} />
          <input value={mission.vehicle || ""} onChange={(event) => patch("vehicle", event.target.value)} placeholder="Véhicule" />
          <input value={mission.passengers || ""} onChange={(event) => patch("passengers", event.target.value)} placeholder="Passagers" />
          <input value={mission.price || ""} onChange={(event) => patch("price", event.target.value)} placeholder="Prix proposé" />
          <select value={mission.status || "Ouverte"} onChange={(event) => patch("status", event.target.value)}>
            <option>Ouverte</option>
            <option>Pourvue</option>
            <option>Terminée</option>
          </select>
          <textarea className="fullWidth" value={mission.comment || ""} onChange={(event) => patch("comment", event.target.value)} placeholder="Commentaire / consignes particulières" />
        </div>

        <div className="modalActions">
          <button className="secondaryAction" onClick={onClose}>Annuler</button>
          <button className="primaryAction" onClick={onSave}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, text, onCancel, onConfirm }) {
  return (
    <div className="modalOverlay">
      <div className="confirmModal">
        <div className="confirmIcon">
          <Trash2 size={26} />
        </div>
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="modalActions">
          <button className="secondaryAction" onClick={onCancel}>Garder la mission</button>
          <button className="dangerAction" onClick={onConfirm}>Confirmer l'annulation</button>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="detailItem">
      <Icon size={19} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="statCard">
      <div className="statIcon">
        <Icon size={22} />
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function VerifiedCheck({ label = "Vérifié" }) {
  return (
    <span className="verifiedCheck" title={label} aria-label={label}>
      <BadgeCheck size={18} />
    </span>
  );
}

function CompanyStyles() {
  return (
    <style>{`
      .companyPage {
        min-height: 100svh;
        display: grid;
        grid-template-columns: 280px 1fr;
        background: #f8fafc;
        color: #0f172a;
        font-family: Inter, system-ui, Arial, sans-serif;
      }

      .companyPage button,
      .companyPage input,
      .companyPage select,
      .companyPage textarea {
        font: inherit;
      }

      .companyPage button {
        border: 0;
        cursor: pointer;
      }

      .companyPage button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .companySidebar {
        min-height: 100svh;
        padding: 28px;
        background: #07152f;
        color: white;
        display: flex;
        flex-direction: column;
        gap: 30px;
      }

      .brandBlock {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mark {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        background: #2563eb;
        font-size: 30px;
        font-weight: 950;
        font-style: italic;
      }

      .brandBlock strong {
        display: block;
        font-size: 28px;
        font-style: italic;
        letter-spacing: -0.07em;
        line-height: 0.9;
      }

      .brandBlock span {
        display: inline-flex;
        margin-top: 7px;
        padding: 4px 8px;
        border-radius: 7px;
        background: #2563eb;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .sideNav {
        display: grid;
        gap: 8px;
      }

      .sideNav button,
      .logoutButton {
        display: flex;
        align-items: center;
        gap: 11px;
        min-height: 46px;
        border-radius: 13px;
        padding: 12px 14px;
        background: transparent;
        color: #cbd5e1;
        font-size: 15px;
        font-weight: 780;
        line-height: 1.15;
        text-align: left;
      }

      .sideNav .active,
      .sideNav button:hover {
        background: #2563eb;
        color: white;
      }

      .logoutButton {
        margin-top: 8px;
        background: rgba(239, 68, 68, 0.1);
        color: #fecaca;
      }

      .companyContent {
        padding: 30px;
        overflow: auto;
      }

      .companyTopbar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 20px;
      }

      .eyebrow {
        display: inline-flex;
        margin-bottom: 10px;
        padding: 7px 11px;
        border-radius: 999px;
        background: #dbeafe;
        color: #2563eb;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .companyTopbar h1 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        font-size: clamp(24px, 3vw, 34px);
        line-height: 1.08;
        letter-spacing: -0.05em;
      }

      .verifiedCheck {
        width: 26px;
        height: 26px;
        display: inline-grid;
        place-items: center;
        border-radius: 999px;
        background: #22c55e;
        color: white;
        vertical-align: middle;
        box-shadow: 0 8px 18px rgba(34, 197, 94, 0.22);
      }

      .companyTopbar p {
        margin: 12px 0 0;
        color: #64748b;
        line-height: 1.6;
      }

      .topActions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .createButton,
      .notificationButton,
      .rowActions button,
      .primaryAction,
      .candidateCard button,
      .popup button {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 999px;
        padding: 0 15px;
        background: #2563eb;
        color: white;
        font-weight: 950;
      }

      .notificationButton {
        position: relative;
        width: 44px;
        padding: 0;
        background: white;
        color: #0f172a;
        border: 1px solid #dbe3ee !important;
      }

      .notificationButton span {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 21px;
        height: 21px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: #ef4444;
        color: white;
        font-size: 11px;
        font-weight: 950;
      }

      .statsGrid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }

      .statCard,
      .calendarPanel,
      .quickPanel,
      .missionsPanel {
        background: white;
        border: 1px solid #dbe3ee;
        box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06);
      }

      .statCard {
        padding: 18px;
        border-radius: 22px;
      }

      .statIcon {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 13px;
        background: #dbeafe;
        color: #2563eb;
        margin-bottom: 12px;
      }

      .statCard strong {
        display: block;
        font-size: 30px;
        letter-spacing: -0.05em;
      }

      .statCard span {
        color: #64748b;
        font-size: 13px;
        font-weight: 800;
      }

      .controlGrid {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 18px;
        margin-bottom: 18px;
      }

      .calendarPanel,
      .quickPanel,
      .missionsPanel {
        border-radius: 26px;
        padding: 22px;
      }

      .panelHeader {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 18px;
        margin-bottom: 18px;
      }

      .panelHeader h2 {
        margin: 0;
        font-size: 24px;
        letter-spacing: -0.04em;
      }

      .panelHeader span {
        color: #64748b;
        font-size: 13px;
        font-weight: 800;
      }

      .calendarCard {
        width: 100%;
        overflow: hidden;
      }

      .fc {
        width: 100%;
        min-width: 0;
        font-family: Inter, system-ui, Arial, sans-serif;
      }

      .fc .fc-toolbar-title {
        font-size: 22px;
        font-weight: 950;
        color: #0f172a;
      }

      .fc .fc-button {
        background: #0f172a !important;
        border: none !important;
        border-radius: 999px !important;
        font-weight: 850 !important;
      }

      .fc .fc-event {
        border: none !important;
        border-radius: 999px !important;
        padding: 3px 7px !important;
        font-weight: 850 !important;
      }

      .quickPanel {
        display: grid;
        gap: 10px;
        align-content: start;
      }

      .quickPanel button {
        min-height: 48px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: 16px;
        padding: 0 14px;
        background: #f8fafc;
        color: #0f172a;
        border: 1px solid #e5eaf2 !important;
        font-weight: 900;
        text-align: left;
      }

      .filters {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .filters label {
        min-height: 42px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 0 14px;
        background: #f8fafc;
        border: 1px solid #dbe3ee;
        color: #2563eb;
      }

      .filters input,
      .filters select {
        border: 0;
        outline: 0;
        background: transparent;
        color: #0f172a;
      }

      .filters select {
        min-height: 42px;
        border-radius: 999px;
        padding: 0 14px;
        background: #f8fafc;
        border: 1px solid #dbe3ee;
        font-weight: 850;
      }

      .missionList {
        display: grid;
        gap: 10px;
      }

      .missionRow {
        display: grid;
        grid-template-columns: 50px 1fr auto;
        align-items: center;
        gap: 14px;
        padding: 16px;
        border-radius: 20px;
        background: #f8fafc;
        border: 1px solid #e5eaf2;
      }

      .rowIcon {
        width: 50px;
        height: 50px;
        display: grid;
        place-items: center;
        border-radius: 16px;
        background: #dbeafe;
        color: #2563eb;
      }

      .rowMain strong {
        display: block;
        margin-bottom: 5px;
      }

      .rowMain span,
      .rowMain small {
        display: block;
        color: #64748b;
        line-height: 1.45;
      }

      .rowActions {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      .badge {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0 11px;
        background: #dbeafe;
        color: #2563eb;
        font-size: 12px;
        font-weight: 950;
      }

      .badge.success {
        background: #dcfce7;
        color: #166534;
      }

      .emptyState,
      .emptyText {
        color: #64748b;
        font-weight: 780;
      }

      .emptyState {
        padding: 20px;
        border-radius: 18px;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
      }

      .modalOverlay {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(15, 23, 42, 0.62);
        backdrop-filter: blur(8px);
        overflow-y: auto;
      }

      .missionModal,
      .confirmModal,
      .popup {
        width: min(720px, 100%);
        border-radius: 28px;
        background: white;
        color: #0f172a;
        box-shadow: 0 28px 90px rgba(15, 23, 42, 0.28);
      }

      .missionModal {
        position: relative;
        padding: 28px;
        max-height: calc(100svh - 48px);
        overflow-y: auto;
      }

      .closeButton {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: #f1f5f9;
        color: #0f172a;
      }

      .modalEyebrow {
        display: inline-flex;
        padding: 7px 11px;
        border-radius: 999px;
        background: #dbeafe;
        color: #2563eb;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .missionModal h2 {
        margin: 16px 44px 20px 0;
        font-size: 34px;
        line-height: 1;
        letter-spacing: -0.055em;
      }

      .detailGrid,
      .editGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .detailItem {
        display: flex;
        gap: 10px;
        padding: 14px;
        border-radius: 18px;
        background: #f8fafc;
        border: 1px solid #e5eaf2;
      }

      .detailItem svg {
        color: #2563eb;
        flex: 0 0 auto;
      }

      .detailItem span {
        display: block;
        color: #64748b;
        font-size: 12px;
        font-weight: 900;
      }

      .detailItem strong {
        display: block;
        margin-top: 3px;
        font-size: 14px;
      }

      .modalActions {
        display: flex;
        gap: 10px;
        margin-top: 18px;
        flex-wrap: wrap;
      }

      .warningAction,
      .dangerAction,
      .secondaryAction {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 999px;
        padding: 0 15px;
        font-weight: 950;
      }

      .warningAction {
        background: #ffedd5;
        color: #c2410c;
      }

      .dangerAction {
        background: #fee2e2;
        color: #b91c1c;
      }

      .secondaryAction {
        background: #f1f5f9;
        color: #0f172a;
      }

      .modalSection {
        margin-top: 22px;
      }

      .modalSection h3 {
        margin: 0 0 12px;
        font-size: 20px;
        letter-spacing: -0.035em;
      }

      .candidateCard {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px;
        border-radius: 18px;
        background: #f8fafc;
        border: 1px solid #e5eaf2;
        margin-bottom: 10px;
      }

      .candidateCard strong {
        display: block;
      }

      .candidateCard span {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: 13px;
      }

      .verifiedDriverBadge {
        width: fit-content;
        display: inline-flex !important;
        align-items: center;
        min-height: 24px;
        margin-top: 7px !important;
        padding: 0 9px;
        border-radius: 999px;
        background: #dcfce7;
        color: #166534 !important;
        font-size: 12px !important;
        font-weight: 950;
      }

      .editGrid input,
      .editGrid select,
      .editGrid textarea {
        width: 100%;
        border-radius: 15px;
        border: 1px solid #dbe3ee;
        background: #f8fafc;
        color: #0f172a;
        padding: 14px 15px;
        outline: none;
        box-sizing: border-box;
      }

      .editGrid textarea {
        min-height: 110px;
        resize: vertical;
      }

      .fullWidth {
        grid-column: 1 / -1;
      }

      .confirmModal,
      .popup {
        width: min(430px, 100%);
        padding: 24px;
        text-align: center;
      }

      .confirmModal {
        border: 1px solid #dbe3ee;
        border-radius: 24px;
        text-align: left;
      }

      .confirmIcon {
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        margin: 0 0 16px;
        border-radius: 14px;
        background: #eff6ff;
        color: #2563eb;
      }

      .confirmModal h3,
      .popup h3 {
        margin: 0;
        font-size: 28px;
        letter-spacing: -0.05em;
      }

      .confirmModal p,
      .popup p {
        color: #64748b;
        line-height: 1.5;
      }

      .confirmModal .modalActions {
        justify-content: flex-end;
      }

      .confirmModal .secondaryAction,
      .confirmModal .dangerAction {
        min-height: 40px;
        border-radius: 999px;
        padding: 0 14px;
        font-size: 13px;
        font-weight: 850;
      }

      .confirmModal .secondaryAction {
        background: #f8fafc;
        color: #334155;
        border: 1px solid #dbe3ee;
      }

      .confirmModal .dangerAction {
        background: #2563eb;
        color: white;
      }

      .popupIcon {
        width: 72px;
        height: 72px;
        display: grid;
        place-items: center;
        margin: 0 auto 18px;
        border-radius: 999px;
        background: #dcfce7;
        color: #16a34a;
      }

      .popup button {
        width: 100%;
      }

      @media (max-width: 1120px) {
        .companyPage {
          grid-template-columns: 1fr;
        }

        .companySidebar {
          min-height: auto;
        }

        .sideNav {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .logoutButton {
          margin-top: 0;
        }

        .statsGrid {
          grid-template-columns: repeat(3, 1fr);
        }

        .controlGrid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .companyContent,
        .companySidebar {
          padding: 18px;
        }

        .companyTopbar,
        .panelHeader,
        .missionRow,
        .detailGrid,
        .editGrid {
          grid-template-columns: 1fr;
          flex-direction: column;
          align-items: flex-start;
        }

        .sideNav,
        .statsGrid {
          grid-template-columns: 1fr;
        }

        .topActions,
        .createButton,
        .filters,
        .filters label,
        .filters select {
          width: 100%;
        }

        .rowActions,
        .candidateCard,
        .modalActions {
          justify-content: flex-start;
          flex-direction: column;
          align-items: stretch;
        }

        .calendarPanel {
          overflow: hidden;
        }

        .calendarCard {
          width: 100%;
        }

        .fc {
          width: 100%;
          min-width: 0;
        }

        .fc .fc-toolbar {
          gap: 10px;
          align-items: center;
        }

        .fc .fc-toolbar-title {
          font-size: 17px;
          line-height: 1.2;
          text-align: center;
        }

        .fc .fc-button {
          padding: 7px 10px !important;
          font-size: 12px !important;
        }

        .fc .fc-daygrid-day-number {
          padding: 5px;
          font-size: 12px;
        }

        .fc .fc-col-header-cell-cushion {
          font-size: 11px;
          padding: 6px 2px;
        }

        .fc .fc-event {
          max-width: 100%;
          padding: 2px 5px !important;
          font-size: 11px !important;
          line-height: 1.2;
          white-space: normal;
        }

        .fc .fc-event-title {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fc .fc-daygrid-day-frame {
          min-height: 72px;
        }
      }
    `}</style>
  );
}

function formatDate(value) {
  if (!value) return "Date non renseignée";

  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeStatus(status) {
  const key = statusKey(status);

  if (key === "accepted") return "Acceptée";
  if (key === "refused") return "Refusée";
  if (key === "completed") return "Terminée";
  if (key === "cancelled") return "Annulée";
  if (key === "assigned") return "Pourvue";
  if (key === "open") return "Ouverte";
  return status || "Ouverte";
}

function statusKey(status) {
  const value = String(status || "").toLowerCase();
  const clean = normalize(value);

  if (clean === "ouverte") return "open";
  if (clean === "pourvue") return "assigned";
  if (clean === "terminee" || value.includes("termin")) return "completed";
  if (clean === "annulee" || value.includes("annul")) return "cancelled";
  if (clean === "acceptee" || value.includes("accept")) return "accepted";
  if (clean === "refusee" || value.includes("refus")) return "refused";
  return clean;
}
function isCancelledMission(mission) {
  const status = statusKey(mission?.status);
  const text = normalize(`
    ${mission?.status || ""}
    ${mission?.title || ""}
    ${mission?.pickup || ""}
    ${mission?.dropoff || ""}
  `);

  return status === "cancelled" || text.includes("annul");
}

function dedupeApplications(applications) {
  const byMissionAndDriver = new Map();

  applications.forEach((application) => {
    const key = `${application.missionId}-${application.driver.id}`;
    if (!byMissionAndDriver.has(key)) byMissionAndDriver.set(key, application);
  });

  return Array.from(byMissionAndDriver.values());
}

function isDriverVerified(driver) {
  if (!driver) return false;

  if (
    driver.driver_verified ||
    driver.profile_verified ||
    driver.is_verified ||
    driver.verified
  ) {
    return true;
  }

  const permits = Array.isArray(driver.permits) ? driver.permits : [];
  const hasPermit = permits.length > 0 || Boolean(driver.driver_permits);
  const fcoReady = normalize(driver.fco_status || driver.driver_fimo).includes("jour");
  const hasIdentity = Boolean(driver.full_name || driver.driver_name);

  return hasIdentity && hasPermit && fcoReady;
}
