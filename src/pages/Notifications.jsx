import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const user = await getCurrentUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setNotifications(data || []);
  }

  async function markAsRead(notification) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id);

    await loadNotifications();
  }

  return (
    <main className="page">
      <header className="top">
        <div>
          <p>Shiftly</p>
          <h1>Notifications</h1>
        </div>

        <button onClick={() => navigate(-1)}>
          ← Retour
        </button>
      </header>

      <section className="list">

        {notifications.length === 0 && (
          <div className="empty">
            Aucune notification.
          </div>
        )}

        {notifications.map((notification) => (
          <div
            className={
              notification.is_read
                ? "notification"
                : "notification unread"
            }
            key={notification.id}
          >
            <div className="notification-content">

              <h3>{notification.title}</h3>

              <p>{notification.message}</p>

              <span>
                {new Date(
                  notification.created_at
                ).toLocaleString("fr-FR")}
              </span>

            </div>

            <div className="notification-actions">

              {!notification.is_read && (
                <button
                  onClick={() =>
                    markAsRead(notification)
                  }
                >
                  Marquer lue
                </button>
              )}

              {notification.ticket_id && (
                <button
                  className="ticket-btn"
                  onClick={() =>
                    navigate(
                      `/support/${notification.ticket_id}`
                    )
                  }
                >
                  Ouvrir le ticket
                </button>
              )}

              <button
  className="delete-notif-btn"
  onClick={async () => {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", notification.id);

    await loadNotifications();
  }}
>
  ✕
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

          margin-bottom: 30px;
        }

        .top h1 {
          margin: 8px 0 0;

          font-size: 42px;

          font-weight: 950;
        }

        .top p {
          margin: 0;

          color: #94a3b8;
        }

        .top button,
        .notification button {
          border: none;

          border-radius: 999px;

          padding: 12px 16px;

          background:
            linear-gradient(
              180deg,
              #2563eb,
              #1d4ed8
            );

          color: white;

          font-weight: 800;

          cursor: pointer;
        }

        .ticket-btn {
          background:
            linear-gradient(
              180deg,
              #16a34a,
              #15803d
            ) !important;
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

          background:
            rgba(255,255,255,0.07);

          border:
            1px solid rgba(255,255,255,0.08);
        }

        .notification {
          display: flex;

          justify-content: space-between;

          align-items: center;

          gap: 18px;
        }

        .notification.unread {
          border-color:
            rgba(249,115,22,0.45);

          background:
            rgba(249,115,22,0.1);
        }

        .notification-content h3 {
          margin: 0 0 8px;
        }

        .notification-content p {
          margin: 0 0 8px;

          color: #cbd5e1;

          line-height: 1.5;
        }

        .notification-content span {
          color: #94a3b8;

          font-size: 13px;
        }

        .notification-actions {
          display: flex;

          gap: 10px;

          flex-wrap: wrap;
        }

        @media (max-width: 900px) {
          .page {
            padding: 24px 16px;
          }

          .top {
            flex-direction: column;

            align-items: stretch;

            gap: 14px;
          }

          .notification {
            flex-direction: column;

            align-items: stretch;
          }

          .notification-actions {
            margin-top: 16px;
          }
        }
      `}</style>
    </main>
  );
}