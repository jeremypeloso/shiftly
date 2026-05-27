import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { X } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  function updateField(field, value) {
    setForm({
      ...form,
      [field]: value,
    });
  }

  async function resetPassword() {
    if (!form.email) {
      alert("Entre ton email");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      form.email,
      {
        redirectTo:
          "https://shiftly-10rnms0nh-jeremypelosos-projects.vercel.app/update-password",
      }
    );

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Email de réinitialisation envoyé");
  }

  async function loginUser() {
    const { data, error } = await supabase.auth.signInWithPassword({
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
      alert("Utilisateur introuvable");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(profileError);
      alert("Erreur récupération profil");
      return;
    }

    if (profile?.is_suspended === true) {
  await supabase.auth.signOut();

  alert(
    "Votre compte est suspendu. Contactez l’administrateur."
  );

  navigate("/login");

  return;
}

if (profile?.is_admin === true) {
  navigate("/admin");
  return;
}

if (profile?.role === "driver") {
  navigate("/driver");
  return;
}

if (profile?.role === "company") {
  navigate("/company");
  return;
}
}
  return (
    <main
      style={styles.page}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          loginUser();
        }
      }}
    >
      <div style={styles.glowOne}></div>
      <div style={styles.glowTwo}></div>

      <div style={styles.card}>

        <button
  style={styles.closeButton}
  onClick={() => navigate("/")}
>
  <X size={18} />
</button>

        <div style={styles.logo}>Shiftly</div>

        <h1 style={styles.title}>Connexion</h1>

        <p style={styles.subtitle}>
          Connectez-vous à votre espace conducteur ou entreprise.
        </p>

        <input
          type="email"
          placeholder="Adresse email"
          style={styles.input}
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          autoFocus
        />

        <input
          type="password"
          placeholder="Mot de passe"
          style={styles.input}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
        />

        <p style={styles.forgot} onClick={resetPassword}>
          Mot de passe oublié ?
        </p>

        <button style={styles.button} onClick={loginUser}>
          Se connecter
        </button>

        <p style={styles.bottom}>
          Pas encore de compte ?{" "}
          <span
            style={styles.link}
            onClick={() => navigate("/register")}
          >
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
    background: `
      radial-gradient(circle at top left, rgba(251,191,36,0.1), transparent 34%),
      radial-gradient(circle at bottom right, rgba(56,189,248,0.1), transparent 34%),
      linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%)
    `,
    fontFamily: "Inter, Arial, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
    overflow: "hidden",
    position: "relative",
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

  forgot: {
    marginTop: "-4px",
    marginBottom: "16px",
    textAlign: "right",
    color: "#dbeafe",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
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
boxShadow:
  "0 18px 45px rgba(37,99,235,0.28)",
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
  color: "#dbeafe",
  fontWeight: "700",
  cursor: "pointer",
},
};