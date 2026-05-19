import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateMission() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    pickup: "",
    dropoff: "",
    missionType: "Transfert",
    departureDate: "",
    departureTime: "",
    returnDate: "",
    returnTime: "",
    vehicle: "Autocar",
    passengers: "",
    price: "",
    documents: ["Permis D", "FIMO"],
    comment: "",
  });

  const vehicles = ["Autocar", "Minicar", "Van"];
  const documents = ["Permis D", "FIMO", "Carte conducteur", "Visite médicale", "ADR"];

  function updateField(field, value) {
    const updatedForm = { ...form, [field]: value };

    const suggestedPrice = calculateSuggestedPrice(updatedForm);

    setForm({
      ...updatedForm,
      price: suggestedPrice ? `${suggestedPrice} € net` : "",
    });
  }

  function calculateSuggestedPrice(data) {
    if (!data.departureDate) return "";

    if (data.missionType === "Transfert") {
      return data.returnDate ? 500 : 250;
    }

    if (data.missionType === "Séjour") {
      if (!data.returnDate) return 250;

      const start = new Date(data.departureDate);
      const end = new Date(data.returnDate);

      const diffTime = end - start;
      const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

      if (days >= 3) {
        return days * 200;
      }

      return days * 250;
    }

    return "";
  }

  function toggleDocument(doc) {
    const selected = form.documents.includes(doc);

    setForm({
      ...form,
      documents: selected
        ? form.documents.filter((item) => item !== doc)
        : [...form.documents, doc],
    });
  }

  function publishMission() {
    const newMission = {
      id: Date.now(),
      title: `${form.pickup} → ${form.dropoff}`,
      status: "Ouverte",
      start: `${form.departureDate}T${form.departureTime || "00:00"}:00`,
      end: `${form.returnDate || form.departureDate}T${form.returnTime || "23:59"}:00`,
      color: "#2563eb",
      pickup: form.pickup,
      dropoff: form.dropoff,
      driver: "Non attribué",
      vehicle: form.vehicle,
      type: form.missionType,
      passengers: `${form.passengers} passagers`,
      price: form.price,
      documents: form.documents.join(" + "),
      comment: form.comment,
    };

    const existingMissions = JSON.parse(
      localStorage.getItem("shiftlyMissions") || "[]"
    );

    localStorage.setItem(
      "shiftlyMissions",
      JSON.stringify([...existingMissions, newMission])
    );

    navigate("/company");
  }

  return (
    <main className="page">
      <div className="card">
        <p className="eyebrow">Entreprise</p>

        <h1>Créer une mission</h1>

        <p className="subtitle">
          Renseignez les informations principales de la mission.
        </p>

        <div className="grid">
          <input
            placeholder="Lieu de départ"
            value={form.pickup}
            onChange={(e) => updateField("pickup", e.target.value)}
          />

          <input
            placeholder="Lieu d’arrivée"
            value={form.dropoff}
            onChange={(e) => updateField("dropoff", e.target.value)}
          />

          <div className="field full">
            <label>Type de mission</label>

            <div className="vehicle-grid">
              <button
                type="button"
                className={form.missionType === "Transfert" ? "vehicle active" : "vehicle"}
                onClick={() => updateField("missionType", "Transfert")}
              >
                Transfert
              </button>

              <button
                type="button"
                className={form.missionType === "Séjour" ? "vehicle active" : "vehicle"}
                onClick={() => updateField("missionType", "Séjour")}
              >
                Séjour
              </button>
            </div>
          </div>

          <div className="field">
            <label>Date de départ</label>
            <input
              type="date"
              value={form.departureDate}
              onChange={(e) => updateField("departureDate", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Heure de départ</label>
            <input
              type="time"
              value={form.departureTime}
              onChange={(e) => updateField("departureTime", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Date de retour</label>
            <input
              type="date"
              value={form.returnDate}
              onChange={(e) => updateField("returnDate", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Heure de retour</label>
            <input
              type="time"
              value={form.returnTime}
              onChange={(e) => updateField("returnTime", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Type de véhicule</label>

            <div className="vehicle-grid">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle}
                  type="button"
                  className={form.vehicle === vehicle ? "vehicle active" : "vehicle"}
                  onClick={() => updateField("vehicle", vehicle)}
                >
                  {vehicle}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Nombre de passagers</label>
            <input
              placeholder="Ex : 48"
              value={form.passengers}
              onChange={(e) => updateField("passengers", e.target.value)}
            />
          </div>

          <div className="suggestion full">
            <span>Prix suggéré conducteur</span>
            <strong>{form.price || "Renseignez les dates"}</strong>
          </div>

          <div className="field full">
            <label>Prix proposé</label>
            <input
              placeholder="Ex : 250 € net"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
            />
          </div>

          <div className="field full">
  <label>Commentaire / consignes particulières</label>

  <textarea
    placeholder="Ex : tenue demandée, contact sur place, particularités client..."
    value={form.comment}
    onChange={(e) => updateField("comment", e.target.value)}
  />
</div>

          <div className="field full">
            <label>Documents requis</label>

            <div className="docs-grid">
              {documents.map((doc) => (
                <button
                  key={doc}
                  type="button"
                  className={form.documents.includes(doc) ? "doc active" : "doc"}
                  onClick={() => toggleDocument(doc)}
                >
                  {doc}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="actions">
          <button className="cancel" onClick={() => navigate("/company")}>
            Annuler
          </button>

          <button className="submit" onClick={publishMission}>
            Publier la mission
          </button>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100svh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          color: white;
          font-family: Inter, Arial, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,0.08), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56,189,248,0.08), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%);
        }

        .card {
          width: 100%;
          max-width: 820px;
          padding: 32px;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 30px 80px rgba(0,0,0,0.28);
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
          margin: 14px 0 28px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field label {
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 700;
        }

        input,
textarea {

          width: 100%;
          padding: 15px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(15,23,42,0.9);
          color: white;
          font-size: 15px;
          outline: none;
        }

        .vehicle-grid,
        .docs-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .vehicle,
        .doc {
          width: auto;
          margin: 0;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: white;
          cursor: pointer;
          font-weight: 700;
        }

        .vehicle.active,
        .doc.active {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          border: none;
        }

        .suggestion {
          background: rgba(37,99,235,0.16);
          border: 1px solid rgba(37,99,235,0.28);
          border-radius: 18px;
          padding: 16px;
        }

        .suggestion span {
          display: block;
          color: #bfdbfe;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .suggestion strong {
          font-size: 26px;
          font-weight: 950;
        }

        .full {
          grid-column: 1 / -1;
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .cancel,
        .submit {
          flex: 1;
          padding: 16px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 16px;
          cursor: pointer;
        }

        .cancel {
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          color: white;
        }

        .submit {
          border: none;
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
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

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}