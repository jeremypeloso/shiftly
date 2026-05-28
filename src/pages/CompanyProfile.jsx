import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileCheck2,
  MapPin,
  Save,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export default function CompanyProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState({
    company_name: "",
    siret: "",
    company_verified: false,
    company_legal_name: "",
    company_address: "",
    company_ape: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) return;

      setUser(currentUser);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      if (data) setProfile(data);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveProfile() {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: profile.company_name || "",
          siret: profile.siret || "",
          company_verified: profile.company_verified || false,
          company_legal_name: profile.company_legal_name || "",
          company_address: profile.company_address || "",
          company_ape: profile.company_ape || "",
        })
        .eq("id", user.id);

      if (error) {
        console.error(error);
        alert("Erreur mise à jour profil");
        return;
      }

      setSuccess("Profil entreprise mis à jour");
      setTimeout(() => setSuccess(""), 1800);
    } finally {
      setSaving(false);
    }
  }

  async function verifySiret() {
    if (!profile.siret) {
      alert("Entre un SIRET");
      return;
    }

    const { data, error } = await supabase.functions.invoke("verify-siret", {
      body: {
        siret: profile.siret.replace(/\D/g, ""),
      },
    });

    if (error) {
      console.error("Erreur function verify-siret :", error);
      alert("Erreur vérification SIRET");
      return;
    }

    if (data?.header?.statut !== 200) {
      alert("SIRET introuvable");
      return;
    }

    const etab = data.etablissement;
    const legal = etab.uniteLegale;
    const adresse = etab.adresseEtablissement;

    const fullAddress = [
      adresse.numeroVoieEtablissement,
      adresse.typeVoieEtablissement,
      adresse.libelleVoieEtablissement,
      adresse.codePostalEtablissement,
      adresse.libelleCommuneEtablissement,
    ]
      .filter(Boolean)
      .join(" ");

    const updatedProfile = {
      ...profile,
      siret: etab.siret,
      company_verified: true,
      company_name: legal.denominationUniteLegale || profile.company_name,
      company_legal_name: legal.denominationUniteLegale || "",
      company_address: fullAddress,
      company_ape: legal.activitePrincipaleUniteLegale || "",
    };

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updatedProfile)
      .eq("id", user.id);

    if (updateError) {
      console.error(updateError);
      alert("Erreur mise à jour profil");
      return;
    }

    setProfile(updatedProfile);
    setSuccess("Entreprise vérifiée avec succès");
    setTimeout(() => setSuccess(""), 1800);
  }

  if (loading) {
    return (
      <main className="companyProfilePage loadingState">
        <div className="loadingCard">
          <div className="mark">S</div>
          <h2>Chargement du profil...</h2>
        </div>
        <CompanyProfileStyles />
      </main>
    );
  }

  return (
    <main className="companyProfilePage">
      <aside className="profileSidebar">
        <button className="backButton" onClick={() => navigate("/company")}>
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="brandBlock">
          <div className="mark">S</div>
          <div>
            <strong>Shiftly</strong>
            <span>Company</span>
          </div>
        </div>

        <div className="identityBlock">
          <span>Profil entreprise</span>
          <h1>{profile.company_name || "Entreprise"}</h1>
          <p>{profile.company_address || "Adresse non renseignée"}</p>
        </div>

        <div className={profile.company_verified ? "verificationCard verified" : "verificationCard"}>
          <BadgeCheck size={32} />
          <div>
            <span>Vérification</span>
            <strong>{profile.company_verified ? "Entreprise vérifiée" : "À vérifier"}</strong>
          </div>
        </div>

        <div className="summaryList">
          <Summary icon={Building2} label="Société" value={profile.company_name || "Non renseignée"} />
          <Summary icon={FileCheck2} label="SIRET" value={profile.siret || "Non renseigné"} />
          <Summary icon={MapPin} label="Adresse" value={profile.company_address || "Non renseignée"} />
        </div>
      </aside>

      <section className="profileContent">
        <header className="profileHeader">
          <div>
            <span className="eyebrow">Entreprise</span>
            <h2>Informations légales et vérification</h2>
            <p>
              Ces informations renforcent la confiance des conducteurs avant
              candidature ou acceptation d'une mission.
            </p>
          </div>

          <button className="saveTop" disabled={saving} onClick={saveProfile}>
            <Save size={18} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </header>

        {success && (
          <div className="success">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        <div className="profileGrid">
          <section className="formPanel wide">
            <PanelTitle
              icon={Building2}
              title="Identité entreprise"
              text="Nom public et informations de base de votre compte."
            />

            <div className="fieldsGrid">
              <Field label="Société">
                <input
                  value={profile.company_name || ""}
                  onChange={(event) => updateField("company_name", event.target.value)}
                  placeholder="Nom de l'entreprise"
                />
              </Field>

              <Field label="SIRET">
                <input
                  value={profile.siret || ""}
                  onChange={(event) => updateField("siret", event.target.value)}
                  placeholder="Numéro SIRET"
                />
              </Field>
            </div>

            <button className="verifyButton" onClick={verifySiret}>
              <ShieldCheck size={18} />
              Vérifier le SIRET
            </button>
          </section>

          <section className="formPanel">
            <PanelTitle
              icon={BadgeCheck}
              title="Statut de vérification"
              text="Validation automatique via les données INSEE."
            />

            {profile.company_verified ? (
              <div className="verifiedBox">
                <BadgeCheck size={26} />
                <div>
                  <strong>Entreprise vérifiée</strong>
                  <p>Société validée automatiquement via la base INSEE.</p>
                </div>
              </div>
            ) : (
              <div className="emptyInfo">
                Vérifiez votre SIRET pour afficher un badge de confiance côté conducteurs.
              </div>
            )}
          </section>

          <section className="formPanel">
            <PanelTitle
              icon={FileCheck2}
              title="Données légales"
              text="Informations retournées après vérification."
            />

            <Info label="Raison sociale" value={profile.company_legal_name} />
            <Info label="Adresse" value={profile.company_address} />
            <Info label="Code APE" value={profile.company_ape} />
          </section>
        </div>

        <button className="saveBottom" disabled={saving} onClick={saveProfile}>
          <Save size={18} />
          {saving ? "Enregistrement..." : "Enregistrer le profil entreprise"}
        </button>
      </section>

      <CompanyProfileStyles />
    </main>
  );
}

function Summary({ icon: Icon, label, value }) {
  return (
    <div className="summaryItem">
      <Icon size={20} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function PanelTitle({ icon: Icon, title, text }) {
  return (
    <div className="panelTitle">
      <div className="panelIcon">
        <Icon size={22} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="infoBox">
      <span>{label}</span>
      <strong>{value || "Non renseigné"}</strong>
    </div>
  );
}

function CompanyProfileStyles() {
  return (
    <style>{`
      .companyProfilePage {
        min-height: 100svh;
        display: grid;
        grid-template-columns: 320px 1fr;
        background: #f8fafc;
        color: #0f172a;
        font-family: Inter, system-ui, Arial, sans-serif;
      }

      .companyProfilePage button,
      .companyProfilePage input {
        font: inherit;
      }

      .companyProfilePage button {
        border: 0;
        cursor: pointer;
      }

      .companyProfilePage button:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .profileSidebar {
        min-height: 100svh;
        padding: 28px;
        background: #07152f;
        color: white;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }

      .backButton {
        width: fit-content;
        display: inline-flex;
        align-items: center;
        gap: 9px;
        min-height: 42px;
        border-radius: 999px;
        padding: 0 14px;
        background: rgba(255, 255, 255, 0.08);
        color: #dbeafe;
        font-weight: 850;
      }

      .brandBlock {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mark {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        background: #2563eb;
        color: white;
        font-size: 30px;
        font-weight: 950;
        font-style: italic;
      }

      .brandBlock strong {
        display: block;
        font-size: 28px;
        font-style: italic;
        letter-spacing: -0.07em;
        line-height: 0.9;
      }

      .brandBlock span,
      .identityBlock span {
        display: inline-flex;
        margin-top: 7px;
        padding: 4px 8px;
        border-radius: 7px;
        background: #2563eb;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .identityBlock {
        padding-top: 20px;
      }

      .identityBlock h1 {
        margin: 18px 0 10px;
        font-size: 34px;
        line-height: 0.95;
        letter-spacing: -0.06em;
      }

      .identityBlock p {
        margin: 0;
        color: #94a3b8;
        line-height: 1.5;
      }

      .verificationCard {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .verificationCard.verified {
        background: rgba(22, 163, 74, 0.18);
        border-color: rgba(34, 197, 94, 0.22);
      }

      .verificationCard svg {
        color: #93c5fd;
      }

      .verificationCard.verified svg {
        color: #86efac;
      }

      .verificationCard span {
        display: block;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 850;
      }

      .verificationCard strong {
        display: block;
        margin-top: 3px;
      }

      .summaryList {
        display: grid;
        gap: 10px;
      }

      .summaryItem {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .summaryItem svg {
        color: #93c5fd;
      }

      .summaryItem span {
        display: block;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 800;
      }

      .summaryItem strong {
        display: block;
        margin-top: 2px;
        font-size: 14px;
        overflow-wrap: anywhere;
      }

      .profileContent {
        padding: 30px;
        overflow: auto;
      }

      .profileHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 20px;
      }

      .eyebrow {
        display: inline-flex;
        margin-bottom: 10px;
        padding: 7px 11px;
        border-radius: 999px;
        background: #dbeafe;
        color: #2563eb;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .profileHeader h2 {
        margin: 0;
        font-size: clamp(34px, 5vw, 52px);
        line-height: 1;
        letter-spacing: -0.065em;
      }

      .profileHeader p {
        max-width: 690px;
        margin: 14px 0 0;
        color: #64748b;
        line-height: 1.6;
      }

      .saveTop,
      .saveBottom,
      .verifyButton {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        border-radius: 999px;
        background: #2563eb;
        color: white;
        font-weight: 950;
        box-shadow: 0 16px 34px rgba(37, 99, 235, 0.22);
      }

      .saveTop {
        padding: 0 18px;
        flex: 0 0 auto;
      }

      .success {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
        padding: 14px 16px;
        border-radius: 18px;
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
        font-weight: 900;
      }

      .profileGrid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.72fr);
        gap: 18px;
      }

      .formPanel {
        padding: 24px;
        border-radius: 26px;
        background: white;
        border: 1px solid #dbe3ee;
        box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06);
      }

      .formPanel.wide {
        grid-column: 1 / -1;
      }

      .panelTitle {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 20px;
      }

      .panelIcon {
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        border-radius: 14px;
        background: #dbeafe;
        color: #2563eb;
      }

      .panelTitle h3 {
        margin: 0 0 5px;
        font-size: 22px;
        letter-spacing: -0.04em;
      }

      .panelTitle p {
        margin: 0;
        color: #64748b;
        font-size: 14px;
        line-height: 1.45;
      }

      .fieldsGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 9px;
        margin-bottom: 16px;
      }

      .field > span {
        color: #334155;
        font-size: 13px;
        font-weight: 900;
      }

      input {
        width: 100%;
        border-radius: 15px;
        border: 1px solid #dbe3ee;
        background: #f8fafc;
        color: #0f172a;
        padding: 14px 15px;
        outline: none;
        box-sizing: border-box;
      }

      input:focus {
        border-color: #93c5fd;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        background: white;
      }

      .verifyButton {
        width: 100%;
      }

      .verifiedBox,
      .emptyInfo,
      .infoBox {
        padding: 16px;
        border-radius: 18px;
      }

      .verifiedBox {
        display: flex;
        gap: 12px;
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
      }

      .verifiedBox p {
        margin: 5px 0 0;
      }

      .emptyInfo {
        background: #f8fafc;
        color: #64748b;
        border: 1px dashed #cbd5e1;
        line-height: 1.5;
      }

      .infoBox {
        margin-bottom: 10px;
        background: #f8fafc;
        border: 1px solid #e5eaf2;
      }

      .infoBox span {
        display: block;
        color: #64748b;
        font-size: 12px;
        font-weight: 900;
        margin-bottom: 5px;
      }

      .infoBox strong {
        overflow-wrap: anywhere;
      }

      .saveBottom {
        width: 100%;
        margin-top: 18px;
        padding: 0 18px;
      }

      .loadingState {
        display: grid;
        place-items: center;
        grid-template-columns: 1fr;
      }

      .loadingCard {
        width: min(420px, calc(100% - 36px));
        display: grid;
        justify-items: center;
        gap: 16px;
        border-radius: 28px;
        padding: 36px;
        background: white;
        border: 1px solid #dbe3ee;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
      }

      @media (max-width: 1040px) {
        .companyProfilePage {
          grid-template-columns: 1fr;
        }

        .profileSidebar {
          min-height: auto;
        }

        .summaryList {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 760px) {
        .profileContent,
        .profileSidebar {
          padding: 18px;
        }

        .profileHeader {
          flex-direction: column;
        }

        .saveTop,
        .saveBottom {
          width: 100%;
        }

        .profileGrid,
        .fieldsGrid,
        .summaryList {
          grid-template-columns: 1fr;
        }

        .formPanel {
          padding: 20px;
          border-radius: 22px;
        }
      }
    `}</style>
  );
}
