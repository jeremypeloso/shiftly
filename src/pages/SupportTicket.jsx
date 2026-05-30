import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export default function SupportTicket() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  async function loadTicket() {
    const { data: ticketData } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    const { data: messagesData } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    setTicket(ticketData);
    setMessages(messagesData || []);
  }

  async function sendReply() {
    const user = await getCurrentUser();

    if (!user || !reply.trim() || ticket?.status === "closed") return;

    await supabase.from("support_messages").insert([
      {
        ticket_id: ticketId,
        sender_id: user.id,
        sender_role: "driver",
        message: reply,
      },
    ]);

    setReply("");
    await loadTicket();
  }

  const isClosed = ticket?.status === "closed";

  return (
    <main className="supportShell">
      <aside className="supportSidebar">
        <div className="supportBrand">
          <div className="supportMark">S</div>
          <div>
            <strong>Shiftly</strong>
            <span>Support</span>
          </div>
        </div>

        <div className="supportIntro">
          <span>Assistance</span>
          <h1>Conversation</h1>
          <p>Suivez les échanges avec l'administration Shiftly depuis cet espace.</p>
        </div>

        <button className="backButton" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Retour
        </button>
      </aside>

      <section className="supportContent">
        <header className="supportTopbar">
          <div>
            <span className="eyebrow">Ticket support</span>
            <h2>{ticket?.subject || "Ticket"}</h2>
            <p>
              {isClosed
                ? "Ce ticket a été clôturé par l'administration."
                : "Votre conversation reste ouverte tant que le ticket n'est pas clôturé."}
            </p>
          </div>

          <div className={isClosed ? "statusPill closed" : "statusPill"}>
            {isClosed ? <Lock size={17} /> : <MessageSquare size={17} />}
            {isClosed ? "Clôturé" : "Ouvert"}
          </div>
        </header>

        <section className="conversationPanel">
          <div className="panelHeader">
            <div>
              <h3>Messages</h3>
              <span>{messages.length} message(s)</span>
            </div>
          </div>

          <div className="thread">
            {messages.length === 0 && (
              <div className="emptyState">Aucun message pour le moment.</div>
            )}

            {messages.map((message) => {
              const isAdmin = message.sender_role === "admin";

              return (
                <article
                  key={message.id}
                  className={isAdmin ? "message admin" : "message user"}
                >
                  <div className="messageHeader">
                    <span className="avatar">
                      {isAdmin ? <ShieldCheck size={17} /> : "V"}
                    </span>
                    <div>
                      <strong>{isAdmin ? "Administration" : "Vous"}</strong>
                      <small>
                        <Clock3 size={13} />
                        {formatDate(message.created_at)}
                      </small>
                    </div>
                  </div>

                  <p>{message.message}</p>
                </article>
              );
            })}
          </div>
        </section>

        {isClosed ? (
          <div className="closedNotice">
            <Lock size={18} />
            Ticket clôturé par l'administration.
          </div>
        ) : (
          <section className="replyPanel">
            <textarea
              placeholder="Votre réponse..."
              value={reply}
              onChange={(event) => setReply(event.target.value)}
            />

            <button disabled={!reply.trim()} onClick={sendReply}>
              <Send size={18} />
              Envoyer
            </button>
          </section>
        )}
      </section>

      <style>{`
        .supportShell {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 280px 1fr;
          background: #f8fafc;
          color: #0f172a;
          font-family: Inter, system-ui, Arial, sans-serif;
        }

        .supportShell button,
        .supportShell textarea {
          font: inherit;
        }

        .supportShell button {
          border: 0;
          cursor: pointer;
        }

        .supportShell button:disabled {
          opacity: 0.58;
          cursor: not-allowed;
        }

        .supportSidebar {
          min-height: 100svh;
          padding: 28px;
          background: #07152f;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .supportBrand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .supportMark {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #2563eb;
          font-size: 30px;
          font-weight: 950;
          font-style: italic;
        }

        .supportBrand strong {
          display: block;
          font-size: 28px;
          font-style: italic;
          letter-spacing: -0.07em;
          line-height: 0.9;
        }

        .supportBrand span,
        .supportIntro span {
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

        .supportIntro h1 {
          margin: 18px 0 12px;
          font-size: 36px;
          line-height: 0.95;
          letter-spacing: -0.065em;
        }

        .supportIntro p {
          margin: 0;
          color: #94a3b8;
          line-height: 1.6;
        }

        .backButton {
          margin-top: auto;
          min-height: 46px;
          display: flex;
          align-items: center;
          gap: 11px;
          border-radius: 13px;
          padding: 0 14px;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          font-weight: 800;
          text-align: left;
        }

        .supportContent {
          padding: 30px;
          overflow: auto;
        }

        .supportTopbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 20px;
        }

        .eyebrow {
          display: inline-flex;
          margin-bottom: 10px;
          padding: 7px 11px;
          border-radius: 999px;
          background: #dbeafe;
          color: #2563eb;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .supportTopbar h2 {
          margin: 0;
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1;
          letter-spacing: -0.07em;
        }

        .supportTopbar p {
          margin: 12px 0 0;
          color: #64748b;
          line-height: 1.6;
        }

        .statusPill {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 0 16px;
          background: #dcfce7;
          color: #166534;
          font-weight: 950;
          white-space: nowrap;
        }

        .statusPill.closed {
          background: #fee2e2;
          color: #b91c1c;
        }

        .conversationPanel,
        .replyPanel,
        .closedNotice {
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06);
        }

        .conversationPanel {
          border-radius: 26px;
          padding: 22px;
        }

        .panelHeader {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .panelHeader h3 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -0.04em;
        }

        .panelHeader span {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .thread {
          display: grid;
          gap: 12px;
        }

        .message {
          width: min(720px, 100%);
          padding: 15px;
          border-radius: 18px;
          border: 1px solid #e5eaf2;
          background: #f8fafc;
        }

        .message.admin {
          justify-self: start;
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .message.user {
          justify-self: end;
          background: #f8fafc;
        }

        .messageHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .avatar {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #dbeafe;
          color: #2563eb;
          font-size: 13px;
          font-weight: 950;
        }

        .message.user .avatar {
          background: #0f172a;
          color: white;
        }

        .messageHeader strong {
          display: block;
          font-size: 15px;
        }

        .messageHeader small {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 3px;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        .message p {
          margin: 0;
          color: #334155;
          line-height: 1.55;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .emptyState {
          padding: 18px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          color: #64748b;
          font-weight: 800;
        }

        .replyPanel {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: end;
          margin-top: 18px;
          border-radius: 26px;
          padding: 18px;
        }

        .replyPanel textarea {
          width: 100%;
          min-height: 112px;
          border-radius: 18px;
          border: 1px solid #dbe3ee;
          background: #f8fafc;
          color: #0f172a;
          padding: 15px;
          outline: none;
          resize: vertical;
          box-sizing: border-box;
        }

        .replyPanel button {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          padding: 0 18px;
          background: #2563eb;
          color: white;
          font-weight: 950;
        }

        .closedNotice {
          min-height: 56px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
          border-radius: 20px;
          padding: 0 18px;
          color: #b91c1c;
          background: #fff7f7;
          border-color: #fecaca;
          font-weight: 900;
        }

        @media (max-width: 980px) {
          .supportShell {
            grid-template-columns: 1fr;
          }

          .supportSidebar {
            min-height: auto;
            padding: 18px;
          }

          .backButton {
            margin-top: 0;
          }
        }

        @media (max-width: 680px) {
          .supportSidebar,
          .supportContent {
            padding: 16px;
          }

          .supportTopbar {
            flex-direction: column;
            gap: 12px;
          }

          .supportTopbar h2 {
            font-size: 30px;
            letter-spacing: -0.045em;
          }

          .conversationPanel {
            border-radius: 20px;
            padding: 16px;
          }

          .message {
            width: 100%;
            box-sizing: border-box;
          }

          .replyPanel {
            grid-template-columns: 1fr;
            border-radius: 20px;
            padding: 16px;
          }

          .replyPanel button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function formatDate(value) {
  if (!value) return "Date non renseignée";

  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
