-- Sample published products for customer browse (run once on WoodMart database)
USE WoodMart;

-- Craftsman product: Oak Dining Table (Dining Room = category 3, Dining Tables subcategory = 9)
INSERT INTO craftsman_products (craftsman_id, product_name, description, wholesale_price, total_stock, category_id, subcategory_id, sku, created_at, updated_at)
SELECT u.id, 'Handcrafted Oak Dining Table',
  'Beautiful solid oak dining table with smooth finish. Seats 6-8 people comfortably.',
  45000, 15, 3, 9, 'WM-DT-001', NOW(), NOW()
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE LOWER(r.name) LIKE '%craftsman%' AND u.user_status_id = 1
ORDER BY u.id
LIMIT 1;

SET @craftsman_product_id = LAST_INSERT_ID();

-- Publish via first approved vendor
INSERT INTO vendor_catalog_products (craftsman_product_id, vendor_id, retail_price, available_stock, is_published, created_at, updated_at)
SELECT @craftsman_product_id, u.id, 69900, 10, TRUE, NOW(), NOW()
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE LOWER(r.name) LIKE '%vendor%' AND u.user_status_id = 1
ORDER BY u.id
LIMIT 1;

-- Coffee table (Living Room = 2)
INSERT INTO craftsman_products (craftsman_id, product_name, description, wholesale_price, total_stock, category_id, subcategory_id, sku, created_at, updated_at)
SELECT u.id, 'Rustic Coffee Table',
  'Elegant coffee table with storage compartment. Perfect for your living room.',
  12000, 20, 2, 7, 'WM-CT-001', NOW(), NOW()
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE LOWER(r.name) LIKE '%craftsman%' AND u.user_status_id = 1
ORDER BY u.id
LIMIT 1;

SET @craftsman_product_id2 = LAST_INSERT_ID();

INSERT INTO vendor_catalog_products (craftsman_product_id, vendor_id, retail_price, available_stock, is_published, created_at, updated_at)
SELECT @craftsman_product_id2, u.id, 18900, 15, TRUE, NOW(), NOW()
FROM users u
INNER JOIN roles r ON u.role_id = r.id
WHERE LOWER(r.name) LIKE '%vendor%' AND u.user_status_id = 1
ORDER BY u.id
LIMIT 1;

SELECT 'Sample products seeded.' AS message;
