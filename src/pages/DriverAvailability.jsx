import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";

const departmentOptions = [
  "01 - Ain",
  "02 - Aisne",
  "03 - Allier",
  "04 - Alpes-de-Haute-Provence",
  "05 - Hautes-Alpes",
  "06 - Alpes-Maritimes",
  "07 - Ardèche",
  "08 - Ardennes",
  "09 - Ariège",
  "10 - Aube",
  "11 - Aude",
  "12 - Aveyron",
  "13 - Bouches-du-Rhône",
  "14 - Calvados",
  "15 - Cantal",
  "16 - Charente",
  "17 - Charente-Maritime",
  "18 - Cher",
  "19 - Corrèze",
  "2A - Corse-du-Sud",
  "2B - Haute-Corse",
  "21 - Côte-d'Or",
  "22 - Côtes-d'Armor",
  "23 - Creuse",
  "24 - Dordogne",
  "25 - Doubs",
  "26 - Drôme",
  "27 - Eure",
  "28 - Eure-et-Loir",
  "29 - Finistère",
  "30 - Gard",
  "31 - Haute-Garonne",
  "32 - Gers",
  "33 - Gironde",
  "34 - Hérault",
  "35 - Ille-et-Vilaine",
  "36 - Indre",
  "37 - Indre-et-Loire",
  "38 - Isère",
  "39 - Jura",
  "40 - Landes",
  "41 - Loir-et-Cher",
  "42 - Loire",
  "43 - Haute-Loire",
  "44 - Loire-Atlantique",
  "45 - Loiret",
  "46 - Lot",
  "47 - Lot-et-Garonne",
  "48 - Lozère",
  "49 - Maine-et-Loire",
  "50 - Manche",
  "51 - Marne",
  "52 - Haute-Marne",
  "53 - Mayenne",
  "54 - Meurthe-et-Moselle",
  "55 - Meuse",
  "56 - Morbihan",
  "57 - Moselle",
  "58 - Nièvre",
  "59 - Nord",
  "60 - Oise",
  "61 - Orne",
  "62 - Pas-de-Calais",
  "63 - Puy-de-Dôme",
  "64 - Pyrénées-Atlantiques",
  "65 - Hautes-Pyrénées",
  "66 - Pyrénées-Orientales",
  "67 - Bas-Rhin",
  "68 - Haut-Rhin",
  "69 - Rhône",
  "70 - Haute-Saône",
  "71 - Saône-et-Loire",
  "72 - Sarthe",
  "73 - Savoie",
  "74 - Haute-Savoie",
  "75 - Paris",
  "76 - Seine-Maritime",
  "77 - Seine-et-Marne",
  "78 - Yvelines",
  "79 - Deux-Sèvres",
  "80 - Somme",
  "81 - Tarn",
  "82 - Tarn-et-Garonne",
  "83 - Var",
  "84 - Vaucluse",
  "85 - Vendée",
  "86 - Vienne",
  "87 - Haute-Vienne",
  "88 - Vosges",
  "89 - Yonne",
  "90 - Territoire de Belfort",
  "91 - Essonne",
  "92 - Hauts-de-Seine",
  "93 - Seine-Saint-Denis",
  "94 - Val-de-Marne",
  "95 - Val-d'Oise",
  "971 - Guadeloupe",
  "972 - Martinique",
  "973 - Guyane",
  "974 - La Réunion",
  "976 - Mayotte",
  "France entière",
  "Europe",
];

export default function DriverAvailability() {
  const navigate = useNavigate();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [departmentToAdd, setDepartmentToAdd] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    const user = await getCurrentUser();

    if (!user) {
  console.warn("Session absente temporairement");
  return;
}

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setAvailableDates(data?.availability_days || []);
    setSelectedDepartments(data?.preferred_departments || []);
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getMonthDays() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }

  function toggleDate(date) {
    const formatted = formatDate(date);

    setAvailableDates((prev) =>
      prev.includes(formatted)
        ? prev.filter((item) => item !== formatted)
        : [...prev, formatted]
    );
  }

  function changeMonth(direction) {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + direction,
        1
      )
    );
  }

  function addDepartment() {
    if (!departmentToAdd) return;

    if (!selectedDepartments.includes(departmentToAdd)) {
      setSelectedDepartments([...selectedDepartments, departmentToAdd]);
    }

    setDepartmentToAdd("");
  }

  function removeDepartment(dep) {
    setSelectedDepartments(
      selectedDepartments.filter((item) => item !== dep)
    );
  }

  async function saveAvailability() {
    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        availability_days: availableDates,
        preferred_departments: selectedDepartments,
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Erreur sauvegarde");
      return;
    }

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
      navigate("/driver");
    }, 1200);
  }

  const monthLabel = currentMonth.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <main className="page">
      <div className="card">
        <button className="back" onClick={() => navigate("/driver")}>
          ← Retour dashboard
        </button>

        <p className="eyebrow">Conducteur</p>
        <h1>Mes disponibilités</h1>

        <p className="subtitle">
          Sélectionnez les dates où vous êtes disponible et vos zones de mission.
        </p>

        {saved && <div className="success">Disponibilités mises à jour ✅</div>}

        <section className="section">
          <div className="section-top">
            <h2>Calendrier des disponibilités</h2>

            <div className="month-actions">
              <button onClick={() => changeMonth(-1)}>←</button>
              <strong>{monthLabel}</strong>
              <button onClick={() => changeMonth(1)}>→</button>
            </div>
          </div>

          <div className="calendar">
            {weekDays.map((day) => (
              <div className="week-day" key={day}>
                {day}
              </div>
            ))}

            {getMonthDays().map((date, index) =>
              date ? (
                <button
                  key={formatDate(date)}
                  className={
                    availableDates.includes(formatDate(date))
                      ? "day selected"
                      : "day"
                  }
                  onClick={() => toggleDate(date)}
                >
                  <span>{date.getDate()}</span>
                </button>
              ) : (
                <div className="empty-day" key={`empty-${index}`}></div>
              )
            )}
          </div>
        </section>

        <section className="section">
          <h2>Zones géographiques</h2>

          <div className="select-row">
            <select
              value={departmentToAdd}
              onChange={(e) => setDepartmentToAdd(e.target.value)}
            >
              <option value="">Sélectionner un département</option>

              {departmentOptions.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>

            <button onClick={addDepartment}>Ajouter</button>
          </div>

          <div className="chips">
            {selectedDepartments.length === 0 && (
              <p className="empty-text">Aucune zone sélectionnée.</p>
            )}

            {selectedDepartments.map((dep) => (
              <button
                key={dep}
                className="chip"
                onClick={() => removeDepartment(dep)}
              >
                {dep} ✕
              </button>
            ))}
          </div>
        </section>

        <button className="save" onClick={saveAvailability}>
          Enregistrer mes disponibilités
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
          max-width: 880px;
          padding: 32px;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 30px 80px rgba(0,0,0,0.28);
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
          margin: 14px 0 24px;
          line-height: 1.5;
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

        .section {
          margin-top: 24px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          padding: 22px;
        }

        .section-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }

        h2 {
          margin: 0;
          font-size: 24px;
        }

        .month-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .month-actions strong {
          min-width: 170px;
          text-align: center;
          text-transform: capitalize;
        }

        .month-actions button,
        .select-row button {
          border: none;
          border-radius: 999px;
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 900;
          cursor: pointer;
          padding: 10px 14px;
        }

        .calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }

        .week-day {
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 900;
          padding-bottom: 4px;
        }

        .day,
        .empty-day {
          min-height: 74px;
          border-radius: 18px;
        }

        .day {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.75);
          color: white;
          cursor: pointer;
          font-weight: 900;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 12px;
        }

        .day.selected {
          background: linear-gradient(180deg, #16a34a, #15803d);
          border: none;
        }

        .select-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          margin-top: 16px;
        }

        select {
          width: 100%;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(15,23,42,0.9);
          color: white;
          font-size: 15px;
          outline: none;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .chip {
          border: none;
          border-radius: 999px;
          padding: 10px 14px;
          background: rgba(37,99,235,0.22);
          color: #bfdbfe;
          font-weight: 800;
          cursor: pointer;
        }

        .empty-text {
          color: #94a3b8;
          margin: 0;
        }

        .save {
          width: 100%;
          margin-top: 24px;
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
          .page {
            padding: 18px 12px 34px;
            align-items: flex-start;
          }

          .card {
            padding: 22px;
            border-radius: 22px;
          }

          h1 {
            font-size: 34px;
          }

          .section-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .month-actions {
            width: 100%;
            justify-content: space-between;
          }

          .month-actions strong {
            min-width: auto;
          }

          .calendar {
            gap: 6px;
          }

          .day,
          .empty-day {
            min-height: 52px;
            border-radius: 13px;
          }

          .day {
            padding: 8px;
            font-size: 13px;
          }

          .select-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}