import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bus,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function resetPassword() {
    if (!form.email) {
      alert("Entre ton email");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo:
        "https://shiftly-10rnms0nh-jeremypelosos-projects.vercel.app/update-password",
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Email de réinitialisation envoyé");
  }

  async function loginUser() {
    setLoading(true);

    try {
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
        alert("Votre compte est suspendu. Contactez l'administrateur.");
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
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="loginPage"
      onKeyDown={(event) => {
        if (event.key === "Enter") loginUser();
      }}
    >
      <button className="closeButton" onClick={() => navigate("/")}>
        <X size={19} />
      </button>

      <section className="loginBrandPanel">
        <div className="brand">
          <div className="mark">S</div>
          <div className="brandText">
            <strong>Shiftly</strong>
            <span>Marketplace</span>
          </div>
        </div>

        <div className="brandCopy">
          <span>Connexion sécurisée</span>
          <h1>Retrouvez vos missions, vos conducteurs et vos échanges.</h1>
          <p>
            Un seul espace pour gérer les missions transport, les candidatures et
            les remplacements en temps réel.
          </p>
        </div>

        <div className="benefits">
          <Benefit icon={Bus} title="Missions en temps réel" />
          <Benefit icon={Users} title="Profils vérifiés" />
          <Benefit icon={ShieldCheck} title="Espace sécurisé" />
        </div>
      </section>

      <section className="loginCard">
        <div className="cardHeader">
          <span className="cardEyebrow">Bienvenue</span>
          <h2>Connexion</h2>
          <p>Connectez-vous à votre espace conducteur ou entreprise.</p>
        </div>

        <div className="formStack">
          <label className="field">
            <span>Adresse email</span>
            <div className="inputWrap">
              <Mail size={19} />
              <input
                type="email"
                placeholder="vous@email.fr"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                autoFocus
              />
            </div>
          </label>

          <label className="field">
            <span>Mot de passe</span>
            <div className="inputWrap">
              <LockKeyhole size={19} />
              <input
                type="password"
                placeholder="Votre mot de passe"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
              />
            </div>
          </label>
        </div>

        <button className="forgotButton" onClick={resetPassword}>
          Mot de passe oublié ?
        </button>

        <button className="submitButton" disabled={loading} onClick={loginUser}>
          {loading ? "Connexion..." : "Se connecter"}
          <ArrowRight size={18} />
        </button>

        <p className="bottomText">
          Pas encore de compte ?{" "}
          <button onClick={() => navigate("/register")}>Créer un compte</button>
        </p>
      </section>

      <style>{`
        .loginPage {
          min-height: 100svh;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.72fr);
          gap: clamp(28px, 6vw, 80px);
          align-items: center;
          padding: 42px clamp(24px, 5vw, 72px);
          background:
            radial-gradient(circle at 14% 14%, rgba(37, 99, 235, 0.14), transparent 30%),
            radial-gradient(circle at 90% 12%, rgba(15, 23, 42, 0.08), transparent 24%),
            #f8fafc;
          color: #0f172a;
          font-family: Inter, system-ui, Arial, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .loginPage button,
        .loginPage input {
          font: inherit;
        }

        .loginPage button {
          border: 0;
          cursor: pointer;
        }

        .loginPage button:disabled {
          opacity: 0.68;
          cursor: not-allowed;
        }

        .closeButton {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 5;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: white;
          color: #0f172a;
          border: 1px solid #dbe3ee !important;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
        }

        .loginBrandPanel {
          max-width: 760px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 70px;
        }

        .mark {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: linear-gradient(135deg, #2563eb, #0f172a);
          color: white;
          font-size: 40px;
          font-weight: 950;
          font-style: italic;
          box-shadow: 0 18px 38px rgba(37, 99, 235, 0.25);
        }

        .brandText {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
        }

        .brand strong {
          display: block;
          font-size: 48px;
          line-height: 0.9;
          font-weight: 950;
          font-style: italic;
          letter-spacing: -0.08em;
        }

        .brand span {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .brandCopy span,
        .cardEyebrow {
          display: inline-flex;
          padding: 8px 12px;
          border-radius: 999px;
          background: #dbeafe;
          color: #2563eb;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .brandCopy h1 {
          max-width: 760px;
          margin: 22px 0 0;
          font-size: clamp(46px, 6vw, 76px);
          line-height: 0.93;
          letter-spacing: -0.08em;
        }

        .brandCopy p {
          max-width: 620px;
          margin: 24px 0 0;
          color: #475569;
          font-size: 18px;
          line-height: 1.7;
        }

        .benefits {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin-top: 42px;
        }

        .benefit {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 16px 42px rgba(15, 23, 42, 0.05);
          font-weight: 850;
        }

        .benefitIcon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #dbeafe;
          color: #2563eb;
          flex: 0 0 auto;
        }

        .loginCard {
          width: 100%;
          max-width: 470px;
          justify-self: end;
          padding: 32px;
          border-radius: 30px;
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 28px 80px rgba(15, 23, 42, 0.12);
        }

        .cardHeader h2 {
          margin: 16px 0 8px;
          font-size: 42px;
          line-height: 1;
          letter-spacing: -0.065em;
        }

        .cardHeader p {
          margin: 0 0 26px;
          color: #64748b;
          line-height: 1.55;
        }

        .formStack {
          display: grid;
          gap: 15px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field > span {
          color: #334155;
          font-size: 13px;
          font-weight: 900;
        }

        .inputWrap {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 54px;
          border-radius: 16px;
          border: 1px solid #dbe3ee;
          background: #f8fafc;
          padding: 0 15px;
          color: #2563eb;
        }

        .inputWrap:focus-within {
          background: white;
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .inputWrap input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0f172a;
        }

        .forgotButton {
          display: block;
          margin: 14px 0 18px auto;
          background: transparent;
          color: #2563eb;
          font-size: 14px;
          font-weight: 900;
        }

        .submitButton {
          width: 100%;
          min-height: 54px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: 999px;
          background: #2563eb;
          color: white;
          font-weight: 950;
          box-shadow: 0 18px 38px rgba(37, 99, 235, 0.24);
        }

        .bottomText {
          margin: 22px 0 0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .bottomText button {
          background: transparent;
          color: #2563eb;
          font-weight: 950;
        }

        @media (max-width: 980px) {
          .loginPage {
            grid-template-columns: 1fr;
            overflow: auto;
          }

          .brand {
            margin-bottom: 34px;
          }

          .loginCard {
            max-width: none;
            justify-self: stretch;
          }

          .benefits {
            grid-template-columns: 1fr;
            margin-top: 28px;
          }
        }

        @media (max-width: 560px) {
          .loginPage {
            padding: 24px 18px;
          }

          .closeButton {
            top: 16px;
            right: 16px;
          }

          .brand strong {
            font-size: 38px;
          }

          .brandCopy h1 {
            font-size: 44px;
          }

          .brandCopy p {
            font-size: 15px;
          }

          .loginCard {
            padding: 24px;
            border-radius: 24px;
          }
        }
      `}</style>
    </main>
  );
}

function Benefit({ icon: Icon, title }) {
  return (
    <div className="benefit">
      <div className="benefitIcon">
        <Icon size={21} />
      </div>
      <span>{title}</span>
    </div>
  );
}
