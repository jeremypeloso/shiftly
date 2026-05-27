import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

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

  async function loadMissions() {
  setLoading(true);

  const user = await getCurrentUser();

  if (!user) {
    console.warn("Session absente temporairement");
    setLoading(false);
    return;
  }

  const { data: applicationsData, error: applicationsError } =
    await supabase
      .from("applications")
      .select(`
        *,
        missions (*)
      `)
      .eq("driver_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  if (applicationsError) {
    console.error(applicationsError);
    setLoading(false);
    return;
  }

  const { data: invitationsData, error: invitationsError } =
    await supabase
      .from("mission_invitations")
      .select(`
        *,
        missions (*)
      `)
      .eq("driver_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  if (invitationsError) {
    console.error(invitationsError);
    setLoading(false);
    return;
  }

  const merged = [
    ...(applicationsData || []).map((item) => ({
      type: "application",
      status: item.status,
      mission: item.missions,
    })),

    ...(invitationsData || []).map((item) => ({
      type: "invitation",
      status: item.status,
      mission: item.missions,
    })),
  ];

  const uniqueMissions = merged.filter(
  (item, index, array) =>
    item.mission?.id &&
    index ===
      array.findIndex(
        (other) =>
          other.mission?.id === item.mission?.id
      )
);

setMissions(uniqueMissions);
  setLoading(false);
}

  function filteredMissions() {
  switch (activeTab) {
    case "en-cours":
      return missions.filter(
        (m) =>
          m.status === "Acceptée" &&
          m.mission?.status !== "Terminée"
      );

    case "candidatures":
      return missions.filter(
        (m) => m.status === "En attente"
      );

    case "refusees":
      return missions.filter(
        (m) => m.status === "Refusée"
      );

    case "archivees":
      return missions.filter((m) => {
        const endDate = new Date(
          m.mission?.end_time
        );

        return (
          m.mission?.status === "Terminée" ||
          endDate < new Date()
        );
      });

    default:
      return missions;
  }
}

async function completeMission(mission) {
  console.log("MISSION REÇUE :", mission);

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
  message:
    "La mission a bien été marquée comme terminée.",
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
    alert("Expliquez le problème avant d’envoyer.");
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
    message:
      "Votre demande a été transmise à l’administration Shiftly.",
  });

  setReportReason("");
  setReportMissionTarget(null);
  setSelectedMission(null);

  await loadMissions();
}

  return (
    <div className="page">
      <div className="top">
        <h1>Mes missions</h1>

        <button
  disabled={pageLocked}
  onClick={() => {
    if (pageLocked) return;

    setPageLocked(true);

    navigate("/driver", {
      replace: true,
    });
  }}
>
  Retour dashboard
</button>
      </div>

      <div className="tabs">
        <button
          className={
            activeTab === "en-cours"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("en-cours")
          }
        >
          En cours
        </button>

        <button
          className={
            activeTab ===
            "candidatures"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("candidatures")
          }
        >
          Candidatures
        </button>

        <button
          className={
            activeTab === "refusees"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("refusees")
          }
        >
          Refusées
        </button>

        <button
          className={
            activeTab === "archivees"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("archivees")
          }
        >
          Archivées
        </button>
      </div>

      <div className="list">
  {loading && (
    <div>Chargement...</div>
  )}

  {!loading &&
    filteredMissions().map(
      (item, index) => (
        <div
          className="card"
          key={index}
        >
          <div>
            <strong>
              {
                item.mission
                  ?.title
              }
            </strong>

            <p>
              📍{" "}
              {
                item.mission
                  ?.pickup
              }{" "}
              →{" "}
              {
                item.mission
                  ?.dropoff
              }
            </p>

            <p>
              📅{" "}
              {new Date(
                item.mission?.start_time
              ).toLocaleString(
                "fr-FR"
              )}
            </p>

            <p>
              💶{" "}
              {item.mission
                ?.price ||
                "Non renseigné"}
            </p>
          </div>

          <div className="card-actions">
            <span className="status">
              {item.status}
            </span>

            <button
  className="detail-btn"
  onClick={() => setSelectedMission(item)}
>
  Voir détail
</button>

{activeTab === "en-cours" && (
  <button
  type="button"
  className="complete-btn"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("CLIC MISSION TERMINÉE", item.mission);

    completeMission(item.mission);
  }}
>
  Mission terminée
</button>
)}

          </div>
        </div>
      )
    )}
</div>

      {selectedMission && (
  <div
    className="modal-overlay"
    onClick={() => setSelectedMission(null)}
  >
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <button
        className="close"
        onClick={() => setSelectedMission(null)}
      >
        ✕
      </button>

      <h2>{selectedMission.mission?.title}</h2>

      <p>📍 {selectedMission.mission?.pickup} → {selectedMission.mission?.dropoff}</p>
      <p>📅 Départ : {new Date(selectedMission.mission?.start_time).toLocaleString("fr-FR")}</p>
      <p>🔁 Retour : {new Date(selectedMission.mission?.end_time).toLocaleString("fr-FR")}</p>
      <p>🚍 Véhicule : {selectedMission.mission?.vehicle}</p>
      <p>👥 Passagers : {selectedMission.mission?.passengers}</p>
      <p>💶 Prix : {selectedMission.mission?.price || "Non renseigné"}</p>
      <p>📄 Documents : {selectedMission.mission?.documents || "Non renseigné"}</p>
      <p>📝 Commentaire : {selectedMission.mission?.comment || "Aucun commentaire"}</p>
      <p>📌 Statut : {selectedMission.status}</p>

<div className="modal-actions">

  <button
  className="report-btn"
  onClick={() =>
    setReportMissionTarget(selectedMission.mission)
  }
>
  Signaler un problème
</button>

  <button
    className="message-btn"
    onClick={() => {
      alert(
        "Messagerie bientôt disponible"
      );
    }}
  >
    Contacter l’entreprise
  </button>

</div>
    </div>
  </div>
)}

{reportMissionTarget && (
  <div className="modal-overlay">
    <div className="modal report-modal">
      <button
        className="close"
        onClick={() => {
          setReportMissionTarget(null);
          setReportReason("");
        }}
      >
        ✕
      </button>

      <h2>Signaler un problème</h2>

      <p className="report-help">
        Expliquez brièvement le problème rencontré sur cette mission.
      </p>

      <textarea
        className="report-textarea"
        placeholder="Exemple : horaires incorrects, mission non conforme, problème avec l’entreprise..."
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}
      />

      <div className="modal-actions">
        <button
          className="report-btn"
          onClick={() => reportMission(reportMissionTarget)}
        >
          Envoyer le signalement
        </button>

        <button
          className="message-btn"
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
  <div className="modal-overlay">
    <div className="popup">

      <div className="popup-icon success">
        ✅
      </div>

      <h3>{popup.title}</h3>

      <p>{popup.message}</p>

      <button
        onClick={() => setPopup(null)}
      >
        Fermer
      </button>

    </div>
  </div>
)}

      <style>{`
        .page {
          min-height: 100svh;
          padding: 40px;
          background:
            linear-gradient(
              135deg,
              #0f172a 0%,
              #162033 52%,
              #1f2937 100%
            );
          color: white;
          font-family: Inter, Arial;
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

  border:
    1px solid rgba(255,255,255,0.12);

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
  background:
    rgba(22,163,74,0.18);
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
      #16a34a,
      #15803d
    );

  color: white;

  font-weight: 900;

  cursor: pointer;
}

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .report-help {
  color: #cbd5e1;
  line-height: 1.5;
}

.report-modal {
  max-width: 560px;
}

.report-textarea {
  width: 100%;
  min-height: 130px;
  margin-top: 18px;
  margin-bottom: 20px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(15,23,42,0.92);
  color: white;
  font-size: 15px;
  font-family: Inter, Arial;
  outline: none;
  resize: none;
  box-sizing: border-box;
}

.report-textarea::placeholder {
  color: #94a3b8;
}

        .modal-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 24px;
  align-items: stretch;
}

.report-textarea {
  width: 100%;

  min-height: 110px;

  margin-top: 22px;
  margin-bottom: 20px;

  padding: 18px;

  border-radius: 24px;

  border:
    1px solid rgba(255,255,255,0.08);

  background:
    linear-gradient(
      180deg,
      rgba(15,23,42,0.92),
      rgba(15,23,42,0.82)
    );

  color: white;

  font-size: 15px;

  font-family: Inter, Arial;

  outline: none;

  resize: none;

  box-sizing: border-box;

  transition: 0.2s;
}

.report-textarea:focus {
  border:
    1px solid rgba(59,130,246,0.35);

  background:
    rgba(15,23,42,0.98);
}

.report-textarea::placeholder {
  color: #94a3b8;
}

.modal-actions button {
  width: 100%;
  height: 52px;
  min-height: 52px;
  margin: 0;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.report-btn {
  padding: 14px;

  border: none;

  border-radius: 999px;

  background:
    rgba(220,38,38,0.16);

  color: #fecaca;

  font-weight: 900;

  cursor: pointer;
}

        .complete-btn {
  padding: 10px 14px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(180deg, #16a34a, #15803d);
  color: white;
  font-weight: 800;
  cursor: pointer;
}

        .detail-btn,
.message-btn {
  padding: 10px 14px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(180deg, #2563eb, #1d4ed8);
  color: white;
  font-weight: 800;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-radius: 20px;
  background:
    rgba(255,255,255,0.08);
  border:
    1px solid
    rgba(255,255,255,0.08);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card p {
  color: #94a3b8;
  margin-top: 6px;
}

.status {
  padding: 10px 14px;
  border-radius: 999px;
  background:
    rgba(37,99,235,0.18);
  color: #bfdbfe;
  font-weight: 800;
  white-space: nowrap;
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

.report-btn {
  width: 100%;

  margin-top: 18px;

  padding: 14px;

  border: none;

  border-radius: 999px;

  background:
    rgba(220,38,38,0.16);

  color: #fecaca;

  font-weight: 900;

  cursor: pointer;
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

        .tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }

        .tabs button,
        .top button {
          border: none;
          padding: 12px 18px;
          border-radius: 999px;
          background:
            rgba(255,255,255,0.08);
          color: white;
          cursor: pointer;
          font-weight: 700;
        }

        .tabs .active {
          background:
            linear-gradient(
              180deg,
              #2563eb,
              #1d4ed8
            );
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border-radius: 20px;
          background:
            rgba(255,255,255,0.08);
          border:
            1px solid
            rgba(255,255,255,0.08);
        }

        .card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

        .card p {
          color: #94a3b8;
          margin-top: 6px;
        }

        .status {
          padding: 10px 14px;
          border-radius: 999px;
          background:
            rgba(37,99,235,0.18);
          color: #bfdbfe;
          font-weight: 800;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .page {
            padding: 20px;
          }

          .card-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.card-actions button,
.card-actions .status {
  width: 100%;
  min-width: 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status {
  height: 42px;
}

          .top {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .card {
            flex-direction: column;
            align-items: flex-start;
          }

          .status {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}