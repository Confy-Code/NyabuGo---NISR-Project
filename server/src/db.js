import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = path.join(DATA_DIR, 'nyabugo.db');
export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS nisr_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id TEXT NOT NULL,
      variable TEXT NOT NULL,
      category TEXT NOT NULL,
      label TEXT NOT NULL,
      value_pct REAL NOT NULL,
      valid_n INTEGER NOT NULL,
      sample_size INTEGER NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin TEXT NOT NULL DEFAULT 'Nyabugogo, Kigali',
      destination TEXT NOT NULL UNIQUE,
      district TEXT NOT NULL,
      region TEXT NOT NULL,
      distance_km INTEGER NOT NULL,
      duration_min INTEGER NOT NULL,
      base_fare INTEGER NOT NULL,
      nisr_commute_weight REAL NOT NULL DEFAULT 4.1,
      regional_multiplier REAL NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      color TEXT NOT NULL,
      premium INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS buses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      route_id INTEGER NOT NULL REFERENCES routes(id),
      plate_number TEXT NOT NULL,
      bus_number TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 30,
      price INTEGER NOT NULL,
      driver_name TEXT,
      departure_at TEXT NOT NULL,
      arrival_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      seat_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      UNIQUE (bus_id, seat_number)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_code TEXT NOT NULL UNIQUE,
      passenger_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_ref TEXT NOT NULL,
      bus_id INTEGER NOT NULL REFERENCES buses(id),
      seat_numbers TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'paid',
      qr_payload TEXT NOT NULL,
      booked_at TEXT NOT NULL,
      used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS demand_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL REFERENCES routes(id),
      recorded_at TEXT NOT NULL,
      hour INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      bookings INTEGER NOT NULL,
      nisr_baseline REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_buses_route ON buses(route_id);
    CREATE INDEX IF NOT EXISTS idx_buses_departure ON buses(departure_at);
    CREATE INDEX IF NOT EXISTS idx_seats_bus ON seats(bus_id, status);
    CREATE INDEX IF NOT EXISTS idx_bookings_bus ON bookings(bus_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(ticket_code);
    CREATE INDEX IF NOT EXISTS idx_bookings_booked ON bookings(booked_at);
    CREATE INDEX IF NOT EXISTS idx_history_route ON demand_history(route_id, recorded_at);
  `);
}

export function all(sql, ...params) {
  return db.prepare(sql).all(...params);
}

export function get(sql, ...params) {
  return db.prepare(sql).get(...params);
}

export function run(sql, ...params) {
  return db.prepare(sql).run(...params);
}

export function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore rollback failures
    }
    throw error;
  }
}
