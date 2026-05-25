import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export default function MissionMessages() {
  const { missionId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [mission, setMission] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [returning, setReturning] = useState(false);

  async function loadConversation() {
    
    if (!missionId) {
  console.error("Mission ID manquant");
  return;
}
    const currentUser = await getCurrentUser();

if (!currentUser) {
  console.warn("Session absente temporairement");
  return;
}

    setUser(currentUser);

    const { data: missionData } = await supabase
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single();

    setMission(missionData);

    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true });

    setMessages(messagesData || []);
  }

  async function sendMessage() {
    if (!content.trim() || !mission || !user) return;

    const receiverId =
  user.id === mission.company_id
    ? mission.driver_id || messages.find((m) => m.sender_id !== user.id)?.sender_id
    : mission.company_id;

    if (!receiverId) {
      alert("Destinataire introuvable");
      return;
    }

    const { error } = await supabase.from("messages").insert([
      {
        mission_id: missionId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erreur envoi message");
      return;
    }

    setContent("");
    await loadConversation();
  }

  return (
    <main className="page">
      <div className="chat">
        <button
  className="back"
  disabled={returning}
  onClick={() => {
    if (returning) return;

    setReturning(true);

    navigate(mission?.company_id === user?.id ? "/company" : "/driver", {
      replace: true,
    });
  }}
>
  {returning ? "Retour..." : "← Retour dashboard"}
</button>

        <h1>Messagerie mission</h1>

        <p className="subtitle">
          {mission?.title || "Mission"}
        </p>

        <div className="messages">
          {messages.length === 0 && (
            <div className="empty">
              Aucun message pour le moment.
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.sender_id === user?.id
                  ? "message mine"
                  : "message"
              }
            >
              <p>{message.content}</p>

              <span>
                {new Date(message.created_at).toLocaleString("fr-FR")}
              </span>
            </div>
          ))}
        </div>

        <div className="composer">
          <input
            placeholder="Écrire un message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button onClick={sendMessage}>
            Envoyer
          </button>
        </div>
      </div>

      <style>{`
        .page {
          min-height: 100svh;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,0.1), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56,189,248,0.1), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%);
          color: white;
          font-family: Inter, Arial, sans-serif;
        }

        button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

        .chat {
          max-width: 900px;
          margin: 0 auto;
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 28px;
          padding: 28px;
          min-height: calc(100svh - 48px);
          display: flex;
          flex-direction: column;
        }

        .back {
          align-self: flex-start;
          border: none;
          background: rgba(255,255,255,0.08);
          color: white;
          padding: 12px 16px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 800;
          margin-bottom: 20px;
        }

        h1 {
          margin: 0;
          font-size: 38px;
          font-weight: 950;
        }

        .subtitle {
          color: #94a3b8;
          margin: 10px 0 24px;
        }

        .messages {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          padding: 16px;
          background: rgba(15,23,42,0.5);
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .message {
          max-width: 70%;
          padding: 12px 14px;
          border-radius: 18px;
          background: rgba(255,255,255,0.08);
        }

        .message.mine {
          align-self: flex-end;
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
        }

        .message p {
          margin: 0;
          line-height: 1.4;
        }

        .message span {
          display: block;
          margin-top: 6px;
          font-size: 11px;
          color: #cbd5e1;
        }

        .empty {
          color: #94a3b8;
          text-align: center;
          padding: 30px;
        }

        .composer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          margin-top: 16px;
        }

        .composer input {
          padding: 15px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(15,23,42,0.9);
          color: white;
          outline: none;
        }

        .composer button {
          border: none;
          border-radius: 999px;
          padding: 0 20px;
          background: linear-gradient(180deg, #16a34a, #15803d);
          color: white;
          font-weight: 900;
          cursor: pointer;
        }

        @media (max-width: 700px) {
          .page {
            padding: 12px;
          }

          .chat {
            padding: 20px;
            min-height: calc(100svh - 24px);
          }

          .message {
            max-width: 88%;
          }

          .composer {
            grid-template-columns: 1fr;
          }

          .composer button {
            padding: 14px;
          }
        }
      `}</style>
    </main>
  );
}