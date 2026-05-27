import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [missions, setMissions] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [popup, setPopup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
const [selectedMission, setSelectedMission] = useState(null);
const [showStats, setShowStats] = useState(false);
const [reportedMission, setReportedMission] = useState(null);
const [missionFilter, setMissionFilter] = useState("all");
const [selectedReport, setSelectedReport] = useState(null);
const [adminResponse, setAdminResponse] = useState("");
const [ticketMessages, setTicketMessages] = useState([]);

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
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

    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: missionsData } = await supabase
      .from("missions")
      .select("*")
      .order("created_at", { ascending: false });

    setUsers(usersData || []);
    setMissions(missionsData || []);
  }

  async function toggleSuspend(user) {
  const newStatus =
    user.is_suspended === true ? false : true;

  console.log("Utilisateur :", user.id);
  console.log("Nouveau statut :", newStatus);

  const { error } = await supabase
    .from("profiles")
    .update({
      is_suspended: newStatus,
    })
    .eq("id", user.id);

  if (error) {
    console.error(error);
    alert("Erreur suspension compte");
    return;
  }

  setPopup({
  type: newStatus ? "suspend" : "success",
  title: newStatus
    ? "Compte suspendu"
    : "Compte réactivé",
  message: newStatus
    ? "L’utilisateur ne peut plus se connecter."
    : "L’utilisateur peut de nouveau accéder à Shiftly.",
});

  await loadAdmin();
}

  const filteredUsers = users.filter((user) => {
    const value = `${user.full_name || ""} ${user.company_name || ""} ${
      user.city || ""
    }`.toLowerCase();

    const matchesSearch = value.includes(search.toLowerCase());

    const matchesRole =
      filterRole === "all" ? true : user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const filteredMissions = missions.filter((mission) => {
  if (missionFilter === "reported") {
    return mission.is_reported;
  }

  return true;
});

async function loadTicketMessages(ticketId) {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error(error);
    return;
  }

  setTicketMessages(data || []);
}

  return (
    <main className="page">
      <header className="top">
  <div>
    <p>Shiftly Admin</p>
    <h1>Espace administrateur</h1>
  </div>

  <div className="top-actions">

  <button
    className="stats-btn"
    onClick={() => setShowStats(true)}
  >
    Voir statistiques
  </button>

  <button
    className="notif-btn"
    onClick={() => navigate("/admin-notifications")}
  >
    🔔
  </button>

  <button onClick={() => navigate("/")}>
    Retour accueil
  </button>

</div>
</header>

      <section className="cards">
        <div className="card">
          <span>Conducteurs</span>
          <strong>{users.filter((u) => u.role === "driver").length}</strong>
        </div>

        <div className="card">
          <span>Entreprises</span>
          <strong>{users.filter((u) => u.role === "company").length}</strong>
        </div>

        <div className="card">
          <span>Missions</span>
          <strong>{missions.length}</strong>
        </div>

        <div className="card">
          <span>Comptes suspendus</span>
          <strong>{users.filter((u) => u.is_suspended).length}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-top">
          <h2>Utilisateurs</h2>

          <div className="filters">
            <input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="driver">Conducteurs</option>
              <option value="company">Entreprises</option>
            </select>
          </div>
        </div>

        {filteredUsers.map((user) => (
          <div className="row" key={user.id}>
            <div>
              <strong>{user.full_name || user.company_name || "Utilisateur"}</strong>

              <p>
                {user.role} · {user.city || "Ville non renseignée"}
              </p>
            </div>

            <div className="actions">
              <span className={user.is_suspended ? "suspended" : "standard"}>
                {user.is_admin
                  ? "Admin"
                  : user.is_suspended
                  ? "Suspendu"
                  : "Standard"}
              </span>

              {!user.is_admin && (
                <button onClick={() => toggleSuspend(user)}>
                  {user.is_suspended ? "Réactiver" : "Suspendre"}
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="panel">

  <div className="panel-top">
    <h2>Missions récentes</h2>

    <div className="filters">
      <select
        value={missionFilter}
        onChange={(e) =>
          setMissionFilter(e.target.value)
        }
      >
        <option value="all">
          Toutes les missions
        </option>

        <option value="reported">
          Missions signalées
        </option>
      </select>
    </div>
  </div>

        {filteredMissions.map((mission) => (
          <div className="row" key={mission.id}>
            <div>
              <strong>{mission.title}</strong>

              <p>
                {mission.pickup} → {mission.dropoff}
              </p>
            </div>

            <div className="actions">
  <button
  className="detail-btn"
  onClick={() => setSelectedMission(mission)}
>
  Voir détail
</button>

{mission.is_reported && (
  <button
    className="reported-detail-btn"
    onClick={async () => {
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("mission_id", mission.id)
        .eq("status", "open")
        .maybeSingle();

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
    }}
  >
    ⚠️ Signalée
  </button>
)}
</div>
          </div>
        ))}
      </section>

      {popup && (
  <div className="popup-overlay">
    <div className="popup">
      <div
        className={
          popup.type === "suspend"
            ? "popup-icon suspend"
            : "popup-icon success"
        }
      >
        {popup.type === "suspend" ? "⛔" : "✅"}
      </div>

      <h3>{popup.title}</h3>

      <p>{popup.message}</p>

      <button onClick={() => setPopup(null)}>
        Fermer
      </button>
    </div>
  </div>
)}

{selectedUser && (
  <div className="popup-overlay">
    <div className="detail-popup">

      <div className="detail-header">
        <div>
          <p>Utilisateur</p>

          <h2>
            {selectedUser.full_name ||
              selectedUser.company_name ||
              "Utilisateur"}
          </h2>
        </div>

        <button
          className="close-btn"
          onClick={() => setSelectedUser(null)}
        >
          ✕
        </button>
      </div>

      <div className="detail-grid">

        <div className="detail-card">
          <span>Rôle</span>
          <strong>{selectedUser.role}</strong>
        </div>

        <div className="detail-card">
          <span>Ville</span>
          <strong>
            {selectedUser.city || "Non renseignée"}
          </strong>
        </div>

        <div className="detail-card">
          <span>Statut</span>
          <strong>
            {selectedUser.is_suspended
              ? "Suspendu"
              : "Actif"}
          </strong>
        </div>

        <div className="detail-card">
          <span>Admin</span>
          <strong>
            {selectedUser.is_admin
              ? "Oui"
              : "Non"}
          </strong>
        </div>
      </div>

      <button
        className="detail-close"
        onClick={() => setSelectedUser(null)}
      >
        Fermer
      </button>

    </div>
  </div>
)}

{selectedMission && (
  <div className="popup-overlay">
    <div className="detail-popup">
      <div className="detail-header">
        <div>
          <p>Mission</p>

          <h2>
            {selectedMission.title || "Mission"}
          </h2>
        </div>

        <button
          className="close-btn"
          onClick={() => setSelectedMission(null)}
        >
          ✕
        </button>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <span>Trajet</span>
          <strong>
            {selectedMission.pickup} → {selectedMission.dropoff}
          </strong>
        </div>

        <div className="detail-card">
          <span>Statut</span>
          <strong>{selectedMission.status}</strong>
        </div>

        <div className="detail-card">
          <span>Conducteur</span>
          <strong>
            {selectedMission.driver_name || "Non attribué"}
          </strong>
        </div>

        <div className="detail-card">
          <span>Prix</span>
          <strong>
            {selectedMission.price || "Non renseigné"}
          </strong>
        </div>

        <div className="detail-card">
          <span>Départ</span>
          <strong>
            {selectedMission.start_time
              ? new Date(selectedMission.start_time).toLocaleString("fr-FR")
              : "Non renseigné"}
          </strong>
        </div>

        <div className="detail-card">
          <span>Retour</span>
          <strong>
            {selectedMission.end_time
              ? new Date(selectedMission.end_time).toLocaleString("fr-FR")
              : "Non renseigné"}
          </strong>
        </div>

        <div className="detail-card">
          <span>Facturation</span>
          <strong>
            {selectedMission.invoice_status || "Non facturée"}
          </strong>
        </div>

        <div className="detail-card">
          <span>Entreprise</span>
          <strong>
            {selectedMission.company_id || "Non renseignée"}
          </strong>
        </div>

        
      </div>

      <button
        className="detail-close"
        onClick={() => setSelectedMission(null)}
      >
        Fermer
      </button>
    </div>
  </div>
)}

{showStats && (
  <div className="popup-overlay">
    <div className="detail-popup">

      <div className="detail-header">
        <div>
          <p>Analytics</p>
          <h2>Statistiques plateforme</h2>
        </div>

        <button
          className="close-btn"
          onClick={() => setShowStats(false)}
        >
          ✕
        </button>
      </div>

      <div className="detail-grid">

        <div className="detail-card">
          <span>Taux missions pourvues</span>

          <strong>
            {missions.length === 0
              ? "0%"
              : `${Math.round(
                  (
                    missions.filter(
                      (m) =>
                        m.status === "Pourvue"
                    ).length /
                    missions.length
                  ) * 100
                )}%`}
          </strong>
        </div>

        <div className="detail-card">
          <span>Taux missions terminées</span>

          <strong>
            {missions.length === 0
              ? "0%"
              : `${Math.round(
                  (
                    missions.filter(
                      (m) =>
                        m.status === "Terminée"
                    ).length /
                    missions.length
                  ) * 100
                )}%`}
          </strong>
        </div>

        <div className="detail-card">
          <span>Missions à payer</span>

          <strong>
            {
              missions.filter(
                (m) =>
                  m.status === "Terminée" &&
                  m.invoice_status !== "Payée"
              ).length
            }
          </strong>
        </div>

        <div className="detail-card">
          <span>Utilisateurs suspendus</span>

          <strong>
            {
              users.filter(
                (u) => u.is_suspended
              ).length
            }
          </strong>
        </div>

        <div className="detail-card">
          <span>Conducteurs actifs</span>

          <strong>
            {
              users.filter(
                (u) =>
                  u.role === "driver" &&
                  !u.is_suspended
              ).length
            }
          </strong>
        </div>

        <div className="detail-card">
          <span>Entreprises actives</span>

          <strong>
            {
              users.filter(
                (u) =>
                  u.role === "company" &&
                  !u.is_suspended
              ).length
            }
          </strong>
        </div>

      </div>

      <button
        className="detail-close"
        onClick={() => setShowStats(false)}
      >
        Fermer
      </button>

    </div>
  </div>
)}

{selectedReport && (
  <div className="popup-overlay">
    <div className="detail-popup">
      <div className="detail-header">
        <div>
          <p>Signalement</p>
          <h2>{selectedReport.title}</h2>
        </div>

        <button
          className="close-btn"
          onClick={() => {
            setSelectedReport(null);
            setAdminResponse("");
          }}
        >
          ✕
        </button>
      </div>

      <div className="report-box">
        <span>Motif utilisateur</span>

        <div className="ticket-thread">
  {ticketMessages.map((message) => (
    <div
      className={
        message.sender_role === "admin"
          ? "ticket-message admin"
          : "ticket-message user"
      }
      key={message.id}
    >
      <strong>
        {message.sender_role === "admin"
          ? "Administration"
          : "Utilisateur"}
      </strong>

      <p>{message.message}</p>

      <span>
        {new Date(message.created_at).toLocaleString("fr-FR")}
      </span>
    </div>
  ))}
</div>
      </div>

      <textarea
        className="admin-response"
        placeholder="Répondre à l’utilisateur..."
        value={adminResponse}
        onChange={(e) =>
          setAdminResponse(e.target.value)
        }
      />

      <button
        className="detail-close"
        onClick={async () => {
  if (!adminResponse.trim()) {
    alert("Écris une réponse avant d’envoyer");
    return;
  }

  const user = await getCurrentUser();

  await supabase
    .from("support_messages")
    .insert([
      {
        ticket_id: selectedReport.ticket_id,
        sender_id: user.id,
        sender_role: "admin",
        message: adminResponse,
      },
    ]);

  await supabase
    .from("notifications")
    .insert([
      {
        user_id: selectedReport.reported_by,
        title: "Réponse de l’administration",
        message: adminResponse,
        type: "admin_response",
        ticket_id: selectedReport.ticket_id,
      },
    ]);

  setPopup({
    type: "success",
    title: "Réponse envoyée",
    message:
      "L’utilisateur recevra votre réponse dans ses notifications.",
  });

  setAdminResponse("");

  await loadTicketMessages(
    selectedReport.ticket_id
  );
}}>
  Envoyer la réponse
</button>

    </div>
  </div>
)}

      <style>{`
        .page {
          min-height: 100svh;
          padding: 40px;
          color: white;
          font-family: Inter, Arial, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,0.08), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56,189,248,0.08), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%);
        }
            
        .stats-btn {
  border: 1px solid rgba(74,222,128,0.28);

  padding: 12px 18px;

  border-radius: 999px;

  background:
    linear-gradient(
      180deg,
      #22c55e,
      #16a34a
    );

  color: white;

  font-weight: 900;

  cursor: pointer;

  transition: 0.2s;
}

.notif-btn {
  width: 48px;
  height: 48px;

  border-radius: 999px;

  border: 1px solid rgba(255,255,255,0.08);

  background:
    rgba(255,255,255,0.08);

  color: white;

  font-size: 20px;

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: 0.2s;
}

.notif-btn:hover {
  background:
    rgba(255,255,255,0.14);
}

.ticket-thread {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 18px 0;
}

.ticket-message {
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.08);
}

.ticket-message.user {
  background: rgba(37,99,235,0.12);
}

.ticket-message.admin {
  background: rgba(22,163,74,0.12);
}

.ticket-message p {
  color: #e5e7eb;
  line-height: 1.5;
}

.ticket-message span {
  color: #94a3b8;
  font-size: 12px;
}

.reported-btn {
  padding: 8px 12px;
  border-radius: 999px;
  border: none;
  background: rgba(220,38,38,0.18);
  color: #fca5a5;
  font-weight: 900;
  cursor: pointer;
}

.reported-detail-btn {
  background:
    linear-gradient(
      180deg,
      #dc2626,
      #991b1b
    ) !important;

  color: white;
}

.report-box {
  padding: 22px;
  border-radius: 22px;
  background: rgba(220,38,38,0.08);
  border: 1px solid rgba(220,38,38,0.22);
  margin-bottom: 18px;
}

.report-box span {
  color: #fca5a5;
  font-weight: 900;
}

.report-box p {
  color: #fecaca;
  line-height: 1.5;
}

.admin-response {
  width: 100%;
  min-height: 130px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(15,23,42,0.92);
  color: white;
  font-family: Inter, Arial;
  font-size: 15px;
  resize: none;
  box-sizing: border-box;
}

.reported {
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  white-space: nowrap;
  background: rgba(220,38,38,0.18);
  color: #fca5a5;
}

.stats-btn:hover {
  background:
    rgba(134,239,172,0.18);

  color: #dcfce7;

  border:
    1px solid rgba(134,239,172,0.35);
}

        .top,
        .panel-top,
        .row,
        .actions {
          display: flex;
          align-items: center;
        }

        .detail-popup {
  width: 100%;
  max-width: 760px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,0.14),
      rgba(255,255,255,0.06)
    );

  border: 1px solid rgba(255,255,255,0.1);

  border-radius: 34px;

  padding: 34px;

  backdrop-filter: blur(30px);

  box-shadow:
    0 40px 120px rgba(0,0,0,0.45);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  margin-bottom: 28px;
}

.detail-header p {
  color: #94a3b8;
  margin: 0;
}

.reported-card {
  border:
    1px solid rgba(220,38,38,0.22);

  background:
    rgba(220,38,38,0.08);
}

.reported-card small {
  display: block;

  margin-top: 14px;

  color: #fca5a5;
}

.detail-header h2 {
  margin: 8px 0 0;
  font-size: 34px;
  font-weight: 950;
}

.close-btn {
  width: 42px;
  height: 42px;

  border-radius: 999px;
  border: none;

  background:
    rgba(255,255,255,0.08);

  color: white;

  cursor: pointer;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);

  gap: 18px;
}

.detail-card {
  padding: 22px;

  border-radius: 22px;

  background:
    rgba(255,255,255,0.06);

  border:
    1px solid rgba(255,255,255,0.08);
}

.detail-card span {
  color: #94a3b8;
  display: block;
  margin-bottom: 10px;
}

.detail-card strong {
  font-size: 22px;
}

.detail-close {
  width: 100%;

  margin-top: 26px;

  padding: 16px;

  border: none;
  border-radius: 999px;

  background:
    linear-gradient(
      180deg,
      #2563eb,
      #1d4ed8
    );

  color: white;

  font-weight: 900;

  cursor: pointer;
}

        .top {
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 32px;
        }

        .top p {
          color: #94a3b8;
          margin: 0;
        }

        h1 {
          margin: 8px 0 0;
          font-size: 42px;
          font-weight: 950;
        }

        .top button:not(.stats-btn),
.actions button {
          border: none;
          padding: 12px 16px;
          border-radius: 999px;
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 900;
          cursor: pointer;
        }

        .top-actions {
  display: flex;
  align-items: center;
  gap: 32px;
}

        .cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 34px;
        }

        .card,
        .panel {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 24px;
        }

        .popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.popup {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  border-radius: 30px;
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,0.14),
      rgba(255,255,255,0.06)
    );

  border: 1px solid rgba(255,255,255,0.12);

  text-align: center;

  box-shadow:
    0 40px 120px rgba(0,0,0,0.45);

  backdrop-filter: blur(30px);
}

.popup-icon {
  width: 82px;
  height: 82px;
  border-radius: 999px;
  margin: 0 auto 18px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 38px;
}

.popup-icon.success {
  background: rgba(22,163,74,0.18);
}

.popup-icon.suspend {
  background: rgba(220,38,38,0.18);
}

.popup h3 {
  margin: 0;
  font-size: 30px;
  font-weight: 950;
}

.popup p {
  margin-top: 14px;
  color: #cbd5e1;
  line-height: 1.5;
}

.popup button {
  width: 100%;
  margin-top: 24px;
  padding: 15px;
  border: none;
  border-radius: 999px;

  background:
    linear-gradient(
      180deg,
      #2563eb,
      #1d4ed8
    );

  color: white;
  font-weight: 900;
  cursor: pointer;
}

        .card span {
          color: #94a3b8;
        }

        .card strong {
          display: block;
          margin-top: 10px;
          font-size: 38px;
          font-weight: 950;
        }

        .panel {
          margin-top: 22px;
        }

        .panel-top {
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .panel h2 {
          margin: 0;
        }

        .filters {
          display: flex;
          gap: 10px;
        }

        .filters input,
        .filters select {
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.9);
          color: white;
          outline: none;
        }

        .row {
          justify-content: space-between;
          gap: 18px;
          padding: 16px 0;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .row p {
          margin: 6px 0 0;
          color: #94a3b8;
        }

        .actions {
          gap: 10px;
        }

        .standard,
        .suspended {
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 800;
          white-space: nowrap;
        }

        .standard {
          background: rgba(37,99,235,0.18);
          color: #bfdbfe;
        }

        .suspended {
          background: rgba(220,38,38,0.18);
          color: #fca5a5;
        }

        @media (max-width: 900px) {
          .page {
            padding: 24px 16px;
          }

          .top,
          .panel-top,
          .row,
          .actions,
          .filters {
            flex-direction: column;
            align-items: stretch;
          }

          .cards {
            grid-template-columns: 1fr;
          }

          h1 {
            font-size: 34px;
          }

          .actions button,
          .filters input,
          .filters select {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}