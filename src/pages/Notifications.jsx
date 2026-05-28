import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock3,
  Inbox,
  LifeBuoy,
  MailOpen,
  Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

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

  async function deleteNotification(notification) {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", notification.id);

    await loadNotifications();
  }

  return (
    <main className="notificationsPage">
      <header className="notificationsHeader">
        <button className="backButton" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="headerContent">
          <span className="eyebrow">Centre de notifications</span>
          <h1>Notifications</h1>
          <p>
            Suivez les candidatures, invitations et messages importants liés à
            vos missions Shiftly.
          </p>
        </div>

        <div className="summaryCard">
          <Bell size={28} />
          <div>
            <strong>{unreadCount}</strong>
            <span>non lue(s)</span>
          </div>
        </div>
      </header>

      <section className="notificationsShell">
        <aside className="sidePanel">
          <div className="brand">
            <div className="mark">S</div>
            <div>
              <strong>Shiftly</strong>
              <span>Marketplace</span>
            </div>
          </div>

          <div className="quickStats">
            <Stat icon={Inbox} value={notifications.length} label="Total" />
            <Stat icon={MailOpen} value={notifications.length - unreadCount} label="Lues" />
            <Stat icon={Bell} value={unreadCount} label="À traiter" />
          </div>
        </aside>

        <section className="notificationList">
          {notifications.length === 0 && (
            <div className="emptyState">
              <Inbox size={36} />
              <h2>Aucune notification</h2>
              <p>Les nouvelles informations importantes apparaîtront ici.</p>
            </div>
          )}

          {notifications.map((notification) => (
            <article
              className={notification.is_read ? "notificationCard" : "notificationCard unread"}
              key={notification.id}
            >
              <div className="notificationIcon">
                {notification.ticket_id ? <LifeBuoy size={22} /> : <Bell size={22} />}
              </div>

              <div className="notificationContent">
                <div className="notificationTop">
                  <div>
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                  </div>

                  {!notification.is_read && <span className="unreadBadge">Nouveau</span>}
                </div>

                <div className="notificationMeta">
                  <span>
                    <Clock3 size={15} />
                    {formatDate(notification.created_at)}
                  </span>
                </div>
              </div>

              <div className="notificationActions">
                {!notification.is_read && (
                  <button className="softAction" onClick={() => markAsRead(notification)}>
                    <CheckCircle2 size={17} />
                    Marquer lue
                  </button>
                )}

                {notification.ticket_id && (
                  <button
                    className="primaryAction"
                    onClick={() => navigate(`/support/${notification.ticket_id}`)}
                  >
                    Ouvrir le ticket
                  </button>
                )}

                <button className="iconAction" onClick={() => deleteNotification(notification)}>
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </section>
      </section>

      <style>{`
        .notificationsPage {
          min-height: 100svh;
          padding: 30px;
          background:
            radial-gradient(circle at 12% 10%, rgba(37, 99, 235, 0.13), transparent 28%),
            radial-gradient(circle at 88% 14%, rgba(15, 23, 42, 0.07), transparent 24%),
            #f8fafc;
          color: #0f172a;
          font-family: Inter, system-ui, Arial, sans-serif;
        }

        .notificationsPage button {
          border: 0;
          font: inherit;
          cursor: pointer;
        }

        .notificationsHeader {
          max-width: 1220px;
          margin: 0 auto 22px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) 190px;
          align-items: start;
          gap: 18px;
        }

        .backButton {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-height: 42px;
          border-radius: 999px;
          padding: 0 14px;
          background: white;
          color: #0f172a;
          border: 1px solid #dbe3ee !important;
          font-weight: 900;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
        }

        .eyebrow {
          display: inline-flex;
          padding: 7px 11px;
          border-radius: 999px;
          background: #dbeafe;
          color: #2563eb;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .headerContent h1 {
          margin: 12px 0 8px;
          font-size: clamp(38px, 5vw, 58px);
          line-height: 1;
          letter-spacing: -0.07em;
        }

        .headerContent p {
          max-width: 690px;
          margin: 0;
          color: #64748b;
          line-height: 1.6;
        }

        .summaryCard {
          min-height: 112px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          border-radius: 24px;
          background: #0f172a;
          color: white;
          box-shadow: 0 20px 54px rgba(15, 23, 42, 0.13);
        }

        .summaryCard svg {
          color: #93c5fd;
        }

        .summaryCard strong {
          display: block;
          font-size: 34px;
          letter-spacing: -0.05em;
        }

        .summaryCard span {
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 800;
        }

        .notificationsShell {
          max-width: 1220px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 18px;
        }

        .sidePanel {
          align-self: start;
          position: sticky;
          top: 30px;
          padding: 24px;
          border-radius: 28px;
          background: #07152f;
          color: white;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }

        .mark {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #2563eb;
          color: white;
          font-size: 30px;
          font-weight: 950;
          font-style: italic;
        }

        .brand strong {
          display: block;
          font-size: 28px;
          font-style: italic;
          letter-spacing: -0.07em;
          line-height: 0.9;
        }

        .brand span {
          display: inline-flex;
          margin-top: 7px;
          padding: 4px 8px;
          border-radius: 7px;
          background: #2563eb;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .quickStats {
          display: grid;
          gap: 10px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stat svg {
          color: #93c5fd;
        }

        .stat strong {
          display: block;
          font-size: 22px;
        }

        .stat span {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
        }

        .notificationList {
          display: grid;
          gap: 13px;
        }

        .notificationCard,
        .emptyState {
          border-radius: 24px;
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06);
        }

        .notificationCard {
          display: grid;
          grid-template-columns: 50px 1fr auto;
          gap: 14px;
          align-items: start;
          padding: 18px;
        }

        .notificationCard.unread {
          border-color: #bfdbfe;
          background: linear-gradient(135deg, #eff6ff, white 58%);
        }

        .notificationIcon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: #dbeafe;
          color: #2563eb;
        }

        .notificationTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .notificationContent h3 {
          margin: 0 0 7px;
          font-size: 18px;
          letter-spacing: -0.03em;
        }

        .notificationContent p {
          margin: 0;
          color: #475569;
          line-height: 1.55;
        }

        .unreadBadge {
          flex: 0 0 auto;
          border-radius: 999px;
          padding: 6px 10px;
          background: #2563eb;
          color: white;
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .notificationMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }

        .notificationMeta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 13px;
          font-weight: 750;
        }

        .notificationActions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
          min-width: 170px;
        }

        .softAction,
        .primaryAction,
        .iconAction {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 999px;
          padding: 0 13px;
          font-weight: 900;
        }

        .softAction {
          background: #dbeafe;
          color: #2563eb;
        }

        .primaryAction {
          background: #2563eb;
          color: white;
        }

        .iconAction {
          width: 40px;
          padding: 0;
          background: #fee2e2;
          color: #b91c1c;
        }

        .emptyState {
          min-height: 300px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 40px;
          color: #64748b;
        }

        .emptyState svg {
          color: #2563eb;
          margin-bottom: 14px;
        }

        .emptyState h2 {
          margin: 0 0 8px;
          color: #0f172a;
          letter-spacing: -0.04em;
        }

        .emptyState p {
          margin: 0;
        }

        @media (max-width: 920px) {
          .notificationsPage {
            padding: 22px 18px;
          }

          .notificationsHeader,
          .notificationsShell {
            grid-template-columns: 1fr;
          }

          .sidePanel {
            position: static;
          }

          .summaryCard {
            min-height: auto;
          }
        }

        @media (max-width: 640px) {
          .notificationCard {
            grid-template-columns: 1fr;
          }

          .notificationActions {
            justify-content: flex-start;
            min-width: 0;
          }

          .notificationTop {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="stat">
      <Icon size={20} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Date inconnue";

  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
