// models/sellerModel.js
//
// Usage: Call initSellerTables(pool) once at app startup (in app.js or server.js)
// before your server starts listening.
//
// Example in app.js:
//   const { initSellerTables } = require("./models/sellerModel");
//   const { pool } = require("./config/db");
//   initSellerTables(pool).then(() => {
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//   });

/**
 * Creates the sellers table if it does not already exist.
 * aadhar_number stores only masked value (e.g. "XXXX-XXXX-1234") —
 * never the full 12-digit number.
 */
const createSellerTable = async (pool) => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sellers (
      id                  INT AUTO_INCREMENT PRIMARY KEY,

      -- Personal info
      full_name           VARCHAR(120)  NOT NULL,
      email               VARCHAR(160)  NOT NULL UNIQUE,
      mobile              VARCHAR(15)   NOT NULL,
      password_hash       VARCHAR(255)  NOT NULL,
      dob                 DATE,

      -- Shop details
      shop_name           VARCHAR(160)  NOT NULL,
      shop_category       VARCHAR(80)   NOT NULL,
      shop_street         TEXT          NOT NULL,
      shop_city           VARCHAR(80)   NOT NULL,
      shop_state          VARCHAR(80)   NOT NULL,
      shop_pincode        VARCHAR(10)   NOT NULL,
      delivery_charge     DECIMAL(8,2)  NOT NULL DEFAULT 0,
      shop_description    TEXT,

      -- KYC documents
      pan_number          VARCHAR(12)   NOT NULL,
      -- Stores masked Aadhar only: "XXXX-XXXX-1234"
      aadhar_number       VARCHAR(20)   NOT NULL,
      pan_card_url        TEXT,
      profile_pic_url     TEXT,          


      -- Payment details
      upi_id              VARCHAR(100)  NOT NULL,
      upi_mobile          VARCHAR(15)   NOT NULL,

      -- Pickup address
      same_as_shop        TINYINT(1)    NOT NULL DEFAULT 1,
      pickup_street       TEXT,
      pickup_city         VARCHAR(80),
      pickup_state        VARCHAR(80),
      pickup_pincode      VARCHAR(10),

      -- Working hours
      working_hours_from  TIME          NOT NULL DEFAULT '09:00:00',
      working_hours_to    TIME          NOT NULL DEFAULT '18:00:00',

      -- Consent
      terms_accepted      TINYINT(1)    NOT NULL DEFAULT 0,
      commission_accepted TINYINT(1)    NOT NULL DEFAULT 0,

      -- Admin control
      is_approved         TINYINT(1)    NOT NULL DEFAULT 0,
      is_active           TINYINT(1)    NOT NULL DEFAULT 1,

      -- Timestamps
      created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_email (email),
      INDEX idx_is_approved (is_approved),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("sellers table ready");
};

/**
 * Creates the email_otps table if it does not already exist.
 * expires_at is stored in UTC and compared with UTC_TIMESTAMP() in queries.
 */
const createOtpTable = async (pool) => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS email_otps (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      email      VARCHAR(160) NOT NULL,
      otp        VARCHAR(10)  NOT NULL,
      expires_at DATETIME     NOT NULL,   -- stored in UTC
      used       TINYINT(1)   NOT NULL DEFAULT 0,
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_email_otp (email),
      INDEX idx_used (used)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("email_otps table ready");
};

/**
 * Initialises all seller-related tables.
 * Call this once at application startup.
 */
const initSellerTables = async (pool) => {
  try {
    await createSellerTable(pool);
    await createOtpTable(pool);
    console.log("All seller tables initialised successfully");
  } catch (err) {
    console.error("Failed to initialise seller tables:", err);
    throw err; // re-throw so the app does not start with broken DB
  }
};

module.exports = { createSellerTable, createOtpTable, initSellerTables };