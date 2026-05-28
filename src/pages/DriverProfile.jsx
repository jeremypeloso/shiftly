import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  MapPin,
  Save,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const permitOptions = ["Permis B", "Permis D", "Permis D1", "Permis DE"];

const missionOptions = [
  "Scolaire",
  "Tourisme",
  "Transfert",
  "Séjour",
  "Ligne régulière",
  "Événementiel",
];

const mobilityOptions = [
  "75",
  "77",
  "78",
  "91",
  "92",
  "93",
  "94",
  "95",
  "27",
  "28",
  "76",
  "France entière",
  "Europe",
];

const defaultForm = {
  fullName: "",
  city: "",
  phone: "",
  permits: [],
  fcoStatus: "À jour",
  rcproStatus: "Non renseignée",
  experience: "",
  mobilityZones: [],
  missionTypes: [],
  availability: "",
  shiftScore: 92,
  driverSiret: "",
  driverCompanyVerified: false,
  driverLegalName: "",
  driverCompanyAddress: "",
  driverApe: "",
  licenseExpiry: "",
  fcoExpiry: "",
  rcproExpiry: "",
};

export default function DriverProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(error);
          return;
        }

        if (data && mounted) {
          setForm((prev) => ({
            ...prev,
            fullName: data.full_name || "",
            city: data.city || "",
            phone: data.phone || "",
            permits: data.permits || [],
            fcoStatus: data.fco_status || "À jour",
            rcproStatus: data.rcpro_status || "Non renseignée",
            experience: data.experience || "",
            mobilityZones: data.mobility_zones || data.preferred_departments || [],
            missionTypes: data.mission_types || [],
            availability: data.availability || "",
            shiftScore: data.shift_score ?? 92,
            driverSiret: data.driver_siret || "",
            driverCompanyVerified: data.driver_company_verified || false,
            driverLegalName: data.driver_legal_name || "",
            driverCompanyAddress: data.driver_company_address || "",
            driverApe: data.driver_ape || "",
            licenseExpiry: data.driver_license_expiry || "",
            fcoExpiry: data.driver_fco_expiry || "",
            rcproExpiry: data.driver_rcpro_expiry || "",
          }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function toggleArrayField(field, value) {
    setForm((prev) => {
      const current = prev[field] || [];

      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  }

  async function verifyDriverSiret() {
    if (!form.driverSiret) {
      alert("Entre un SIRET");
      return;
    }

    const { data, error } = await supabase.functions.invoke("verify-siret", {
      body: {
        siret: form.driverSiret.replace(/\D/g, ""),
      },
    });

    if (error) {
      console.error(error);
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

    setForm((prev) => ({
      ...prev,
      driverSiret: etab.siret,
      driverCompanyVerified: true,
      driverLegalName: legal.denominationUniteLegale || "",
      driverCompanyAddress: fullAddress,
      driverApe: legal.activitePrincipaleUniteLegale || "",
    }));
  }

  async function saveProfile() {
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Session temporairement indisponible");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.fullName,
          city: form.city,
          phone: form.phone,
          permits: form.permits,
          fco_status: form.fcoStatus,
          rcpro_status: form.rcproStatus,
          experience: form.experience,
          mobility_zones: form.mobilityZones,
          preferred_departments: form.mobilityZones,
          mission_types: form.missionTypes,
          availability: form.availability,
          shift_score: form.shiftScore,
          driver_siret: form.driverSiret,
          driver_company_verified: form.driverCompanyVerified,
          driver_legal_name: form.driverLegalName,
          driver_company_address: form.driverCompanyAddress,
          driver_ape: form.driverApe,
          driver_license_expiry: form.licenseExpiry || null,
          driver_fco_expiry: form.fcoExpiry || null,
          driver_rcpro_expiry: form.rcproExpiry || null,
        })
        .eq("id", user.id);

      if (error) {
        alert(error.message);
        return;
      }

      setSuccessMessage("Profil mis à jour");

      setTimeout(() => {
        navigate("/driver");
      }, 1200);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="driverProfilePage loadingState">
        <div className="loadingCard">
          <div className="loaderMark">S</div>
          <h2>Chargement du profil...</h2>
        </div>
        <ProfileStyles />
      </main>
    );
  }

  return (
    <main className="driverProfilePage">
      <aside className="profileSidebar">
        <button className="backButton" onClick={() => navigate("/driver")}>
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="profileIdentity">
          <div className="avatar">
            {(form.fullName || "C").slice(0, 1).toUpperCase()}
          </div>
          <span>Conducteur</span>
          <h1>{form.fullName || "Mon profil"}</h1>
          <p>{form.city || "Ville non renseignée"}</p>
        </div>

        <div className="scoreCard">
          <div>
            <span>ShiftScore</span>
            <strong>{form.shiftScore}</strong>
          </div>
          <Star size={32} fill="currentColor" />
        </div>

        <div className="summaryList">
          <Summary icon={ShieldCheck} label="Permis" value={`${form.permits.length} sélectionné(s)`} />
          <Summary icon={MapPin} label="Mobilité" value={`${form.mobilityZones.length} zone(s)`} />
          <Summary icon={CalendarDays} label="Missions" value={`${form.missionTypes.length} type(s)`} />
          <Summary icon={BadgeCheck} label="SIRET" value={form.driverCompanyVerified ? "Vérifié" : "À vérifier"} />
        </div>
      </aside>

      <section className="profileContent">
        <header className="profileHeader">
          <div>
            <span className="eyebrow">Profil conducteur</span>
            <h2>Informations, documents et préférences</h2>
            <p>
              Mets à jour ton profil pour améliorer ton matching avec les missions
              disponibles sur Shiftly Marketplace.
            </p>
          </div>

          <button className="saveTop" disabled={saving} onClick={saveProfile}>
            <Save size={18} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </header>

        {successMessage && (
          <div className="success">
            <CheckCircle2 size={20} />
            {successMessage}
          </div>
        )}

        <div className="profileGrid">
          <section className="formPanel wide">
            <PanelTitle icon={User} title="Identité conducteur" text="Informations visibles par les entreprises." />

            <div className="fieldsGrid">
              <Field label="Nom complet">
                <input
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Nom complet"
                />
              </Field>

              <Field label="Ville">
                <input
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Ville"
                />
              </Field>

              <Field label="Téléphone">
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="Téléphone"
                />
              </Field>

              <Field label="Expérience">
                <input
                  value={form.experience}
                  onChange={(event) => updateField("experience", event.target.value)}
                  placeholder="Ex : 8 ans"
                />
              </Field>
            </div>
          </section>

          <section className="formPanel">
            <PanelTitle icon={Building2} title="Conducteur indépendant" text="Vérification SIRET et entreprise." />

            <div className="siretRow">
              <input
                value={form.driverSiret}
                onChange={(event) => updateField("driverSiret", event.target.value)}
                placeholder="SIRET conducteur"
              />
              <button type="button" onClick={verifyDriverSiret}>
                Vérifier
              </button>
            </div>

            {form.driverCompanyVerified ? (
              <div className="verifiedBox">
                <BadgeCheck size={24} />
                <div>
                  <strong>Conducteur déclaré</strong>
                  <p>{form.driverLegalName || "Entreprise vérifiée"}</p>
                  <p>{form.driverCompanyAddress}</p>
                  <small>APE : {form.driverApe || "Non renseigné"}</small>
                </div>
              </div>
            ) : (
              <div className="emptyInfo">
                Renseigne ton SIRET pour rassurer les entreprises avant candidature.
              </div>
            )}
          </section>

          <section className="formPanel">
            <PanelTitle icon={FileCheck2} title="Documents" text="Dates de validité professionnelles." />

            <div className="fieldsGrid single">
              <Field label="Validité permis">
                <input
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(event) => updateField("licenseExpiry", event.target.value)}
                />
              </Field>

              <Field label="Validité FCO">
                <input
                  type="date"
                  value={form.fcoExpiry}
                  onChange={(event) => updateField("fcoExpiry", event.target.value)}
                />
              </Field>

              <Field label="Validité RC Pro">
                <input
                  type="date"
                  value={form.rcproExpiry}
                  onChange={(event) => updateField("rcproExpiry", event.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="formPanel wide">
            <PanelTitle icon={ShieldCheck} title="Qualifications" text="Permis, FCO et assurance." />

            <Field label="Permis détenus">
              <ChipGroup
                items={permitOptions}
                selected={form.permits}
                onToggle={(value) => toggleArrayField("permits", value)}
              />
            </Field>

            <div className="fieldsGrid">
              <Field label="FCO à jour ?">
                <select
                  value={form.fcoStatus}
                  onChange={(event) => updateField("fcoStatus", event.target.value)}
                >
                  <option>À jour</option>
                  <option>À renouveler</option>
                  <option>Non renseignée</option>
                </select>
              </Field>

              <Field label="RC Pro">
                <select
                  value={form.rcproStatus}
                  onChange={(event) => updateField("rcproStatus", event.target.value)}
                >
                  <option>Non renseignée</option>
                  <option>Oui</option>
                  <option>Non</option>
                  <option>En cours</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="formPanel wide">
            <PanelTitle icon={CalendarDays} title="Préférences de missions" text="Aide Shiftly à te proposer les bonnes missions." />

            <Field label="Types de missions souhaitées">
              <ChipGroup
                items={missionOptions}
                selected={form.missionTypes}
                onToggle={(value) => toggleArrayField("missionTypes", value)}
              />
            </Field>

            <Field label="Mobilité géographique">
              <ChipGroup
                items={mobilityOptions}
                selected={form.mobilityZones}
                onToggle={(value) => toggleArrayField("mobilityZones", value)}
              />
            </Field>

            <Field label="Disponibilités / commentaires">
              <textarea
                value={form.availability}
                onChange={(event) => updateField("availability", event.target.value)}
                placeholder="Ex : disponible les week-ends, secteur IDF, missions tourisme..."
              />
            </Field>
          </section>
        </div>

        <button className="saveBottom" disabled={saving} onClick={saveProfile}>
          <Save size={18} />
          {saving ? "Enregistrement..." : "Enregistrer mon profil"}
        </button>
      </section>

      <ProfileStyles />
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

function ChipGroup({ items, selected, onToggle }) {
  return (
    <div className="chips">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={selected.includes(item) ? "chip active" : "chip"}
          onClick={() => onToggle(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function ProfileStyles() {
  return (
    <style>{`
      .driverProfilePage {
        min-height: 100svh;
        display: grid;
        grid-template-columns: 320px 1fr;
        background: #f8fafc;
        color: #0f172a;
        font-family: Inter, system-ui, Arial, sans-serif;
      }

      .driverProfilePage button,
      .driverProfilePage input,
      .driverProfilePage select,
      .driverProfilePage textarea {
        font: inherit;
      }

      .driverProfilePage button {
        border: 0;
        cursor: pointer;
      }

      .driverProfilePage button:disabled {
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

      .profileIdentity {
        padding: 24px 0 6px;
      }

      .avatar,
      .loaderMark {
        width: 72px;
        height: 72px;
        display: grid;
        place-items: center;
        border-radius: 22px;
        background: #2563eb;
        color: white;
        font-size: 36px;
        font-weight: 950;
        box-shadow: 0 18px 38px rgba(37, 99, 235, 0.26);
      }

      .profileIdentity span {
        display: inline-flex;
        margin-top: 18px;
        padding: 6px 10px;
        border-radius: 8px;
        background: #2563eb;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      .profileIdentity h1 {
        margin: 16px 0 6px;
        font-size: 34px;
        line-height: 0.95;
        letter-spacing: -0.06em;
      }

      .profileIdentity p {
        margin: 0;
        color: #94a3b8;
      }

      .scoreCard {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 20px;
        border-radius: 24px;
        background: rgba(37, 99, 235, 0.18);
        color: #bfdbfe;
        border: 1px solid rgba(147, 197, 253, 0.16);
      }

      .scoreCard span {
        display: block;
        color: #dbeafe;
        font-size: 13px;
        font-weight: 850;
      }

      .scoreCard strong {
        display: block;
        margin-top: 3px;
        color: white;
        font-size: 42px;
        letter-spacing: -0.06em;
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
        max-width: 760px;
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
      .saveBottom {
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

      .fieldsGrid.single {
        grid-template-columns: 1fr;
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

      input,
      select,
      textarea {
        width: 100%;
        border-radius: 15px;
        border: 1px solid #dbe3ee;
        background: #f8fafc;
        color: #0f172a;
        padding: 14px 15px;
        outline: none;
        box-sizing: border-box;
      }

      input:focus,
      select:focus,
      textarea:focus {
        border-color: #93c5fd;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        background: white;
      }

      textarea {
        min-height: 118px;
        resize: vertical;
      }

      .siretRow {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
      }

      .siretRow button {
        border-radius: 15px;
        padding: 0 16px;
        background: #2563eb;
        color: white;
        font-weight: 950;
      }

      .verifiedBox,
      .emptyInfo {
        margin-top: 14px;
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

      .verifiedBox p,
      .verifiedBox small {
        display: block;
        margin: 4px 0 0;
        color: #166534;
      }

      .emptyInfo {
        background: #f8fafc;
        color: #64748b;
        border: 1px dashed #cbd5e1;
        line-height: 1.5;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .chip {
        width: auto;
        border-radius: 999px;
        border: 1px solid #dbe3ee !important;
        background: white;
        color: #334155;
        padding: 10px 14px;
        font-weight: 850;
      }

      .chip.active {
        border-color: #2563eb !important;
        background: #2563eb;
        color: white;
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

      .loadingCard h2 {
        margin: 0;
        letter-spacing: -0.04em;
      }

      @media (max-width: 1040px) {
        .driverProfilePage {
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
        .summaryList,
        .siretRow {
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
