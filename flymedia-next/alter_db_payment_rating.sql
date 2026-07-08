-- SQL MIGRATION TO UPDATE SERVER DATABASE
-- Run this script on your database on the server.

-- 1. Add stripe_customer_id to customers table
ALTER TABLE `customers` ADD COLUMN `stripe_customer_id` VARCHAR(255) NULL DEFAULT NULL;

-- 2. Add UPI configurations to store_payment_configs table
ALTER TABLE `store_payment_configs` ADD COLUMN `is_upi_enabled` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `store_payment_configs` ADD COLUMN `upi_vpa` VARCHAR(255) NULL DEFAULT NULL;
ALTER TABLE `store_payment_configs` ADD COLUMN `upi_qr_image` VARCHAR(500) NULL DEFAULT NULL;

-- 3. Add rating and comment to orders table
ALTER TABLE `orders` ADD COLUMN `rating` INT NULL DEFAULT NULL;
ALTER TABLE `orders` ADD COLUMN `rating_comment` TEXT NULL DEFAULT NULL;
