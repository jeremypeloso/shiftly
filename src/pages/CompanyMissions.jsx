import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export default function CompanyMissions() {
  const navigate = useNavigate();

  const [missions, setMissions] = useState([]);

  useEffect(() => {
    loadMissions();
  }, []);

  async function loadMissions() {
    const user = await getCurrentUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .eq("company_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setMissions(data || []);
  }

  return (
    <main className="page">
      <header className="top">
        <div>
          <p>Entreprise</p>
          <h1>Mes missions</h1>
        </div>

        <button
          className="back-btn"
          onClick={() => navigate("/company")}
        >
          ← Retour dashboard
        </button>
      </header>

      <section className="grid">
        {missions.map((mission) => (
          <div className="card" key={mission.id}>
            <span
  className={
    mission.driver_name &&
    mission.driver_name !== "Non attribué"
      ? "assigned"
      : "waiting"
  }
>
  {mission.driver_name &&
  mission.driver_name !== "Non attribué"
    ? "Conducteur attribué"
    : "En attente d’attribution"}
</span>

            <h2>{mission.title}</h2>

            <p>
              📍 {mission.pickup} → {mission.dropoff}
            </p>

            <p>
              📅{" "}
              {new Date(
                mission.start_time
              ).toLocaleString("fr-FR")}
            </p>

            <div className="driver-box">
              <span>Conducteur</span>

              <strong>
                {mission.driver_name ||
                  "Aucun conducteur"}
              </strong>
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
            radial-gradient(circle at top left, rgba(251,191,36,0.08), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56,189,248,0.08), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%);
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        h1 {
          margin: 8px 0 0;
          font-size: 42px;
          font-weight: 950;
        }

        .back-btn {
          padding: 14px 18px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(180deg,#2563eb,#1d4ed8);
          color: white;
          font-weight: 800;
          cursor: pointer;
        }

        .waiting {
  background: rgba(249,115,22,0.18);
  color: #fdba74;
}

.assigned,
.waiting {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.assigned {
  background: rgba(22,163,74,0.2);
  color: #86efac;
}

.waiting {
  background: rgba(249,115,22,0.18);
  color: #fdba74;
}

        .grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 18px;
        }

        .card {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 24px;
        }

        .assigned,
        .open
        .waiting {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
        }

        .waiting {
  background: rgba(249,115,22,0.18);
  color: #fdba74;
}

        .assigned {
          background: rgba(22,163,74,0.2);
          color: #86efac;
        }


        
        .driver-box {
          margin-top: 18px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.06);
        }

        .driver-box span {
          display: block;
          color: #94a3b8;
          margin-bottom: 6px;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .page {
            padding: 24px 16px;
          }

          .top {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }

          .back-btn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}