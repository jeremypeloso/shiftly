import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function DriverDashboard() {
  const [openMissions, setOpenMissions] = useState([]);
  const [myMissions, setMyMissions] = useState([]);

  const driverProfile = {
    id: "driver_001",
    name: "Yorick Martin",
  };

  useEffect(() => {
    const savedMissions = JSON.parse(
      localStorage.getItem("shiftlyMissions") || "[]"
    );

    const applications = JSON.parse(
      localStorage.getItem("shiftlyApplications") || "[]"
    );

    const missionsOpen = savedMissions
      .filter((mission) => mission.status === "Ouverte")
      .map((mission) => ({
        ...mission,
        applied: applications.some(
          (app) =>
            app.missionId === mission.id &&
            app.driver.id === driverProfile.id
        ),
      }));

    const assignedMissions = savedMissions.filter(
      (mission) =>
        mission.driverId === driverProfile.id &&
mission.status === "Pourvue"
    );

    setOpenMissions(missionsOpen);
    setMyMissions(assignedMissions);
  }, []);

  function applyToMission(mission) {
    const applications = JSON.parse(
      localStorage.getItem("shiftlyApplications") || "[]"
    );

    const alreadyApplied = applications.some(
      (app) =>
        app.missionId === mission.id &&
        app.driver.id === driverProfile.id
    );

    if (alreadyApplied) return;

    const newApplication = {
  id: Date.now(),
  missionId: mission.id,
  missionTitle: mission.title,

  driver: {
    id: driverProfile.id,
    name: driverProfile.name,
    city: "Limetz-Villez",
    permits: "Permis D",
    fimo: "À jour",
    experience: "8 ans",
    shiftScore: 92,
    availability: "Disponible",
  },

  status: "En attente",
};

    localStorage.setItem(
      "shiftlyApplications",
      JSON.stringify([...applications, newApplication])
    );

    setOpenMissions((prev) =>
      prev.map((item) =>
        item.id === mission.id ? { ...item, applied: true } : item
      )
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Shiftly</h2>

        <nav>
          <button className="active">Dashboard</button>
          <button>Missions</button>
          <button>Disponibilités</button>
          <button>Profil</button>
          <button>Messages</button>
        </nav>
      </aside>

      <main className="content">
        <header className="top">
          <div>
            <p>Bonjour Yorick 👋</p>
            <h1>Tableau conducteur</h1>
          </div>

          <div className="score">⭐ ShiftScore 92</div>
        </header>

        <section className="cards">
          <div className="card">
            <span>Missions disponibles</span>
            <strong>{openMissions.length}</strong>
          </div>

          <div className="card">
            <span>Missions attribuées</span>
            <strong>{myMissions.length}</strong>
          </div>

          <div className="card">
            <span>Revenus estimés</span>
            <strong>2 450€</strong>
          </div>
        </section>

        <section className="calendar-section">
          <h2>Mon agenda</h2>

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
              events={myMissions.map((mission) => ({
                title: mission.title,
                start: mission.start,
                end: mission.end,
                color: "#16a34a",
              }))}
            />
          </div>
        </section>

        <section className="missions">
          <div className="section-title">
            <h2>Missions ouvertes</h2>
            <span>{openMissions.length} disponibles</span>
          </div>

          <div className="mission-list">
            {openMissions.length === 0 && (
              <div className="empty">
                Aucune mission ouverte pour le moment.
              </div>
            )}

            {openMissions.map((mission) => (
              <div className="mission" key={mission.id}>
                <div>
                  <strong>{mission.title}</strong>
                  <p>
                    📍 {mission.pickup} → {mission.dropoff}
                  </p>
                  <p>
  📅 Départ :{" "}
  {new Date(mission.start).toLocaleString("fr-FR")}
</p>

<p>
  🔁 Retour :{" "}
  {new Date(mission.end).toLocaleString("fr-FR")}
</p>
                  <p>
                    🚍 {mission.vehicle} · 👥 {mission.passengers}
                  </p>

                  <p>💶 {mission.price || "Prix non renseigné"}</p>

                  <p>
  📝 {mission.comment || "Aucune consigne particulière"}
</p>
                </div>

                {mission.applied ? (
                  <button className="applied-btn">
                    ✓ Candidature envoyée
                  </button>
                ) : (
                  <button onClick={() => applyToMission(mission)}>
                    Postuler
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        .dashboard {
          min-height: 100svh;
          display: flex;
          color: white;
          font-family: Inter, Arial, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,0.1), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56,189,248,0.1), transparent 34%),
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

        nav .active {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
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

        .score {
          background: rgba(37,99,235,0.18);
          color: #bfdbfe;
          padding: 12px 18px;
          border-radius: 999px;
          font-weight: 800;
          white-space: nowrap;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-top: 40px;
        }

        .card {
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 18px 45px rgba(0,0,0,0.22);
        }

        .card span {
          display: block;
          color: #94a3b8;
          margin-bottom: 10px;
        }

        .card strong {
          display: block;
          font-size: 38px;
          font-weight: 950;
        }

        .calendar-section {
          margin-top: 40px;
        }

        .calendar-section h2,
        .missions h2 {
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
        }

        .missions {
          margin-top: 40px;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
        }

        .section-title h2 {
          margin: 0;
        }

        .section-title span {
          color: #94a3b8;
        }

        .mission {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 14px;
        }

        .mission p {
          color: #94a3b8;
          margin: 6px 0 0;
        }

        .mission button,
        .applied-btn {
          min-width: 190px;
          padding: 12px 18px;
          border-radius: 999px;
          border: none;
          color: white;
          font-weight: 800;
        }

        .mission button {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          cursor: pointer;
        }

        .applied-btn {
          background: linear-gradient(180deg, #16a34a, #15803d);
          cursor: default;
        }

        .empty {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 20px;
          color: #cbd5e1;
        }

        @media (max-width: 900px) {
          .dashboard {
            display: block;
            overflow-x: hidden;
          }

          .sidebar {
            width: 100%;
            padding: 20px 16px;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }

          nav {
            margin-top: 18px;
            flex-direction: row;
            overflow-x: auto;
            gap: 10px;
            padding-bottom: 4px;
          }

          nav button {
            white-space: nowrap;
            padding: 12px 14px;
            font-size: 13px;
          }

          .content {
            padding: 24px 16px 40px;
          }

          .top {
            flex-direction: column;
            align-items: flex-start;
          }

          .top h1 {
            font-size: 34px;
            line-height: 1;
          }

          .score {
            width: 100%;
            text-align: center;
          }

          .cards {
            grid-template-columns: 1fr;
            gap: 14px;
            margin-top: 28px;
          }

          .calendar-card {
            padding: 10px;
            border-radius: 18px;
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

          .fc .fc-event {
            font-size: 9px !important;
            padding: 2px 4px !important;
            white-space: normal !important;
            line-height: 1.2;
          }

          .section-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .mission {
            flex-direction: column;
            align-items: flex-start;
          }

          .mission button,
          .applied-btn {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}