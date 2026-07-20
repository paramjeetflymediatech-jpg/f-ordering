-- ALTER COUPONS TABLE FOR DYNAMIC DAYS AND ORDER TYPE DISCOUNTS

ALTER TABLE `coupons` ADD COLUMN `valid_days` JSON NULL AFTER `get_qty`;
ALTER TABLE `coupons` ADD COLUMN `order_type_discounts` JSON NULL AFTER `valid_days`;
ALTER TABLE `coupons` ADD COLUMN `is_auto_apply` TINYINT(1) NOT NULL DEFAULT 0 AFTER `order_type_discounts`;
