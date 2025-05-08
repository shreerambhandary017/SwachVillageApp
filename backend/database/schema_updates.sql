-- Schema updates for the Swach Village App UI/UX enhancements

-- Alter the products table to add category and description fields
ALTER TABLE products
ADD COLUMN category VARCHAR(100) DEFAULT NULL AFTER product_code,
ADD COLUMN description TEXT DEFAULT NULL AFTER category;

-- Create a product_verifications table to track product verification history
CREATE TABLE IF NOT EXISTS product_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT,
    verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_method ENUM('barcode_scan', 'manual_code', 'qr_code') DEFAULT 'manual_code',
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Modify the feedback table to allow business-level feedback (not just product-specific)
ALTER TABLE feedback
MODIFY COLUMN product_id INT NULL,
ADD COLUMN business_id INT NULL AFTER product_id,
ADD FOREIGN KEY (business_id) REFERENCES users(id);

-- Create a businesses table for the business listings feature
CREATE TABLE IF NOT EXISTS businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    certification_status ENUM('pending', 'certified', 'rejected') DEFAULT 'pending',
    certified_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create index for better query performance
CREATE INDEX idx_businesses_cert_status ON businesses(certification_status);
CREATE INDEX idx_feedback_business_id ON feedback(business_id);
CREATE INDEX idx_product_verifications_product_id ON product_verifications(product_id);
CREATE INDEX idx_product_verifications_date ON product_verifications(verification_date);

-- Sample data for businesses
INSERT INTO businesses (user_id, business_name, description, certification_status, certified_date) VALUES
(1, 'Eco-Friendly Products', 'We create sustainable and eco-friendly products for everyday use.', 'certified', '2024-10-15'),
(1, 'Green Earth Cosmetics', 'Natural, organic cosmetics without animal testing.', 'certified', '2024-09-02'),
(1, 'Pure Beauty', 'Cruelty-free beauty products for conscious consumers.', 'certified', '2024-11-20');

-- Sample products with improved data for the verify feature
INSERT INTO products (business_id, product_name, product_code, category, description, certification_status) VALUES
(1, 'Natural Face Wash', 'ECO12345', 'Skincare', 'A gentle, all-natural face wash made with organic ingredients.', 'verified'),
(1, 'Vegan Lipstick', 'ECO12346', 'Makeup', 'Long-lasting vegan lipstick with natural pigments.', 'verified'),
(1, 'Bamboo Toothbrush', 'GRN54321', 'Personal Care', 'Eco-friendly bamboo toothbrush with plant-based bristles.', 'verified'),
(1, 'Organic Shampoo', 'PUR78901', 'Hair Care', 'Chemical-free shampoo for all hair types.', 'verified');

-- Sample feedback data
INSERT INTO feedback (consumer_id, business_id, feedback_text, rating) VALUES
(2, 1, 'Great products, really love their commitment to sustainability!', 5),
(2, 1, 'Product quality is excellent, packaging could be improved.', 4);
