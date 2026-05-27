import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

export default function CreateMission() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    pickup: "",
    dropoff: "",
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
    comment: "",
  });

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function toggleDocument(doc) {
    if (form.documents.includes(doc)) {
      updateField(
        "documents",
        form.documents.filter((d) => d !== doc)
      );
    } else {
      updateField("documents", [
        ...form.documents,
        doc,
      ]);
    }
  }

  async function createMission(e) {
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

    const start = `${form.startDate}T${form.startTime}`;
    const end = `${form.endDate}T${form.endTime}`;

    const title = form.title;

    const { error } = await supabase
      .from("missions")
      .insert([
        {
          title,
          pickup: form.pickup,
          dropoff: form.dropoff,

          pickup_department:
            form.pickupDepartment || "",

          start_time: start,
          end_time: end,

          vehicle: form.vehicle,
          passengers: form.passengers,

          mission_type:
            form.missionType,

          price: form.price,

          documents:
            form.documents.join(", "),

          required_documents:
            form.documents,

          required_permits: [
            "Permis D",
          ],

          matching_score: 0,

          comment: form.comment,

          status: "Ouverte",

          color: "#2563eb",

          driver_name:
            "Non attribué",

          driver_id: null,

          company_id: user.id,

          company_name:
            profile?.company_name ||
            profile?.full_name ||
            "Entreprise",

            company_verified:
  profile.company_verified || false,
        },
      ]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert(
        "Erreur création mission"
      );
      return;
    }

    navigate("/company");
  }

  return (
    <main className="page">
      <div className="card">
        <div className="top">
          <button
            className="back"
            onClick={() =>
              navigate("/company")
            }
          >
            ← Retour
          </button>

          <div>
            <p className="eyebrow">
              Entreprise
            </p>

            <h1>
              Créer une mission
            </h1>
          </div>
        </div>

        <form onSubmit={createMission}>
          <div className="grid">

  <div className="field full">
    <label>Titre mission</label>

    <input
      placeholder="Ex : Séjour scolaire"
      value={form.title}
      onChange={(e) =>
        updateField("title", e.target.value)
      }
      required
    />
  </div>

  <div className="field">
  <label>
    Adresse de départ
  </label>

  <input
    type="text"
    value={form.departureAddress}
    onChange={(e) =>
      updateField(
        "departureAddress",
        e.target.value
      )
    }
    placeholder="Adresse de départ"
    required
  />
</div>

<div className="field">
  <label>
    Adresse d'arrivée
  </label>

  <input
    type="text"
    value={form.arrivalAddress}
    onChange={(e) =>
      updateField(
        "arrivalAddress",
        e.target.value
      )
    }
    placeholder="Adresse d'arrivée"
    required
  />
</div>

  <div className="field">
  <label>
    Début mission
  </label>

  <input
    className="same-input"
    type="date"
    value={form.startDate}
    onChange={(e) =>
      updateField(
        "startDate",
        e.target.value
      )
    }
    required
  />
</div>

<div className="field">
  <label>
    Heure départ
  </label>

  <input
    className="same-input"
    type="time"
    value={form.startTime}
    onChange={(e) =>
      updateField(
        "startTime",
        e.target.value
      )
    }
    required
  />
</div>

<div className="field">
  <label>
    Fin mission
  </label>

  <input
    className="same-input"
    type="date"
    value={form.endDate}
    onChange={(e) =>
      updateField(
        "endDate",
        e.target.value
      )
    }
    required
  />
</div>

<div className="field">
  <label>
    Heure retour
  </label>

  <input
    className="same-input"
    type="time"
    value={form.endTime}
    onChange={(e) =>
      updateField(
        "endTime",
        e.target.value
      )
    }
    required
  />
</div>

            <div className="field">
              <label>
                Véhicule
              </label>

              <input
                placeholder="Ex : Autocar GT"
                value={form.vehicle}
                onChange={(e) =>
                  updateField(
                    "vehicle",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                Passagers
              </label>

              <input
                type="number"
                placeholder="Ex : 53"
                value={
                  form.passengers
                }
                onChange={(e) =>
                  updateField(
                    "passengers",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                Prix proposé (€)
              </label>

              <input
                placeholder="Ex : 650"
                value={form.price}
                onChange={(e) =>
                  updateField(
                    "price",
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="documents">
            <label>
              Documents requis
            </label>

            <div className="documents-grid">
              {[
                "FCO",
                "Permis D",
                "Carte conducteur",
                "RCPRO",
              ].map((doc) => (
                <button
                  type="button"
                  key={doc}
                  className={
                    form.documents.includes(
                      doc
                    )
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    toggleDocument(doc)
                  }
                >
                  {doc}
                </button>
              ))}
            </div>
          </div>

          <div className="field full">
            <label>
              Commentaires
            </label>

            <textarea
              placeholder="Informations complémentaires..."
              value={form.comment}
              onChange={(e) =>
                updateField(
                  "comment",
                  e.target.value
                )
              }
            />
          </div>

          <button
            type="submit"
            className="submit"
            disabled={loading}
          >
            {loading
              ? "Création..."
              : "Publier la mission"}
          </button>
        </form>
      </div>

      <style>{`
        .page {
          min-height: 100svh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          color: white;
          font-family:
            Inter,
            Arial,
            sans-serif;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,0.1), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56,189,248,0.1), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%);
        }

        .card {
          width: 100%;
          max-width: 1100px;
          padding: 32px;
          border-radius: 28px;
          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.12),
              rgba(255,255,255,0.05)
            );

          border:
            1px solid rgba(255,255,255,0.1);

          box-shadow:
            0 30px 80px rgba(0,0,0,0.28);
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 30px;
        }

        .back {
          border: none;
          background:
            rgba(255,255,255,.08);

          color: white;
          padding: 12px 16px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 800;
        }

        .eyebrow {
          margin: 0;
          color: #94a3b8;
        }

        h1 {
          margin: 8px 0 0;
          font-size: 42px;
          font-weight: 950;
          letter-spacing: -.05em;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);

          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        label {
          font-weight: 700;
          color: #e2e8f0;
        }

        input,
select,
textarea {
  width: 100%;
  height: 52px;
  box-sizing: border-box;

  padding: 14px;

  border-radius: 16px;

  border:
    1px solid rgba(255,255,255,.08);

  background:
    rgba(15,23,42,.9);

  color: white;
  font-size: 15px;
  outline: none;
}

input[type="date"],
input[type="time"],
input[type="number"] {
  appearance: none;
  -webkit-appearance: none;
  height: 52px;
  min-height: 52px;
  line-height: 52px;
}

.same-input {
  height: 54px !important;
  min-height: 54px !important;
  padding: 14px !important;
  box-sizing: border-box !important;
}

textarea {
  min-height: 120px;
  height: auto;
}

        .documents {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .documents-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .documents-grid button {
          padding: 12px 16px;
          border-radius: 999px;

          border:
            1px solid rgba(255,255,255,.1);

          background:
            rgba(255,255,255,.06);

          color: white;
          cursor: pointer;
          font-weight: 700;
        }

        .documents-grid .selected {
          background:
            linear-gradient(
              180deg,
              #2563eb,
              #1d4ed8
            );

          border: none;
        }

        .submit {
          width: 100%;
          padding: 18px;
          border-radius: 999px;
          border: none;

          background:
            linear-gradient(
              180deg,
              #16a34a,
              #15803d
            );

          color: white;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .submit:disabled {
          opacity: .7;
          cursor: not-allowed;
        }

        .full {
          grid-column: 1 / -1;
        }

        @media (max-width: 900px) {
          .page {
            padding: 16px 12px 40px;
          }

          input,
select {
  height: 52px;
  min-height: 52px;
}

          .card {
            padding: 22px;
            border-radius: 22px;
          }

          .top {
            flex-direction: column;
          }

          h1 {
            font-size: 34px;
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}