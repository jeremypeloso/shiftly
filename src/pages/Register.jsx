import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Bus,
  CheckCircle2,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Register() {
  const navigate = useNavigate();

  const [successModal, setSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    city: "",
    email: "",
    password: "",
    role: "driver",
  });

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function registerUser() {
    setLoading(true);

    try {
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="registerPage">
      <button className="closeButton" onClick={() => navigate("/")}>
        <X size={19} />
      </button>

      <section className="registerBrandPanel">
        <div className="brand">
          <div className="mark">S</div>
          <div className="brandText">
            <strong>Shiftly</strong>
            <span>Marketplace</span>
          </div>
        </div>

        <div className="brandCopy">
          <span>Rejoindre la plateforme</span>
          <h1>Créez votre accès au réseau Shiftly.</h1>
          <p>
            Inscrivez-vous comme conducteur indépendant ou entreprise de transport
            et commencez à gérer vos missions plus simplement.
          </p>
        </div>

        <div className="benefits">
          <Benefit icon={Bus} title="Missions en temps réel" />
          <Benefit icon={Users} title="Mise en relation rapide" />
          <Benefit icon={ShieldCheck} title="Profils et échanges sécurisés" />
        </div>
      </section>

      <section className="registerCard">
        <div className="cardHeader">
          <span className="cardEyebrow">Inscription</span>
          <h2>Créer un compte</h2>
          <p>Choisissez votre profil puis renseignez vos informations principales.</p>
        </div>

        <div className="roleSwitch" aria-label="Type de compte">
          <button
            type="button"
            className={form.role === "driver" ? "active" : ""}
            onClick={() => updateField("role", "driver")}
          >
            <User size={18} />
            Conducteur
          </button>
          <button
            type="button"
            className={form.role === "company" ? "active" : ""}
            onClick={() => updateField("role", "company")}
          >
            <Building2 size={18} />
            Entreprise
          </button>
        </div>

        <div className="formStack">
          <Field icon={User} label="Nom complet">
            <input
              type="text"
              placeholder="Votre nom"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
            />
          </Field>

          {form.role === "company" && (
            <Field icon={Building2} label="Entreprise">
              <input
                type="text"
                placeholder="Nom de l'entreprise"
                value={form.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
              />
            </Field>
          )}

          <Field icon={MapPin} label="Ville">
            <input
              type="text"
              placeholder="Ville"
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
            />
          </Field>

          <Field icon={Mail} label="Adresse email">
            <input
              type="email"
              placeholder="vous@email.fr"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </Field>

          <Field icon={LockKeyhole} label="Mot de passe">
            <input
              type="password"
              placeholder="Créer un mot de passe"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </Field>
        </div>

        <button className="submitButton" disabled={loading} onClick={registerUser}>
          {loading ? "Création..." : "Créer mon compte"}
          <ArrowRight size={18} />
        </button>

        <p className="bottomText">
          Déjà inscrit ?{" "}
          <button onClick={() => navigate("/login")}>Se connecter</button>
        </p>
      </section>

      {successModal && (
        <div className="modalOverlay" onClick={() => setSuccessModal(false)}>
          <div className="successModal" onClick={(event) => event.stopPropagation()}>
            <div className="successIcon">
              <CheckCircle2 size={36} />
            </div>

            <h2>Compte créé</h2>
            <p>Bienvenue sur Shiftly. Votre compte est prêt.</p>

            <button onClick={() => navigate("/login")}>Continuer</button>
          </div>
        </div>
      )}

      <style>{`
        .registerPage {
          min-height: 100svh;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(390px, 0.76fr);
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
        }

        .registerPage button,
        .registerPage input {
          font: inherit;
        }

        .registerPage button {
          border: 0;
          cursor: pointer;
        }

        .registerPage button:disabled {
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

        .registerBrandPanel {
          max-width: 760px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 64px;
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

        .registerCard {
          width: 100%;
          max-width: 500px;
          justify-self: end;
          padding: 32px;
          border-radius: 30px;
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 28px 80px rgba(15, 23, 42, 0.12);
        }

        .cardHeader h2 {
          margin: 16px 0 8px;
          font-size: 40px;
          line-height: 1;
          letter-spacing: -0.065em;
        }

        .cardHeader p {
          margin: 0 0 22px;
          color: #64748b;
          line-height: 1.55;
        }

        .roleSwitch {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
          padding: 6px;
          border-radius: 18px;
          background: #f1f5f9;
          border: 1px solid #dbe3ee;
        }

        .roleSwitch button {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 14px;
          background: transparent;
          color: #475569;
          font-weight: 900;
        }

        .roleSwitch button.active {
          background: #2563eb;
          color: white;
          box-shadow: 0 12px 26px rgba(37, 99, 235, 0.22);
        }

        .formStack {
          display: grid;
          gap: 14px;
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
          min-height: 52px;
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

        .submitButton {
          width: 100%;
          min-height: 54px;
          margin-top: 20px;
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

        .modalOverlay {
          position: fixed;
          inset: 0;
          z-index: 20;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.62);
          backdrop-filter: blur(8px);
        }

        .successModal {
          width: min(420px, 100%);
          padding: 30px;
          border-radius: 28px;
          background: white;
          color: #0f172a;
          text-align: center;
          box-shadow: 0 28px 90px rgba(15, 23, 42, 0.28);
        }

        .successIcon {
          width: 72px;
          height: 72px;
          margin: 0 auto 18px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #dcfce7;
          color: #16a34a;
        }

        .successModal h2 {
          margin: 0;
          font-size: 32px;
          letter-spacing: -0.05em;
        }

        .successModal p {
          margin: 12px 0 24px;
          color: #64748b;
          line-height: 1.5;
        }

        .successModal button {
          width: 100%;
          min-height: 50px;
          border-radius: 999px;
          background: #2563eb;
          color: white;
          font-weight: 950;
        }

        @media (max-width: 980px) {
          .registerPage {
            grid-template-columns: 1fr;
          }

          .brand {
            margin-bottom: 34px;
          }

          .registerCard {
            max-width: none;
            justify-self: stretch;
          }

          .benefits {
            grid-template-columns: 1fr;
            margin-top: 28px;
          }
        }

        @media (max-width: 560px) {
          .registerPage {
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

          .registerCard {
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

function Field({ icon: Icon, label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="inputWrap">
        <Icon size={19} />
        {children}
      </div>
    </label>
  );
}
