-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS swach_village;
USE swach_village;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('business', 'consumer') NOT NULL,  -- role selection
    is_verified BOOLEAN DEFAULT FALSE, -- Email or Phone verification
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Business Certification Table
CREATE TABLE IF NOT EXISTS business_certification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    business_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    pan_card VARCHAR(100),
    aadhaar_card VARCHAR(100),
    gst_number VARCHAR(100),
    owner_name VARCHAR(255) NOT NULL,
    citizenship VARCHAR(50),
    owner_mobile VARCHAR(20),
    owner_email VARCHAR(100),
    mobile_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    pan_card_owner VARCHAR(100),
    aadhaar_card_owner VARCHAR(100),
    vendor_count INT DEFAULT 0,
    vendor_certification JSON, -- stores vendor certifications as JSON
    cleanliness_rating INT DEFAULT 0, -- cleanliness rating
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    cruelty_free BOOLEAN DEFAULT FALSE,
    sanitation_practices BOOLEAN DEFAULT FALSE,
    waste_management BOOLEAN DEFAULT FALSE,
    sustainability TEXT,
    photos JSON, -- stores photo URLs or file paths
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    audit_required BOOLEAN DEFAULT FALSE,
    audit_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(255) UNIQUE NOT NULL, -- barcode or other unique identifier
    certification_status ENUM('verified', 'unverified') DEFAULT 'unverified',
    certification_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES users(id)
);

-- 4. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    consumer_id INT,
    feedback_text TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5), -- 1 to 5 rating scale
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (consumer_id) REFERENCES users(id)
);

-- 5. Audit Table
CREATE TABLE IF NOT EXISTS audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT,
    reason_for_audit TEXT,
    audit_status ENUM('pending', 'completed', 'rejected') DEFAULT 'pending',
    audit_notes TEXT,
    audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES users(id)
);

-- 6. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 7. Vendor Certification Table (optional for specific vendor info)
CREATE TABLE IF NOT EXISTS vendor_certification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_certification_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES users(id)
);

-- Create indexes for efficiency
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_business_cert_status ON business_certification(status);
CREATE INDEX idx_product_cert_status ON products(certification_status);
CREATE INDEX idx_feedback_product_id ON feedback(product_id);
CREATE INDEX idx_feedback_consumer_id ON feedback(consumer_id);

-- Insert default roles
INSERT INTO roles (role_name, description) VALUES
('business', 'Business account with certification capabilities'),
('consumer', 'Consumer account for product verification and feedback');

-- Add sample users for testing (password: 'password123')
INSERT INTO users (full_name, email, phone, password_hash, role, is_verified) VALUES
('Business User', 'business@example.com', '1234567890', '$2b$12$8vGCA9Oz6GJ5zHmR/DDbruQSfSnIgIJhYeGYEKQJYEYkYm0HnV7Wi', 'business', TRUE),
('Consumer User', 'consumer@example.com', '0987654321', '$2b$12$8vGCA9Oz6GJ5zHmR/DDbruQSfSnIgIJhYeGYEKQJYEYkYm0HnV7Wi', 'consumer', TRUE); 