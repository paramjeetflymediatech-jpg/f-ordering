-- SQL Migration: Add 'completed' to reservations status ENUM
-- Run this on your Central Database (e.g. flymedia_twirl_db):
ALTER TABLE `reservations` 
MODIFY COLUMN `status` ENUM('pending', 'confirmed', 'cancelled', 'seated', 'completed') 
NOT NULL DEFAULT 'pending';

-- Run this on each of your Tenant Databases (e.g. tenant_f_ordering_foods):
-- ALTER TABLE `tenant_f_ordering_foods`.`reservations` 
-- MODIFY COLUMN `status` ENUM('pending', 'confirmed', 'cancelled', 'seated', 'completed') 
-- NOT NULL DEFAULT 'pending';
