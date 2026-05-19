import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="home-page">
      <div className="blob blob-one"></div>
      <div className="blob blob-two"></div>
      <div className="blob blob-three"></div>

      <section className="hero">
        <div className="left">
          <div className="logo">Shiftly</div>

          <div className="badge">
            🚍 Missions transport en temps réel
          </div>

          <h1>
            Le bon conducteur,
            <br />
            La bonne mission,
            <br />
            Au bon moment.
          </h1>

          <p className="subtitle">
            Shiftly connecte les entreprises de transport avec des
            conducteurs qualifiés, disponibles et fiables grâce au
            ShiftScore.
          </p>

          <div className="actions">
            <button
              className="primary"
              onClick={() => navigate("/login")}
            >
              Connexion
            </button>

            <button
              className="secondary"
              onClick={() => navigate("/register")}
            >
              Créer un compte
            </button>
          </div>

          <div className="stats">
            <div>
              <strong>24/7</strong>
              <span>Missions</span>
            </div>

            <div>
              <strong>100%</strong>
              <span>Profils vérifiés</span>
            </div>

            <div>
              <strong>92</strong>
              <span>ShiftScore</span>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="mission-card">
            <div className="card-top">
              <div>
                <span className="mini">
                  Mission ouverte
                </span>

                <h2>CDG → Rouen</h2>
              </div>

              <span className="pill">
                Urgent
              </span>
            </div>

            <div className="route">
              <div>
                <small>Départ</small>
                <strong>Roissy CDG</strong>
              </div>

              <div className="route-line"></div>

              <div>
                <small>Arrivée</small>
                <strong>Rouen Centre</strong>
              </div>
            </div>

            <div className="info">
              <strong>
                📅 Demain · 06h30
              </strong>

              <span>
                Transport tourisme · autocar
              </span>
            </div>

            <div className="info">
              <strong>
                🛡️ Permis D + FIMO
              </strong>

              <span>
                Documents obligatoires vérifiés
              </span>
            </div>

            <div className="driver">
              <div>
                <span className="mini">
                  Conducteur recommandé
                </span>

                <h3>Yorick Martin</h3>
              </div>

              <span className="score">
                ⭐ 92
              </span>
            </div>

            <button className="card-button">
              Proposer la mission
            </button>
          </div>
        </div>
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
          overflow-x: hidden;
        }

        body {
          overflow-y: auto;
        }

        .home-page {
          width: 100%;
          min-height: 100svh;
          overflow-x: hidden;
          position: relative;
          color: white;
          font-family: Inter, Arial, sans-serif;

          background:
            radial-gradient(circle at top left,
            rgba(251, 191, 36, 0.12),
            transparent 34%),

            radial-gradient(circle at bottom right,
            rgba(56, 189, 248, 0.12),
            transparent 34%),

            linear-gradient(
              135deg,
              #0f172a 0%,
              #162033 52%,
              #1f2937 100%
            );
        }

        .blob {
          position: absolute;
          border-radius: 999px;
          filter: blur(75px);
          pointer-events: none;
        }

        .blob-one {
          width: 360px;
          height: 360px;
          background: #fbbf24;
          opacity: 0.28;
          top: -130px;
          left: -100px;
        }

        .blob-two {
          width: 340px;
          height: 340px;
          background: #38bdf8;
          opacity: 0.16;
          right: -110px;
          bottom: -110px;
        }

        .blob-three {
          width: 260px;
          height: 260px;
          background: #2563eb;
          opacity: 0.16;
          top: 30%;
          right: 36%;
        }

        .hero {
          position: relative;
          z-index: 2;
          width: 100%;
          min-height: 100svh;
          display: grid;
          grid-template-columns: 1.12fr 0.88fr;
          align-items: center;
          gap: 56px;
          padding: 42px 64px;
        }

        .logo {
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.05em;
          margin-bottom: 22px;
        }

        .badge {
          display: inline-flex;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.14);
          color: #dbeafe;
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 22px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.18);
        }

        h1 {
          max-width: 900px;
          margin: 0;
          font-size: clamp(58px, 7vw, 92px);
          line-height: 0.92;
          letter-spacing: -0.07em;
          font-weight: 950;
        }

        .subtitle {
          max-width: 650px;
          margin-top: 24px;
          color: #dbeafe;
          font-size: 20px;
          line-height: 1.55;
        }

        .actions {
          display: flex;
          gap: 14px;
          margin-top: 32px;
          flex-wrap: wrap;
        }

        button {
          font-family: inherit;
          border: none;
          cursor: pointer;
          transition: 0.2s ease;
        }

        button:hover {
          transform: translateY(-2px);
        }

        .primary {
          background:
            linear-gradient(
              180deg,
              #2563eb,
              #1d4ed8
            );

          color: white;
          padding: 17px 30px;
          border-radius: 999px;
          font-size: 16px;
          font-weight: 950;

          box-shadow:
            0 18px 45px
            rgba(37,99,235,0.28);
        }

        .secondary {
          background: rgba(255,255,255,0.1);
          color: white;

          padding: 17px 30px;

          border-radius: 999px;

          font-size: 16px;
          font-weight: 850;

          border: 1px solid rgba(255,255,255,0.16);

          backdrop-filter: blur(14px);

          box-shadow:
            0 14px 35px
            rgba(0,0,0,0.22);
        }

        .stats {
          margin-top: 36px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          max-width: 720px;
        }

        .stats div {
          padding: 20px;
          border-radius: 24px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.12),
              rgba(255,255,255,0.055)
            );

          border:
            1px solid rgba(255,255,255,0.13);

          backdrop-filter: blur(18px);

          box-shadow:
            0 14px 35px rgba(0,0,0,0.22),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .stats strong {
          display: block;
          font-size: 26px;
          font-weight: 950;
        }

        .stats span {
          display: block;
          margin-top: 4px;
          color: #cbd5e1;
          font-size: 13px;
        }

        .right {
          display: flex;
          justify-content: center;
        }

        .mission-card {
          width: 100%;
          max-width: 470px;

          padding: 28px;

          border-radius: 38px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.15),
              rgba(255,255,255,0.06)
            );

          border:
            1px solid rgba(255,255,255,0.16);

          backdrop-filter: blur(30px);

          box-shadow:
            0 55px 130px rgba(0,0,0,0.42),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
        }

        .mini {
          display: block;
          color: #cbd5e1;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .card-top h2 {
          margin: 0;
          font-size: 34px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .pill {
          padding: 9px 15px;
          border-radius: 999px;

          background:
            rgba(37,99,235,0.18);

          color: #bfdbfe;
          font-weight: 900;
        }

        .route,
        .info,
        .driver {
          background:
            linear-gradient(
              180deg,
              rgba(15,23,42,0.94),
              rgba(30,41,59,0.92)
            );

          border:
            1px solid rgba(255,255,255,0.08);

          box-shadow:
            0 12px 28px rgba(0,0,0,0.2);
        }

        .route {
          border-radius: 24px;
          padding: 20px;
          margin-bottom: 14px;
        }

        .route small {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .route-line {
          height: 1px;
          margin: 14px 0;
          background: rgba(255,255,255,0.12);
        }

        .info {
          display: flex;
          flex-direction: column;
          gap: 5px;

          padding: 16px;

          border-radius: 20px;

          margin-bottom: 14px;
        }

        .info span {
          color: #cbd5e1;
          font-size: 14px;
        }

        .driver {
          margin-top: 18px;

          border-radius: 22px;

          padding: 20px;

          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .driver h3 {
          margin: 0;
          font-size: 21px;
          font-weight: 950;
        }

        .score {
          padding: 9px 15px;

          border-radius: 999px;

          color: #bfdbfe;

          background:
            rgba(37,99,235,0.18);

          font-weight: 900;
          white-space: nowrap;
        }

        .card-button {
          width: 100%;
          margin-top: 18px;

          padding: 16px;

          border-radius: 999px;

          background:
            linear-gradient(
              180deg,
              #2563eb,
              #1d4ed8
            );

          color: white;

          font-size: 15px;
          font-weight: 950;

          box-shadow:
            0 16px 40px
            rgba(37,99,235,0.24);
        }

        @media (max-width: 900px) {

          .hero {
            grid-template-columns: 1fr;

            min-height: auto;

            padding:
              22px 16px 48px;

            gap: 24px;

            align-items: start;
          }

          .logo {
            font-size: 28px;
            margin-bottom: 18px;
          }

          .badge {
            font-size: 12px;
            padding: 8px 13px;
            margin-bottom: 18px;
          }

          h1 {
            font-size:
              clamp(38px, 12vw, 50px);

            line-height: 0.96;
          }

          .subtitle {
            font-size: 15px;
            line-height: 1.5;
            margin-top: 18px;
          }

          .actions {
            flex-direction: column;
            margin-top: 24px;
          }

          .primary,
          .secondary {
            width: 100%;
            padding: 15px 22px;
          }

          .stats {
            grid-template-columns:
              repeat(3, 1fr);

            gap: 9px;

            margin-top: 24px;
          }

          .stats div {
            padding: 13px 8px;
            border-radius: 18px;
            text-align: center;
          }

          .stats strong {
            font-size: 20px;
          }

          .stats span {
            font-size: 11px;
          }

          .mission-card {
            max-width: 100%;
            padding: 20px;
            border-radius: 30px;
          }

          .card-top h2 {
            font-size: 27px;
          }

          .pill {
            padding: 7px 12px;
            font-size: 13px;
          }

          .route {
            padding: 16px;
          }

          .info {
            padding: 14px;
          }

          .driver {
            padding: 16px;
          }

          .driver h3 {
            font-size: 18px;
          }
        }

        @media (max-width: 380px) {

          .stats {
            grid-template-columns: 1fr;
          }

          .card-top,
          .driver {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 900px) {
  .blob {
    display: none;
  }

  .badge,
  .stats div,
  .mission-card,
  .secondary {
    backdrop-filter: none;
  }

  .mission-card {
    box-shadow: 0 24px 60px rgba(0,0,0,0.28);
  }

  .stats div,
  .route,
  .info,
  .driver {
    box-shadow: 0 8px 20px rgba(0,0,0,0.16);
  }

  button:hover {
    transform: none;
  }

  .home-page {
    -webkit-overflow-scrolling: touch;
  }
}

      `}</style>
    </main>
  );
}