-- ============================================================
-- UNIFIED ACCOMMODATION FINDER — MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS unified_accommodation;
USE unified_accommodation;

-- ─────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password      VARCHAR(255)  NOT NULL,
  phone         VARCHAR(15),
  role          ENUM('user','owner') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 2. PROPERTIES
-- ─────────────────────────────────────────────
CREATE TABLE properties (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  owner_id         INT NOT NULL,
  type             ENUM('PG','Hostel','Flat') NOT NULL,
  title            VARCHAR(200) NOT NULL,
  location         VARCHAR(300) NOT NULL,
  rent             DECIMAL(10,2) NOT NULL,
  total_rooms      INT NOT NULL DEFAULT 1,
  available_rooms  INT NOT NULL DEFAULT 0,
  vacancy_status   ENUM('available','full') NOT NULL DEFAULT 'available',
  facilities       TEXT,                   -- comma-separated or JSON string
  image_path       VARCHAR(500),           -- store path, NOT the image
  description      TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_properties_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_properties_owner   (owner_id),
  INDEX idx_properties_type    (type),
  INDEX idx_properties_vacancy (vacancy_status),
  INDEX idx_properties_location(location(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 3. REQUESTS  (Student → Owner)
-- ─────────────────────────────────────────────
CREATE TABLE requests (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  property_id  INT NOT NULL,
  message      TEXT,
  contact      VARCHAR(15),
  status       ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_requests_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_requests_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_requests_user     (user_id),
  INDEX idx_requests_property (property_id),
  INDEX idx_requests_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 4. FLATMATE REQUESTS
-- ─────────────────────────────────────────────
CREATE TABLE flatmate_requests (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  budget      DECIMAL(10,2),
  location    VARCHAR(300),
  gender      ENUM('male','female','any') NOT NULL DEFAULT 'any',
  description TEXT,
  contact     VARCHAR(15),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_flatmate_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_flatmate_user     (user_id),
  INDEX idx_flatmate_gender   (gender),
  INDEX idx_flatmate_location (location(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 5. ATTENDANCE  (PG & Hostel only)
-- ─────────────────────────────────────────────
CREATE TABLE attendance (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  property_id  INT NOT NULL,
  tenant_name  VARCHAR(100) NOT NULL,
  room_no      VARCHAR(20)  NOT NULL,
  date         DATE NOT NULL,
  status       ENUM('present','absent') NOT NULL DEFAULT 'present',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_attendance_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- Prevent duplicate attendance records per tenant per day
  UNIQUE KEY uq_attendance (property_id, tenant_name, room_no, date),

  INDEX idx_attendance_property (property_id),
  INDEX idx_attendance_date     (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 6. FEES
-- ─────────────────────────────────────────────
CREATE TABLE fees (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  property_id  INT NOT NULL,
  tenant_name  VARCHAR(100) NOT NULL,
  room_no      VARCHAR(20)  NOT NULL,
  rent         DECIMAL(10,2) NOT NULL,
  month        VARCHAR(20)  NOT NULL,   -- e.g. "2024-06"
  status       ENUM('paid','unpaid') NOT NULL DEFAULT 'unpaid',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_fees_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- One fee record per tenant per month per property
  UNIQUE KEY uq_fees (property_id, tenant_name, room_no, month),

  INDEX idx_fees_property (property_id),
  INDEX idx_fees_month    (month),
  INDEX idx_fees_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Sample seed data (optional)
-- ─────────────────────────────────────────────
-- Password below is bcrypt hash of "password123"
INSERT INTO users (name, email, password, phone, role) VALUES
  ('Alice Owner',   'alice@example.com',   '$2b$10$examplehashalice',   '9000000001', 'owner'),
  ('Bob Student',   'bob@example.com',     '$2b$10$examplehashbob',     '9000000002', 'user'),
  ('Carol Student', 'carol@example.com',   '$2b$10$examplehashcarol',   '9000000003', 'user');

INSERT INTO properties (owner_id, type, title, location, rent, total_rooms, available_rooms, vacancy_status, facilities, image_path, description) VALUES
  (1, 'PG',     'Sunrise PG',      'Koregaon Park, Pune', 6500,  10, 3, 'available', 'WiFi,Meals,Laundry',   '/uploads/pg1.jpg',     'Clean PG near IT hub.'),
  (1, 'Hostel', 'Green Hostel',    'Viman Nagar, Pune',   5000,  20, 5, 'available', 'WiFi,Security,Gym',    '/uploads/hostel1.jpg', 'Budget-friendly hostel.'),
  (1, 'Flat',   'Cozy 2BHK Flat',  'Baner, Pune',         18000,  4, 1, 'available', 'Parking,WiFi,AC',      '/uploads/flat1.jpg',   'Furnished 2BHK flat.');

INSERT INTO flatmate_requests (user_id, name, budget, location, gender, description, contact) VALUES
  (2, 'Bob',   7000, 'Koregaon Park, Pune', 'male',   'Looking for a male flatmate, non-smoker.', '9000000002'),
  (3, 'Carol', 8000, 'Baner, Pune',         'female', 'Working professional seeking flatmate.',   '9000000003');

-- ─────────────────────────────────────────────
-- 7. FLATMATE CONNECTS  (Student → Student)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flatmate_connects (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  sender_id            INT NOT NULL,
  flatmate_request_id  INT NOT NULL,
  target_user_id       INT NOT NULL,
  message              TEXT,
  contact              VARCHAR(15),
  status               ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_fc_sender  FOREIGN KEY (sender_id)           REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fc_target  FOREIGN KEY (target_user_id)      REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fc_post    FOREIGN KEY (flatmate_request_id) REFERENCES flatmate_requests(id) ON DELETE CASCADE,

  INDEX idx_fc_sender (sender_id),
  INDEX idx_fc_target (target_user_id),
  INDEX idx_fc_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
