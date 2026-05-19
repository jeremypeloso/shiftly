export default function Register() {
  return (
    <main style={styles.page}>
      <div style={styles.glowOne}></div>
      <div style={styles.glowTwo}></div>

      <div style={styles.card}>
        <div style={styles.logo}>Shiftly</div>

        <div style={styles.badge}>
          🚍 Rejoindre la plateforme
        </div>

        <h1 style={styles.title}>
          Créer un compte
        </h1>

        <p style={styles.subtitle}>
          Rejoignez Shiftly en tant que conducteur ou entreprise.
        </p>

        <input
          type="text"
          placeholder="Nom complet"
          style={styles.input}
        />

        <input
          type="email"
          placeholder="Adresse email"
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          style={styles.input}
        />

        <select style={styles.input}>
          <option>Je suis conducteur</option>
          <option>Je suis une entreprise</option>
        </select>

        <button style={styles.button}>
          Créer mon compte
        </button>

        <p style={styles.bottom}>
          Déjà inscrit ?{" "}
          <span style={styles.link}>
            Se connecter
          </span>
        </p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100svh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },

  glowOne: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "#fbbf24",
    opacity: 0.12,
    filter: "blur(80px)",
    top: "-120px",
    left: "-120px",
  },

  glowTwo: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "#2563eb",
    opacity: 0.12,
    filter: "blur(80px)",
    bottom: "-120px",
    right: "-120px",
  },

  card: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "460px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(28px)",
    borderRadius: "36px",
    padding: "36px",
    boxSizing: "border-box",
    color: "white",
    boxShadow:
      "0 40px 100px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
  },

  logo: {
    fontSize: "30px",
    fontWeight: "950",
    marginBottom: "14px",
    letterSpacing: "-0.04em",
  },

  badge: {
    display: "inline-flex",
    padding: "9px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#dbeafe",
    marginBottom: "18px",
    fontWeight: "700",
    fontSize: "13px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
  },

  title: {
    margin: 0,
    fontSize: "46px",
    fontWeight: "950",
    letterSpacing: "-0.06em",
    lineHeight: "0.95",
  },

  subtitle: {
    color: "#cbd5e1",
    marginTop: "16px",
    lineHeight: "1.55",
    marginBottom: "30px",
    fontSize: "15px",
  },

  input: {
    width: "100%",
    padding: "16px",
    marginBottom: "14px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15,23,42,0.88)",
    color: "white",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    marginTop: "10px",
    padding: "16px",
    borderRadius: "999px",
    border: "none",
    background:
      "linear-gradient(180deg, #2563eb, #1d4ed8)",
    color: "white",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer",
    boxShadow:
      "0 18px 45px rgba(37,99,235,0.28)",
  },

  bottom: {
    marginTop: "22px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "14px",
  },

  link: {
    color: "#dbeafe",
    fontWeight: "700",
    cursor: "pointer",
  },
};