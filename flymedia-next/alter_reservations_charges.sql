-- ALTER TABLES MIGRATION FOR RESERVATION DEPOSITS & OFFERS
-- Run this on your MySQL database if not using sequelize sync.

-- 1. Add booking_charge column to store_payment_configs table
ALTER TABLE `store_payment_configs` ADD COLUMN `booking_charge` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- 2. Add booking_charge_paid column to reservations table
ALTER TABLE `reservations` ADD COLUMN `booking_charge_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- 3. Add applied_offer column to reservations table
ALTER TABLE `reservations` ADD COLUMN `applied_offer` VARCHAR(255) NULL;

-- 4. Add deposit_credited column to reservations table
ALTER TABLE `reservations` ADD COLUMN `deposit_credited` TINYINT(1) NOT NULL DEFAULT 0;

-- 5. Add deposit_deducted column to orders table
ALTER TABLE `orders` ADD COLUMN `deposit_deducted` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

