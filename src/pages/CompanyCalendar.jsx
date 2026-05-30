import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CompanyCalendar() {
  const [compactCalendar, setCompactCalendar] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");

    const updateCalendarMode = () => setCompactCalendar(mediaQuery.matches);
    updateCalendarMode();

    mediaQuery.addEventListener("change", updateCalendarMode);
    return () => mediaQuery.removeEventListener("change", updateCalendarMode);
  }, []);

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
          key={compactCalendar ? "compact" : "desktop"}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={compactCalendar ? "timeGridDay" : "dayGridMonth"}
          locale="fr"
          height="auto"
          aspectRatio={compactCalendar ? 0.8 : 1.55}
          dayMaxEventRows={compactCalendar ? 2 : 3}
          slotMinTime="05:00:00"
          slotMaxTime="22:00:00"
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: compactCalendar ? "today" : "dayGridMonth,timeGridWeek,timeGridDay",
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
          overflow: hidden;
        }

        .fc {
          width: 100%;
          min-width: 0;
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
            overflow: hidden;
          }

          .fc-toolbar {
            flex-direction: column;
            gap: 10px;
          }

          .fc-toolbar-title {
            font-size: 18px !important;
            line-height: 1.2;
            text-align: center;
          }

          .fc-header-toolbar {
            margin-bottom: 12px !important;
          }

          .fc-button {
            padding: 7px 10px !important;
            font-size: 12px !important;
          }

          .fc-event {
            font-size: 12px !important;
            line-height: 1.25;
            white-space: normal;
          }

          .fc-timegrid-slot {
            height: 34px;
          }

          .fc-timegrid-axis-cushion,
          .fc-timegrid-slot-label-cushion {
            font-size: 11px;
          }
        }

        @media (max-width: 520px) {
          .calendar-page {
            padding: 18px 10px;
          }

          .header {
            margin-bottom: 16px;
          }

          .header h1 {
            font-size: 26px;
            line-height: 1.05;
          }

          .calendar-card {
            padding: 10px;
            border-radius: 16px;
          }

          .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 6px;
          }
        }
      `}</style>
    </main>
  );
}
