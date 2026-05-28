import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  MapPin,
  Save,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

const emptyForm = {
  title: "",
  departureAddress: "",
  arrivalAddress: "",
  pickupDepartment: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  vehicle: "",
  passengers: "",
  missionType: "",
  price: "",
  documents: [],
  status: "Ouverte",
  driverName: "Non attribué",
  comment: "",
};

const documentOptions = ["FCO", "Permis D", "Carte conducteur", "RCPRO"];
const missionTypes = [
  "Transport scolaire",
  "Tourisme",
  "Ligne régulière",
  "Navette événementielle",
  "Transfert aéroport",
  "Remplacement urgent",
];
const statusOptions = ["Ouverte", "Pourvue", "Terminée", "Annulée"];

export default function CreateMission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const missionId = searchParams.get("missionId");
  const isEditing = Boolean(missionId);

  const [loading, setLoading] = useState(false);
  const [loadingMission, setLoadingMission] = useState(isEditing);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!missionId) return;

    async function loadMission() {
      setLoadingMission(true);

      const user = await getCurrentUser();
      if (!user) {
        setLoadingMission(false);
        return;
      }

      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .eq("id", missionId)
        .eq("company_id", user.id)
        .single();

      if (error) {
        console.error(error);
        alert("Mission introuvable ou inaccessible");
        navigate("/company");
        return;
      }

      setForm(missionToForm(data));
      setLoadingMission(false);
    }

    loadMission();
  }, [missionId, navigate]);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function toggleValue(field, value) {
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

  async function saveMission(e) {
    e.preventDefault();
    setLoading(true);

    const user = await getCurrentUser();

    if (!user) {
      console.warn("Session absente temporairement");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const payload = {
      title: form.title,
      pickup: form.departureAddress,
      dropoff: form.arrivalAddress,
      pickup_department: form.pickupDepartment || "",
      start_time: buildDateTime(form.startDate, form.startTime),
      end_time: buildDateTime(form.endDate, form.endTime),
      vehicle: form.vehicle,
      passengers: form.passengers,
      mission_type: form.missionType,
      price: form.price,
      documents: form.documents.join(", "),
      required_documents: form.documents,
      required_permits: form.documents.includes("Permis D") ? ["Permis D"] : [],
      matching_score: 0,
      comment: form.comment,
      status: form.status,
      color: statusColor(form.status),
      driver_name: form.driverName || "Non attribué",
      company_id: user.id,
      company_name: profile?.company_name || profile?.full_name || "Entreprise",
      company_verified: profile?.company_verified || false,
    };

    const { error } = isEditing
      ? await supabase
          .from("missions")
          .update(payload)
          .eq("id", missionId)
          .eq("company_id", user.id)
      : await supabase.from("missions").insert([
          {
            ...payload,
            driver_id: null,
          },
        ]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert(isEditing ? "Erreur modification mission" : "Erreur création mission");
      return;
    }

    navigate("/company");
  }

  const routeReady = form.departureAddress || form.arrivalAddress;
  const actionLabel = isEditing ? "Enregistrer les modifications" : "Publier la mission";

  if (loadingMission) {
    return (
      <main className="missionPage loadingPage">
        <div className="loadingCard">Chargement de la mission...</div>
        <MissionStyles />
      </main>
    );
  }

  return (
    <main className="missionPage">
      <aside className="missionSidebar">
        <button className="backButton" onClick={() => navigate("/company")}>
          <ArrowLeft size={18} />
          Retour espace entreprise
        </button>

        <div className="brandBlock">
          <div className="mark">S</div>
          <div className="brandText">
            <strong>Shiftly</strong>
            <span>Marketplace</span>
          </div>
        </div>

        <div className="sideHero">
          <p className="eyebrow">{isEditing ? "Modification" : "Nouvelle mission"}</p>
          <h1>{isEditing ? "Modifier tous les détails de la mission." : "Publier une mission claire et complète."}</h1>
          <span>
            Trajet, horaires, véhicule, documents, permis, statut et consignes :
            tout reste pilotable depuis ce formulaire.
          </span>
        </div>

        <div className="previewCard">
          <div className="previewHeader">
            <span>Aperçu conducteur</span>
            <CheckCircle2 size={19} />
          </div>

          <h2>{form.title || "Titre de la mission"}</h2>

          <div className="previewRoute">
            <MapPin size={18} />
            <p>
              <strong>{form.departureAddress || "Adresse de départ"}</strong>
              <span>{form.arrivalAddress || "Adresse d'arrivée"}</span>
            </p>
          </div>

          <div className="previewGrid">
            <PreviewMetric label="Début" value={formatPreviewDate(form.startDate, form.startTime)} />
            <PreviewMetric label="Statut" value={form.status || "Ouverte"} />
            <PreviewMetric label="Documents" value={`${form.documents.length} requis`} />
            <PreviewMetric label="Prix" value={form.price ? `${form.price} €` : "À définir"} />
          </div>
        </div>
      </aside>

      <section className="missionContent">
        <header className="contentHeader">
          <div>
            <p className="eyebrow">Entreprise</p>
            <h2>{isEditing ? "Modifier la mission" : "Créer une mission"}</h2>
            <span>
              {isEditing
                ? "Mets à jour l'ensemble des informations visibles et opérationnelles."
                : "Renseigne les informations visibles par les conducteurs Shiftly."}
            </span>
          </div>

          <div className="statusPill">
            <ShieldCheck size={18} />
            {form.status || "Ouverte"}
          </div>
        </header>

        <form className="missionForm" onSubmit={saveMission}>
          <FormPanel
            icon={<MapPin size={21} />}
            title="Trajet"
            text="Départ, arrivée, département et type de transport."
          >
            <Field label="Titre mission" className="full">
              <input
                placeholder="Ex : Paris CDG vers Rouen"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </Field>

            <Field label="Adresse de départ">
              <input
                value={form.departureAddress}
                onChange={(e) => updateField("departureAddress", e.target.value)}
                placeholder="Ex : Roissy CDG, Terminal 2E"
                required
              />
            </Field>

            <Field label="Adresse d'arrivée">
              <input
                value={form.arrivalAddress}
                onChange={(e) => updateField("arrivalAddress", e.target.value)}
                placeholder="Ex : Gare routière de Rouen"
                required
              />
            </Field>

            <Field label="Département de départ">
              <input
                value={form.pickupDepartment}
                onChange={(e) => updateField("pickupDepartment", e.target.value)}
                placeholder="Ex : 95"
                maxLength={3}
              />
            </Field>

            <Field label="Type de mission">
              <select
                value={form.missionType}
                onChange={(e) => updateField("missionType", e.target.value)}
              >
                <option value="">Sélectionner</option>
                {missionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
          </FormPanel>

          <FormPanel
            icon={<CalendarDays size={21} />}
            title="Planning"
            text="Créneau complet de prise en charge et de retour."
          >
            <Field label="Début mission">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                required
              />
            </Field>

            <Field label="Heure départ">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                required
              />
            </Field>

            <Field label="Fin mission">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                required
              />
            </Field>

            <Field label="Heure retour">
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                required
              />
            </Field>
          </FormPanel>

          <FormPanel
            icon={<Truck size={21} />}
            title="Exploitation"
            text="Véhicule, capacité, prix, statut et conducteur affiché."
          >
            <Field label="Véhicule">
              <input
                placeholder="Ex : Autocar 53 places"
                value={form.vehicle}
                onChange={(e) => updateField("vehicle", e.target.value)}
              />
            </Field>

            <Field label="Passagers">
              <input
                type="number"
                placeholder="Ex : 53"
                value={form.passengers}
                onChange={(e) => updateField("passengers", e.target.value)}
              />
            </Field>

            <Field label="Prix proposé (€)">
              <input
                inputMode="decimal"
                placeholder="Ex : 650"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
              />
            </Field>

            <Field label="Statut mission">
              <select value={form.status} onChange={(e) => updateField("status", e.target.value)}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Conducteur affiché" className="full">
              <input
                placeholder="Non attribué"
                value={form.driverName}
                onChange={(e) => updateField("driverName", e.target.value)}
              />
            </Field>
          </FormPanel>

          <FormPanel
            icon={<FileText size={21} />}
            title="Documents et consignes"
            text="Justificatifs attendus et informations complémentaires."
          >
            <ChipGroup
              label="Documents requis"
              values={form.documents}
              options={documentOptions}
              onToggle={(value) => toggleValue("documents", value)}
            />

            <Field label="Commentaires" className="full">
              <textarea
                placeholder="Lieu de prise en charge, tenue attendue, contact sur place, consignes particulières..."
                value={form.comment}
                onChange={(e) => updateField("comment", e.target.value)}
              />
            </Field>
          </FormPanel>

          <div className="submitBar">
            <div>
              <strong>{routeReady ? "Mission prête" : "Brouillon à compléter"}</strong>
              <span>
                {isEditing
                  ? "Toutes les modifications seront enregistrées sur la mission existante."
                  : "La mission sera publiée comme ouverte sur la marketplace."}
              </span>
            </div>

            <button type="submit" className="submit" disabled={loading}>
              <Save size={18} />
              {loading ? "Enregistrement..." : actionLabel}
            </button>
          </div>
        </form>
      </section>

      <MissionStyles />
    </main>
  );
}

function FormPanel({ icon, title, text, children }) {
  return (
    <section className="formPanel">
      <div className="panelIntro">
        <span className="panelIcon">{icon}</span>
        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      </div>

      <div className="panelFields">{children}</div>
    </section>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function ChipGroup({ label, values, options, onToggle }) {
  return (
    <div className="documents full">
      <span>{label}</span>
      <div className="documentsGrid">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={values.includes(option) ? "selected" : ""}
            onClick={() => onToggle(option)}
          >
            {values.includes(option) && <CheckCircle2 size={16} />}
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function PreviewMetric({ label, value }) {
  return (
    <div className="previewMetric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function missionToForm(mission) {
  const start = splitDateTime(mission.start_time);
  const end = splitDateTime(mission.end_time);

  return {
    title: mission.title || "",
    departureAddress: mission.pickup || "",
    arrivalAddress: mission.dropoff || "",
    pickupDepartment: mission.pickup_department || "",
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    vehicle: mission.vehicle || "",
    passengers: mission.passengers || "",
    missionType: mission.mission_type || "",
    price: mission.price || "",
    documents: Array.isArray(mission.required_documents)
      ? mission.required_documents
      : splitList(mission.documents),
    status: mission.status || "Ouverte",
    driverName: mission.driver_name || "Non attribué",
    comment: mission.comment || "",
  };
}

function splitDateTime(value) {
  if (!value) return { date: "", time: "" };
  const [date, time = ""] = String(value).split("T");
  return {
    date: date || "",
    time: time.slice(0, 5),
  };
}

function buildDateTime(date, time) {
  return date && time ? `${date}T${time}` : "";
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPreviewDate(date, time) {
  if (!date && !time) return "À compléter";
  return `${date || "--"} ${time || "--"}`;
}

function statusColor(status) {
  if (status === "Pourvue") return "#16a34a";
  if (status === "Terminée") return "#64748b";
  if (status === "Annulée") return "#ef4444";
  return "#2563eb";
}

function MissionStyles() {
  return (
    <style>{`
      .missionPage {
        min-height: 100svh;
        display: grid;
        grid-template-columns: 300px 1fr;
        color: #07152f;
        font-family: Inter, system-ui, Arial, sans-serif;
        background: #f8fafc;
      }

      .missionPage button,
      .missionPage input,
      .missionPage select,
      .missionPage textarea {
        font: inherit;
      }

      .missionSidebar {
        min-height: 100svh;
        display: flex;
        flex-direction: column;
        gap: 26px;
        padding: 28px;
        color: white;
        background: #07152f;
      }

      .backButton,
      .submit {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border: 0;
        cursor: pointer;
        font-weight: 950;
      }

      .backButton {
        width: fit-content;
        min-height: 44px;
        padding: 0 14px;
        border-radius: 999px;
        color: #dbeafe;
        background: rgba(255, 255, 255, 0.08);
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
        font-size: 30px;
        font-weight: 950;
        font-style: italic;
      }

      .brandText {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .brandText strong {
        font-size: 30px;
        font-style: italic;
        letter-spacing: -0.07em;
        line-height: 1;
      }

      .brandText span {
        display: inline-flex;
        padding: 5px 9px;
        border-radius: 7px;
        background: #2563eb;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .sideHero,
      .previewCard,
      .missionForm {
        display: grid;
        gap: 16px;
      }

      .eyebrow {
        margin: 0;
        color: #2563eb;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .missionSidebar .eyebrow {
        color: #93c5fd;
      }

      .sideHero h1,
      .contentHeader h2,
      .previewCard h2,
      .panelIntro h3,
      .submitBar strong {
        margin: 0;
        letter-spacing: -0.055em;
      }

      .sideHero h1 {
        font-size: 38px;
        line-height: 0.98;
      }

      .sideHero span {
        color: #bfd2f5;
        line-height: 1.65;
      }

      .previewCard {
        margin-top: auto;
        padding: 18px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.08);
      }

      .previewHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #bfdbfe;
        font-size: 13px;
        font-weight: 900;
      }

      .previewCard h2 {
        color: white;
        font-size: 23px;
      }

      .previewRoute {
        display: flex;
        gap: 12px;
        padding: 13px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.09);
      }

      .previewRoute p {
        display: grid;
        gap: 4px;
        margin: 0;
      }

      .previewRoute span {
        color: #bfd2f5;
        font-size: 13px;
      }

      .previewGrid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .previewMetric {
        padding: 12px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.1);
      }

      .previewMetric span {
        display: block;
        color: #93c5fd;
        font-size: 11px;
        font-weight: 950;
        text-transform: uppercase;
      }

      .previewMetric strong {
        display: block;
        margin-top: 5px;
        color: white;
        font-size: 13px;
      }

      .missionContent {
        padding: 30px;
      }

      .contentHeader {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }

      .contentHeader h2 {
        margin-top: 8px;
        font-size: clamp(34px, 5vw, 54px);
        line-height: 1;
      }

      .contentHeader span {
        display: block;
        margin-top: 10px;
        color: #64748b;
      }

      .statusPill {
        height: 44px;
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 0 14px;
        border: 1px solid #dbeafe;
        border-radius: 999px;
        color: #1d4ed8;
        background: white;
        font-size: 13px;
        font-weight: 950;
      }

      .formPanel {
        display: grid;
        grid-template-columns: 230px 1fr;
        gap: 22px;
        padding: 22px;
        border: 1px solid #dbe3ee;
        border-radius: 26px;
        background: white;
        box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06);
      }

      .panelIntro {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .panelIcon {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 15px;
        color: #2563eb;
        background: #dbeafe;
      }

      .panelIntro h3 {
        font-size: 22px;
      }

      .panelIntro p {
        margin: 0;
        color: #64748b;
        font-size: 14px;
        line-height: 1.55;
      }

      .panelFields {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 15px;
      }

      .field,
      .documents {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .field span,
      .documents > span {
        color: #334155;
        font-size: 13px;
        font-weight: 950;
      }

      .full {
        grid-column: 1 / -1;
      }

      input,
      select,
      textarea {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #dbe3ee;
        border-radius: 16px;
        outline: none;
        color: #07152f;
        background: #f8fafc;
        font-size: 15px;
      }

      input,
      select {
        height: 52px;
        padding: 0 14px;
      }

      textarea {
        min-height: 116px;
        resize: vertical;
        padding: 14px;
        line-height: 1.5;
      }

      input:focus,
      select:focus,
      textarea:focus {
        border-color: #2563eb;
        background: white;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
      }

      .documentsGrid {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .documentsGrid button {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0 14px;
        border: 1px solid #dbe3ee;
        border-radius: 999px;
        color: #334155;
        background: #f8fafc;
        cursor: pointer;
        font-weight: 950;
      }

      .documentsGrid button.selected {
        color: white;
        border-color: #2563eb;
        background: #2563eb;
      }

      .submitBar {
        position: sticky;
        bottom: 16px;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 16px;
        border: 1px solid #dbe3ee;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
        backdrop-filter: blur(14px);
      }

      .submitBar strong {
        display: block;
        font-size: 15px;
      }

      .submitBar span {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: 13px;
      }

      .submit {
        min-height: 52px;
        padding: 0 22px;
        border-radius: 999px;
        color: white;
        background: #2563eb;
      }

      .submit:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .loadingPage {
        display: grid;
        place-items: center;
      }

      .loadingCard {
        padding: 22px 26px;
        border-radius: 22px;
        background: white;
        box-shadow: 0 16px 48px rgba(15, 23, 42, 0.08);
        font-weight: 950;
      }

      @media (max-width: 1040px) {
        .missionPage {
          grid-template-columns: 1fr;
        }

        .missionSidebar {
          min-height: auto;
        }

        .previewCard {
          margin-top: 0;
        }
      }

      @media (max-width: 760px) {
        .missionSidebar,
        .missionContent {
          padding: 18px;
        }

        .contentHeader,
        .submitBar {
          flex-direction: column;
          align-items: stretch;
        }

        .statusPill,
        .submit {
          width: 100%;
        }

        .formPanel {
          grid-template-columns: 1fr;
          padding: 18px;
        }

        .panelFields,
        .previewGrid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}
