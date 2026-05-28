import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

const statusFilters = [
  { value: "all", label: "Toutes" },
  { value: "open", label: "Ouvertes" },
  { value: "assigned", label: "Pourvues" },
  { value: "completed", label: "Terminées" },
  { value: "cancelled", label: "Annulées" },
];

export default function CompanyMissions() {
  const navigate = useNavigate();

  const [missions, setMissions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [missionToCancel, setMissionToCancel] = useState(null);

  useEffect(() => {
    loadMissions();
  }, []);

  const stats = useMemo(
    () => ({
      total: missions.length,
      open: missions.filter((mission) => mission.status === "Ouverte").length,
      assigned: missions.filter((mission) => mission.status === "Pourvue").length,
      completed: missions.filter((mission) => mission.status === "Terminée").length,
    }),
    [missions]
  );

  const filteredMissions = missions.filter((mission) => {
    const value = `${mission.title || ""} ${mission.pickup || ""} ${mission.dropoff || ""} ${mission.driver_name || ""}`.toLowerCase();
    const matchesSearch = value.includes(search.toLowerCase());
    const key = statusKey(mission.status);

    if (filter === "open") return matchesSearch && key === "open";
    if (filter === "assigned") return matchesSearch && key === "assigned";
    if (filter === "completed") return matchesSearch && key === "completed";
    if (filter === "cancelled") return matchesSearch && key === "cancelled";
    return matchesSearch;
  });

  async function loadMissions() {
    setLoading(true);

    const user = await getCurrentUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: missionsData, error: missionsError } = await supabase
      .from("missions")
      .select("*")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false });

    if (missionsError) {
      console.error(missionsError);
      setLoading(false);
      return;
    }

    const missionIds = (missionsData || []).map((mission) => mission.id);
    let applicationsData = [];

    if (missionIds.length) {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .in("mission_id", missionIds);

      if (error) console.error(error);
      applicationsData = data || [];
    }

    setMissions((missionsData || []).map(normalizeMission));
    setApplications(dedupeApplications(applicationsData));
    setLoading(false);
  }

  async function markMissionDone(mission) {
    const { error } = await supabase
      .from("missions")
      .update({
        status: "Terminée",
        color: "#64748b",
      })
      .eq("id", mission.id);

    if (error) {
      console.error(error);
      alert("Erreur clôture mission");
      return;
    }

    await loadMissions();
  }

  async function cancelMission(mission) {
    const { error } = await supabase
      .from("missions")
      .update({
        status: "Annulée",
        color: "#ef4444",
      })
      .eq("id", mission.id);

    if (error) {
      console.error(error);
      alert("Erreur annulation mission");
      return;
    }

    await loadMissions();
  }

  function applicationCount(missionId) {
    return applications.filter(
      (application) => String(application.mission_id) === String(missionId)
    ).length;
  }

  return (
    <main className="missionsPage">
      <aside className="missionsSidebar">
        <div className="brandBlock">
          <div className="mark">S</div>
          <div>
            <strong>Shiftly</strong>
            <span>Company</span>
          </div>
        </div>

        <nav className="sideNav">
          <button onClick={() => navigate("/company")}>Dashboard</button>
          <button className="active">Missions</button>
          <button onClick={() => navigate("/company/create-mission")}>Créer mission</button>
          <button onClick={() => navigate("/company/profile")}>Profil entreprise</button>
        </nav>

        <button className="logoutButton" onClick={() => navigate("/company")}>
          <ArrowLeft size={18} />
          Retour dashboard
        </button>
      </aside>

      <section className="missionsContent">
        <header className="topbar">
          <div>
            <span className="eyebrow">Espace entreprise</span>
            <h1>Mes missions</h1>
            <p>Suivez, modifiez et clôturez vos missions depuis une vue dédiée.</p>
          </div>

          <button className="createButton" onClick={() => navigate("/company/create-mission")}>
            <Plus size={18} />
            Publier une mission
          </button>
        </header>

        <section className="statsGrid">
          <Stat label="Total" value={stats.total} />
          <Stat label="Ouvertes" value={stats.open} />
          <Stat label="Pourvues" value={stats.assigned} />
          <Stat label="Terminées" value={stats.completed} />
        </section>

        <section className="toolbar">
          <label className="searchBox">
            <Search size={18} />
            <input
              placeholder="Rechercher par trajet, titre ou conducteur..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="filters">
            {statusFilters.map((item) => (
              <button
                key={item.value}
                className={filter === item.value ? "active" : ""}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="missionsList">
          {loading && <div className="emptyState">Chargement des missions...</div>}

          {!loading && filteredMissions.length === 0 && (
            <div className="emptyState">Aucune mission trouvée.</div>
          )}

          {filteredMissions.map((mission) => (
            <article className="missionCard" key={mission.id}>
              <div className="missionIcon">
                <CalendarDays size={22} />
              </div>

              <div className="missionMain">
                <div className="missionTitle">
                  <span className={`status ${statusClass(mission.status)}`}>
                    {mission.status || "Statut"}
                  </span>
                  <h2>{mission.title || `${mission.pickup} vers ${mission.dropoff}`}</h2>
                </div>

                <div className="missionMeta">
                  <span>
                    <MapPin size={16} />
                    {mission.pickup || "Départ"} vers {mission.dropoff || "Arrivée"}
                  </span>

                  <span>
                    <CalendarDays size={16} />
                    {formatDate(mission.start_time)}
                  </span>

                  <span>
                    <UserCheck size={16} />
                    {mission.driver_name || "Non attribué"}
                  </span>
                </div>
              </div>

              <div className="missionSide">
                <div className="applicationCount">
                  <strong>{applicationCount(mission.id)}</strong>
                  <span>candidature(s)</span>
                </div>

                <div className="actions">
                  <button onClick={() => navigate(`/company/create-mission?missionId=${mission.id}`)}>
                    <Edit3 size={14} />
                    Modifier
                  </button>

                  {mission.status === "Pourvue" && (
                    <button onClick={() => markMissionDone(mission)}>
                      <CheckCircle2 size={14} />
                      Clôturer
                    </button>
                  )}

                  <button className="danger" onClick={() => setMissionToCancel(mission)}>
                    <Trash2 size={14} />
                    Annuler
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>

      {missionToCancel && (
        <ConfirmModal
          title="Annuler cette mission ?"
          text="Elle ne sera plus proposée aux conducteurs, mais restera visible dans l'historique des missions annulées."
          onCancel={() => setMissionToCancel(null)}
          onConfirm={() => {
            cancelMission(missionToCancel);
            setMissionToCancel(null);
          }}
        />
      )}

      <style>{`
        .missionsPage {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 280px 1fr;
          background: #f8fafc;
          color: #0f172a;
          font-family: Inter, system-ui, Arial, sans-serif;
        }

        .missionsPage button,
        .missionsPage input {
          border: 0;
          font: inherit;
        }

        .missionsPage button {
          cursor: pointer;
        }

        .missionsSidebar {
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
          min-height: 42px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 13px;
          padding: 10px 13px;
          background: transparent;
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 760;
          line-height: 1.15;
          text-align: left;
        }

        .sideNav button.active,
        .sideNav button:hover {
          background: #2563eb;
          color: white;
        }

        .logoutButton {
          margin-top: auto;
          background: rgba(239, 68, 68, 0.1);
          color: #fecaca;
        }

        .missionsContent {
          padding: 30px;
        }

        .topbar {
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

        .topbar h1 {
          margin: 0;
          font-size: clamp(36px, 5vw, 56px);
          line-height: 1;
          letter-spacing: -0.065em;
        }

        .topbar p {
          margin: 12px 0 0;
          color: #64748b;
        }

        .createButton {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          padding: 0 15px;
          background: #2563eb;
          color: white;
          font-size: 14px;
          font-weight: 820;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .statCard,
        .toolbar,
        .missionCard,
        .emptyState {
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06);
        }

        .statCard {
          padding: 18px;
          border-radius: 22px;
        }

        .statCard strong {
          display: block;
          font-size: 32px;
          letter-spacing: -0.05em;
        }

        .statCard span {
          color: #64748b;
          font-size: 13px;
          font-weight: 850;
        }

        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
          border-radius: 24px;
          margin-bottom: 18px;
        }

        .searchBox {
          flex: 1;
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          padding: 0 14px;
          background: #f8fafc;
          color: #2563eb;
        }

        .searchBox input {
          width: 100%;
          outline: 0;
          background: transparent;
          color: #0f172a;
        }

        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .filters button {
          min-height: 32px;
          border: 1px solid #dbe3ee;
          border-radius: 9px;
          padding: 0 10px;
          color: #475569;
          background: transparent;
          font-size: 12px;
          font-weight: 720;
        }

        .filters button.active {
          color: white;
          border-color: #2563eb;
          background: #2563eb;
        }

        .missionsList {
          display: grid;
          gap: 12px;
        }

        .missionCard {
          display: grid;
          grid-template-columns: 52px 1fr auto;
          align-items: center;
          gap: 16px;
          padding: 18px;
          border-radius: 24px;
        }

        .missionIcon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: #dbeafe;
          color: #2563eb;
        }

        .missionTitle {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .missionTitle h2 {
          margin: 0;
          font-size: 21px;
          letter-spacing: -0.035em;
        }

        .status {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0 10px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 950;
        }

        .status.assigned {
          background: #dcfce7;
          color: #166534;
        }

        .status.done {
          background: #e2e8f0;
          color: #475569;
        }

        .status.cancelled {
          background: #fee2e2;
          color: #b91c1c;
        }

        .missionMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 780;
        }

        .missionMeta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .missionSide {
          min-width: 250px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        .applicationCount {
          text-align: center;
        }

        .applicationCount strong {
          display: block;
          color: #2563eb;
          font-size: 20px;
        }

        .applicationCount span {
          color: #64748b;
          font-size: 12px;
          font-weight: 850;
        }

        .actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .actions button {
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid #dbe3ee;
          border-radius: 10px;
          padding: 0 9px;
          background: white;
          color: #334155;
          font-size: 12px;
          font-weight: 720;
        }

        .actions button:hover {
          border-color: #bfdbfe;
          color: #1d4ed8;
          background: #eff6ff;
        }

        .actions .danger {
          border-color: #fecdd3;
          background: white;
          color: #be123c;
        }

        .actions .danger:hover {
          border-color: #fda4af;
          background: #fff1f2;
          color: #be123c;
        }

        .emptyState {
          padding: 22px;
          border-radius: 22px;
          color: #64748b;
          font-weight: 850;
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

        .confirmModal {
          width: min(430px, 100%);
          padding: 24px;
          border: 1px solid #dbe3ee;
          border-radius: 24px;
          background: white;
          color: #0f172a;
          box-shadow: 0 28px 90px rgba(15, 23, 42, 0.28);
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

        .confirmModal h3 {
          margin: 0;
          font-size: 28px;
          letter-spacing: -0.05em;
        }

        .confirmModal p {
          color: #64748b;
          line-height: 1.5;
        }

        .modalActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
          flex-wrap: wrap;
        }

        .modalActions button {
          min-height: 40px;
          border-radius: 999px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 850;
        }

        .secondaryAction {
          background: #f8fafc;
          color: #334155;
          border: 1px solid #dbe3ee !important;
        }

        .dangerAction {
          background: #2563eb;
          color: white;
        }

        @media (max-width: 1100px) {
          .missionsPage {
            grid-template-columns: 1fr;
          }

          .missionsSidebar {
            min-height: auto;
          }

          .sideNav {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .logoutButton {
            margin-top: 0;
          }

          .missionCard {
            grid-template-columns: 52px 1fr;
          }

          .missionSide {
            grid-column: 2;
            min-width: 0;
            justify-content: flex-start;
          }
        }

        @media (max-width: 760px) {
          .missionsSidebar,
          .missionsContent {
            padding: 18px;
          }

          .topbar,
          .toolbar,
          .missionSide {
            flex-direction: column;
            align-items: stretch;
          }

          .sideNav,
          .statsGrid,
          .missionCard {
            grid-template-columns: 1fr;
          }

          .createButton,
          .actions button {
            width: 100%;
          }

          .modalActions {
            flex-direction: column;
          }

          .applicationCount {
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="statCard">
      <strong>{value}</strong>
      <span>{label}</span>
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
          <button className="secondaryAction" onClick={onCancel}>
            Garder la mission
          </button>

          <button className="dangerAction" onClick={onConfirm}>
            Confirmer l'annulation
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeMission(mission) {
  return {
    ...mission,
    status: normalizeStatus(mission.status),
    driver_name: normalizeDriverName(mission.driver_name),
  };
}

function normalizeStatus(status) {
  const key = statusKey(status);

  if (key === "completed") return "Terminée";
  if (key === "cancelled") return "Annulée";
  if (key === "accepted") return "Acceptée";
  if (key === "assigned") return "Pourvue";
  if (key === "open") return "Ouverte";

  return status || "Ouverte";
}

function normalizeDriverName(name) {
  if (!name || normalizeText(name) === "non attribue") return "Non attribué";
  return name;
}

function statusClass(status) {
  const key = statusKey(status);

  if (key === "assigned") return "assigned";
  if (key === "completed") return "done";
  if (key === "cancelled") return "cancelled";

  return "";
}

function statusKey(status) {
  const clean = normalizeText(status);

  if (clean === "ouverte") return "open";
  if (clean === "pourvue") return "assigned";
  if (clean.includes("termin")) return "completed";
  if (clean.includes("annul")) return "cancelled";
  if (clean.includes("accept")) return "accepted";

  return clean;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function dedupeApplications(applications) {
  const byMissionAndDriver = new Map();

  applications.forEach((application) => {
    const key = `${application.mission_id}-${application.driver_id}`;
    if (!byMissionAndDriver.has(key)) byMissionAndDriver.set(key, application);
  });

  return Array.from(byMissionAndDriver.values());
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