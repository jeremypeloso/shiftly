import { useEffect, useState } from "react";

export default function OpenMissions() {
  const [missions, setMissions] = useState([]);

  const driverProfile = {
    id: "driver_001",
    name: "Yorick Martin",
    city: "Limetz-Villez",
    permits: "Permis D",
    fimo: "À jour",
    experience: "8 ans",
    shiftScore: 92,
    availability: "Disponible",
  };

  useEffect(() => {
  const savedMissions = JSON.parse(
    localStorage.getItem("shiftlyMissions") || "[]"
  );

  const applications = JSON.parse(
    localStorage.getItem("shiftlyApplications") || "[]"
  );

  const openMissions = savedMissions
    .filter((mission) => mission.status === "Ouverte")
    .map((mission) => ({
      ...mission,

      applied: applications.some(
        (app) =>
          app.missionId === mission.id &&
          app.driver.id === driverProfile.id
      ),
    }));

  setMissions(openMissions);
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

    if (alreadyApplied) {
      alert("Vous avez déjà postulé à cette mission.");
      return;
    }

    const newApplication = {
      id: Date.now(),
      missionId: mission.id,
      missionTitle: mission.title,
      status: "En attente",
      driver: driverProfile,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "shiftlyApplications",
      JSON.stringify([...applications, newApplication])
    );

    setMissions((prev) =>
  prev.map((item) =>
    item.id === mission.id
      ? { ...item, applied: true }
      : item
  )
);
  }

  return (
    <main className="page">
      <section className="header">
        <div>
          <p>Conducteur</p>
          <h1>Missions ouvertes</h1>
        </div>
      </section>

      <section className="grid">
        {missions.length === 0 && (
          <div className="empty">
            Aucune mission ouverte pour le moment.
          </div>
        )}

        {missions.map((mission) => (
          <div className="mission-card" key={mission.id}>
            <span className="status">{mission.status}</span>

            <h2>{mission.title}</h2>

            <p>📍 {mission.pickup} → {mission.dropoff}</p>
            <p>
              📅 {new Date(mission.start).toLocaleString("fr-FR")}
            </p>
            <p>🚍 {mission.vehicle}</p>
            <p>👥 {mission.passengers}</p>
            <p>📄 {mission.documents}</p>

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
      </section>

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

        .header p {
          color: #94a3b8;
          margin: 0;
        }

        .header h1 {
          margin: 8px 0 32px;
          font-size: 42px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .mission-card,
        .empty {
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 18px 45px rgba(0,0,0,0.22);
        }

        .status {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(37,99,235,0.18);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
        }

        .mission-card h2 {
          margin: 14px 0;
          font-size: 24px;
        }

        .mission-card p {
          color: #cbd5e1;
          margin: 8px 0;
        }

        .mission-card button {
          width: 100%;
          margin-top: 18px;
          padding: 14px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 900;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .page {
            padding: 24px 16px;
          }

          .header h1 {
            font-size: 34px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .applied-btn {
  width: 100%;
  margin-top: 18px;
  padding: 14px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(180deg, #16a34a, #15803d);
  color: white;
  font-weight: 900;
  cursor: default;
}
        }
      `}</style>
    </main>
  );
}