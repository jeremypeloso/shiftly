import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Bell,
  Bus,
  CalendarDays,
  ChevronRight,
  Clock3,
  Home,
  MapPin,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";
import { sendNotificationEmail } from "../lib/notifications";

const acceptedStatuses = ["Acceptée", "AcceptÃ©e"];
const refusedStatuses = ["Refusée", "RefusÃ©e"];

export default function DriverDashboard() {
  const navigate = useNavigate();

  const [openMissions, setOpenMissions] = useState([]);
  const [myMissions, setMyMissions] = useState([]);
  const [driverProfile, setDriverProfile] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [applyingMissionId, setApplyingMissionId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [applicationNotice, setApplicationNotice] = useState(null);

  const actionLockRef = useRef(false);
  const loadIdRef = useRef(0);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const pendingInvitations = invitations.filter(
    (invitation) =>
      !acceptedStatuses.includes(invitation.status) &&
      !refusedStatuses.includes(invitation.status)
  );

  const recommendedMission = openMissions[0];

  const weekDays = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() + index);
      const iso = date.toISOString().slice(0, 10);
      const booked = myMissions.some((mission) => String(mission.start || "").slice(0, 10) === iso);

      return {
        day: date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
        date: date.getDate(),
        active: index === 0,
        booked,
      };
    });
  }, [myMissions]);

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
      driver.preferredDepartments?.includes("France entiÃ¨re") ||
      driver.preferredDepartments?.includes("Europe")
    ) {
      score += 25;
    }

    if (mission.required_permits?.some((permit) => driver.permits?.includes(permit))) {
      score += 20;
    }

    if (mission.required_documents?.includes("FCO") && driver.fcoStatus === "À jour") {
      score += 10;
    }

    if (mission.required_documents?.includes("RCPRO") && driver.rcproStatus === "Oui") {
      score += 10;
    }

    if (driver.missionTypes?.includes(mission.mission_type)) score += 5;

    return score;
  }

  const loadDriverData = useCallback(async () => {
    const loadId = ++loadIdRef.current;
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
      shiftScore: profileData.shift_score ?? 0,
      verified: isDriverProfileVerified(profileData),
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

    const formattedMissions = (missionsData || []).map((mission) => ({
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
      applied: (applicationsData || []).some(
        (application) =>
          String(application.mission_id) === String(mission.id) &&
          String(application.driver_id) === String(currentDriver.id) &&
          (application.status === "En attente" || acceptedStatuses.includes(application.status))
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
        (mission) => String(mission.driverId) === String(currentDriver.id) && mission.status === "Pourvue"
      )
    );
  }, []);

  useEffect(() => {
    let reloadTimeout = null;

    loadDriverData();
    loadNotifications();

    const interval = setInterval(loadNotifications, 5000);

    const reloadSafely = () => {
      if (actionLockRef.current) return;

      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(loadDriverData, 500);
    };

    const missionsChannel = supabase
      .channel("missions-live-driver")
      .on("postgres_changes", { event: "*", schema: "public", table: "missions" }, reloadSafely)
      .subscribe();

    const applicationsChannel = supabase
      .channel("applications-live-driver")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, reloadSafely)
      .subscribe();

    const invitationsChannel = supabase
      .channel("invitations-live-driver")
      .on("postgres_changes", { event: "*", schema: "public", table: "mission_invitations" }, reloadSafely)
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
    setApplyingMissionId(mission.id);

    try {
      if (!driverProfile) {
        alert("Profil conducteur non chargé");
        return;
      }

      if (mission.applied) {
        showApplicationNotice({
          type: "info",
          title: "Candidature déjà envoyée",
          message: "Tu as déjà postulé à cette mission. Elle reste visible avec le statut correspondant.",
        });
        markMissionAsApplied(mission.id);
        return;
      }

      const { data: existingApplications, error: existingError } = await supabase
        .from("applications")
        .select("id")
        .eq("mission_id", mission.id)
        .eq("driver_id", driverProfile.id)
        .limit(1);

      if (existingError) {
        console.error(existingError);
        alert("Erreur vérification candidature");
        return;
      }

      if (existingApplications?.length) {
        markMissionAsApplied(mission.id);
        showApplicationNotice({
          type: "info",
          title: "Candidature déjà envoyée",
          message: "Tu avais déjà postulé à cette mission. Aucun doublon n'a été créé.",
        });
        return;
      }

      markMissionAsApplied(mission.id);

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

      if (error) {
        console.error(error);
        markMissionAsApplied(mission.id, false);
        alert("Erreur candidature");
        return;
      }

      const notification = {
  user_id: mission.companyId,
  title: "Nouvelle candidature",
  message: `${driverProfile.name || "Un conducteur"} a postulé à votre mission : ${mission.title}`,
  type: "application",
};

await supabase.from("notifications").insert([notification]);
await sendNotificationEmail({
  userId: notification.user_id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
});

      await loadDriverData();
      showApplicationNotice({
        type: "success",
        title: "Candidature envoyée",
        message: `Ta candidature pour "${mission.title}" a bien été transmise à l'entreprise.`,
      });
    } finally {
      actionLockRef.current = false;
      setActionLoading(false);
      setApplyingMissionId(null);
    }
  }

  function showApplicationNotice(notice) {
    setApplicationNotice(notice);
    window.setTimeout(() => setApplicationNotice(null), 4200);
  }

  function markMissionAsApplied(missionId, applied = true) {
    setOpenMissions((prev) =>
      prev.map((item) =>
        String(item.id) === String(missionId)
          ? { ...item, applied }
          : item
      )
    );

    setSelectedMission((prev) =>
      prev && String(prev.id) === String(missionId)
        ? { ...prev, applied }
        : prev
    );
  }

  async function acceptInvitation(invitation) {
    if (actionLockRef.current) return;

    actionLockRef.current = true;
    setActionLoading(true);

    try {
      if (!driverProfile) return;

      const { error: applicationError } = await supabase.from("applications").insert([
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

      const newShiftScore = Math.min(100, (driverProfile.shiftScore ?? 70) + 5);

      const { error: scoreError } = await supabase
        .from("profiles")
        .update({ shift_score: newShiftScore })
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
        .update({ status: "Acceptée" })
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

  return (
    <main className="driverShell">
      <aside className="driverSidebar">
        <div className="driverBrand">
          <div className="driverMark">S</div>
          <div>
            <strong>Shiftly</strong>
            <span>Driver</span>
          </div>
        </div>

        <nav className="driverNav">
          <button className="active" onClick={() => safeNavigate("/driver")}>
            <Home size={18} /> Accueil
          </button>
          <button onClick={() => safeNavigate("/driver/missions")}>
            <Bus size={18} /> Missions
            {myMissions.length > 0 && <em>{myMissions.length}</em>}
          </button>
          <button onClick={() => safeNavigate("/driver/availability")}>
            <CalendarDays size={18} /> Disponibilités
          </button>
          <button onClick={() => safeNavigate("/driver/profile")}>
            <User size={18} /> Profil
          </button>
        </nav>

        <button className="sidebarLogout" onClick={logout}>
          Déconnexion
        </button>
      </aside>

      <section className="driverContent">
        <header className="driverTopbar">
          <div>
            <span className="eyebrow">Espace conducteur</span>
            <h1>
              Bonjour {driverProfile?.name || driverProfile?.fullName || "conducteur"}
              {driverProfile?.verified && <VerifiedCheck label="Profil vérifié" />}
            </h1>
            <p>Suivez vos missions, invitations et disponibilités depuis votre tableau de bord.</p>
          </div>

          <div className="topActions">
            <div className="scorePill">
              <Star size={17} fill="currentColor" />
              ShiftScore {driverProfile?.shiftScore ?? 0}
            </div>

            <button className="notificationButton" onClick={() => navigate("/notifications")}>
              <Bell size={20} />
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </button>
          </div>
        </header>

        <section className="recommendationCard">
          <div>
            <span className="label">Mission recommandée</span>
            <h2>{recommendedMission?.title || "Aucune mission ouverte pour le moment"}</h2>
            <p>
              {recommendedMission
                ? "Cette mission est classée selon tes disponibilités, tes permis, tes documents et ta zone préférée."
                : "Dès qu'une mission compatible arrive, elle apparaîtra ici en priorité."}
            </p>

            <div className="missionMeta">
              <span>
                <Clock3 size={16} />
                {recommendedMission?.start ? formatDateTime(recommendedMission.start) : "En attente"}
              </span>
              <span>
                <MapPin size={16} />
                {recommendedMission?.pickup || "Départ à confirmer"}
              </span>
              <span>
                <ShieldCheck size={16} />
                Match {recommendedMission?.matchScore ?? 0}%
              </span>
            </div>
          </div>

          <div className="priceBox">
            <small>Rémunération</small>
            <strong>{formatPrice(recommendedMission?.price)}</strong>
            <button
              disabled={!recommendedMission || recommendedMission.applied || actionLoading}
              onClick={() => recommendedMission && applyToMission(recommendedMission)}
            >
              {recommendedMission?.applied
                ? "Candidature envoyée"
                : applyingMissionId === recommendedMission?.id
                  ? "Envoi..."
                  : "Postuler"}
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        <section className="driverStats">
          <Stat value={openMissions.length} label="Missions proposées" />
          <Stat value={pendingInvitations.length} label="Invitations reçues" />
          <Stat value={myMissions.length} label="Missions attribuées" />
          <Stat value={`${driverProfile?.shiftScore ?? 0}`} label="ShiftScore" />
        </section>

        <section className="dashboardGrid">
          <div className="panel">
            <div className="panelTitle">
              <div>
                <h3>Invitations entreprises</h3>
                <span>{pendingInvitations.length} invitation(s)</span>
              </div>
            </div>

            <div className="missionList">
              {pendingInvitations.length === 0 && <div className="emptyState">Aucune invitation reçue.</div>}
              {pendingInvitations.slice(0, 3).map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  loading={actionLoading}
                  onAccept={acceptInvitation}
                  onRefuse={refuseInvitation}
                />
              ))}
            </div>
          </div>

          <div className="panel sidePanel">
            <div className="panelTitle">
              <div>
                <h3>Mon planning</h3>
                <span>Cette semaine</span>
              </div>
            </div>

            <div className="calendarMini">
              {weekDays.map((day) => (
                <Day key={`${day.day}-${day.date}`} {...day} />
              ))}
            </div>

            <div className="nextCard">
              <small>Prochaine mission</small>
              <strong>{myMissions[0]?.title || "Aucune mission planifiée"}</strong>
              <span>{myMissions[0]?.start ? formatDateTime(myMissions[0].start) : "Ton agenda est libre"}</span>
            </div>
          </div>
        </section>

        <section className="panel openPanel">
          <div className="panelTitle">
            <div>
              <h3>Missions ouvertes</h3>
              <span>Triées par compatibilité</span>
            </div>
            <button onClick={() => safeNavigate("/driver/open-missions")}>Voir tout</button>
          </div>

          <div className="missionList">
            {openMissions.length === 0 && <div className="emptyState">Aucune mission ouverte pour le moment.</div>}
            {openMissions.slice(0, 5).map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                loading={actionLoading}
                applyingMissionId={applyingMissionId}
                onApply={applyToMission}
                onOpen={setSelectedMission}
              />
            ))}
          </div>
        </section>
      </section>

      {selectedMission && (
        <div className="modalOverlay" onClick={() => setSelectedMission(null)}>
          <div className="missionModal" onClick={(event) => event.stopPropagation()}>
            <button className="closeModal" onClick={() => setSelectedMission(null)}>
              ×
            </button>
            <h2>{selectedMission.title}</h2>
            <p>{selectedMission.pickup} → {selectedMission.dropoff}</p>
            <p>Départ : {formatDateTime(selectedMission.start)}</p>
            <p>Retour : {formatDateTime(selectedMission.end)}</p>
            <p>Véhicule : {selectedMission.vehicle || "Non renseigné"}</p>
            <p>Passagers : {selectedMission.passengers || "Non renseigné"}</p>
            <p>Prix : {formatPrice(selectedMission.price)}</p>
            <p>{selectedMission.comment || "Aucune consigne particulière"}</p>
          </div>
        </div>
      )}

      {applicationNotice && (
        <div className={`applicationNotice ${applicationNotice.type}`}>
          <strong>{applicationNotice.title}</strong>
          <span>{applicationNotice.message}</span>
          <button onClick={() => setApplicationNotice(null)}>OK</button>
        </div>
      )}

      <style>{`
        .driverShell {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 260px 1fr;
          background: #f8fafc;
          color: #0f172a;
          font-family: Inter, system-ui, Arial, sans-serif;
          overflow-x: hidden;
        }

        .driverShell button {
          border: 0;
          font: inherit;
          cursor: pointer;
        }

        .driverShell button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .driverSidebar {
          min-height: 100svh;
          padding: 28px;
          background: #07152f;
          color: white;
          display: flex;
          flex-direction: column;
        }

        .driverBrand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 42px;
        }

        .driverMark {
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

        .driverBrand strong {
          display: block;
          font-size: 28px;
          font-style: italic;
          letter-spacing: -0.07em;
          line-height: .9;
        }

        .driverBrand span {
          display: inline-flex;
          margin-top: 7px;
          padding: 4px 8px;
          border-radius: 7px;
          background: #2563eb;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .driverNav {
          display: grid;
          gap: 8px;
        }

        .driverNav button,
        .sidebarLogout {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 46px;
          padding: 12px 14px;
          border-radius: 13px;
          background: transparent;
          color: #cbd5e1;
          font-weight: 780;
          text-align: left;
        }

        .driverNav button.active,
        .driverNav button:hover {
          background: #2563eb;
          color: white;
        }

        .driverNav em {
          min-width: 24px;
          height: 24px;
          margin-left: auto;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 12px;
          font-style: normal;
          font-weight: 950;
        }

        .sidebarLogout {
          margin-top: 8px;
          width: 100%;
          color: #fecaca;
          background: rgba(239, 68, 68, 0.1);
        }

        .driverContent {
          padding: 30px;
          overflow: auto;
        }

        .driverTopbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
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

        .driverTopbar h1 {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin: 0;
          font-size: clamp(24px, 3vw, 34px);
          line-height: 1.08;
          letter-spacing: -0.05em;
        }

        .driverTopbar p {
          margin: 10px 0 0;
          color: #64748b;
          line-height: 1.6;
        }

        .verifiedCheck {
          width: 20px;
          height: 20px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          background: #22c55e;
          color: white;
          box-shadow: 0 7px 15px rgba(34, 197, 94, 0.22);
        }

        .topActions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .scorePill,
        .notificationButton {
          min-height: 44px;
          border-radius: 999px;
          background: white;
          border: 1px solid #dbe3ee !important;
          color: #0f172a;
          font-weight: 850;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
        }

        .scorePill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          color: #2563eb;
        }

        .notificationButton {
          position: relative;
          width: 44px;
          display: grid;
          place-items: center;
        }

        .notificationButton span {
          position: absolute;
          top: -5px;
          right: -5px;
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

        .recommendationCard {
          display: grid;
          grid-template-columns: 1fr 230px;
          gap: 24px;
          padding: 28px;
          border-radius: 28px;
          background:
            linear-gradient(135deg, rgba(37, 99, 235, .18), transparent 55%),
            #0f172a;
          color: white;
          box-shadow: 0 24px 70px rgba(15, 23, 42, .16);
        }

        .label {
          display: inline-flex;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(37, 99, 235, .28);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .recommendationCard h2 {
          margin: 16px 0 10px;
          font-size: clamp(28px, 4vw, 40px);
          letter-spacing: -0.06em;
        }

        .recommendationCard p {
          max-width: 640px;
          color: #cbd5e1;
          line-height: 1.6;
        }

        .missionMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .missionMeta span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          color: #dbeafe;
          font-size: 13px;
          font-weight: 800;
        }

        .priceBox {
          padding: 20px;
          border-radius: 22px;
          background: white;
          color: #0f172a;
          align-self: stretch;
        }

        .priceBox small {
          color: #64748b;
          font-weight: 800;
        }

        .priceBox strong {
          display: block;
          margin: 6px 0 24px;
          font-size: 36px;
          letter-spacing: -0.06em;
        }

        .priceBox button {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 14px;
          padding: 13px;
          background: #2563eb;
          color: white;
          font-weight: 950;
        }

        .driverStats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin: 18px 0;
        }

        .stat,
        .panel {
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 16px 48px rgba(15, 23, 42, .06);
        }

        .stat {
          padding: 20px;
          border-radius: 22px;
        }

        .stat strong {
          display: block;
          font-size: 30px;
          letter-spacing: -0.05em;
        }

        .stat span {
          color: #64748b;
          font-size: 13px;
          font-weight: 750;
        }

        .dashboardGrid {
          display: grid;
          grid-template-columns: 1.35fr .65fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .panel {
          border-radius: 26px;
          padding: 22px;
        }

        .panelTitle {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .panelTitle h3 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -0.04em;
        }

        .panelTitle span {
          color: #64748b;
          font-size: 13px;
          font-weight: 750;
        }

        .panelTitle button {
          border-radius: 999px;
          padding: 10px 14px;
          background: #dbeafe;
          color: #2563eb;
          font-weight: 900;
        }

        .missionList {
          display: grid;
          gap: 11px;
        }

        .missionRow,
        .inviteRow {
          display: grid;
          grid-template-columns: 46px 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 15px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e5eaf2;
        }

        .missionBody,
        .inviteRow > div:nth-child(2) {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .missionRight {
          min-width: 210px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          align-self: center;
        }

        .missionIcon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #dbeafe;
          color: #2563eb;
        }

        .missionRow strong,
        .inviteRow strong {
          display: block;
          margin-bottom: 4px;
          overflow-wrap: anywhere;
        }

        .missionRow span,
        .inviteRow span {
          color: #64748b;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .missionCompany {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 5px;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        .verifiedCompanyBadge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 24px;
          margin-bottom: 7px;
          padding: 0 9px;
          border-radius: 999px;
          background: #dcfce7;
          color: #166534;
          font-size: 12px;
          font-weight: 950;
        }

        .appliedBadge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          margin-top: 9px;
          padding: 0 10px;
          border-radius: 999px;
          background: #dcfce7;
          color: #166534;
          font-size: 12px;
          font-weight: 950;
        }

        .matchBox {
          min-width: 110px;
          align-self: center;
          text-align: center;
        }

        .matchBox strong {
          color: #2563eb;
          font-size: 18px;
        }

        .missionActions,
        .inviteActions {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }

        .inviteActions {
          margin-top: 10px;
        }

        .missionActions button,
        .inviteActions button {
          border-radius: 999px;
          padding: 10px 13px;
          background: #2563eb;
          color: white;
          font-weight: 900;
          font-size: 13px;
        }

        .missionActions .softButton {
          background: white;
          color: #0f172a;
          border: 1px solid #dbe3ee;
        }

        .inviteActions .refuseButton {
          background: #fee2e2;
          color: #b91c1c;
        }

        .calendarMini {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 9px;
        }

        .day {
          padding: 13px 8px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e5eaf2;
          text-align: center;
        }

        .day span {
          display: block;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .day strong {
          display: block;
          margin-top: 4px;
          font-size: 20px;
        }

        .day.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .day.active span {
          color: #dbeafe;
        }

        .day.booked {
          background: #dbeafe;
          border-color: #bfdbfe;
        }

        .nextCard {
          margin-top: 18px;
          padding: 18px;
          border-radius: 20px;
          background: #0f172a;
          color: white;
        }

        .nextCard small {
          color: #93c5fd;
          font-weight: 850;
        }

        .nextCard strong {
          display: block;
          margin: 8px 0 5px;
          font-size: 20px;
        }

        .nextCard span {
          color: #cbd5e1;
          font-size: 13px;
        }

        .emptyState {
          padding: 18px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          color: #64748b;
          font-weight: 750;
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
        }

        .missionModal {
          position: relative;
          width: min(560px, 100%);
          border-radius: 26px;
          background: white;
          color: #0f172a;
          padding: 28px;
          box-shadow: 0 28px 90px rgba(15, 23, 42, 0.28);
        }

        .missionModal h2 {
          margin: 0 0 16px;
          font-size: 30px;
          letter-spacing: -0.05em;
        }

        .missionModal p {
          color: #475569;
          line-height: 1.5;
        }

        .closeModal {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #0f172a;
          font-size: 24px;
        }

        .applicationNotice {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 70;
          width: min(390px, calc(100vw - 32px));
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 5px 14px;
          padding: 18px;
          border-radius: 20px;
          background: white;
          color: #0f172a;
          border: 1px solid #dbe3ee;
          box-shadow: 0 20px 55px rgba(15, 23, 42, 0.18);
        }

        .applicationNotice.success {
          border-color: #bbf7d0;
        }

        .applicationNotice.info {
          border-color: #bfdbfe;
        }

        .applicationNotice strong {
          display: block;
          font-size: 15px;
          font-weight: 950;
        }

        .applicationNotice span {
          grid-column: 1 / -1;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }

        .applicationNotice button {
          grid-row: 1;
          grid-column: 2;
          width: 38px;
          height: 32px;
          border-radius: 999px;
          background: #2563eb;
          color: white;
          font-size: 12px;
          font-weight: 950;
        }

        @media (max-width: 1040px) {
          .driverShell {
            grid-template-columns: 1fr;
          }

          .driverSidebar {
            min-height: auto;
            padding: 18px;
          }

          .driverBrand {
            margin-bottom: 18px;
          }

          .driverNav {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
          }

          .driverNav button {
            min-width: 0;
            justify-content: center;
            text-align: center;
          }

          .sidebarLogout {
            margin-top: 10px;
          }

          .dashboardGrid,
          .recommendationCard {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          .driverShell {
            display: block;
          }

          .driverSidebar {
            padding: 16px;
            gap: 14px;
          }

          .driverBrand {
            margin-bottom: 10px;
          }

          .driverMark {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            font-size: 26px;
          }

          .driverBrand strong {
            font-size: 24px;
          }

          .driverNav {
            grid-template-columns: 1fr;
          }

          .driverNav button {
            min-height: 44px;
            padding: 10px;
            border-radius: 12px;
            justify-content: flex-start;
            font-size: 13px;
            line-height: 1.15;
          }

          .driverNav button svg {
            flex: 0 0 auto;
          }

          .driverNav em {
            min-width: 22px;
            height: 22px;
            font-size: 11px;
          }

          .driverContent {
            padding: 16px;
          }

          .driverTopbar,
          .panelTitle {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
          }

          .driverTopbar {
            margin-bottom: 16px;
          }

          .driverTopbar h1 {
            font-size: 25px;
            letter-spacing: -0.035em;
          }

          .driverTopbar p {
            font-size: 14px;
            line-height: 1.45;
          }

          .topActions {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 44px;
            gap: 10px;
          }

          .scorePill {
            min-width: 0;
            justify-content: center;
            padding: 0 12px;
            font-size: 13px;
          }

          .recommendationCard {
            gap: 18px;
            padding: 20px;
            border-radius: 22px;
          }

          .recommendationCard h2 {
            margin-top: 12px;
            font-size: 26px;
            line-height: 1.05;
            letter-spacing: -0.035em;
          }

          .recommendationCard p {
            margin-bottom: 0;
            font-size: 14px;
            line-height: 1.45;
          }

          .missionMeta {
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
            margin-top: 16px;
          }

          .missionMeta span {
            width: 100%;
            box-sizing: border-box;
            border-radius: 14px;
          }

          .priceBox {
            padding: 16px;
            border-radius: 18px;
          }

          .priceBox strong {
            margin-bottom: 16px;
            font-size: 30px;
          }

          .priceBox button {
            min-height: 46px;
          }

          .driverStats,
          .missionRow,
          .inviteRow {
            grid-template-columns: 1fr;
          }

          .driverStats {
            gap: 10px;
            margin: 14px 0;
          }

          .stat,
          .panel {
            border-radius: 18px;
          }

          .stat {
            padding: 16px;
          }

          .stat strong {
            font-size: 26px;
          }

          .panel {
            padding: 16px;
          }

          .panelTitle h3 {
            font-size: 21px;
          }

          .panelTitle button {
            width: 100%;
            min-height: 42px;
          }

          .missionRow,
          .inviteRow {
            gap: 12px;
            padding: 14px;
          }

          .missionIcon {
            width: 42px;
            height: 42px;
          }

          .missionCompany,
          .verifiedCompanyBadge,
          .appliedBadge {
            max-width: 100%;
          }

          .matchBox {
            text-align: left;
          }

          .calendarMini {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 6px;
            overflow: visible;
          }

          .day {
            padding: 10px 5px;
            border-radius: 12px;
          }

          .day span {
            font-size: 10px;
          }

          .day strong {
            font-size: 17px;
          }

          .missionRight,
          .missionActions,
          .inviteActions {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .missionRight {
            width: 100%;
            min-width: 0;
            align-items: flex-start;
            gap: 10px;
          }

          .matchBox {
            width: 100%;
            min-width: 0;
          }

          .missionActions,
          .inviteActions {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .missionActions button,
          .inviteActions button {
            width: 100%;
            min-height: 42px;
          }

          .nextCard {
            border-radius: 16px;
          }

          .modalOverlay {
            align-items: end;
            padding: 12px;
          }

          .missionModal {
            width: 100%;
            max-height: calc(100svh - 24px);
            overflow-y: auto;
            border-radius: 22px;
            padding: 22px 18px;
          }

          .missionModal h2 {
            margin-right: 44px;
            font-size: 24px;
            line-height: 1.08;
          }

          .applicationNotice {
            right: 12px;
            bottom: 12px;
            width: calc(100vw - 24px);
            border-radius: 16px;
            box-sizing: border-box;
          }
        }

        @media (max-width: 390px) {
          .calendarMini {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function VerifiedCheck({ label = "Vérifié" }) {
  return (
    <span className="verifiedCheck" title={label} aria-label={label}>
      <BadgeCheck size={14} />
    </span>
  );
}

function MissionCard({ mission, loading, applyingMissionId, onApply, onOpen }) {
  const isApplying = String(applyingMissionId) === String(mission.id);

  return (
    <div className="missionRow">
      <div className="missionIcon">
        <Bus size={22} />
      </div>

      <div className="missionBody">
        {mission.companyName && <small className="missionCompany">{mission.companyName}</small>}
        {mission.companyVerified && (
          <em className="verifiedCompanyBadge">
            <BadgeCheck size={14} />
            Entreprise vérifiée
          </em>
        )}
        <strong>{mission.title}</strong>
        <span>{mission.pickup} → {mission.dropoff}</span>
        <span>{mission.start ? ` · ${formatDateTime(mission.start)}` : ""}</span>
        {mission.applied && <em className="appliedBadge">Déjà postulé</em>}
      </div>

      <div className="missionRight">
        <div className="matchBox">
          <strong>{mission.matchScore}%</strong>
          <span>match</span>
        </div>

        <div className="missionActions">
          <button className="softButton" onClick={() => onOpen(mission)}>
            Détails
          </button>
          <button disabled={loading || mission.applied} onClick={() => onApply(mission)}>
            {mission.applied ? "Candidature envoyée" : isApplying ? "Envoi..." : "Postuler"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvitationCard({ invitation, loading, onAccept, onRefuse }) {
  const mission = invitation.missions;

  return (
    <div className="inviteRow">
      <div className="missionIcon">
        <ShieldCheck size={22} />
      </div>

      <div>
        <strong>{mission?.title || "Mission"}</strong>
        <span>{mission?.pickup || "Départ"} → {mission?.dropoff || "Arrivée"}</span>
        <span>{mission?.start_time ? ` · ${formatDateTime(mission.start_time)}` : ""}</span>

        <div className="inviteActions">
          <button disabled={loading} onClick={() => onAccept(invitation)}>
            Accepter
          </button>
          <button className="refuseButton" disabled={loading} onClick={() => onRefuse(invitation)}>
            Refuser
          </button>
        </div>
      </div>

      <div className="matchBox">
        <strong>{formatPrice(mission?.price)}</strong>
        <span>proposé</span>
      </div>
    </div>
  );
}

function Day({ day, date, active, booked }) {
  return (
    <div className={`day ${active ? "active" : ""} ${booked ? "booked" : ""}`}>
      <span>{day}</span>
      <strong>{date}</strong>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "Date non renseignée";

  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "À définir";

  const numericValue = Number(String(value).replace(",", ".").replace(/[^\d.]/g, ""));

  if (Number.isFinite(numericValue)) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2,
    }).format(numericValue);
  }

  return String(value).includes("€") ? String(value) : `${value} €`;
}

function isDriverProfileVerified(profile) {
  if (!profile) return false;

  if (
    profile.driver_verified ||
    profile.profile_verified ||
    profile.is_verified ||
    profile.verified
  ) {
    return true;
  }

  const permits = Array.isArray(profile.permits) ? profile.permits : [];
  const hasPermit = permits.length > 0;
  const fcoReady = String(profile.fco_status || "").toLowerCase().includes("jour");

  return Boolean(profile.full_name) && hasPermit && fcoReady;
}
