import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CompanyCalendar() {
  const missions = [
    {
      title: "Ouverte · CDG → Rouen",
      start: "2026-05-22T06:30:00",
      end: "2026-05-22T18:45:00",
      color: "#2563eb",
    },
    {
      title: "Pourvue · Paris → Lille",
      start: "2026-05-24T08:00:00",
      end: "2026-05-24T19:00:00",
      color: "#16a34a",
    },
    {
      title: "Terminée · Orly → Reims",
      start: "2026-05-18T07:00:00",
      end: "2026-05-18T17:30:00",
      color: "#64748b",
    },
  ];

  return (
    <main className="calendar-page">
      <div className="header">
        <div>
          <p>Entreprise</p>
          <h1>Agenda des missions</h1>
        </div>
      </div>

      <div className="calendar-card">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="fr"
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "Aujourd’hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
          }}
          events={missions}
        />
      </div>

      <style>{`
        .calendar-page {
          min-height: 100svh;
          padding: 40px;
          color: white;
          font-family: Inter, Arial, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(251,191,36,0.08), transparent 34%),
            radial-gradient(circle at bottom right, rgba(56,189,248,0.08), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #162033 52%, #1f2937 100%);
        }

        .header {
          margin-bottom: 28px;
        }

        .header p {
          color: #94a3b8;
          margin: 0;
        }

        .header h1 {
          margin: 8px 0 0;
          font-size: 42px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .calendar-card {
          background: rgba(255,255,255,0.96);
          color: #0f172a;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.28);
        }

        .fc {
          font-family: Inter, Arial, sans-serif;
        }

        .fc-button {
          background: #2563eb !important;
          border: none !important;
          border-radius: 10px !important;
          font-weight: 700 !important;
        }

        .fc-event {
          border: none !important;
          border-radius: 8px !important;
          padding: 2px 4px !important;
          font-weight: 700 !important;
        }

        @media (max-width: 900px) {
          .calendar-page {
            padding: 24px 14px;
          }

          .header h1 {
            font-size: 32px;
          }

          .calendar-card {
            padding: 12px;
            border-radius: 20px;
            overflow-x: auto;
          }

          .fc-toolbar {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </main>
  );
}