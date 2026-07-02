-- SQL MIGRATION FOR CREATING THE MENU_BASES TABLE
-- Run this script on your central and tenant databases on the server.

CREATE TABLE IF NOT EXISTS `menu_bases` (
  `id` CHAR(36) BINARY NOT NULL,
  `menu_item_id` CHAR(36) BINARY NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `extra_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_menu_bases_menu_item` FOREIGN KEY (`menu_item_id`) 
    REFERENCES `menu_items` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add bases JSON column to order_items table to record selected bases per ordered item
ALTER TABLE `order_items` ADD COLUMN `bases` JSON NULL AFTER `addons`;
