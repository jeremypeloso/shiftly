import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function CompanyProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

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
    const currentUser =
      await getCurrentUser();

    if (!currentUser) return;

    setUser(currentUser);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (data) {
      setProfile(data);
    }
  }

  async function verifySiret() {
    if (!profile.siret) {
      alert("Entre un SIRET");
      return;
    }

    const { data, error } =
      await supabase.functions.invoke(
        "verify-siret",
        {
          body: {
            siret:
              profile.siret.replace(
                /\D/g,
                ""
              ),
          },
        }
      );

    if (error) {
      console.error(
        "Erreur function verify-siret :",
        error
      );

      alert(
        "Erreur vérification SIRET"
      );

      return;
    }

    if (
      data?.header?.statut !== 200
    ) {
      alert("SIRET introuvable");
      return;
    }

    const etab =
      data.etablissement;

    const legal =
      etab.uniteLegale;

    const adresse =
      etab.adresseEtablissement;

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

      company_verified: true,

      company_name:
        legal.denominationUniteLegale,

      company_legal_name:
        legal.denominationUniteLegale,

      company_address:
        fullAddress,

      company_ape:
        legal.activitePrincipaleUniteLegale,
    };

    const {
      error: updateError,
    } = await supabase
      .from("profiles")
      .update(updatedProfile)
      .eq("id", user.id);

    if (updateError) {
      console.error(updateError);

      alert(
        "Erreur mise à jour profil"
      );

      return;
    }

    setProfile(updatedProfile);
  }

  return (
    <div className="company-profile">
      <div className="card">

        <button
          className="back-btn"
          onClick={() =>
            navigate("/company")
          }
        >
          ← Retour dashboard
        </button>

        <h1>
          Profil entreprise
        </h1>

        <div className="field">
          <label>Société</label>

          <input
            value={
              profile.company_name || ""
            }
            onChange={(e) =>
              setProfile({
                ...profile,
                company_name:
                  e.target.value,
              })
            }
          />
        </div>

        <div className="field">
          <label>SIRET</label>

          <input
            value={
              profile.siret || ""
            }
            onChange={(e) =>
              setProfile({
                ...profile,
                siret:
                  e.target.value,
              })
            }
          />
        </div>

        <button
          className="verify-btn"
          onClick={verifySiret}
        >
          Vérifier le SIRET
        </button>

        {profile.company_verified && (
          <div className="verified-card">

            <div className="verified-icon">
              ✓
            </div>

            <div>
              <strong>
                Entreprise vérifiée
              </strong>

              <p>
                Société validée
                automatiquement via
                la base INSEE.
              </p>
            </div>

          </div>
        )}

        <div className="info">
          <strong>
            Raison sociale :
          </strong>

          <p>
            {
              profile.company_legal_name
            }
          </p>
        </div>

        <div className="info">
          <strong>Adresse :</strong>

          <p>
            {
              profile.company_address
            }
          </p>
        </div>

        <div className="info">
          <strong>Code APE :</strong>

          <p>
            {profile.company_ape}
          </p>
        </div>
      </div>

      <style>{`
        .company-profile {
          min-height: 100svh;

          padding: 40px;

          background:
            linear-gradient(
              135deg,
              #0f172a,
              #111827
            );

          color: white;

          font-family:
            Inter,
            sans-serif;
        }

        .card {
          max-width: 700px;

          margin: auto;

          padding: 28px;

          border-radius: 28px;

          background:
            rgba(255,255,255,0.06);

          border:
            1px solid
            rgba(255,255,255,0.08);
        }

        h1 {
          margin-top: 0;
          margin-bottom: 28px;
        }

        .back-btn {
          margin-bottom: 22px;

          padding: 12px 18px;

          border: none;

          border-radius: 999px;

          background:
            rgba(255,255,255,0.08);

          color: white;

          font-weight: 800;

          cursor: pointer;

          transition: 0.2s;
        }

        .back-btn:hover {
          background:
            rgba(255,255,255,0.12);
        }

        .field {
          margin-bottom: 18px;
        }

        label {
          display: block;

          margin-bottom: 8px;

          color: #94a3b8;
        }

        input {
          width: 100%;

          padding: 14px;

          border-radius: 14px;

          border:
            1px solid
            rgba(255,255,255,0.08);

          background:
            rgba(15,23,42,.9);

          color: white;

          font-size: 15px;
        }

        .verify-btn {
          width: 100%;

          margin-top: 10px;

          padding: 14px;

          border: none;

          border-radius: 999px;

          background:
            linear-gradient(
              180deg,
              #2563eb,
              #1d4ed8
            );

          color: white;

          font-weight: 900;

          cursor: pointer;
        }

        .verified-card {
          display: flex;
          align-items: center;
          gap: 16px;

          margin-top: 22px;

          padding: 18px;

          border-radius: 22px;

          background:
            linear-gradient(
              180deg,
              rgba(22,163,74,.18),
              rgba(22,163,74,.08)
            );

          border:
            1px solid
            rgba(34,197,94,.22);
        }

        .verified-icon {
          width: 54px;
          height: 54px;

          border-radius: 999px;

          background:
            rgba(34,197,94,.2);

          color: #86efac;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 26px;
          font-weight: 900;

          flex-shrink: 0;
        }

        .verified-card strong {
          display: block;

          font-size: 17px;

          color: white;
        }

        .verified-card p {
          margin: 6px 0 0;

          color: #bbf7d0;

          font-size: 14px;

          line-height: 1.4;
        }

        .info {
          margin-top: 22px;
        }

        .info strong {
          color: #94a3b8;
        }

        @media (max-width: 900px) {
          .company-profile {
            padding: 18px;
          }

          .card {
            padding: 20px;
            border-radius: 22px;
          }
        }
      `}</style>
    </div>
  );
}