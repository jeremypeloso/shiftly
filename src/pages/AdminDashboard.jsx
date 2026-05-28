import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Ban,
  BarChart3,
  Bell,
  Building2,
  Bus,
  CheckCircle2,
  Clock3,
  Eye,
  MessageSquare,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

const missionStatuses = ["Ouverte", "Pourvue", "Terminée", "Annulée"];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [missions, setMissions] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [missionFilter, setMissionFilter] = useState("all");
  const [popup, setPopup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [ticketMessages, setTicketMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmin();
  }, []);

  const stats = useMemo(() => {
    const drivers = users.filter((user) => user.role === "driver");
    const companies = users.filter((user) => user.role === "company");
    const suspended = users.filter((user) => user.is_suspended);
    const reported = missions.filter((mission) => mission.is_reported);
    const completed = missions.filter((mission) => isCompleted(mission.status));
    const assigned = missions.filter((mission) => mission.status === "Pourvue");

    return {
      drivers: drivers.length,
      companies: companies.length,
      users: users.length,
      missions: missions.length,
      suspended: suspended.length,
      reported: reported.length,
      assignedRate: missions.length ? Math.round((assigned.length / missions.length) * 100) : 0,
      completedRate: missions.length ? Math.round((completed.length / missions.length) * 100) : 0,
    };
  }, [users, missions]);

  const filteredUsers = users.filter((user) => {
    const value = `${user.full_name || ""} ${user.company_name || ""} ${user.city || ""} ${user.email || ""}`.toLowerCase();
    const matchesSearch = value.includes(search.toLowerCase());
    const matchesRole = filterRole === "all" ? true : user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const filteredMissions = missions.filter((mission) => {
    if (missionFilter === "reported") return mission.is_reported;
    if (missionFilter === "open") return mission.status === "Ouverte";
    if (missionFilter === "assigned") return mission.status === "Pourvue";
    if (missionFilter === "completed") return isCompleted(mission.status);
    return true;
  });

  async function loadAdmin() {
    setLoading(true);

    const user = await getCurrentUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profileData?.is_admin) {
      navigate("/");
      return;
    }

    const { data: usersData, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: missionsData, error: missionsError } = await supabase
      .from("missions")
      .select("*")
      .order("created_at", { ascending: false });

    if (usersError) console.error(usersError);
    if (missionsError) console.error(missionsError);

    setUsers(usersData || []);
    setMissions((missionsData || []).map(normalizeMission));
    setLoading(false);
  }

  async function toggleSuspend(user) {
    const newStatus = user.is_suspended !== true;

    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: newStatus })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Erreur suspension compte");
      return;
    }

    setPopup({
      type: newStatus ? "danger" : "success",
      title: newStatus ? "Compte suspendu" : "Compte réactivé",
      message: newStatus
        ? "L'utilisateur ne peut plus se connecter à Shiftly."
        : "L'utilisateur peut de nouveau accéder à Shiftly.",
    });

    setSelectedUser(null);
    await loadAdmin();
  }

  async function updateMission(mission, fields, successTitle = "Mission mise à jour") {
    const { error } = await supabase
      .from("missions")
      .update(fields)
      .eq("id", mission.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setPopup({
      type: "success",
      title: successTitle,
      message: "La modification a bien été enregistrée.",
    });

    await loadAdmin();
    setSelectedMission((prev) => (prev?.id === mission.id ? { ...prev, ...fields } : prev));
  }

  async function loadTicketMessages(ticketId) {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setTicketMessages(data || []);
  }

  async function openReport(mission) {
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("mission_id", mission.id)
      .eq("status", "open")
      .maybeSingle();

    if (error) {
      console.error(error);
      alert("Erreur chargement du ticket");
      return;
    }

    if (!ticket) {
      alert("Aucun ticket ouvert trouvé");
      return;
    }

    setSelectedReport({
      ...mission,
      ticket_id: ticket.id,
      ticket_status: ticket.status,
    });

    await loadTicketMessages(ticket.id);
  }

  async function sendAdminResponse() {
    if (!selectedReport) return;

    if (!adminResponse.trim()) {
      alert("Écris une réponse avant d'envoyer");
      return;
    }

    const user = await getCurrentUser();

    const { error: messageError } = await supabase.from("support_messages").insert([
      {
        ticket_id: selectedReport.ticket_id,
        sender_id: user.id,
        sender_role: "admin",
        message: adminResponse,
      },
    ]);

    if (messageError) {
      console.error(messageError);
      alert("Erreur envoi réponse");
      return;
    }

    if (selectedReport.reported_by) {
      await supabase.from("notifications").insert([
        {
          user_id: selectedReport.reported_by,
          title: "Réponse de l'administration",
          message: adminResponse,
          type: "admin_response",
          ticket_id: selectedReport.ticket_id,
        },
      ]);
    }

    setPopup({
      type: "success",
      title: "Réponse envoyée",
      message: "L'utilisateur recevra votre réponse dans ses notifications.",
    });

    setAdminResponse("");
    await loadTicketMessages(selectedReport.ticket_id);
  }

  async function closeReport() {
    if (!selectedReport) return;

    await supabase
      .from("support_tickets")
      .update({ status: "closed" })
      .eq("id", selectedReport.ticket_id);

    await supabase
      .from("missions")
      .update({ is_reported: false })
      .eq("id", selectedReport.id);

    setPopup({
      type: "success",
      title: "Signalement clôturé",
      message: "Le ticket est fermé et la mission n'est plus marquée comme signalée.",
    });

    setSelectedReport(null);
    setAdminResponse("");
    await loadAdmin();
  }

  return (
    <main className="adminPage">
      <aside className="adminSidebar">
        <div className="brandBlock">
          <div className="mark">S</div>
          <div>
            <strong>Shiftly</strong>
            <span>Admin</span>
          </div>
        </div>

        <div className="adminIntro">
          <span>Marketplace control</span>
          <h1>Centre de pilotage</h1>
          <p>Contrôlez les utilisateurs, les missions, les signalements et la modération.</p>
        </div>

        <nav className="sideNav">
          <a href="#overview">
            <BarChart3 size={18} />
            Vue globale
          </a>
          <a href="#users">
            <Users size={18} />
            Utilisateurs
          </a>
          <a href="#missions">
            <Bus size={18} />
            Missions
          </a>
          <button onClick={() => navigate("/admin-notifications")}>
            <Bell size={18} />
            Notifications admin
          </button>
        </nav>

        <button className="homeButton" onClick={() => navigate("/")}>
          <ArrowLeft size={18} />
          Retour accueil
        </button>
      </aside>

      <section className="adminContent">
        <header className="contentHeader" id="overview">
          <div>
            <span className="eyebrow">Administration</span>
            <h2>Espace administrateur</h2>
            <p>Pilote l'ensemble de la marketplace depuis une interface unique.</p>
          </div>

          <button className="refreshButton" onClick={loadAdmin}>
            <RefreshCw size={18} />
            Actualiser
          </button>
        </header>

        <section className="statsGrid">
          <StatCard icon={UserCheck} label="Conducteurs" value={stats.drivers} />
          <StatCard icon={Building2} label="Entreprises" value={stats.companies} />
          <StatCard icon={Bus} label="Missions" value={stats.missions} />
          <StatCard icon={AlertTriangle} label="Signalements" value={stats.reported} danger={stats.reported > 0} />
          <StatCard icon={Ban} label="Suspendus" value={stats.suspended} danger={stats.suspended > 0} />
        </section>

        <section className="controlGrid">
          <div className="analyticsPanel">
            <div className="panelTitle">
              <h3>Santé marketplace</h3>
              <span>Indicateurs de pilotage</span>
            </div>

            <Progress label="Missions pourvues" value={stats.assignedRate} />
            <Progress label="Missions terminées" value={stats.completedRate} />

            <div className="riskStrip">
              <div>
                <strong>{stats.reported}</strong>
                <span>signalement(s) ouvert(s)</span>
              </div>
              <div>
                <strong>{stats.suspended}</strong>
                <span>compte(s) suspendu(s)</span>
              </div>
            </div>
          </div>

          <div className="adminActionsPanel">
            <div className="panelTitle">
              <h3>Actions rapides</h3>
              <span>Contrôles plateforme</span>
            </div>

            <button onClick={() => setMissionFilter("reported")}>
              <AlertTriangle size={18} />
              Voir les missions signalées
            </button>
            <button onClick={() => setFilterRole("driver")}>
              <UserCheck size={18} />
              Filtrer les conducteurs
            </button>
          </div>
        </section>

        <section className="panel" id="users">
          <div className="panelHeader">
            <div>
              <h3>Utilisateurs</h3>
              <span>{filteredUsers.length} résultat(s)</span>
            </div>

            <div className="filters">
              <label>
                <Search size={17} />
                <input
                  placeholder="Rechercher un utilisateur..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <select value={filterRole} onChange={(event) => setFilterRole(event.target.value)}>
                <option value="all">Tous les rôles</option>
                <option value="driver">Conducteurs</option>
                <option value="company">Entreprises</option>
              </select>
            </div>
          </div>

          <div className="tableList">
            {loading && <div className="emptyState">Chargement...</div>}
            {!loading && filteredUsers.length === 0 && <div className="emptyState">Aucun utilisateur trouvé.</div>}

            {!loading &&
              filteredUsers.map((user) => (
                <article className="adminRow" key={user.id}>
                  <div className="rowIcon">
                    {user.role === "company" ? <Building2 size={22} /> : <UserCheck size={22} />}
                  </div>

                  <div className="rowMain">
                    <strong>
                      {user.full_name || user.company_name || "Utilisateur"}
                      {isUserVerified(user) && <VerifiedCheck label={`${roleLabel(user.role)} vérifié`} />}
                    </strong>
                    <span>{roleLabel(user.role)} · {user.city || "Ville non renseignée"}</span>
                  </div>

                  <div className="rowActions">
                    <StatusBadge user={user} />
                    <button className="softButton" onClick={() => setSelectedUser(user)}>
                      <Eye size={17} />
                      Détails
                    </button>
                    {!user.is_admin && (
                      <button
                        className={user.is_suspended ? "successButton" : "dangerButton"}
                        onClick={() => toggleSuspend(user)}
                      >
                        {user.is_suspended ? "Réactiver" : "Suspendre"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
          </div>
        </section>

        <section className="panel" id="missions">
          <div className="panelHeader">
            <div>
              <h3>Missions</h3>
              <span>{filteredMissions.length} résultat(s)</span>
            </div>

            <div className="filters">
              <select value={missionFilter} onChange={(event) => setMissionFilter(event.target.value)}>
                <option value="all">Toutes les missions</option>
                <option value="open">Ouvertes</option>
                <option value="assigned">Pourvues</option>
                <option value="completed">Terminées</option>
                <option value="reported">Signalées</option>
              </select>
            </div>
          </div>

          <div className="tableList">
            {loading && <div className="emptyState">Chargement...</div>}
            {!loading && filteredMissions.length === 0 && <div className="emptyState">Aucune mission trouvée.</div>}

            {!loading &&
              filteredMissions.map((mission) => (
                <article className={mission.is_reported ? "adminRow reportedRow" : "adminRow"} key={mission.id}>
                  <div className="rowIcon">
                    <Bus size={22} />
                  </div>

                  <div className="rowMain">
                    <strong>{mission.title || "Mission"}</strong>
                    <span>{mission.pickup || "Départ"} → {mission.dropoff || "Arrivée"}</span>
                    <small>{formatDate(mission.start_time)} · {mission.price || "Prix non renseigné"}</small>
                  </div>

                  <div className="rowActions">
                    <span className={mission.is_reported ? "badge danger" : "badge"}>{mission.status || "Statut"}</span>
                    <button className="softButton" onClick={() => setSelectedMission(mission)}>
                      <Eye size={17} />
                      Piloter
                    </button>
                    {mission.is_reported && (
                      <button className="dangerButton" onClick={() => openReport(mission)}>
                        <AlertTriangle size={17} />
                        Signalée
                      </button>
                    )}
                  </div>
                </article>
              ))}
          </div>
        </section>
      </section>

      {selectedUser && (
        <Modal
          onClose={() => setSelectedUser(null)}
          eyebrow="Utilisateur"
          title={
            <span className="modalTitleInline">
              {selectedUser.full_name || selectedUser.company_name || "Utilisateur"}
              {isUserVerified(selectedUser) && <VerifiedCheck label={`${roleLabel(selectedUser.role)} vérifié`} />}
            </span>
          }
        >
          <div className="detailGrid">
            <Detail label="Rôle" value={roleLabel(selectedUser.role)} />
            <Detail label="Ville" value={selectedUser.city || "Non renseignée"} />
            <Detail label="Statut" value={selectedUser.is_suspended ? "Suspendu" : "Actif"} />
            <Detail label="Vérification" value={isUserVerified(selectedUser) ? "Vérifié" : "Non vérifié"} />
            <Detail label="Admin" value={selectedUser.is_admin ? "Oui" : "Non"} />
            <Detail label="Entreprise" value={selectedUser.company_name || "Non renseignée"} />
            <Detail label="ShiftScore" value={selectedUser.shift_score ?? "Non concerné"} />
          </div>

          {!selectedUser.is_admin && (
            <button
              className={selectedUser.is_suspended ? "modalPrimary" : "modalDanger"}
              onClick={() => toggleSuspend(selectedUser)}
            >
              {selectedUser.is_suspended ? "Réactiver le compte" : "Suspendre le compte"}
            </button>
          )}
        </Modal>
      )}

      {selectedMission && (
        <Modal onClose={() => setSelectedMission(null)} eyebrow="Mission" title={selectedMission.title || "Mission"}>
          <div className="detailGrid">
            <Detail label="Trajet" value={`${selectedMission.pickup || "Départ"} → ${selectedMission.dropoff || "Arrivée"}`} />
            <Detail label="Statut" value={selectedMission.status || "Non renseigné"} />
            <Detail label="Conducteur" value={selectedMission.driver_name || "Non attribué"} />
            <Detail label="Prix" value={selectedMission.price || "Non renseigné"} />
            <Detail label="Départ" value={formatDate(selectedMission.start_time)} />
            <Detail label="Retour" value={formatDate(selectedMission.end_time)} />
            <Detail label="Signalement" value={selectedMission.is_reported ? "Oui" : "Non"} />
          </div>

          <div className="adminControlBlock">
            <div>
              <label>Statut mission</label>
              <select
                value={normalizeStatus(selectedMission.status) || "Ouverte"}
                onChange={(event) => updateMission(selectedMission, { status: event.target.value }, "Statut mission mis à jour")}
              >
                {missionStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedMission.is_reported && (
            <button className="modalDanger" onClick={() => openReport(selectedMission)}>
              Ouvrir le signalement
            </button>
          )}
        </Modal>
      )}

      {selectedReport && (
        <Modal onClose={() => { setSelectedReport(null); setAdminResponse(""); }} eyebrow="Signalement" title={selectedReport.title || "Mission signalée"}>
          <div className="ticketThread">
            {ticketMessages.length === 0 && <div className="emptyState">Aucun message dans ce ticket.</div>}
            {ticketMessages.map((message) => (
              <div className={message.sender_role === "admin" ? "ticketMessage admin" : "ticketMessage user"} key={message.id}>
                <strong>{message.sender_role === "admin" ? "Administration" : "Utilisateur"}</strong>
                <p>{message.message}</p>
                <span>{formatDate(message.created_at)}</span>
              </div>
            ))}
          </div>

          <textarea
            className="adminResponse"
            placeholder="Répondre à l'utilisateur..."
            value={adminResponse}
            onChange={(event) => setAdminResponse(event.target.value)}
          />

          <div className="modalActions">
            <button className="modalPrimary" onClick={sendAdminResponse}>
              <MessageSquare size={18} />
              Envoyer la réponse
            </button>
            <button className="modalSuccess" onClick={closeReport}>
              <CheckCircle2 size={18} />
              Clôturer le ticket
            </button>
          </div>
        </Modal>
      )}

      {popup && (
        <div className="modalOverlay">
          <div className="popup">
            <div className={popup.type === "danger" ? "popupIcon danger" : "popupIcon success"}>
              {popup.type === "danger" ? <Ban size={34} /> : <CheckCircle2 size={34} />}
            </div>
            <h3>{popup.title}</h3>
            <p>{popup.message}</p>
            <button onClick={() => setPopup(null)}>Fermer</button>
          </div>
        </div>
      )}

      <style>{`
        .adminPage {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 300px 1fr;
          background: #f8fafc;
          color: #0f172a;
          font-family: Inter, system-ui, Arial, sans-serif;
        }

        .adminPage button,
        .adminPage input,
        .adminPage select,
        .adminPage textarea {
          font: inherit;
        }

        .adminPage button {
          border: 0;
          cursor: pointer;
        }

        .adminSidebar {
          min-height: 100svh;
          padding: 28px;
          background: #07152f;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 26px;
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
        .adminIntro span {
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

        .adminIntro {
          padding-top: 22px;
        }

        .adminIntro h1 {
          margin: 18px 0 12px;
          font-size: 36px;
          line-height: 0.95;
          letter-spacing: -0.065em;
        }

        .adminIntro p {
          margin: 0;
          color: #94a3b8;
          line-height: 1.6;
        }

        .sideNav {
          display: grid;
          gap: 8px;
        }

        .sideNav a,
        .sideNav button,
        .homeButton {
          min-height: 46px;
          display: flex;
          align-items: center;
          gap: 11px;
          border-radius: 13px;
          padding: 0 14px;
          color: #cbd5e1;
          background: transparent;
          text-decoration: none;
          font-weight: 800;
        }

        .sideNav a:hover,
        .sideNav button:hover {
          background: #2563eb;
          color: white;
        }

        .homeButton {
          margin-top: auto;
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .adminContent {
          padding: 30px;
          overflow: auto;
        }

        .contentHeader {
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

        .refreshButton,
        .softButton,
        .dangerButton,
        .successButton {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          padding: 0 14px;
          font-weight: 900;
        }

        .refreshButton,
        .softButton {
          background: white;
          color: #0f172a;
          border: 1px solid #dbe3ee !important;
        }

        .dangerButton {
          background: #fee2e2;
          color: #b91c1c;
        }

        .successButton {
          background: #dcfce7;
          color: #166534;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .statCard,
        .analyticsPanel,
        .adminActionsPanel,
        .panel {
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

        .statCard.danger .statIcon {
          background: #fee2e2;
          color: #b91c1c;
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
          grid-template-columns: 1.2fr 0.8fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .analyticsPanel,
        .adminActionsPanel,
        .panel {
          border-radius: 26px;
          padding: 22px;
        }

        .panelTitle,
        .panelHeader {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .panelTitle h3,
        .panelHeader h3 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -0.04em;
        }

        .panelTitle span,
        .panelHeader span {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .progressItem {
          margin-top: 16px;
        }

        .progressItem div:first-child {
          display: flex;
          justify-content: space-between;
          color: #334155;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .progressTrack {
          height: 12px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .progressTrack span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #2563eb;
        }

        .riskStrip {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .riskStrip div {
          border-radius: 18px;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e5eaf2;
        }

        .riskStrip strong {
          display: block;
          font-size: 26px;
        }

        .riskStrip span {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .adminActionsPanel {
          display: grid;
          gap: 10px;
        }

        .adminActionsPanel button {
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

        .panel {
          margin-top: 18px;
        }

        .filters {
          display: flex;
          align-items: center;
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
        .filters select,
        .adminControlBlock select {
          border: 0;
          outline: 0;
          background: transparent;
          color: #0f172a;
        }

        .filters select,
        .adminControlBlock select {
          min-height: 42px;
          border-radius: 999px;
          padding: 0 14px;
          background: #f8fafc;
          border: 1px solid #dbe3ee;
          font-weight: 850;
        }

        .tableList {
          display: grid;
          gap: 10px;
        }

        .adminRow {
          display: grid;
          grid-template-columns: 50px 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 20px;
          background: #f8fafc;
          border: 1px solid #e5eaf2;
        }

        .adminRow.reportedRow {
          background: #fff7ed;
          border-color: #fed7aa;
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
        display: flex;
        align-items: center;
        gap: 7px;
        flex-wrap: wrap;
        margin-bottom: 5px;
        font-size: 16px;
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

        .rowMain span,
        .rowMain small {
          display: block;
          color: #64748b;
          line-height: 1.45;
        }

        .rowActions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          border-radius: 999px;
          padding: 0 11px;
          background: #dbeafe;
          color: #2563eb;
          font-size: 12px;
          font-weight: 950;
        }

        .badge.danger {
          background: #fee2e2;
          color: #b91c1c;
        }

        .emptyState {
          padding: 22px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          color: #64748b;
          font-weight: 800;
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

        .modal,
        .popup {
          width: min(760px, 100%);
          border-radius: 28px;
          background: white;
          color: #0f172a;
          box-shadow: 0 28px 90px rgba(15, 23, 42, 0.28);
        }

        .modal {
          position: relative;
          padding: 28px;
        }

        .closeModal {
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

      .modal h2 {
        margin: 16px 44px 20px 0;
        font-size: 34px;
        line-height: 1;
        letter-spacing: -0.055em;
      }

      .modalTitleInline {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        flex-wrap: wrap;
      }

        .detailGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .detailCard {
          padding: 15px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e5eaf2;
        }

        .detailCard span {
          display: block;
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 5px;
        }

        .detailCard strong {
          overflow-wrap: anywhere;
        }

        .adminControlBlock {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 18px;
        }

        .adminControlBlock label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-size: 13px;
          font-weight: 900;
        }

        .adminControlBlock select {
          width: 100%;
        }

        .modalPrimary,
        .modalDanger,
        .modalSuccess {
          width: 100%;
          min-height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          margin-top: 18px;
          font-weight: 950;
        }

        .modalPrimary {
          background: #2563eb;
          color: white;
        }

        .modalDanger {
          background: #fee2e2;
          color: #b91c1c;
        }

        .modalSuccess {
          background: #dcfce7;
          color: #166534;
        }

        .modalActions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .ticketThread {
          display: grid;
          gap: 10px;
          margin-bottom: 14px;
        }

        .ticketMessage {
          padding: 14px;
          border-radius: 18px;
          border: 1px solid #e5eaf2;
          background: #f8fafc;
        }

        .ticketMessage.admin {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .ticketMessage p {
          color: #475569;
          line-height: 1.5;
        }

        .ticketMessage span {
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        .adminResponse {
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

        .popup {
          width: min(430px, 100%);
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
        }

        .popupIcon.success {
          background: #dcfce7;
          color: #16a34a;
        }

        .popupIcon.danger {
          background: #fee2e2;
          color: #b91c1c;
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

        @media (max-width: 1180px) {
          .adminPage {
            grid-template-columns: 1fr;
          }

          .adminSidebar {
            min-height: auto;
          }

          .sideNav {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .homeButton {
            margin-top: 0;
          }

          .statsGrid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 820px) {
          .adminContent,
          .adminSidebar {
            padding: 18px;
          }

          .contentHeader,
          .panelHeader {
            flex-direction: column;
            align-items: flex-start;
          }

          .statsGrid,
          .controlGrid,
          .sideNav,
          .adminRow,
          .detailGrid,
          .adminControlBlock,
          .modalActions {
            grid-template-columns: 1fr;
          }

          .rowActions {
            justify-content: flex-start;
          }

          .filters,
          .filters label,
          .filters select {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, danger }) {
  return (
    <div className={danger ? "statCard danger" : "statCard"}>
      <div className="statIcon">
        <Icon size={22} />
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Progress({ label, value }) {
  return (
    <div className="progressItem">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="progressTrack">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ user }) {
  if (user.is_admin) return <span className="badge">Admin</span>;
  if (user.is_suspended) return <span className="badge danger">Suspendu</span>;
  return <span className="badge">Actif</span>;
}

function VerifiedCheck({ label = "Vérifié" }) {
  return (
    <span className="verifiedCheck" title={label} aria-label={label}>
      <BadgeCheck size={14} />
    </span>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detailCard">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Modal({ eyebrow, title, children, onClose }) {
  return (
    <div className="modalOverlay">
      <div className="modal">
        <button className="closeModal" onClick={onClose}>
          <X size={20} />
        </button>
        <span className="modalEyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function roleLabel(role) {
  if (role === "driver") return "Conducteur";
  if (role === "company") return "Entreprise";
  return role || "Utilisateur";
}

function isUserVerified(user) {
  if (!user) return false;

  if (user.role === "company") {
    return Boolean(user.company_verified || user.is_verified || user.verified);
  }

  if (user.role === "driver") {
    if (
      user.driver_verified ||
      user.profile_verified ||
      user.is_verified ||
      user.verified
    ) {
      return true;
    }

    const permits = Array.isArray(user.permits) ? user.permits : [];
    const hasPermit = permits.length > 0;
    const fcoReady = normalizeText(user.fco_status).includes("jour");

    return Boolean(user.full_name) && hasPermit && fcoReady;
  }

  return false;
}

function normalizeMission(mission) {
  return {
    ...mission,
    status: normalizeStatus(mission.status),
  };
}

function normalizeStatus(status) {
  if (status === "TerminÃ©e") return "Terminée";
  return status;
}

function isCompleted(status) {
  return normalizeStatus(status) === "Terminée";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatDate(value) {
  if (!value) return "Non renseigné";

  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
