import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CompanyDashboard() {
  const navigate = useNavigate();

  const [selectedMission, setSelectedMission] = useState(null);
  const [editMission, setEditMission] = useState(null);
  const [createdMissions, setCreatedMissions] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const savedMissions = JSON.parse(
      localStorage.getItem("shiftlyMissions") || "[]"
    );

    const savedApplications = JSON.parse(
      localStorage.getItem("shiftlyApplications") || "[]"
    );

    setCreatedMissions(savedMissions);
    setApplications(savedApplications);
  }, []);

  function deleteMission(missionToDelete) {
    const updatedMissions = createdMissions.filter(
      (mission) => mission.id !== missionToDelete.id
    );

    localStorage.setItem("shiftlyMissions", JSON.stringify(updatedMissions));

    setCreatedMissions(updatedMissions);
    setSelectedMission(null);
  }

  function updateMission() {
    const updatedMissions = createdMissions.map((mission) =>
      mission.id === editMission.id ? editMission : mission
    );

    localStorage.setItem("shiftlyMissions", JSON.stringify(updatedMissions));

    setCreatedMissions(updatedMissions);
    setSelectedMission(editMission);
    setEditMission(null);
  }

  const missions = [
    {
      id: "demo-1",
      title: "CDG → Rouen",
      status: "Ouverte",
      start: "2026-05-22T06:30:00",
      end: "2026-05-22T18:45:00",
      color: "#2563eb",
      pickup: "Roissy CDG",
      dropoff: "Rouen Centre",
      driver: "Non attribué",
      vehicle: "Autocar GT",
      type: "Transport tourisme",
      passengers: "48 passagers",
      price: "250 € net",
      comment: "Mission exemple.",
      documents: "Permis D + FIMO",
      demo: true,
    },
    {
      id: "demo-2",
      title: "Paris → Lille",
      status: "Pourvue",
      start: "2026-05-24T08:00:00",
      end: "2026-05-24T19:00:00",
      color: "#16a34a",
      pickup: "Paris Bercy",
      dropoff: "Lille Europe",
      driver: "Yorick Martin",
      vehicle: "Autocar",
      type: "Ligne occasionnelle",
      passengers: "52 passagers",
      price: "500 € net",
      comment: "Prévoir tenue professionnelle.",
      documents: "Permis D + FIMO",
      demo: true,
    },
  ];

  const allMissions = [...missions, ...createdMissions];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Shiftly</h2>

        <nav>
          <button className="active">Dashboard</button>

          <button onClick={() => navigate("/company/create-mission")}>
            Créer mission
          </button>

          <button onClick={() => navigate("/company/drivers")}>
            Candidatures
          </button>

          <button>Missions</button>
          <button>Facturation</button>
        </nav>
      </aside>

      <main className="content">
        <header className="top">
          <div>
            <p>Bonjour TransExpress 👋</p>
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
            <strong>{applications.length}</strong>
          </div>

          <div className="card">
            <span>Taux de réponse</span>
            <strong>86%</strong>
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
            <div className="mission-tile" key={mission.id}>
              <span>{mission.status}</span>

              <h3>{mission.title}</h3>

              <p>
                📍 {mission.pickup} → {mission.dropoff}
              </p>

              <p>
                📅 Départ : {new Date(mission.start).toLocaleString("fr-FR")}
              </p>

              <p>
                🔁 Retour : {new Date(mission.end).toLocaleString("fr-FR")}
              </p>

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
                <h3>Candidatures reçues</h3>

                {applications.filter((app) => app.missionId === selectedMission.id)
                  .length === 0 && (
                  <p className="no-app">Aucune candidature pour le moment.</p>
                )}

                {applications
                  .filter((app) => app.missionId === selectedMission.id)
                  .map((app) => (
                    <div className="application-card" key={app.id}>
                      <div>
                        <strong>{app.driver.name}</strong>
                        <p>{app.driver.city}</p>
                        <p>
                          {app.driver.permits} · FIMO {app.driver.fimo}
                        </p>
                        <p>
                          {app.driver.experience} · ShiftScore{" "}
                          {app.driver.shiftScore}
                        </p>
                      </div>

                      <button>Accepter</button>
                    </div>
                  ))}
              </div>

              <div className="modal-actions">
                <button
                  className="secondary-btn"
                  onClick={() => setEditMission(selectedMission)}
                >
                  Modifier
                </button>

                {!selectedMission.demo && (
                  <button
                    className="delete-btn"
                    onClick={() => deleteMission(selectedMission)}
                  >
                    Supprimer
                  </button>
                )}
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
                  value={editMission.driver}
                  onChange={(e) =>
                    setEditMission({
                      ...editMission,
                      driver: e.target.value,
                    })
                  }
                  placeholder="Conducteur"
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
      </main>

      <style>{`
        * {
          box-sizing: border-box;
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

        .delete-btn {
          background: linear-gradient(180deg, #dc2626, #991b1b) !important;
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
          align-items: center;
          z-index: 999;
          padding: 20px;
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
            margin-top: 16px;
            flex-direction: row;
            overflow-x: auto;
            gap: 10px;
            padding-bottom: 6px;
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