"use client";
/*
  Premium analog clock time picker — 24-hour format (0–23 hours, 0–59 minutes).

  Digit-entry rules (tens-first):
    - First digit typed → tens place
        • Hours: valid tens = 0,1,2 → wait for units (clock shows tens*10)
                 invalid tens = 3-9  → treat as units with tens=0, auto-advance
        • Minutes: valid tens = 0-5 → wait for units
                   invalid tens = 6-9 → treat as units with tens=0
    - Second digit typed → units place
        • If combined value ≤ max → accept, auto-advance hour→minute
        • If combined value > max → treat second digit as standalone units (tens=0)

*/

import { useState, useRef, useEffect, useCallback } from "react";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { usePickerContext } from "@mui/x-date-pickers/hooks";
import dayjs, { Dayjs } from "dayjs";
import { Clock } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function toDayjs(hhmm: string): Dayjs {
  const [h, m] = hhmm.split(":").map(Number);
  return dayjs()
    .hour(h || 0)
    .minute(m || 0)
    .second(0)
    .millisecond(0);
}

function toHHMM(d: Dayjs): string {
  return `${String(d.hour()).padStart(2, "0")}:${String(d.minute()).padStart(2, "0")}`;
}

// ─── Custom toolbar with tens-first digit entry ───────────────────────────────
// Must be outside ClockTimePicker — otherwise React remounts it on every render.
function EditableToolbar() {
  const { value, view, setView, setValue } = usePickerContext<Dayjs>();

  const [hourDisplay, setHourDisplay] = useState("00");
  const [minDisplay, setMinDisplay] = useState("00");

  // Pending tens digit while waiting for the units digit (null = no pending)
  const hourTens = useRef<number | null>(null);
  const minTens = useRef<number | null>(null);
  // True while WE called setValue so useEffect knows not to reset the buffer
  const isTyping = useRef(false);
  // Ref for the minute input so we can focus it after hour entry completes
  const minInputRef = useRef<HTMLInputElement>(null);

  // Sync display only when the clock hand moves via user click (not our own setValue calls)
  useEffect(() => {
    if (isTyping.current) {
      // We triggered this change — skip sync so the digit buffer stays intact
      isTyping.current = false;
      return;
    }
    if (value) {
      setHourDisplay(String(value.hour()).padStart(2, "0"));
      setMinDisplay(String(value.minute()).padStart(2, "0"));
      hourTens.current = null;
      minTens.current = null;
    }
  }, [value]);

  // ── Hour input ─────────────────────────────────────────────────────────────
  const onHourKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!/^\d$/.test(e.key)) return;
      e.preventDefault();
      const d = parseInt(e.key, 10);

      if (hourTens.current === null) {
        // ── First digit → goes to tens place ──
        if (d <= 2) {
          // Valid hour tens (0, 1, 2) — wait for units digit
          hourTens.current = d;
          const interim = d * 10; // show e.g. 20 while waiting for second digit
          setHourDisplay(String(interim).padStart(2, "0"));
          if (value) {
            isTyping.current = true;
            setValue(value.hour(interim), { changeImportance: "set" });
          }
        } else {
          // Invalid hour tens (3-9) — treat digit as units, tens = 0
          hourTens.current = null;
          setHourDisplay(`0${d}`);
          if (value) {
            isTyping.current = true;
            setValue(value.hour(d), { changeImportance: "set" });
          }
          setView("minutes");
          setTimeout(() => minInputRef.current?.focus(), 0);
        }
      } else {
        // ── Second digit → goes to units place ──
        const tens = hourTens.current;
        const combined = tens * 10 + d;
        hourTens.current = null;

        if (combined <= 23) {
          setHourDisplay(String(combined).padStart(2, "0"));
          if (value) {
            isTyping.current = true;
            setValue(value.hour(combined), { changeImportance: "set" });
          }
        } else {
          // e.g. user typed "2" then "8" → 28 invalid → treat "8" as units with tens=0
          setHourDisplay(`0${d}`);
          if (value) {
            isTyping.current = true;
            setValue(value.hour(d), { changeImportance: "set" });
          }
        }
        setView("minutes");
        setTimeout(() => minInputRef.current?.focus(), 0);
      }
    },
    [value, setValue, setView],
  );

  // ── Minute input ───────────────────────────────────────────────────────────
  const onMinKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!/^\d$/.test(e.key)) return;
      e.preventDefault();
      const d = parseInt(e.key, 10);

      if (minTens.current === null) {
        if (d <= 5) {
          // Valid minute tens (0-5) — wait for units
          minTens.current = d;
          const interim = d * 10;
          setMinDisplay(String(interim).padStart(2, "0"));
          if (value) {
            isTyping.current = true;
            setValue(value.minute(interim), { changeImportance: "set" });
          }
        } else {
          // Invalid minute tens (6-9) — treat as units with tens=0
          minTens.current = null;
          setMinDisplay(`0${d}`);
          if (value) {
            isTyping.current = true;
            setValue(value.minute(d), { changeImportance: "set" });
          }
        }
      } else {
        const tens = minTens.current;
        const combined = tens * 10 + d;
        minTens.current = null;

        if (combined <= 59) {
          setMinDisplay(String(combined).padStart(2, "0"));
          if (value) {
            isTyping.current = true;
            setValue(value.minute(combined), { changeImportance: "set" });
          }
        } else {
          // e.g. "5" then "9" → 59 ✓ but "5" then beyond — treat second digit as units
          setMinDisplay(`0${d}`);
          if (value) {
            isTyping.current = true;
            setValue(value.minute(d), { changeImportance: "set" });
          }
        }
      }
    },
    [value, setValue],
  );

  function inputStyle(isActive: boolean): React.CSSProperties {
    return {
      width: "52px",
      fontSize: "34px",
      fontWeight: 300,
      lineHeight: 1,
      color: "white",
      background: isActive
        ? "rgba(255,255,255,0.22)"
        : "rgba(255,255,255,0.08)",
      border: "none",
      borderRadius: "8px",
      textAlign: "center",
      outline: "none",
      cursor: "pointer",
      padding: "4px 2px",
      transition: "background 0.15s",
      caretColor: "transparent",
    };
  }

  return (
    <div
      style={{
        backgroundColor: "#0d9488",
        padding: "18px 28px 14px",
        textAlign: "center",
        color: "white",
        direction: "ltr",
      }}
    >
      <p
        style={{
          fontSize: "18px",
          fontWeight: 600,
          opacity: 0.95,
          marginBottom: "10px",
        }}
      >
        בחר שעה
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
        }}
      >
        <input
          value={hourDisplay}
          readOnly
          onKeyDown={onHourKeyDown}
          onClick={() => {
            setView("hours");
            hourTens.current = null;
          }}
          inputMode="numeric"
          aria-label="שעות"
          style={inputStyle(view === "hours")}
        />
        <span
          style={{
            fontSize: "32px",
            fontWeight: 300,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1,
          }}
        >
          :
        </span>
        <input
          ref={minInputRef}
          value={minDisplay}
          readOnly
          onKeyDown={onMinKeyDown}
          onClick={() => {
            setView("minutes");
            minTens.current = null;
          }}
          inputMode="numeric"
          aria-label="דקות"
          style={inputStyle(view === "minutes")}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ClockTimePicker({
  value,
  onChange,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        dir="ltr"
        className={[
          "flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2",
          "text-sm bg-white hover:border-teal-400 focus:outline-none",
          "focus:border-teal-400 transition-colors cursor-pointer",
          className,
        ].join(" ")}
      >
        <Clock size={14} className="text-teal-500 shrink-0" />
        <span className="font-mono font-medium text-gray-700 tracking-wide">
          {value}
        </span>
      </button>

      <MobileTimePicker
        open={open}
        onClose={() => setOpen(false)}
        value={toDayjs(value)}
        onChange={(newVal) => {
          if (newVal) onChange(toHHMM(newVal));
        }}
        ampm={false}
        localeText={{ okButtonLabel: "אישור", cancelButtonLabel: "ביטול" }}
        slots={{ toolbar: EditableToolbar }}
        slotProps={{
          textField: { sx: { display: "none" } },
          dialog: {
            sx: {
              "& .MuiDialog-paper": {
                borderRadius: "16px",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                direction: "ltr",
                overflow: "hidden",
              },

              // Force portrait: toolbar above clock, not beside it
              "& .MuiPickersLayout-root": {
                display: "grid",
                gridTemplateColumns: "1fr",
                gridTemplateRows: "auto 1fr auto",
                gridTemplateAreas: `"toolbar" "contentWrapper" "actionBar"`,
              },
              "& .MuiPickersLayout-toolbar": { gridArea: "toolbar" },
              "& .MuiPickersLayout-contentWrapper": {
                gridArea: "contentWrapper",
              },
              "& .MuiPickersLayout-actionBar": { gridArea: "actionBar" },

              // Hide navigation arrows — only click/type to switch modes
              "& .MuiPickersArrowSwitcher-root": { display: "none" },

              // Clock face teal accent
              "& .MuiClock-pin, & .MuiClockPointer-root, & .MuiClockPointer-thumb":
                {
                  backgroundColor: "#0d9488",
                  borderColor: "#0d9488",
                },
              "& .MuiClockNumber-root.Mui-selected": {
                backgroundColor: "#0d9488",
              },
              "& .MuiTimeClock-root .Mui-selected": {
                backgroundColor: "#0d9488",
              },

              // Action buttons
              "& .MuiDialogActions-root": {
                justifyContent: "space-between",
                padding: "8px 16px 12px",
              },
              "& .MuiDialogActions-root button:first-of-type": {
                color: "#ef4444",
                fontWeight: 600,
                fontSize: "0.9rem",
                "&:hover": { backgroundColor: "#fef2f2" },
              },
              "& .MuiDialogActions-root button:last-of-type": {
                backgroundColor: "#22c55e",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
                borderRadius: "8px",
                padding: "6px 20px",
                "&:hover": { backgroundColor: "#16a34a" },
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}
