CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  app_domain TEXT,
  api_domain TEXT,
  plan TEXT DEFAULT 'Profissional',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'master',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  project TEXT NOT NULL,
  city TEXT,
  contact TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  typology TEXT NOT NULL,
  line TEXT,
  width_mm INTEGER,
  height_mm INTEGER,
  color TEXT,
  glass TEXT,
  quantity INTEGER DEFAULT 1,
  total_value NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'Enviado',
  calculation_payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_plans (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'BRL',
  interval_unit TEXT NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO billing_plans (code, name, description, price_cents, currency, interval_unit, interval_count, trial_days)
VALUES
('basico', 'Básico', 'Plano básico do Cálculo Light', 5900, 'BRL', 'months', 1, 0),
('profissional', 'Profissional', 'Plano profissional do Cálculo Light', 11900, 'BRL', 'months', 1, 2),
('fabrica', 'Fábrica', 'Plano completo para operação fabril', 24900, 'BRL', 'months', 1, 2)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  trial_days = EXCLUDED.trial_days;
