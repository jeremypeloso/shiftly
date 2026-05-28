import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bus,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="home">
      <header className="header">
        <div className="brand">
  <div className="mark">S</div>

  <div className="brandText">
    <strong>Shiftly</strong>
    <span>Marketplace</span>
  </div>
</div>

        <button className="login" onClick={() => navigate("/login")}>
          Connexion
        </button>
      </header>

      <section className="hero">
        <div className="copy">
          <div className="pill">
            <Zap size={16} />
            Missions transport en temps réel
          </div>

          <h1>
            Le bon conducteur,
            <span> au bon moment.</span>
          </h1>

          <p>
            Shiftly Marketplace connecte les entreprises de transport avec des
            conducteurs indépendants qualifiés, disponibles et vérifiés.
          </p>

          <div className="actions">
            <button className="primary" onClick={() => navigate("/register")}>
              Publier une mission
              <ArrowRight size={18} />
            </button>

            <button className="secondary" onClick={() => navigate("/register")}>
              Je suis conducteur
            </button>
          </div>

          <div className="metrics">
            <Metric value="24/7" label="Missions visibles" />
            <Metric value="100%" label="Profils vérifiés" />
            <Metric value="92" label="ShiftScore moyen" />
          </div>
        </div>

        <div className="visual">
          <div className="dashboard">
            <aside>
              <div className="sideLogo">Shiftly</div>
              <span className="active">Tableau de bord</span>
              <span>Missions</span>
              <span>Conducteurs</span>
              <span>Messagerie</span>
            </aside>

            <div className="screen">
              <div className="screenTop">
                <div>
                  <small>Missions disponibles</small>
                  <h2>Aujourd’hui</h2>
                </div>

                <button>+ Mission</button>
              </div>

              <Mission title="Paris → Disneyland Paris" price="320 €" />
              <Mission title="Lyon → Aéroport LYS" price="180 €" />
              <Mission title="Marseille → Avignon" price="350 €" />

              <div className="driver">
                <div>
                  <small>Conducteur recommandé</small>
                  <strong>Antoine Marshall</strong>
                </div>
                <span>Score 92</span>
              </div>
            </div>
          </div>

          <div className="phone">
            <div className="phoneHead">
              <strong>Bonjour<br />Thomas</strong>
            </div>

            <div className="phoneBody">
              <div className="phoneCard">
                <small>Mission recommandée</small>
                <strong>Paris → Disneyland</strong>
                <span>06:00 - 16:00 · 320 €</span>
              </div>

              <div className="phoneNav">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="featureBar">
        <Feature icon={Clock} title="Rapide" text="Publier une mission en quelques clics" />
        <Feature icon={Users} title="Vérifié" text="Profils, permis et documents visibles" />
        <Feature icon={CalendarDays} title="Disponible" text="Conducteurs filtrés par créneau" />
        <Feature icon={MessageCircle} title="Centralisé" text="Échanges intégrés à la mission" />
        <Feature icon={ShieldCheck} title="Sécurisé" text="Missions mieux suivies et tracées" />
      </section>

      <style>{`
        .home {
          width: 100%;
          min-height: 100svh;
          background:
            radial-gradient(circle at 12% 12%, rgba(37, 99, 235, .13), transparent 28%),
            radial-gradient(circle at 86% 20%, rgba(15, 23, 42, .08), transparent 28%),
            #f8fafc;
          color: #06142d;
          font-family: Inter, system-ui, Arial, sans-serif;
          padding: 28px 42px;
        }

        button {
          border: 0;
          font: inherit;
          cursor: pointer;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .header {
          height: 70px;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .mark {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #2563eb, #0f172a);
          color: white;
          font-size: 34px;
          font-weight: 950;
          font-style: italic;
          box-shadow: 0 18px 38px rgba(37, 99, 235, .26);
        }

        .brandText {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.brand strong {
  display: block;
  font-size: 34px;
  line-height: .9;
  font-weight: 950;
  font-style: italic;
  letter-spacing: -0.07em;
}

.brand span {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 7px;
  background: #2563eb;
  color: white;
  font-size: 11px;
  font-weight: 950;
  letter-spacing: .08em;
  text-transform: uppercase;
}

        .login {
          border-radius: 999px;
          padding: 12px 18px;
          background: #0f172a;
          color: white;
          font-weight: 850;
        }

        .hero {
          max-width: 1400px;
          height: calc(100svh - 210px);
          min-height: 520px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: .88fr 1.12fr;
          align-items: center;
          gap: 56px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 14px;
          border-radius: 999px;
          background: #dbeafe;
          color: #2563eb;
          font-size: 13px;
          font-weight: 950;
        }

        h1 {
          max-width: 620px;
          margin: 22px 0 0;
          font-size: clamp(54px, 6vw, 86px);
          line-height: .9;
          letter-spacing: -0.085em;
        }

        h1 span {
          color: #2563eb;
        }

        .copy p {
          max-width: 560px;
          margin: 24px 0 0;
          color: #475569;
          font-size: 18px;
          line-height: 1.65;
        }

        .actions {
          display: flex;
          gap: 14px;
          margin-top: 30px;
          flex-wrap: wrap;
        }

        .primary,
        .secondary {
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: 999px;
          padding: 14px 22px;
          font-weight: 950;
        }

        .primary {
          background: #2563eb;
          color: white;
          box-shadow: 0 18px 38px rgba(37, 99, 235, .25);
        }

        .secondary {
          background: white;
          color: #0f172a;
          border: 1px solid #dbe3ee;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 32px;
          max-width: 560px;
        }

        .metric {
          padding: 16px;
          border-radius: 18px;
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 16px 42px rgba(15, 23, 42, .05);
        }

        .metric strong {
          display: block;
          font-size: 25px;
          letter-spacing: -0.04em;
        }

        .metric span {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
        }

        .visual {
          position: relative;
          min-height: 510px;
          display: flex;
          align-items: center;
        }

        .dashboard {
          width: 88%;
          min-height: 420px;
          display: grid;
          grid-template-columns: 148px 1fr;
          border-radius: 28px;
          overflow: hidden;
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 34px 90px rgba(15, 23, 42, .16);
        }

        aside {
          padding: 24px 16px;
          background: #07152f;
          color: white;
        }

        .sideLogo {
          font-size: 24px;
          font-style: italic;
          font-weight: 950;
          margin-bottom: 26px;
        }

        aside span {
          display: block;
          padding: 10px 11px;
          border-radius: 9px;
          margin-bottom: 7px;
          color: #cbd5e1;
          font-size: 12px;
        }

        aside .active {
          background: #2563eb;
          color: white;
        }

        .screen {
          padding: 28px;
          background: linear-gradient(180deg, #ffffff, #f8fafc);
        }

        .screenTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
        }

        .screenTop small {
          color: #64748b;
          font-weight: 800;
        }

        .screenTop h2 {
          margin: 4px 0 0;
          font-size: 30px;
          letter-spacing: -0.05em;
        }

        .screenTop button {
          border-radius: 10px;
          padding: 10px 13px;
          background: #2563eb;
          color: white;
          font-weight: 900;
        }

        .mission {
          display: grid;
          grid-template-columns: 46px 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 15px;
          border-radius: 18px;
          background: white;
          border: 1px solid #e5eaf2;
          margin-bottom: 11px;
        }

        .missionIcon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #dbeafe;
          color: #2563eb;
        }

        .mission strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .mission span {
          color: #64748b;
          font-size: 12px;
        }

        .missionPrice {
          color: #2563eb;
          font-weight: 950;
        }

        .driver {
          margin-top: 18px;
          padding: 17px;
          border-radius: 20px;
          background: #0f172a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .driver small {
          display: block;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .driver span {
          border-radius: 999px;
          padding: 8px 11px;
          background: rgba(37, 99, 235, .24);
          color: #93c5fd;
          font-weight: 900;
        }

        .phone {
          position: absolute;
          right: 0;
          bottom: 14px;
          width: 210px;
          height: 360px;
          border: 8px solid #050b16;
          border-radius: 36px;
          overflow: hidden;
          background: #f8fafc;
          box-shadow: 0 28px 70px rgba(15, 23, 42, .24);
        }

        .phoneHead {
          padding: 28px 18px 18px;
          color: white;
          background: linear-gradient(135deg, #2563eb, #0f172a);
        }

        .phoneHead strong {
          display: block;
          font-size: 18px;
          line-height: 1.12;
        }

        .phoneBody {
          padding: 14px;
        }

        .phoneCard {
          padding: 15px;
          border-radius: 17px;
          background: white;
          border: 1px solid #e5eaf2;
        }

        .phoneCard small {
          display: block;
          color: #64748b;
          font-size: 11px;
          margin-bottom: 8px;
        }

        .phoneCard strong {
          display: block;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .phoneCard span {
          color: #2563eb;
          font-size: 12px;
          font-weight: 900;
        }

        .phoneNav {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 18px;
        }

        .phoneNav span {
          width: 34px;
          height: 5px;
          border-radius: 999px;
          background: #dbe3ee;
        }

        .featureBar {
          max-width: 1400px;
          height: 92px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 12px 34px rgba(15, 23, 42, .05);
        }

        .featureIcon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 13px;
          background: #dbeafe;
          color: #2563eb;
        }

        .feature strong {
          display: block;
          font-size: 14px;
        }

        .feature span {
          display: block;
          margin-top: 2px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.25;
        }

        @media (min-width: 951px) {
          html,
          body,
          #root {
            height: 100%;
            overflow: hidden;
          }

          .home {
            height: 100svh;
            overflow: hidden;
          }
        }

        @media (max-width: 950px) {
          .home {
            padding: 22px 18px;
          }

          .login,
          aside,
          .phone {
            display: none;
          }

          .hero {
            height: auto;
            min-height: auto;
            grid-template-columns: 1fr;
            padding: 44px 0;
          }

          .dashboard {
            width: 100%;
            grid-template-columns: 1fr;
          }

          .metrics,
          .featureBar {
            grid-template-columns: 1fr;
          }

          .featureBar {
            height: auto;
            padding-bottom: 32px;
          }
        }

        @media (max-width: 560px) {
          .brand strong {
            font-size: 30px;
          }

          h1 {
            font-size: 45px;
          }

          .actions,
          .primary,
          .secondary {
            width: 100%;
          }

          .mission {
            grid-template-columns: 44px 1fr;
          }

          .missionPrice {
            grid-column: 2;
          }
        }
      `}</style>
    </main>
  );
}

function Metric({ value, label }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Mission({ title, price }) {
  return (
    <div className="mission">
      <div className="missionIcon">
        <Bus size={21} />
      </div>

      <div>
        <strong>{title}</strong>
        <span>22 mai 2024 · Autocar · 50 places</span>
      </div>

      <div className="missionPrice">{price}</div>
    </div>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <article className="feature">
      <div className="featureIcon">
        <Icon size={21} />
      </div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </article>
  );
}