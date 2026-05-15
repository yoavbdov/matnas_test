// Types for tournaments, their rounds, and participants

import type { ResourceAssignment } from "./resources";

/** A single round within a tournament (specific date + time) */
export interface TournamentRound {
  id: string;
  round_number: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  location?: string; // optional venue / room name
  notes?: string;
  resource_assignments?: ResourceAssignment[]; // equipment needed for this round
}

/** A non-student participant added manually (e.g. external player) */
export interface ManualParticipant {
  id: string; // local UUID
  name: string;
  rating?: number;
  notes?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  status: "מתוכנן" | "פעיל" | "הסתיים" | "בוטל";
  rating_min?: number; // eligibility rating range
  rating_max?: number;
  age_min?: number; // eligibility age range (years, inclusive)
  age_max?: number;
  is_recurring?: boolean; // recurring tournament — no fixed rounds
  // Used only when is_recurring=true (replaces rounds)
  recurring_date?: string;         // YYYY-MM-DD
  recurring_start_time?: string;   // HH:MM
  recurring_end_time?: string;     // HH:MM
  recurring_resource_assignments?: ResourceAssignment[]; // equipment for recurring tournaments
  resource_assignments?: ResourceAssignment[]; // equipment for the whole tournament (set in Details tab)
  room?: string; // the room / hall where the tournament is held
  judge_id?: string; // teacher ID of the referee/arbiter for this tournament
  rounds: TournamentRound[];
  participant_ids: string[]; // student IDs registered in this tournament
  manual_participants: ManualParticipant[]; // externally added players
  color?: string; // display color in calendar
  notes?: string;
  cancelled_dates?: string[]; // YYYY-MM-DD dates where a recurring occurrence was manually cancelled
  created_at?: string;
}
