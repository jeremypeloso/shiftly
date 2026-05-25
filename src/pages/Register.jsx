import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { X } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [successModal, setSuccessModal] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    city: "",
    email: "",
    password: "",
    role: "driver",
  });

  function updateField(field, value) {
    setForm({
      ...form,
      [field]: value,
    });
  }

  async function registerUser() {
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      setSuccessModal(true);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: user.id,
        role: form.role,
        full_name: form.fullName,
        company_name: form.role === "company" ? form.companyName : null,
        city: form.city,
        shift_score: form.role === "driver" ? 0 : null,
      },
    ]);

    if (profileError) {
      console.error(profileError);
      alert(profileError.message);
      return;
    }

    setSuccessModal(true);
  }

  return (
    <main style={styles.page}>
      <div style={styles.glowOne}></div>
      <div style={styles.glowTwo}></div>

      <div style={styles.card}>
        <button style={styles.closeButton} onClick={() => navigate("/")}>
          <X size={18} />
        </button>

        <div style={styles.logo}>Shiftly</div>

        <div style={styles.badge}>🚍 Rejoindre la plateforme</div>

        <h1 style={styles.title}>Créer un compte</h1>

        <p style={styles.subtitle}>
          Rejoignez Shiftly en tant que conducteur ou entreprise.
        </p>

        <input
          type="text"
          placeholder="Nom complet"
          style={styles.input}
          value={form.fullName}
          onChange={(e) => updateField("fullName", e.target.value)}
        />

        <input
          type="text"
          placeholder="Ville"
          style={styles.input}
          value={form.city}
          onChange={(e) => updateField("city", e.target.value)}
        />

        <input
          type="email"
          placeholder="Adresse email"
          style={styles.input}
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          style={styles.input}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
        />

        <select
          style={styles.input}
          value={form.role}
          onChange={(e) => updateField("role", e.target.value)}
        >
          <option value="driver">Je suis conducteur</option>
          <option value="company">Je suis une entreprise</option>
        </select>

        {form.role === "company" && (
          <input
            type="text"
            placeholder="Nom de l’entreprise"
            style={styles.input}
            value={form.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
          />
        )}

        <button style={styles.button} onClick={registerUser}>
          Créer mon compte
        </button>

        <p style={styles.bottom}>
          Déjà inscrit ?{" "}
          <span style={styles.link} onClick={() => navigate("/login")}>
            Se connecter
          </span>
        </p>
      </div>

      {successModal && (
        <div style={styles.modalOverlay} onClick={() => setSuccessModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.successIcon}>✅</div>

            <h2 style={styles.modalTitle}>Compte créé</h2>

            <p style={styles.modalText}>
              Bienvenue sur Shiftly. Votre compte est prêt.
            </p>

            <button style={styles.confirmBtn} onClick={() => navigate("/login")}>
              Continuer
            </button>
          </div>
        </div>
      )}
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
    background: `
      radial-gradient(circle at top left, rgba(251,191,36,0.1), transparent 34%),
      radial-gradient(circle at bottom right, rgba(56,189,248,0.1), transparent 34%),
      linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%)
    `,
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

  closeButton: {
    position: "absolute",
    top: "24px",
    right: "24px",
    width: "38px",
    height: "38px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.06)",
    color: "#cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    zIndex: 3,
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
    background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
    color: "white",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 18px 45px rgba(37,99,235,0.28)",
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

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: "20px",
  },

  modal: {
    width: "100%",
    maxWidth: "420px",
    padding: "28px",
    borderRadius: "28px",
    background: "linear-gradient(180deg, #111827, #0f172a)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
    textAlign: "center",
    boxShadow: "0 40px 120px rgba(0,0,0,0.45)",
  },

  successIcon: {
    width: "72px",
    height: "72px",
    margin: "0 auto 18px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    background: "rgba(22,163,74,0.18)",
  },

  modalTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "950",
  },

  modalText: {
    color: "#cbd5e1",
    lineHeight: 1.5,
    marginTop: "12px",
  },

  confirmBtn: {
    width: "100%",
    marginTop: "24px",
    padding: "14px",
    border: "none",
    borderRadius: "999px",
    background: "linear-gradient(180deg, #16a34a, #15803d)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer",
  },
};