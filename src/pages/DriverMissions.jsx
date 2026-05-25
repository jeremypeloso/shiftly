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

  setMissions(merged);
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

  alert("Mission terminée ✅");

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

      <button
  className="message-btn"
  onClick={() => {
    alert("Messagerie bientôt disponible");
  }}
>
  Contacter l’entreprise
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

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
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