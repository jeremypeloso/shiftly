export default function Login() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Shiftly</div>

        <h1 style={styles.title}>
          Connexion
        </h1>

        <p style={styles.subtitle}>
          Connectez-vous à votre espace conducteur ou entreprise.
        </p>

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

        <button style={styles.button}>
          Se connecter
        </button>

        <p style={styles.bottom}>
          Pas encore de compte ?{" "}
          <span style={styles.link}>
            Créer un compte
          </span>
        </p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    width: "100%",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg,#020617 0%,#0f172a 55%,#111827 100%)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(24px)",
    borderRadius: "32px",
    padding: "36px",
    boxSizing: "border-box",
    color: "white",
    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
  },

  logo: {
    fontSize: "28px",
    fontWeight: "900",
    marginBottom: "12px",
  },

  title: {
    margin: 0,
    fontSize: "42px",
    fontWeight: "900",
    letterSpacing: "-0.05em",
  },

  subtitle: {
    color: "#94a3b8",
    marginTop: "12px",
    lineHeight: "1.5",
    marginBottom: "28px",
  },

  input: {
    width: "100%",
    padding: "16px",
    marginBottom: "14px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15,23,42,0.9)",
    color: "white",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    marginTop: "10px",
    padding: "16px",
    borderRadius: "999px",
    border: "none",
    background: "#2dd4bf",
    color: "#020617",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer",
  },

  bottom: {
    marginTop: "24px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "14px",
  },

  link: {
    color: "#5eead4",
    fontWeight: "700",
    cursor: "pointer",
  },
};