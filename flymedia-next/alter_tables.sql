-- ALTER TABLES MIGRATION FOR GLOBAL COUPONS AND ORDER COUPON CODES

-- 1. Add coupon_code column to orders table
ALTER TABLE `orders` ADD COLUMN `coupon_code` VARCHAR(255) NULL AFTER `total_amount`;

-- 2. Modify store_id column in coupons table to be nullable to support global coupons
ALTER TABLE `coupons` MODIFY COLUMN `store_id` CHAR(36) BINARY NULL;
