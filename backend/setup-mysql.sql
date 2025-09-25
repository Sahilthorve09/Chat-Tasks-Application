-- Chat & Tasks Application MySQL Setup
-- Run this script in MySQL Workbench or MySQL CLI

-- Create database
CREATE DATABASE IF NOT EXISTS chattasks;

-- Use the database
USE chattasks;

-- Show tables (should be empty initially, Sequelize will create them)
SHOW TABLES;

-- Grant permissions (adjust username/password as needed)
-- GRANT ALL PRIVILEGES ON chattasks.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;