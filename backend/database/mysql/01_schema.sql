-- One-shot setup: drop DB, create schema, and import CSV files.
-- Run this file in MySQL Workbench with a user that has FILE/LOCAL INFILE permission.

DROP DATABASE IF EXISTS asset_management;
CREATE DATABASE asset_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE asset_management;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NULL,
  phone_number VARCHAR(30) NULL,
  role VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  avatar_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  KEY idx_users_role (role)
);

CREATE TABLE categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_categories_code (code)
);

CREATE TABLE rooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_code VARCHAR(50) NOT NULL,
  building_code VARCHAR(30) NOT NULL,
  floor INT NOT NULL,
  class_using VARCHAR(100) NULL,
  department VARCHAR(150) NULL,
  capacity INT NOT NULL,
  status VARCHAR(30) NOT NULL,
  teacher_name VARCHAR(150) NULL,
  class_studying VARCHAR(100) NULL,
  desk_count INT NOT NULL DEFAULT 0,
  chair_count INT NOT NULL DEFAULT 0,
  speaker_count INT NOT NULL DEFAULT 0,
  air_conditioner_count INT NOT NULL DEFAULT 0,
  microphone_count INT NOT NULL DEFAULT 0,
  glass_door_status VARCHAR(30) NULL,
  ceiling_fan_count INT NOT NULL DEFAULT 0,
  curtain_status VARCHAR(30) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_rooms_room_code (room_code),
  KEY idx_rooms_building_code (building_code)
);

CREATE TABLE assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  card_number VARCHAR(50) NOT NULL,
  asset_name VARCHAR(200) NOT NULL,
  provider VARCHAR(200) NULL,
  country VARCHAR(100) NULL,
  department VARCHAR(150) NULL,
  classroom VARCHAR(100) NULL,
  asset_type VARCHAR(100) NULL,
  item_category VARCHAR(100) NULL,
  manufacture_year INT NULL,
  unit_price DECIMAL(18,2) NULL,
  quantity INT NOT NULL DEFAULT 0,
  original_price DECIMAL(18,2) NULL,
  fund_source VARCHAR(100) NULL,
  usage_time INT NULL,
  purchase_date DATE NULL,
  usage_year INT NULL,
  buyer_user_id BIGINT UNSIGNED NULL,
  room_id BIGINT UNSIGNED NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'IN_USE',
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_assets_card_number (card_number),
  KEY idx_assets_status (status),
  KEY idx_assets_item_category (item_category),
  CONSTRAINT fk_assets_buyer_user_id FOREIGN KEY (buyer_user_id) REFERENCES users(id),
  CONSTRAINT fk_assets_room_id FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  note VARCHAR(1000) NULL,
  manager_group VARCHAR(100) NULL,
  priority VARCHAR(30) NULL,
  manager_name VARCHAR(150) NULL,
  attachment_url VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'NEW',
  is_draft TINYINT(1) NOT NULL DEFAULT 0,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_requests_status (status),
  KEY idx_requests_created_by_user_id (created_by_user_id),
  CONSTRAINT fk_requests_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE asset_transfers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  source_building VARCHAR(50) NULL,
  source_classroom VARCHAR(100) NULL,
  giver_user_id BIGINT UNSIGNED NULL,
  receiver_user_id BIGINT UNSIGNED NULL,
  target_building VARCHAR(50) NULL,
  target_classroom VARCHAR(100) NULL,
  received_date DATE NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_asset_transfers_asset_id (asset_id),
  KEY idx_asset_transfers_received_date (received_date),
  CONSTRAINT fk_asset_transfers_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id),
  CONSTRAINT fk_asset_transfers_giver_user_id FOREIGN KEY (giver_user_id) REFERENCES users(id),
  CONSTRAINT fk_asset_transfers_receiver_user_id FOREIGN KEY (receiver_user_id) REFERENCES users(id)
);

CREATE TABLE asset_ratings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  reviewer_user_id BIGINT UNSIGNED NULL,
  reviewer_name VARCHAR(150) NULL,
  rating_stars INT NOT NULL,
  rated_at DATETIME NOT NULL,
  rating_note VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_asset_ratings_asset_id (asset_id),
  KEY idx_asset_ratings_rated_at (rated_at),
  CONSTRAINT fk_asset_ratings_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id),
  CONSTRAINT fk_asset_ratings_reviewer_user_id FOREIGN KEY (reviewer_user_id) REFERENCES users(id),
  CONSTRAINT chk_asset_ratings_stars CHECK (rating_stars BETWEEN 1 AND 5)
);

CREATE TABLE asset_liquidations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  card_number VARCHAR(50) NOT NULL,
  asset_name VARCHAR(200) NOT NULL,
  liquidation_date DATE NOT NULL,
  liquidation_reason VARCHAR(500) NULL,
  unit_name VARCHAR(150) NULL,
  quantity INT NOT NULL DEFAULT 1,
  liquidated_by_user_id BIGINT UNSIGNED NULL,
  liquidated_by_name VARCHAR(150) NULL,
  attachments_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_asset_liquidations_asset_id (asset_id),
  KEY idx_asset_liquidations_liquidation_date (liquidation_date),
  CONSTRAINT fk_asset_liquidations_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id),
  CONSTRAINT fk_asset_liquidations_liquidated_by_user_id FOREIGN KEY (liquidated_by_user_id) REFERENCES users(id)
);

-- CSV import section.
-- Update this path only if your project folder changes.
SET @base_path = 'C:/Users/Tien Hop/Desktop/datab/excel';
SET SESSION sql_mode = REPLACE(@@sql_mode, 'NO_AUTO_VALUE_ON_ZERO', '');

LOAD DATA LOCAL INFILE 'C:/Users/Tien Hop/Desktop/datab/excel/users.csv'
INTO TABLE users
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(id, username, password_hash, full_name, address, phone_number, role, status, avatar_url);

LOAD DATA LOCAL INFILE 'C:/Users/Tien Hop/Desktop/datab/excel/categories.csv'
INTO TABLE categories
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(id, code, name, type);

LOAD DATA LOCAL INFILE 'C:/Users/Tien Hop/Desktop/datab/excel/rooms.csv'
INTO TABLE rooms
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(id, room_code, building_code, floor, class_using, department, capacity, status, teacher_name, class_studying, desk_count, chair_count, speaker_count, air_conditioner_count, microphone_count, glass_door_status, ceiling_fan_count, curtain_status);

LOAD DATA LOCAL INFILE 'C:/Users/Tien Hop/Desktop/datab/excel/assets.csv'
INTO TABLE assets
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(
  id, card_number, asset_name, provider, country, department, classroom, asset_type, item_category,
  manufacture_year, unit_price, quantity, original_price, fund_source, usage_time, purchase_date,
  usage_year, @buyer_user_id, room_id, status, note
)
SET buyer_user_id = IF(@buyer_user_id REGEXP '^[0-9]+$' AND CAST(@buyer_user_id AS UNSIGNED) BETWEEN 1 AND 8, CAST(@buyer_user_id AS UNSIGNED), NULL);

LOAD DATA LOCAL INFILE 'C:/Users/Tien Hop/Desktop/datab/excel/requests.csv'
INTO TABLE requests
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(id, title, note, manager_group, priority, manager_name, attachment_url, status, is_draft, @created_by_user_id)
SET created_by_user_id = IF(@created_by_user_id REGEXP '^[0-9]+$' AND CAST(@created_by_user_id AS UNSIGNED) BETWEEN 1 AND 8, CAST(@created_by_user_id AS UNSIGNED), NULL);

LOAD DATA LOCAL INFILE 'C:/Users/Tien Hop/Desktop/datab/excel/asset_transfers.csv'
INTO TABLE asset_transfers
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(id, asset_id, source_building, source_classroom, @giver_user_id, @receiver_user_id, target_building, target_classroom, received_date, note)
SET
  giver_user_id = IF(@giver_user_id REGEXP '^[0-9]+$' AND CAST(@giver_user_id AS UNSIGNED) BETWEEN 1 AND 8, CAST(@giver_user_id AS UNSIGNED), NULL),
  receiver_user_id = IF(@receiver_user_id REGEXP '^[0-9]+$' AND CAST(@receiver_user_id AS UNSIGNED) BETWEEN 1 AND 8, CAST(@receiver_user_id AS UNSIGNED), NULL);

LOAD DATA LOCAL INFILE 'C:/Users/Tien Hop/Desktop/datab/excel/asset_ratings.csv'
INTO TABLE asset_ratings
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(id, asset_id, @reviewer_user_id, reviewer_name, rating_stars, rated_at, rating_note)
SET reviewer_user_id = IF(@reviewer_user_id REGEXP '^[0-9]+$' AND CAST(@reviewer_user_id AS UNSIGNED) BETWEEN 1 AND 8, CAST(@reviewer_user_id AS UNSIGNED), NULL);

LOAD DATA LOCAL INFILE 'C:/Users/Tien Hop/Desktop/datab/excel/asset_liquidations.csv'
INTO TABLE asset_liquidations
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(id, asset_id, card_number, asset_name, liquidation_date, liquidation_reason, unit_name, quantity, @liquidated_by_user_id, liquidated_by_name, attachments_json)
SET liquidated_by_user_id = IF(@liquidated_by_user_id REGEXP '^[0-9]+$' AND CAST(@liquidated_by_user_id AS UNSIGNED) BETWEEN 1 AND 8, CAST(@liquidated_by_user_id AS UNSIGNED), NULL);

SELECT 'users' AS table_name, COUNT(*) AS total_rows FROM users
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL SELECT 'assets', COUNT(*) FROM assets
UNION ALL SELECT 'requests', COUNT(*) FROM requests
UNION ALL SELECT 'asset_transfers', COUNT(*) FROM asset_transfers
UNION ALL SELECT 'asset_ratings', COUNT(*) FROM asset_ratings
UNION ALL SELECT 'asset_liquidations', COUNT(*) FROM asset_liquidations;
