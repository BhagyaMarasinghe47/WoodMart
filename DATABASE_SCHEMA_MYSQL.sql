-- WoodMart MySQL Database Schema
-- Compatible with MySQL 8.0+
-- Generated for WoodMart Furniture Marketplace

-- ============================================================================
-- STEP 1: CREATE LOOKUP TABLES (No Foreign Keys)
-- ============================================================================

-- Create Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create User Statuses Table
CREATE TABLE IF NOT EXISTS user_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Order Statuses Table
CREATE TABLE IF NOT EXISTS order_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Bulk Order Statuses Table
CREATE TABLE IF NOT EXISTS bulk_order_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Payment Statuses Table
CREATE TABLE IF NOT EXISTS payment_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Subcategories Table
CREATE TABLE IF NOT EXISTS subcategories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_subcategory (category_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 2: CREATE CORE TABLES
-- ============================================================================

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    role_id INT NOT NULL,
    user_status_id INT NOT NULL,
    approved_at DATETIME,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (user_status_id) REFERENCES user_statuses(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_email (email),
    INDEX idx_role_id (role_id),
    INDEX idx_user_status_id (user_status_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 3: CREATE PRODUCT TABLES
-- ============================================================================

-- Create Craftsman Products Table (Wholesale)
CREATE TABLE IF NOT EXISTS craftsman_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    craftsman_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    wholesale_price DECIMAL(10, 2) NOT NULL,
    total_stock INT NOT NULL DEFAULT 0,
    category_id INT NOT NULL,
    subcategory_id INT,
    sku VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (craftsman_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    INDEX idx_craftsman_id (craftsman_id),
    INDEX idx_category_id (category_id),
    INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Vendor Catalog Products Table (Retail)
CREATE TABLE IF NOT EXISTS vendor_catalog_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    craftsman_product_id INT NOT NULL,
    vendor_id INT NOT NULL,
    retail_price DECIMAL(10, 2) NOT NULL,
    available_stock INT NOT NULL DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (craftsman_product_id) REFERENCES craftsman_products(id),
    FOREIGN KEY (vendor_id) REFERENCES users(id),
    UNIQUE KEY unique_vendor_product (craftsman_product_id, vendor_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 4: CREATE SHOPPING CART TABLES
-- ============================================================================

-- Create Shopping Carts Table
CREATE TABLE IF NOT EXISTS shopping_carts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shopping_cart_id INT NOT NULL,
    vendor_catalog_product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shopping_cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_catalog_product_id) REFERENCES vendor_catalog_products(id),
    UNIQUE KEY unique_cart_product (shopping_cart_id, vendor_catalog_product_id),
    INDEX idx_vendor_product_id (vendor_catalog_product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 5: CREATE ORDER TABLES
-- ============================================================================

-- Create Customer Orders Table
CREATE TABLE IF NOT EXISTS customer_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    total_amount DECIMAL(15, 2) NOT NULL,
    order_status_id INT NOT NULL,
    delivery_address TEXT,
    delivery_city VARCHAR(100),
    delivery_state VARCHAR(100),
    delivery_postal_code VARCHAR(20),
    delivery_country VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (order_status_id) REFERENCES order_statuses(id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_order_status_id (order_status_id),
    INDEX idx_order_number (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Customer Order Items Table
CREATE TABLE IF NOT EXISTS customer_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_order_id INT NOT NULL,
    vendor_catalog_product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_catalog_product_id) REFERENCES vendor_catalog_products(id),
    INDEX idx_customer_order_id (customer_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Bulk Orders Table (Vendor to Craftsman)
CREATE TABLE IF NOT EXISTS bulk_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    craftsman_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    total_quantity INT NOT NULL,
    total_cost DECIMAL(15, 2) NOT NULL,
    bulk_order_status_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(id),
    FOREIGN KEY (craftsman_id) REFERENCES users(id),
    FOREIGN KEY (bulk_order_status_id) REFERENCES bulk_order_statuses(id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_craftsman_id (craftsman_id),
    INDEX idx_bulk_order_status_id (bulk_order_status_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Bulk Order Items Table
CREATE TABLE IF NOT EXISTS bulk_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bulk_order_id INT NOT NULL,
    craftsman_product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bulk_order_id) REFERENCES bulk_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (craftsman_product_id) REFERENCES craftsman_products(id),
    INDEX idx_bulk_order_id (bulk_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 6: CREATE PAYMENT AND REVIEW TABLES
-- ============================================================================

-- Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_order_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method_id INT NOT NULL,
    payment_status_id INT NOT NULL,
    transaction_id VARCHAR(255),
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (payment_status_id) REFERENCES payment_statuses(id),
    UNIQUE KEY unique_transaction (transaction_id),
    INDEX idx_customer_order_id (customer_order_id),
    INDEX idx_payment_status_id (payment_status_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    vendor_catalog_product_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (vendor_catalog_product_id) REFERENCES vendor_catalog_products(id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_vendor_product_id (vendor_catalog_product_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 7: INSERT SEED DATA
-- ============================================================================

-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS=0;

-- Insert Roles
INSERT INTO roles (name, description) VALUES
('Admin', 'System administrator with full access'),
('Craftsman', 'Creates and manages wholesale products'),
('Vendor', 'Manages retail catalog and customer orders'),
('Customer', 'Purchases products from vendors');

-- Insert User Statuses (1=Approved/Active, 2=Pending, 3=Rejected, 4=Disabled)
INSERT INTO user_statuses (name, description) VALUES
('Approved', 'Account is active and approved'),
('Pending', 'Awaiting admin approval'),
('Rejected', 'Account application was rejected'),
('Disabled', 'Account has been disabled');

-- Insert Order Statuses
INSERT INTO order_statuses (name, description) VALUES
('Pending', 'Order created, awaiting payment'),
('Processing', 'Payment received, preparing order'),
('Shipped', 'Order has been shipped'),
('Delivered', 'Order delivered to customer'),
('Cancelled', 'Order has been cancelled');

-- Insert Bulk Order Statuses
INSERT INTO bulk_order_statuses (name, description) VALUES
('Pending', 'Awaiting craftsman acceptance'),
('Accepted', 'Craftsman accepted the order'),
('InProduction', 'Currently being produced'),
('ReadyForDispatch', 'Ready to be shipped'),
('Dispatched', 'Shipped to vendor');

-- Insert Payment Statuses
INSERT INTO payment_statuses (name, description) VALUES
('Pending', 'Payment awaiting processing'),
('Completed', 'Payment successfully completed'),
('Failed', 'Payment processing failed'),
('Refunded', 'Payment has been refunded');

-- Insert Payment Methods
INSERT INTO payment_methods (name, description) VALUES
('Credit Card', 'Pay with credit card'),
('Debit Card', 'Pay with debit card'),
('Bank Transfer', 'Direct bank transfer'),
('PayPal', 'PayPal payment'),
('Cash On Delivery', 'Pay when item is delivered');

-- Insert Categories
INSERT INTO categories (name, description) VALUES
('Bedroom Furniture', 'Beds, wardrobes, nightstands, and bedroom accessories'),
('Living Room', 'Sofas, chairs, tables, and living room essentials'),
('Dining Room', 'Dining tables, chairs, sideboards, and dining accessories'),
('Office Furniture', 'Desks, chairs, storage, and office equipment'),
('Outdoor Furniture', 'Garden furniture, patio sets, and outdoor decor'),
('Kitchen Furniture', 'Kitchen cabinets, islands, and kitchen storage'),
('Decorative Items', 'Wall art, mirrors, shelving, and decorative pieces');

-- Insert Subcategories
INSERT INTO subcategories (category_id, name, description) VALUES
(1, 'Beds', 'Single, double, and king-size beds'),
(1, 'Wardrobes', 'Clothing storage and organization'),
(1, 'Nightstands', 'Bedside tables and storage'),
(2, 'Sofas', 'Single and multi-seater sofas'),
(2, 'Chairs', 'Armchairs, accent chairs, and recliners'),
(2, 'Coffee Tables', 'Low tables for living room'),
(3, 'Dining Tables', 'Large dining tables for families'),
(3, 'Dining Chairs', 'Chairs for dining tables'),
(4, 'Desks', 'Computer and work desks'),
(4, 'Office Chairs', 'Ergonomic office seating'),
(5, 'Garden Sets', 'Complete outdoor furniture sets'),
(6, 'Cabinets', 'Kitchen storage cabinets'),
(7, 'Shelving', 'Wall-mounted and freestanding shelves');

-- Insert Admin User (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role_id, user_status_id, approved_at, approved_by)
VALUES ('admin@woodmart.com', '$2a$11$C/0frmhxv8eVhUQJMarlUe2tUx.5xRyLc1AEGSol4NSe.jcPWX5bi', 'Admin', 'User', '0000000000', 1, 1, NOW(), 1);

-- Insert test Customer User (password: customer123)
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role_id, user_status_id, approved_at)
VALUES ('customer@woodmart.com', '$2a$11$Vbv6JmLoQjCwvHzcGE4dFe5a2A2HAJOvJ.Y7.UOaScuBL7FbTlMxu', 'Bob', 'Customer', '0771234567', 4, 1, NOW());

-- Create index on refresh_tokens for cleanup queries
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;

-- ============================================================================
-- STEP 8: CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active Users
CREATE OR REPLACE VIEW active_users AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role,
    u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.user_status_id = 1;

-- View: Published Products
CREATE OR REPLACE VIEW published_products AS
SELECT 
    cp.id,
    cp.product_name,
    cp.wholesale_price,
    vcp.retail_price,
    vcp.available_stock,
    cat.name as category,
    u.first_name as vendor_first_name,
    u.last_name as vendor_last_name
FROM vendor_catalog_products vcp
JOIN craftsman_products cp ON vcp.craftsman_product_id = cp.id
JOIN categories cat ON cp.category_id = cat.id
JOIN users u ON vcp.vendor_id = u.id
WHERE vcp.is_published = TRUE;

-- View: Pending Approvals
CREATE OR REPLACE VIEW pending_approvals AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role,
    u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.user_status_id = 2
ORDER BY u.created_at ASC;

-- View: Order Summary
CREATE OR REPLACE VIEW order_summary AS
SELECT 
    co.id,
    co.order_number,
    u.email as customer_email,
    os.name as status,
    co.total_amount,
    COUNT(coi.id) as item_count,
    co.created_at
FROM customer_orders co
JOIN users u ON co.customer_id = u.id
JOIN order_statuses os ON co.order_status_id = os.id
LEFT JOIN customer_order_items coi ON co.id = coi.customer_order_id
GROUP BY co.id, co.order_number, u.email, os.name, co.total_amount, co.created_at;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
SELECT 'WoodMart MySQL Database Schema Created Successfully!' as message;
