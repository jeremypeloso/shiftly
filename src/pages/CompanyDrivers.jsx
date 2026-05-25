import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function CompanyDrivers() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);

  useEffect(() => {
  loadApplications();
}, []);

async function loadApplications() {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return;
  }

  setApplications(data || []);
}

  function acceptApplication(application) {
  const missions = JSON.parse(
    localStorage.getItem("shiftlyMissions") || "[]"
  );

  const updatedMissions = missions.map((mission) =>
    String(mission.id) === String(application.missionId)
      ? {
          ...mission,
          status: "Pourvue",
          color: "#16a34a",
          driver: application.driver.name,
          driverId: application.driver.id,
        }
      : mission
  );

  const updatedApplications = applications.map((app) =>
    String(app.id) === String(application.id)
      ? { ...app, status: "Acceptée" }
      : app
  );

  setApplications(updatedApplications);
}

  return (
    <main className="page">
      <header className="top">
        <div>
          <p>Entreprise</p>

          <h1>Candidatures conducteurs</h1>
        </div>

        <button
          className="back-btn"
          onClick={() => navigate("/company")}
        >
          ← Retour dashboard
        </button>
      </header>

      <section className="grid">
        {applications.length === 0 && (
          <div className="empty">
            Aucune candidature reçue.
          </div>
        )}

        {applications.map((app) => (
          <div className="card" key={app.id}>
            <span className="status">
              {app.status}
            </span>

            <h2>{app.driver_name}</h2>

            <p>
              Ville : {app.driver_city}
            </p>

            <p>
              {app.driver_permits} · FIMO {app.driver_fimo}
            </p>

            <p>
              Expérience : {app.driver_experience}
            </p>

            <p>
              ShiftScore : ⭐ {app.driver_shift_score}
            </p>

            <p>
              Disponibilité : {app.driver_availability}
            </p>

            <div className="actions">
              <button
  onClick={() =>
    alert(
      `Conducteur : ${app.driver_name}
Ville : ${app.driver_city}
Permis : ${app.driver_permits}
FIMO : ${app.driver_fimo}
Expérience : ${app.driver_experience}
ShiftScore : ${app.driver_shift_score}
Disponibilité : ${app.driver_availability}`
    )
  }
>
  Voir profil
</button>

              <button
  className="accept"
  onClick={() => acceptApplication(app)}
>
  {app.status === "Acceptée" ? "Acceptée" : "Accepter"}
</button>
            </div>
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
            radial-gradient(
              circle at top left,
              rgba(251,191,36,0.08),
              transparent 34%
            ),

            radial-gradient(
              circle at bottom right,
              rgba(56,189,248,0.08),
              transparent 34%
            ),

            linear-gradient(
              135deg,
              #0f172a 0%,
              #162033 52%,
              #1f2937 100%
            );
        }

        .top {
          display: flex;

          justify-content: space-between;

          align-items: center;

          gap: 20px;

          margin-bottom: 32px;
        }

        header p {
          color: #94a3b8;
          margin: 0;
        }

        header h1 {
          margin: 8px 0 0;

          font-size: 42px;

          font-weight: 950;

          letter-spacing: -0.05em;
        }

        .back-btn {
          padding: 14px 18px;

          border-radius: 999px;

          border: none;

          background:
            linear-gradient(
              180deg,
              #2563eb,
              #1d4ed8
            );

          color: white;

          font-weight: 800;

          cursor: pointer;

          white-space: nowrap;
        }

        .grid {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 18px;
        }

        .card,
        .empty {
          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.12),
              rgba(255,255,255,0.05)
            );

          border:
            1px solid rgba(255,255,255,0.1);

          border-radius: 24px;

          padding: 24px;

          box-shadow:
            0 18px 45px rgba(0,0,0,0.22);
        }

        .status {
          display: inline-flex;

          padding: 6px 10px;

          border-radius: 999px;

          background:
            rgba(37,99,235,0.18);

          color: #bfdbfe;

          font-size: 12px;

          font-weight: 900;
        }

        .card h2 {
          margin: 14px 0;
          font-size: 26px;
        }

        .card p {
          color: #cbd5e1;
          margin: 8px 0;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .actions button {
          flex: 1;

          padding: 12px;

          border-radius: 999px;

          border: none;

          background:
            rgba(255,255,255,0.08);

          color: white;

          font-weight: 800;

          cursor: pointer;
        }

        .actions .accept {
          background:
            linear-gradient(
              180deg,
              #16a34a,
              #15803d
            );
        }

        @media (max-width: 900px) {

          .page {
            padding: 24px 16px;
          }

          .top {
            flex-direction: column;
            align-items: stretch;
          }

          .back-btn {
            width: 100%;
          }

          header h1 {
            font-size: 34px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}