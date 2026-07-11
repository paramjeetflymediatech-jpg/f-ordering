-- ALTER TABLES MIGRATION FOR CINEMATIC SLOTS BOOKING
-- Run this on your MySQL database if not using sequelize sync.

-- 1. Add booking_slots column to restaurant_tables table
ALTER TABLE `restaurant_tables` ADD COLUMN `booking_slots` JSON NULL;

-- 2. Add booking_slot column to reservations table
ALTER TABLE `reservations` ADD COLUMN `booking_slot` VARCHAR(255) NULL;
