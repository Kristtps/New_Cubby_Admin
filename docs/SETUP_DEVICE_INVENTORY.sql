-- ====================================================================
-- 🔧 COINCUBBY - SETUP DEVICE INVENTORY SYSTEM
-- COPY AND RUN THIS ENTIRE SCRIPT IN YOUR SUPABASE SQL EDITOR
-- ====================================================================

-- 1. Create public.device_inventory table (tracking current balance)
CREATE TABLE IF NOT EXISTS public.device_inventory (
  inventory_id uuid NOT null DEFAULT gen_random_uuid (),
  device_id bigint NOT null,
  change_amount numeric(10, 2) NOT null DEFAULT 0.00,
  last_refilled_at timestamp with time zone null,
  last_refilled_amount numeric(10, 2) NOT null DEFAULT 0.00,
  updated_at timestamp with time zone NOT null DEFAULT now(),
  CONSTRAINT device_inventory_pkey PRIMARY KEY (inventory_id),
  CONSTRAINT device_inventory_device_id_key UNIQUE (device_id),
  CONSTRAINT device_inventory_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. Create public.device_inventory_history table (audit logging of all changes)
CREATE TABLE IF NOT EXISTS public.device_inventory_history (
  history_id uuid NOT null DEFAULT gen_random_uuid (),
  device_id bigint NOT null,
  action_type varchar(50) NOT null, -- 'add', 'deduct', 'refill', 'reset'
  amount numeric(10, 2) NOT null,
  previous_amount numeric(10, 2) NOT null,
  new_amount numeric(10, 2) NOT null,
  performed_by varchar(255) NOT null, -- Admin user email or full name
  notes text null,
  created_at timestamp with time zone NOT null DEFAULT now(),
  CONSTRAINT device_inventory_history_pkey PRIMARY KEY (history_id),
  CONSTRAINT device_inventory_history_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 3. Disable Row Level Security (RLS) on both tables (matches project pattern)
ALTER TABLE public.device_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_inventory_history DISABLE ROW LEVEL SECURITY;

-- 4. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_device_inventory_history_device_id ON public.device_inventory_history(device_id);
CREATE INDEX IF NOT EXISTS idx_device_inventory_history_created_at ON public.device_inventory_history(created_at DESC);

-- 5. Seed default inventory rows for existing devices (if any)
INSERT INTO public.device_inventory (device_id, change_amount, last_refilled_amount)
SELECT device_id, 0.00, 0.00
FROM public.devices
ON CONFLICT (device_id) DO NOTHING;

-- 6. Verify table creation
SELECT '✅ device_inventory count:' AS message, count(*) FROM public.device_inventory;
SELECT '✅ device_inventory_history count:' AS message, count(*) FROM public.device_inventory_history;
