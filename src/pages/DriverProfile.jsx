import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function DriverProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

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

  const [form, setForm] = useState({
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
  });

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);

        const {
  data: { user },
} = await supabase.auth.getUser();

        if (!user) {
          if (mounted) setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(error);
          if (mounted) setLoading(false);
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
            mobilityZones: data.mobility_zones || [],
            missionTypes: data.mission_types || [],
            availability: data.availability || "",
            shiftScore: data.shift_score || 92,

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
    const user = await getCurrentUser();

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

    setSuccessMessage("Profil mis à jour ✅");

    setTimeout(() => {
      navigate("/driver");
    }, 1200);
  }

  if (loading) {
    return (
      <main className="page">
        <div className="card">
          <h2>Chargement du profil...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="card">
        <button className="back" onClick={() => navigate("/driver")}>
          ← Retour dashboard
        </button>

        <p className="eyebrow">Conducteur</p>

        <h1>Mon profil</h1>

        <p className="subtitle">
          Gérez vos informations conducteur, vos documents et vos préférences de
          mission.
        </p>

        <div className="score">⭐ ShiftScore {form.shiftScore}</div>

        {successMessage && <div className="success">{successMessage}</div>}

        <div className="verification-box full">
          <h2>Vérification conducteur indépendant</h2>

          <p>
            Vérifiez votre SIRET et renseignez les dates de validité de vos
            documents professionnels.
          </p>

          <div className="grid">
            <input
              placeholder="SIRET conducteur"
              value={form.driverSiret}
              onChange={(e) => updateField("driverSiret", e.target.value)}
            />

            <button
              type="button"
              className="verify"
              onClick={verifyDriverSiret}
            >
              Vérifier le SIRET
            </button>

            {form.driverCompanyVerified && (
              <div className="verified-driver full">
                <div className="verified-icon">✓</div>

                <div>
                  <strong>Conducteur déclaré</strong>
                  <p>{form.driverLegalName}</p>
                  <p>{form.driverCompanyAddress}</p>
                  <p>APE : {form.driverApe}</p>
                </div>
              </div>
            )}

            <div className="field">
              <label>Validité permis</label>
              <input
                type="date"
                value={form.licenseExpiry}
                onChange={(e) => updateField("licenseExpiry", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Validité FCO</label>
              <input
                type="date"
                value={form.fcoExpiry}
                onChange={(e) => updateField("fcoExpiry", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Validité RC Pro</label>
              <input
                type="date"
                value={form.rcproExpiry}
                onChange={(e) => updateField("rcproExpiry", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid">
          <input
            placeholder="Nom complet"
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
          />

          <input
            placeholder="Ville"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
          />

          <input
            placeholder="Téléphone"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />

          <input
            placeholder="Expérience ex : 8 ans"
            value={form.experience}
            onChange={(e) => updateField("experience", e.target.value)}
          />

          <div className="field full">
            <label>Permis détenus</label>

            <div className="chips">
              {permitOptions.map((permit) => (
                <button
                  key={permit}
                  type="button"
                  className={
                    form.permits.includes(permit) ? "chip active" : "chip"
                  }
                  onClick={() => toggleArrayField("permits", permit)}
                >
                  {permit}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>FCO à jour ?</label>

            <select
              value={form.fcoStatus}
              onChange={(e) => updateField("fcoStatus", e.target.value)}
            >
              <option>À jour</option>
              <option>À renouveler</option>
              <option>Non renseignée</option>
            </select>
          </div>

          <div className="field">
            <label>RC Pro</label>

            <select
              value={form.rcproStatus}
              onChange={(e) => updateField("rcproStatus", e.target.value)}
            >
              <option>Non renseignée</option>
              <option>Oui</option>
              <option>Non</option>
              <option>En cours</option>
            </select>
          </div>

          <div className="field full">
            <label>Types de missions souhaitées</label>

            <div className="chips">
              {missionOptions.map((mission) => (
                <button
                  key={mission}
                  type="button"
                  className={
                    form.missionTypes.includes(mission)
                      ? "chip active"
                      : "chip"
                  }
                  onClick={() => toggleArrayField("missionTypes", mission)}
                >
                  {mission}
                </button>
              ))}
            </div>
          </div>

          <div className="field full">
            <label>Mobilité géographique</label>

            <div className="chips">
              {mobilityOptions.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  className={
                    form.mobilityZones.includes(zone) ? "chip active" : "chip"
                  }
                  onClick={() => toggleArrayField("mobilityZones", zone)}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="full"
            placeholder="Disponibilités / commentaires"
            value={form.availability}
            onChange={(e) => updateField("availability", e.target.value)}
          />
        </div>

        <button className="save" onClick={saveProfile}>
          Enregistrer mon profil
        </button>
      </div>

      <style>{`
        .page {
          min-height: 100svh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          color: white;
          font-family: Inter, Arial, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,0.1), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56,189,248,0.1), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%);
        }

        .card {
          width: 100%;
          max-width: 860px;
          padding: 32px;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 30px 80px rgba(0,0,0,0.28);
        }

        .success {
          margin-bottom: 20px;
          padding: 14px 18px;
          border-radius: 16px;
          background: rgba(22,163,74,0.18);
          border: 1px solid rgba(22,163,74,0.3);
          color: #bbf7d0;
          font-weight: 800;
        }

        .back {
          margin-bottom: 20px;
          border: none;
          background: rgba(255,255,255,0.08);
          color: white;
          padding: 12px 16px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 800;
        }

        .eyebrow {
          color: #94a3b8;
          margin: 0 0 8px;
        }

        h1 {
          margin: 0;
          font-size: 42px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .subtitle {
          color: #cbd5e1;
          margin: 14px 0 22px;
          line-height: 1.5;
        }

        .score {
          display: inline-flex;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(37,99,235,0.18);
          color: #bfdbfe;
          font-weight: 900;
          margin-bottom: 22px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .field label {
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 800;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 15px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(15,23,42,0.9);
          color: white;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
        }

        textarea {
          min-height: 110px;
          resize: vertical;
        }

        .full {
          grid-column: 1 / -1;
        }

        .verification-box {
          margin: 24px 0;
          padding: 20px;
          border-radius: 24px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .verification-box h2 {
          margin: 0 0 8px;
        }

        .verification-box p {
          color: #cbd5e1;
          margin: 0 0 18px;
        }

        .verify {
          border: none;
          border-radius: 999px;
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 900;
          cursor: pointer;
          padding: 14px;
        }

        .verified-driver {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px;
          border-radius: 22px;
          background: linear-gradient(
            180deg,
            rgba(22,163,74,.18),
            rgba(22,163,74,.08)
          );
          border: 1px solid rgba(34,197,94,.22);
        }

        .verified-icon {
          width: 54px;
          height: 54px;
          border-radius: 999px;
          background: rgba(34,197,94,.2);
          color: #86efac;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .verified-driver strong {
          color: white;
        }

        .verified-driver p {
          margin: 4px 0 0;
          color: #bbf7d0;
          font-size: 13px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chip {
          width: auto;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.06);
          color: #cbd5e1;
          padding: 11px 14px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 800;
        }

        .chip.active {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          border: none;
          color: white;
        }

        .save {
          width: 100%;
          margin-top: 22px;
          padding: 16px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 900;
          font-size: 16px;
          cursor: pointer;
        }

        @media (max-width: 700px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .card {
            padding: 24px;
          }

          h1 {
            font-size: 34px;
          }
        }
      `}</style>
    </main>
  );
}