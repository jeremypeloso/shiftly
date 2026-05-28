import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Save,
  Trash2,
} from "lucide-react";
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

const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    const user = await getCurrentUser();

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

    setAvailableDates(data?.availability_days || []);
    setSelectedDepartments(data?.preferred_departments || []);
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
    setSelectedDepartments(selectedDepartments.filter((item) => item !== dep));
  }

  async function saveAvailability() {
    const user = await getCurrentUser();

    if (!user) return;

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

  return (
    <main className="availabilityPage">
      <aside className="availabilitySidebar">
        <button className="backButton" onClick={() => navigate("/driver")}>
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="brandBlock">
          <div className="mark">S</div>
          <div>
            <strong>Shiftly</strong>
            <span>Driver</span>
          </div>
        </div>

        <div className="sideHero">
          <span>Disponibilités</span>
          <h1>Où et quand veux-tu rouler ?</h1>
          <p>
            Ces informations améliorent le matching des missions ouvertes avec
            ton profil conducteur.
          </p>
        </div>

        <div className="sideStats">
          <Stat icon={CalendarDays} value={availableDates.length} label="jours disponibles" />
          <Stat icon={MapPin} value={selectedDepartments.length} label="zones choisies" />
        </div>
      </aside>

      <section className="availabilityContent">
        <header className="contentHeader">
          <div>
            <span className="eyebrow">Planning conducteur</span>
            <h2>Mes disponibilités</h2>
            <p>Sélectionne tes dates disponibles et tes zones de mission favorites.</p>
          </div>

          <button className="saveTop" onClick={saveAvailability}>
            <Save size={18} />
            Enregistrer
          </button>
        </header>

        {saved && (
          <div className="success">
            <CheckCircle2 size={20} />
            Disponibilités mises à jour
          </div>
        )}

        <div className="availabilityGrid">
          <section className="calendarPanel">
            <div className="panelTitle">
              <div>
                <h3>Calendrier</h3>
                <span>{availableDates.length} date(s) sélectionnée(s)</span>
              </div>

              <div className="monthActions">
                <button onClick={() => changeMonth(-1)}>
                  <ChevronLeft size={18} />
                </button>
                <strong>{monthLabel}</strong>
                <button onClick={() => changeMonth(1)}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="calendar">
              {weekDays.map((day) => (
                <div className="weekDay" key={day}>
                  {day}
                </div>
              ))}

              {monthDays.map((date, index) =>
                date ? (
                  <button
                    key={formatDate(date)}
                    className={availableDates.includes(formatDate(date)) ? "day selected" : "day"}
                    onClick={() => toggleDate(date)}
                  >
                    <span>{date.getDate()}</span>
                    {availableDates.includes(formatDate(date)) && <CheckCircle2 size={16} />}
                  </button>
                ) : (
                  <div className="emptyDay" key={`empty-${index}`} />
                )
              )}
            </div>
          </section>

          <section className="zonesPanel">
            <div className="panelTitle">
              <div>
                <h3>Zones géographiques</h3>
                <span>{selectedDepartments.length} zone(s)</span>
              </div>
            </div>

            <div className="selectRow">
              <select
                value={departmentToAdd}
                onChange={(event) => setDepartmentToAdd(event.target.value)}
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
                <div className="emptyState">
                  <MapPin size={26} />
                  <p>Aucune zone sélectionnée.</p>
                </div>
              )}

              {selectedDepartments.map((dep) => (
                <button className="chip" key={dep} onClick={() => removeDepartment(dep)}>
                  {dep}
                  <Trash2 size={15} />
                </button>
              ))}
            </div>
          </section>
        </div>

        <button className="saveBottom" onClick={saveAvailability}>
          <Save size={18} />
          Enregistrer mes disponibilités
        </button>
      </section>

      <style>{`
        .availabilityPage {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 320px 1fr;
          background: #f8fafc;
          color: #0f172a;
          font-family: Inter, system-ui, Arial, sans-serif;
        }

        .availabilityPage button,
        .availabilityPage select {
          font: inherit;
        }

        .availabilityPage button {
          border: 0;
          cursor: pointer;
        }

        .availabilitySidebar {
          min-height: 100svh;
          padding: 28px;
          background: #07152f;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 24px;
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
        .sideHero span {
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

        .sideHero {
          padding-top: 24px;
        }

        .sideHero h1 {
          margin: 18px 0 12px;
          font-size: 36px;
          line-height: 0.95;
          letter-spacing: -0.065em;
        }

        .sideHero p {
          margin: 0;
          color: #94a3b8;
          line-height: 1.6;
        }

        .sideStats {
          display: grid;
          gap: 10px;
          margin-top: auto;
        }

        .sideStat {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sideStat svg {
          color: #93c5fd;
        }

        .sideStat strong {
          display: block;
          font-size: 26px;
        }

        .sideStat span {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 850;
        }

        .availabilityContent {
          padding: 30px;
          overflow: auto;
        }

        .contentHeader {
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

        .contentHeader h2 {
          margin: 0;
          font-size: clamp(38px, 5vw, 58px);
          line-height: 1;
          letter-spacing: -0.07em;
        }

        .contentHeader p {
          margin: 12px 0 0;
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

        .availabilityGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
          gap: 18px;
        }

        .calendarPanel,
        .zonesPanel {
          padding: 24px;
          border-radius: 26px;
          background: white;
          border: 1px solid #dbe3ee;
          box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06);
        }

        .panelTitle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 20px;
        }

        .panelTitle h3 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -0.04em;
        }

        .panelTitle span {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .monthActions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .monthActions strong {
          min-width: 170px;
          text-align: center;
          text-transform: capitalize;
        }

        .monthActions button {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #dbeafe;
          color: #2563eb;
        }

        .calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }

        .weekDay {
          text-align: center;
          color: #64748b;
          font-size: 13px;
          font-weight: 950;
          padding-bottom: 4px;
        }

        .day,
        .emptyDay {
          min-height: 72px;
          border-radius: 18px;
        }

        .day {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 12px;
          border: 1px solid #e5eaf2;
          background: #f8fafc;
          color: #0f172a;
          font-weight: 950;
        }

        .day.selected {
          background: #2563eb;
          border-color: #2563eb;
          color: white;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
        }

        .selectRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }

        select {
          width: 100%;
          border-radius: 15px;
          border: 1px solid #dbe3ee;
          background: #f8fafc;
          color: #0f172a;
          padding: 14px 15px;
          outline: none;
        }

        select:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          background: white;
        }

        .selectRow button {
          border-radius: 15px;
          padding: 0 16px;
          background: #2563eb;
          color: white;
          font-weight: 950;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 10px 13px;
          background: #dbeafe;
          color: #2563eb;
          font-weight: 900;
        }

        .emptyState {
          width: 100%;
          min-height: 130px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 22px;
          border-radius: 20px;
          border: 1px dashed #cbd5e1;
          color: #64748b;
        }

        .emptyState svg {
          color: #2563eb;
        }

        .emptyState p {
          margin: 8px 0 0;
        }

        .saveBottom {
          width: 100%;
          margin-top: 18px;
          padding: 0 18px;
        }

        @media (max-width: 1040px) {
          .availabilityPage,
          .availabilityGrid {
            grid-template-columns: 1fr;
          }

          .availabilitySidebar {
            min-height: auto;
          }

          .sideStats {
            margin-top: 0;
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 720px) {
          .availabilityContent,
          .availabilitySidebar {
            padding: 18px;
          }

          .contentHeader,
          .panelTitle {
            align-items: flex-start;
            flex-direction: column;
          }

          .saveTop,
          .saveBottom {
            width: 100%;
          }

          .sideStats,
          .selectRow {
            grid-template-columns: 1fr;
          }

          .monthActions {
            width: 100%;
            justify-content: space-between;
          }

          .monthActions strong {
            min-width: auto;
          }

          .calendar {
            gap: 6px;
          }

          .day,
          .emptyDay {
            min-height: 52px;
            border-radius: 13px;
          }

          .day {
            padding: 8px;
            font-size: 13px;
          }
        }
      `}</style>
    </main>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="sideStat">
      <Icon size={22} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthDays(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  for (let index = 0; index < startOffset; index++) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}
