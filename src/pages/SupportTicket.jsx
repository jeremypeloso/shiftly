import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  return (
    <main className="page">
      <header className="top">
        <div>
          <p>Support Shiftly</p>
          <h1>{ticket?.subject || "Ticket"}</h1>
        </div>

        <button onClick={() => navigate(-1)}>Retour</button>
      </header>

      <section className="thread">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.sender_role === "admin"
                ? "message admin"
                : "message user"
            }
          >
            <strong>
              {message.sender_role === "admin"
                ? "Administration"
                : "Vous"}
            </strong>

            <p>{message.message}</p>

            <span>
              {new Date(message.created_at).toLocaleString("fr-FR")}
            </span>
          </div>
        ))}
      </section>

      {ticket?.status !== "closed" ? (
        <section className="reply">
          <textarea
            placeholder="Votre réponse..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />

          <button onClick={sendReply}>Envoyer</button>
        </section>
      ) : (
        <div className="closed">Ticket clôturé par l’administration.</div>
      )}

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
          font-size: 38px;
        }

        .top button,
        .reply button {
          border: none;
          border-radius: 999px;
          padding: 14px 18px;
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 900;
          cursor: pointer;
        }

        .thread {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message {
          max-width: 720px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .message.user {
          background: rgba(37,99,235,0.14);
          align-self: flex-start;
        }

        .message.admin {
          background: rgba(22,163,74,0.14);
          align-self: flex-end;
        }

        .message p {
          color: #e5e7eb;
          line-height: 1.5;
        }

        .message span {
          color: #94a3b8;
          font-size: 12px;
        }

        .reply {
          margin-top: 28px;
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .reply textarea {
          flex: 1;
          min-height: 110px;
          padding: 16px;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.9);
          color: white;
          resize: none;
          font-family: Inter, Arial;
        }

        .closed {
          margin-top: 28px;
          padding: 18px;
          border-radius: 22px;
          background: rgba(220,38,38,0.12);
          color: #fecaca;
        }

        @media (max-width: 900px) {
          .page {
            padding: 24px 16px;
          }

          .top,
          .reply {
            flex-direction: column;
            align-items: stretch;
          }

          .message {
            max-width: 100%;
          }
        }
      `}</style>
    </main>
  );
}