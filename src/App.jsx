export default function App() {
  const mobile = typeof window !== "undefined" && window.innerWidth < 900;

  return (
    <main style={styles.page}>
      <div style={styles.glowOne}></div>
      <div style={styles.glowTwo}></div>

      <section
        style={{
          ...styles.hero,
          gridTemplateColumns: mobile ? "1fr" : "1.15fr 0.85fr",
          padding: mobile ? "24px" : "42px 64px",
          gap: mobile ? "28px" : "56px",
        }}
      >
        <div>
          <div style={styles.logo}>Shiftly</div>

          <div style={styles.badge}>
            🚍 Plateforme transport nouvelle génération
          </div>

          <h1 style={{ ...styles.title, fontSize: mobile ? "42px" : "82px" }}>
            Le bon conducteur, La bonne mission, Au bon moment.
          </h1>

          <p style={{ ...styles.description, fontSize: mobile ? "16px" : "20px" }}>
            Shiftly connecte les entreprises de transport avec des conducteurs qualifiés,
            disponibles et fiables grâce au ShiftScore.
          </p>

          <div style={{ ...styles.buttons, flexDirection: mobile ? "column" : "row" }}>
            <button style={styles.primaryButton}>Trouver un conducteur</button>
            <button style={styles.secondaryButton}>Voir les missions</button>
          </div>

          <div style={{ ...styles.stats, gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)" }}>
            <div style={styles.statCard}><h3>24/7</h3><p>Missions visibles</p></div>
            <div style={styles.statCard}><h3>100%</h3><p>Profils vérifiés</p></div>
            <div style={styles.statCard}><h3>92</h3><p>ShiftScore moyen</p></div>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.missionCard}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.small}>Mission ouverte</p>
                <h2 style={styles.cardTitle}>CDG → Rouen</h2>
              </div>
              <span style={styles.urgent}>Urgent</span>
            </div>

            <div style={styles.routeBox}>
              <div>
                <p style={styles.routeLabel}>Départ</p>
                <strong>Roissy CDG</strong>
              </div>
              <div style={styles.line}></div>
              <div>
                <p style={styles.routeLabel}>Arrivée</p>
                <strong>Rouen Centre</strong>
              </div>
            </div>

            <Info title="📅 Demain · 06h30" text="Transport tourisme · autocar" />
            <Info title="🛡️ Permis D + FIMO" text="Documents obligatoires vérifiés" />

            <div style={styles.driver}>
              <div>
                <p style={styles.small}>Conducteur recommandé</p>
                <h3 style={styles.driverName}>Yorick Martin</h3>
              </div>
              <div style={styles.score}>⭐ 92</div>
            </div>

            <button style={styles.fullButton}>Proposer la mission</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ title, text }) {
  return (
    <div style={styles.info}>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    background: "linear-gradient(135deg,#020617 0%,#0f172a 55%,#111827 100%)",
    color: "white",
    fontFamily: "Inter, Arial, sans-serif",
    position: "relative",
  },
  glowOne: {
    position: "absolute",
    width: "520px",
    height: "520px",
    borderRadius: "50%",
    background: "rgba(45,212,191,0.18)",
    filter: "blur(80px)",
    top: "-160px",
    left: "-140px",
  },
  glowTwo: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "rgba(59,130,246,0.16)",
    filter: "blur(80px)",
    bottom: "-120px",
    right: "-80px",
  },
  hero: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    height: "100vh",
    display: "grid",
    alignItems: "center",
    boxSizing: "border-box",
  },
  logo: {
    fontSize: "26px",
    fontWeight: "950",
    marginBottom: "22px",
    letterSpacing: "-0.04em",
  },
  badge: {
    display: "inline-block",
    padding: "9px 15px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#99f6e4",
    marginBottom: "20px",
    fontWeight: "800",
    fontSize: "14px",
  },
  title: {
    lineHeight: "0.92",
    fontWeight: "950",
    letterSpacing: "-0.065em",
    margin: 0,
    maxWidth: "880px",
  },
  description: {
    lineHeight: "1.55",
    color: "#cbd5e1",
    maxWidth: "650px",
    marginTop: "22px",
  },
  buttons: {
    display: "flex",
    gap: "14px",
    marginTop: "30px",
  },
  primaryButton: {
    background: "#2dd4bf",
    color: "#020617",
    border: "none",
    padding: "16px 28px",
    borderRadius: "999px",
    fontSize: "16px",
    fontWeight: "950",
    cursor: "pointer",
    boxShadow: "0 18px 45px rgba(45,212,191,0.25)",
  },
  secondaryButton: {
    background: "rgba(255,255,255,0.08)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "16px 28px",
    borderRadius: "999px",
    fontSize: "16px",
    fontWeight: "850",
    cursor: "pointer",
  },
  stats: {
    marginTop: "34px",
    display: "grid",
    gap: "14px",
    maxWidth: "720px",
  },
  statCard: {
    background: "rgba(255,255,255,0.065)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "22px",
    padding: "18px",
    backdropFilter: "blur(18px)",
  },
  right: {
    display: "flex",
    justifyContent: "center",
  },
  missionCard: {
    width: "100%",
    maxWidth: "460px",
    background: "linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "34px",
    padding: "24px",
    backdropFilter: "blur(24px)",
    boxShadow: "0 40px 100px rgba(0,0,0,0.42)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    alignItems: "center",
  },
  small: {
    color: "#94a3b8",
    fontSize: "13px",
    marginBottom: "4px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "950",
    letterSpacing: "-0.04em",
  },
  urgent: {
    background: "rgba(45,212,191,0.15)",
    color: "#5eead4",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "850",
  },
  routeBox: {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "12px",
  },
  routeLabel: {
    color: "#64748b",
    fontSize: "12px",
    margin: 0,
  },
  line: {
    height: "1px",
    background: "rgba(255,255,255,0.12)",
    margin: "14px 0",
  },
  info: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    background: "rgba(15,23,42,0.92)",
    borderRadius: "18px",
    padding: "15px",
    marginBottom: "12px",
    color: "#e2e8f0",
  },
  driver: {
    marginTop: "18px",
    background: "rgba(2,6,23,0.7)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  driverName: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "950",
  },
  score: {
    background: "rgba(250,204,21,0.15)",
    color: "#fde68a",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "900",
  },
  fullButton: {
    marginTop: "18px",
    width: "100%",
    background: "white",
    color: "#020617",
    border: "none",
    padding: "16px",
    borderRadius: "999px",
    fontWeight: "950",
    fontSize: "15px",
    cursor: "pointer",
  },
};