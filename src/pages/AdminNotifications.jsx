import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminNotifications() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setTickets(data || []);
  }

  return (
    <main className="page">
      <header className="top">
        <div>
          <p>Shiftly Admin</p>
          <h1>Notifications admin</h1>
        </div>

        <button onClick={() => navigate("/admin")}>
          Retour admin
        </button>
      </header>

      <section className="list">
        {tickets.length === 0 && (
          <div className="empty">
            Aucun ticket support.
          </div>
        )}

        {tickets.map((ticket) => (
          <div className="notification" key={ticket.id}>
            <div>
              <h3>{ticket.subject}</h3>

              <p>
                Statut :{" "}
                {ticket.status === "open"
                  ? "Ouvert"
                  : "Clôturé"}
              </p>

              <span>
                {new Date(ticket.created_at).toLocaleString("fr-FR")}
              </span>
            </div>

            <button onClick={() => navigate("/admin")}>
              Voir dans admin
            </button>
          </div>
        ))}
      </section>

      <style>{`
        .page {
          min-height: 100svh;
          padding: 40px;
          color: white;
          font-family: Inter, Arial, sans-serif;
          background: linear-gradient(135deg, #0f172a, #1f2937);
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .top p {
          color: #94a3b8;
          margin: 0;
        }

        .top h1 {
          margin: 8px 0 0;
          font-size: 42px;
          font-weight: 950;
        }

        .top button,
        .notification button {
          border: none;
          border-radius: 999px;
          padding: 12px 16px;
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 900;
          cursor: pointer;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .notification,
        .empty {
          padding: 20px;
          border-radius: 22px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .notification {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }

        .notification h3 {
          margin: 0 0 8px;
        }

        .notification p {
          margin: 0 0 8px;
          color: #cbd5e1;
        }

        .notification span {
          color: #94a3b8;
          font-size: 13px;
        }
      `}</style>
    </main>
  );
}