CREATE TABLE IF NOT EXISTS admin_intervention_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  risk_level_at_time TEXT NOT NULL,
  note TEXT NOT NULL,
  action_type TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
