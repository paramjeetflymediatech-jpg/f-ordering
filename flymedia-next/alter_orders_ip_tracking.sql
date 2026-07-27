-- Migration: Add customer IP tracking + full address columns to orders and reservations
-- MySQL-compatible version (uses stored procedure to safely add columns if missing)

-- Orders table
ALTER TABLE orders
  ADD COLUMN customer_ip VARCHAR(64) NULL,
  ADD COLUMN customer_device TEXT NULL,
  ADD COLUMN customer_geo JSON NULL,
  ADD COLUMN customer_address TEXT NULL;

-- Reservations table
ALTER TABLE reservations
  ADD COLUMN customer_ip VARCHAR(64) NULL,
  ADD COLUMN customer_device TEXT NULL,
  ADD COLUMN customer_geo JSON NULL,
  ADD COLUMN customer_address TEXT NULL;
