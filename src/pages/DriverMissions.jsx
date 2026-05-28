import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Archive,
  Bus,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

const tabs = [
  { id: "en-cours", label: "En cours" },
  { id: "candidatures", label: "Candidatures" },
  { id: "refusees", label: "Refusées" },
  { id: "archivees", label: "Archivées" },
];

const acceptedStatuses = ["Acceptée", "AcceptÃ©e"];
const refusedStatuses = ["Refusée", "RefusÃ©e"];
const completedStatuses = ["Terminée", "TerminÃ©e"];

export default function DriverMissions() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("en-cours");
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);
  const [pageLocked, setPageLocked] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportMissionTarget, setReportMissionTarget] = useState(null);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    loadMissions();
  }, []);

  const counts = useMemo(
    () => ({
      current: missions.filter((item) => isCurrent(item)).length,
      pending: missions.filter((item) => item.status === "En attente").length,
      refused: missions.filter((item) => refusedStatuses.includes(item.status)).length,
      archived: missions.filter((item) => isArchived(item)).length,
    }),
    [missions]
  );

  async function loadMissions() {
    setLoading(true);

    const user = await getCurrentUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: applicationsData, error: applicationsError } = await supabase
      .from("applications")
      .select(`
        *,
        missions (*)
      `)
      .eq("driver_id", user.id)
      .order("created_at", { ascending: false });

    if (applicationsError) {
      console.error(applicationsError);
      setLoading(false);
      return;
    }

    const { data: invitationsData, error: invitationsError } = await supabase
      .from("mission_invitations")
      .select(`
        *,
        missions (*)
      `)
      .eq("driver_id", user.id)
      .order("created_at", { ascending: false });

    if (invitationsError) {
      console.error(invitationsError);
      setLoading(false);
      return;
    }

    const merged = [
      ...(applicationsData || []).map((item) => ({
        type: "application",
        status: normalizeStatus(item.status),
        mission: item.missions,
      })),
      ...(invitationsData || []).map((item) => ({
        type: "invitation",
        status: normalizeStatus(item.status),
        mission: item.missions,
      })),
    ];

    const uniqueMissions = merged.filter(
      (item, index, array) =>
        item.mission?.id &&
        index === array.findIndex((other) => other.mission?.id === item.mission?.id)
    );

    setMissions(uniqueMissions);
    setLoading(false);
  }

  function filteredMissions() {
    switch (activeTab) {
      case "en-cours":
        return missions.filter((item) => isCurrent(item));
      case "candidatures":
        return missions.filter((item) => item.status === "En attente");
      case "refusees":
        return missions.filter((item) => refusedStatuses.includes(item.status));
      case "archivees":
        return missions.filter((item) => isArchived(item));
      default:
        return missions;
    }
  }

  async function completeMission(mission) {
    if (!mission?.id) {
      alert("ID mission introuvable");
      return;
    }

    const { error } = await supabase
      .from("missions")
      .update({
        status: "Terminée",
        completed_by_driver: true,
        completed_at: new Date().toISOString(),
        billing_status: "À facturer",
        invoice_status: "À payer",
      })
      .eq("id", mission.id);

    if (error) {
      console.error(error);
      alert("Erreur validation mission terminée");
      return;
    }

    setPopup({
      type: "success",
      title: "Mission terminée",
      message: "La mission a bien été marquée comme terminée.",
    });

    setSelectedMission(null);
    await loadMissions();
  }

  async function reportMission(mission) {
    const user = await getCurrentUser();

    if (!user) {
      alert("Utilisateur introuvable");
      return;
    }

    if (!mission?.id) {
      alert("Mission introuvable");
      return;
    }

    if (!reportReason.trim()) {
      alert("Expliquez le problème avant d'envoyer.");
      return;
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert([
        {
          mission_id: mission.id,
          user_id: user.id,
          status: "open",
          subject: mission.title || "Signalement mission",
        },
      ])
      .select()
      .single();

    if (ticketError) {
      console.error(ticketError);
      alert("Erreur création ticket");
      return;
    }

    const { error: messageError } = await supabase
      .from("support_messages")
      .insert([
        {
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_role: "driver",
          message: reportReason,
        },
      ]);

    if (messageError) {
      console.error(messageError);
      alert("Erreur envoi message");
      return;
    }

    await supabase
      .from("missions")
      .update({
        is_reported: true,
        report_reason: reportReason,
        reported_by: user.id,
        reported_at: new Date().toISOString(),
      })
      .eq("id", mission.id);

    setPopup({
      type: "success",
      title: "Signalement envoyé",
      message: "Votre demande a été transmise à l'administration Shiftly.",
    });

    setReportReason("");
    setReportMissionTarget(null);
    setSelectedMission(null);
    await loadMissions();
  }

  const visibleMissions = filteredMissions();

  return (
    <main className="driverMissionsPage">
      <aside className="missionsSidebar">
        <button
          className="backButton"
          disabled={pageLocked}
          onClick={() => {
            if (pageLocked) return;
            setPageLocked(true);
            navigate("/driver", { replace: true });
          }}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="brandBlock">
          <div className="mark">S</div>
          <div>
            <strong>Shiftly</strong>
            <span>Driver</span>
          </div>
        </div>

        <div className="sideHero">
          <span>Missions</span>
          <h1>Suivi de tes missions</h1>
          <p>Retrouve tes candidatures, missions acceptées, refusées et archivées.</p>
        </div>

        <div className="sideStats">
          <Stat icon={Bus} value={counts.current} label="en cours" />
          <Stat icon={Clock3} value={counts.pending} label="en attente" />
          <Stat icon={Archive} value={counts.archived} label="archivées" />
        </div>
      </aside>

      <section className="missionsContent">
        <header className="contentHeader">
          <div>
            <span className="eyebrow">Espace conducteur</span>
            <h2>Mes missions</h2>
            <p>Suivez vos missions et gérez les actions importantes depuis un seul endroit.</p>
          </div>
        </header>

        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="missionListPanel">
          {loading && <div className="emptyState">Chargement...</div>}

          {!loading && visibleMissions.length === 0 && (
            <div className="emptyState">
              <FileText size={34} />
              <h3>Aucune mission</h3>
              <p>Les missions correspondant à cet onglet apparaîtront ici.</p>
            </div>
          )}

          {!loading &&
            visibleMissions.map((item) => (
              <MissionCard
                key={`${item.type}-${item.mission?.id}`}
                item={item}
                activeTab={activeTab}
                onOpen={setSelectedMission}
                onComplete={completeMission}
              />
            ))}
        </section>
      </section>

      {selectedMission && (
        <div className="modalOverlay" onClick={() => setSelectedMission(null)}>
          <div className="missionModal" onClick={(event) => event.stopPropagation()}>
            <button className="closeButton" onClick={() => setSelectedMission(null)}>
              <X size={20} />
            </button>

            <span className="modalEyebrow">{selectedMission.status}</span>
            <h2>{selectedMission.mission?.title}</h2>

            <div className="modalDetails">
              <Detail icon={MapPin} label="Trajet" value={`${selectedMission.mission?.pickup || "Départ"} → ${selectedMission.mission?.dropoff || "Arrivée"}`} />
              <Detail icon={Clock3} label="Départ" value={formatDate(selectedMission.mission?.start_time)} />
              <Detail icon={Clock3} label="Retour" value={formatDate(selectedMission.mission?.end_time)} />
              <Detail icon={Bus} label="Véhicule" value={selectedMission.mission?.vehicle || "Non renseigné"} />
              <Detail icon={Wallet} label="Prix" value={selectedMission.mission?.price || "Non renseigné"} />
              <Detail icon={FileText} label="Documents" value={selectedMission.mission?.documents || "Non renseigné"} />
            </div>

            <div className="commentBox">
              <strong>Commentaire</strong>
              <p>{selectedMission.mission?.comment || "Aucun commentaire"}</p>
            </div>

            <div className="modalActions">
              <button className="reportButton" onClick={() => setReportMissionTarget(selectedMission.mission)}>
                <AlertTriangle size={18} />
                Signaler un problème
              </button>

              <button
                className="messageButton"
                onClick={() => alert("Messagerie bientôt disponible")}
              >
                <MessageCircle size={18} />
                Contacter l'entreprise
              </button>
            </div>
          </div>
        </div>
      )}

      {reportMissionTarget && (
        <div className="modalOverlay">
          <div className="missionModal reportModal">
            <button
              className="closeButton"
              onClick={() => {
                setReportMissionTarget(null);
                setReportReason("");
              }}
            >
              <X size={20} />
            </button>

            <span className="modalEyebrow danger">Signalement</span>
            <h2>Signaler un problème</h2>
            <p className="reportHelp">
              Expliquez brièvement le problème rencontré sur cette mission.
            </p>

            <textarea
              className="reportTextarea"
              placeholder="Exemple : horaires incorrects, mission non conforme, problème avec l'entreprise..."
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
            />

            <div className="modalActions">
              <button className="reportButton" onClick={() => reportMission(reportMissionTarget)}>
                Envoyer le signalement
              </button>

              <button
                className="messageButton"
                onClick={() => {
                  setReportMissionTarget(null);
                  setReportReason("");
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
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

      <style>{`
        .driverMissionsPage {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 320px 1fr;
          background: #f8fafc;
          color: #0f172a;
          font-family: Inter, system-ui, Arial, sans-serif;
        }

        .driverMissionsPage button,
        .driverMissionsPage textarea {
          font: inherit;
        }

        .driverMissionsPage button {
          border: 0;
          cursor: pointer;
        }

        .driverMissionsPage button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .missionsSidebar {
          min-height: 100svh;
          padding: 28px;
          background: #07152f;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .backButton {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-height: 42px;
          border-radius: 999px;
          padding: 0 14px;
          background: rgba(255, 255, 255, 0.08);
          color: #dbeafe;
          font-weight: 850;
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

        .brandBlock span,
        .sideHero span {
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

        .sideHero {
          padding-top: 24px;
        }

        .sideHero h1 {
          margin: 18px 0 12px;
          font-size: 36px;
          line-height: 0.95;
          letter-spacing: -0.065em;
        }

        .sideHero p {
          margin: 0;
          color: #94a3b8;
          line-height: 1.6;
        }

        .sideStats {
          display: grid;
          gap: 10px;
          margin-top: auto;
        }

        .sideStat {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sideStat svg {
          color: #93c5fd;
        }

        .sideStat strong {
          display: block;
          font-size: 26px;
        }

        .sideStat span {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 850;
        }

        .missionsContent {
          padding: 30px;
          overflow: auto;
        }

        .contentHeader {
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

        .contentHeader h2 {
          margin: 0;
          font-size: clamp(38px, 5vw, 58px);
          line-height: 1;
          letter-spacing: -0.07em;
        }

        .contentHeader p {
          margin: 12px 0 0;
          color: #64748b;
          line-height: 1.6;
        }

        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }

        .tabs button {
          min-height: 42px;
          border-radius: 999px;
          padding: 0 16px;
          background: white;
          color: #475569;
          border: 1px solid #dbe3ee !important;
          font-weight: 900;
        }

        .tabs button.active {
          background: #2563eb;
          border-color: #2563eb !important;
          color: white;
          box-shadow: 0 14px 30px rgba(37, 99, 235, 0.2);
        }

        .missionListPanel {
          display: grid;
          gap: 12px;
        }

        .missionCard,
        .emptyState {
          border-radius: 24px;
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06);
        }

        .missionCard {
          display: grid;
          grid-template-columns: 50px 1fr auto;
          gap: 14px;
          align-items: start;
          padding: 18px;
        }

        .missionIcon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: #dbeafe;
          color: #2563eb;
        }

        .missionCard h3 {
          margin: 0 0 9px;
          font-size: 20px;
          letter-spacing: -0.04em;
        }

        .missionMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          color: #64748b;
          font-size: 13px;
          font-weight: 760;
        }

        .missionMeta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .missionActions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
          min-width: 220px;
        }

        .statusBadge,
        .detailButton,
        .completeButton {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 999px;
          padding: 0 13px;
          font-weight: 900;
          font-size: 13px;
        }

        .statusBadge {
          background: #dbeafe;
          color: #2563eb;
        }

        .detailButton {
          background: #0f172a;
          color: white;
        }

        .completeButton {
          background: #16a34a;
          color: white;
        }

        .emptyState {
          min-height: 280px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 40px;
          color: #64748b;
        }

        .emptyState svg {
          color: #2563eb;
          margin-bottom: 12px;
        }

        .emptyState h3 {
          margin: 0 0 8px;
          color: #0f172a;
          letter-spacing: -0.04em;
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
        .popup {
          width: min(620px, 100%);
          border-radius: 28px;
          background: white;
          color: #0f172a;
          box-shadow: 0 28px 90px rgba(15, 23, 42, 0.28);
        }

        .missionModal {
          position: relative;
          padding: 28px;
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

        .modalEyebrow.danger {
          background: #fee2e2;
          color: #b91c1c;
        }

        .missionModal h2 {
          margin: 16px 44px 20px 0;
          font-size: 34px;
          line-height: 1;
          letter-spacing: -0.055em;
        }

        .modalDetails {
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

        .commentBox {
          margin-top: 12px;
          padding: 16px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e5eaf2;
        }

        .commentBox p,
        .reportHelp {
          color: #64748b;
          line-height: 1.55;
        }

        .modalActions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .reportButton,
        .messageButton {
          min-height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          font-weight: 950;
        }

        .reportButton {
          background: #fee2e2;
          color: #b91c1c;
        }

        .messageButton {
          background: #2563eb;
          color: white;
        }

        .reportTextarea {
          width: 100%;
          min-height: 130px;
          border-radius: 18px;
          border: 1px solid #dbe3ee;
          background: #f8fafc;
          color: #0f172a;
          padding: 15px;
          outline: none;
          resize: vertical;
          box-sizing: border-box;
        }

        .reportTextarea:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          background: white;
        }

        .popup {
          padding: 30px;
          text-align: center;
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

        .popup h3 {
          margin: 0;
          font-size: 30px;
          letter-spacing: -0.05em;
        }

        .popup p {
          color: #64748b;
          line-height: 1.5;
        }

        .popup button {
          width: 100%;
          min-height: 50px;
          border-radius: 999px;
          background: #2563eb;
          color: white;
          font-weight: 950;
        }

        @media (max-width: 1040px) {
          .driverMissionsPage {
            grid-template-columns: 1fr;
          }

          .missionsSidebar {
            min-height: auto;
          }

          .sideStats {
            margin-top: 0;
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 720px) {
          .missionsContent,
          .missionsSidebar {
            padding: 18px;
          }

          .sideStats,
          .missionCard,
          .modalDetails,
          .modalActions {
            grid-template-columns: 1fr;
          }

          .missionActions {
            justify-content: flex-start;
            min-width: 0;
          }
        }
      `}</style>
    </main>
  );
}

function MissionCard({ item, activeTab, onOpen, onComplete }) {
  const mission = item.mission;

  return (
    <article className="missionCard">
      <div className="missionIcon">
        <Bus size={22} />
      </div>

      <div>
        <h3>{mission?.title || "Mission"}</h3>
        <div className="missionMeta">
          <span>
            <MapPin size={15} />
            {mission?.pickup || "Départ"} → {mission?.dropoff || "Arrivée"}
          </span>
          <span>
            <Clock3 size={15} />
            {formatDate(mission?.start_time)}
          </span>
          <span>
            <Wallet size={15} />
            {mission?.price || "Non renseigné"}
          </span>
        </div>
      </div>

      <div className="missionActions">
        <span className="statusBadge">{item.status}</span>
        <button className="detailButton" onClick={() => onOpen(item)}>
          Détails
        </button>

        {activeTab === "en-cours" && (
          <button className="completeButton" onClick={() => onComplete(mission)}>
            Mission terminée
          </button>
        )}
      </div>
    </article>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="sideStat">
      <Icon size={22} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
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

function normalizeStatus(status) {
  if (status === "AcceptÃ©e") return "Acceptée";
  if (status === "RefusÃ©e") return "Refusée";
  return status;
}

function isCurrent(item) {
  return acceptedStatuses.includes(item.status) && !completedStatuses.includes(item.mission?.status);
}

function isArchived(item) {
  const endDate = new Date(item.mission?.end_time);

  return completedStatuses.includes(item.mission?.status) || endDate < new Date();
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
