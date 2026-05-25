import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export default function CompanyBilling() {
  const navigate = useNavigate();

  const [missions, setMissions] = useState([]);

  useEffect(() => {
    loadBilling();
  }, []);

  async function loadBilling() {
    const user = await getCurrentUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .eq("company_id", user.id)
      .eq("status", "Terminée")
      .order("completed_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setMissions(data || []);
  }

  async function markAsPaid(mission) {
    const { error } = await supabase
      .from("missions")
      .update({
        invoice_status: "Payée",
        paid_at: new Date().toISOString(),
      })
      .eq("id", mission.id);

    if (error) {
      console.error(error);
      return;
    }

    await loadBilling();
  }

  const totalRevenue = missions.reduce((sum, mission) => {
    return sum + Number(mission.price || 0);
  }, 0);

  const unpaid = missions.filter(
    (m) => m.invoice_status !== "Payée"
  ).length;

  const paid = missions.filter(
    (m) => m.invoice_status === "Payée"
  ).length;

  return (
    <main className="page">
      <header className="top">
        <div>
          <p>Entreprise</p>
          <h1>Facturation conducteurs</h1>
        </div>

        <button
          className="back-btn"
          onClick={() => navigate("/company")}
        >
          ← Retour dashboard
        </button>
      </header>

      <section className="stats">
        <div className="stat-card">
          <span>Total à payer conducteurs</span>
          <strong>{totalRevenue} €</strong>
        </div>

        <div className="stat-card orange">
          <span>À payer</span>
          <strong>{unpaid}</strong>
        </div>

        <div className="stat-card green">
          <span>Payées</span>
          <strong>{paid}</strong>
        </div>
      </section>

      <section className="grid">
        {missions.map((mission) => (
          <div className="card" key={mission.id}>
            <span
              className={
                mission.invoice_status === "Payée"
                  ? "paid"
                  : "pending"
              }
            >
              {mission.invoice_status || "À facturer"}
            </span>

            <h2>{mission.title}</h2>

            <p>
              📍 {mission.pickup} → {mission.dropoff}
            </p>

            <p>
              👨‍✈️{" "}
              {mission.driver_name ||
                "Conducteur"}
            </p>

            <p>
              💶 {mission.price || 0} €
            </p>

            <p>
              📅{" "}
              {mission.completed_at
                ? new Date(
                    mission.completed_at
                  ).toLocaleDateString("fr-FR")
                : "-"}
            </p>

            {mission.invoice_status !== "Payée" && (
              <button
                className="paid-btn"
                onClick={() => markAsPaid(mission)}
              >
                Marquer conducteur payé
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

        .stats {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 18px;
          margin-bottom: 30px;
        }

        .stat-card {
          padding: 24px;
          border-radius: 24px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .stat-card strong {
          display: block;
          margin-top: 12px;
          font-size: 38px;
          font-weight: 950;
        }

        .orange strong {
          color: #fdba74;
        }

        .green strong {
          color: #86efac;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 18px;
        }

        .card {
          padding: 24px;
          border-radius: 24px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .card p {
          color: #94a3b8;
        }

        .pending,
        .paid {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
        }

        .pending {
          background: rgba(249,115,22,0.18);
          color: #fdba74;
        }

        .paid {
          background: rgba(22,163,74,0.18);
          color: #86efac;
        }

        .paid-btn {
          margin-top: 16px;
          width: 100%;
          padding: 12px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(180deg,#16a34a,#15803d);
          color: white;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .stats,
          .grid {
            grid-template-columns: 1fr;
          }

          .page {
            padding: 24px 16px;
          }
        }
      `}</style>
    </main>
  );
}