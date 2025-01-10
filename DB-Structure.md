
# **Database Structure Document**

## **1. Users Table**

- **Table Name**: `users`
- **Purpose**: Stores all user accounts, whether Farmer, Buyer, or Admin.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `mobile_number` **(VARCHAR)** – unique
    3. `email` **(VARCHAR,** nullable**)** 
    4. `name` **(VARCHAR)**
    5. `profile_picture` **(VARCHAR)** – URL string
    6. `role` (ENUM, UserRole) - e.g., `'FARMER'`, `'BUYER'`, `'ADMIN'`
    7. `status` **(VARCHAR)** – e.g., `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION`, `DELETED`
    8. `block_reason` **(TEXT)** – nullable
    9. `last_login_at` **(TIMESTAMP)** – tracks the latest login
    10. `scheduled_for_deletion_at` **(TIMESTAMP)** – set if user scheduled for removal
    11. `created_at` **(TIMESTAMP)**
    12. `updated_at` **(TIMESTAMP)**
    13. **loginAttempts** **(INTEGER)**
    14. lastLoginAttempt (TIMESTAMP, nullable)
- **Relationships & Notes**:
    - One `users` record can correspond to **FARMER** or **BUYER** expansions in separate tables.
    - Could use a **soft-delete** approach for `scheduled_for_deletion_at` instead of permanently removing rows.

---

## **2. Farmer Table**

- **Table Name**: `farmers`
- **Purpose**: Extended profile details for a **User** who has the FARMER role.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `user_id` **(FK → [users.id](http://users.id/))**
    3. `created_at` **(TIMESTAMP)**
    4. `updated_at` **(TIMESTAMP)**
- **Relationships**:
    - **user_id** references **users(id)** (1:1 relationship if the user’s role includes FARMER).
    - One `farmer` may have multiple **farms**, multiple **produce** items, multiple **bank_accounts**.

---

## **3. Buyer Table**

- **Table Name**: `buyers`
- **Purpose**: Extended profile for a **User** who has the BUYER role.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `user_id` **(FK → [users.id](http://users.id/))**
    3. `gst` **(VARCHAR)** – optional 
    4. `business_name` **(VARCHAR)**
    5. `registration_number` **(VARCHAR)** – optional
    6. `lat_lng` **(VARCHAR)** – store location as “lat-lng” string
    7. `address` **(TEXT)**
    8. `created_at` **(TIMESTAMP)**
    9. `updated_at` **(TIMESTAMP)**
- **Relationships & Notes**:
    - **user_id** references **users(id)** (1:1 if user’s role includes BUYER).
    - For daily price or produce_tag interests, see additional tables.

---

## **4. Farms Table**

- **Table Name**: `farms`
- **Purpose**: A farmer can own multiple farms.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `farmer_id` **(FK → [farmers.id](http://farmers.id/))**
    3. `name` **(VARCHAR)**
    4. `size` **(DECIMAL)**
    5. `address` **(VARCHAR)**
    6. `lat_lng` **(VARCHAR)** – store location as “lat-lng” string
    7. `image` **(VARCHAR)** – optional farm photo
    8. `created_at` **(TIMESTAMP)**
    9. `updated_at` **(TIMESTAMP)**
- **Relationships**:
    - **farmer_id** references **farmers(id)** (1:Many → one farmer can have many farms).
    - **Optional**: Produce can link to farm_id if produce belongs to a specific farm.

---

## **5. Bank Accounts Table**

- **Table Name**: `bank_accounts`
- **Purpose**: Farmers can store multiple bank accounts.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `farmer_id` **(FK → [farmers.id](http://farmers.id/))** 
    3. `account_name` **(VARCHAR)**
    4. `account_number` **(VARCHAR)**
    5. `bank_name` **(VARCHAR)**
    6. `branch_code` **(VARCHAR)**
    7. `is_primary` **(BOOLEAN)**
    8. `created_at` **(TIMESTAMP)**
    9. `updated_at` **(TIMESTAMP)**
- **Relationships**:
    - Typically 1-to-Many from `farmers` to `bank_accounts`.

---

## **6. Produce Table**

- **Table Name**: `produce`
- **Purpose**: Store each produce listing associated with a Farmer.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `farmer_id` **(FK → [farmers.id](http://farmers.id/))**
    3. `farm_id` **(FK → [farms.id](http://farms.id/), nullable)** – if referencing a specific farm
    4. `name` **(VARCHAR)**
    5. description **(VARCHAR)**
    6. `produce_category` (ENUM, ProduceCategory) - (Food Grains, Oilseeds, Fruits, Vegetables, Spices, Fibers, Sugarcane, Flowers, Medicinal and Aromatic Plants)
    7. `quantity` **(DECIMAL)**
    8. unit (VARCHAR)
    9. price_per_unit (DECIMAL(10,2))
    10. `location` **(VARCHAR)** – “lat-lng” if different from farm’s location
    11. `images` **([TEXT])** – store image URLs 
    12. `status` **(VARCHAR)** – “AVAILABLE”, “IN_PROGRESS”, “SOLD”, “CANCELLED”
    13. `harvested_at` **(TIMESTAMP, nullable)** 
    14. `expiry_date` **(TIMESTAMP, nullable)**
    15. `quality_grade` **(VARCHAR)** – e.g. “A”, “B”, “C”, “D”
    16. `created_at` **(TIMESTAMP)**
    17. `updated_at` **(TIMESTAMP)**
    18. produce_tag **(TIMESTAMP)**
    19. imageUrls (TEXT[])
    20. videoUrl (VARCHAR, nullable)
- **Relationships**:
    - **farmer_id** → `farmers(id)`
    - **farm_id** → `farms(id)` (optional)
    - 1-to-Many with **offers** (one produce listing can have many offers)
    - 1-to-Many with QualityAssessments (one produce listing can have Manual Inscpected and Auto generated assessments)
    - Possibly 1-to-1 or 1-to-many with **transactions** if it’s a direct link when sold

---

## **7. Offers Table**

- **Table Name**: `offers`
- **Purpose**: Manage offers from buyers to farmers for produce.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `produce_id` **(FK → [produce.id](http://produce.id/))**
    3. `buyer_id` **(FK → [buyers.id](http://buyers.id/))**
    4. `price` **(DECIMAL)**
    5. `price`_of_buyer **(DECIMAL, nullable)** 
    6. `quantity` **(DECIMAL)**
    7. `status` **(VARCHAR)** – “PENDING”, “ACCEPTED”, “REJECTED”, “CANCELLED”, “CONFIRMED”, “EXPIRED”
    8. `valid_until` **(TIMESTAMP)** – for expiry
    9. `metadata` **(JSON)** – store auto-generated flags, inspection requests, etc.
    10. `message` **(TEXT)** – buyer’s note
    11. `created_at` **(TIMESTAMP)**
    12. `updated_at` **(TIMESTAMP)**
- **Relationships**:
    - **produce_id** → `produce(id)`
    - **buyer_id** → `buyers(id)`

---

## **8. Transactions Table**

- **Table Name**: `transactions`
- **Purpose**: Stores final deals after an offer is completed.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `offer_id` **(FK → [offers.id](http://offers.id/))** – or store final price, quantity from that offer
    3. `farmer_id` **(FK → [farmers.id](http://farmers.id/))**
    4. `buyer_id` **(FK → [buyers.id](http://buyers.id/))**
    5. `produce_id` **(FK → [produce.id](http://produce.id/))**
    6. `status` **(VARCHAR)** – “PENDING”, “COMPLETED”, “CANCELLED”
    7. `final_price` **(DECIMAL)**
    8. `quantity` **(DECIMAL)**
    9. `created_at` **(TIMESTAMP)**
    10. `updated_at` **(TIMESTAMP)**

---

## **9. QualityAssessments Table**

- **Table Name**: `quality_assessments`
- **Purpose**: Store manual or AI-based quality grading info.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `produce_id` **(FK → [produce.id](http://produce.id/))**
    3. `grade` **(VARCHAR)** – “A”, “B”, “C”, “D”
    4. `notes` **(TEXT, nullable)**
    5. `inspector_id` **(UUID)** – if referencing an external inspector or separate field
    6. `images` **([TEXT], nullable)** – up to 3 images
    7. `assessed_at` **(TIMESTAMP, nullable)**
    8. `created_at` **(TIMESTAMP)**
    9. `updated_at` **(TIMESTAMP)**

---

## **10. Inspector Table**

- **Table Name**: `inspectors`
- **Purpose**: Storing or managing manual inspectors.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `name` **(VARCHAR)** – inspector’s  name
    3. `location` **(VARCHAR)** – “lat-lng”
    4. `mobile_number` **(VARCHAR)**
    5. `created_at` **(TIMESTAMP)**
    6. `updated_at` **(TIMESTAMP)**
- **Notes**:
    - No direct link to users.

---

## **11. Ratings Table**

- **Table Name**: `ratings`
- **Purpose**: Ratings and reviews between farmers and buyers.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `rated_user_id` **(FK → [users.id](http://users.id/))**
    3. `rating_user_id` **(FK → [users.id](http://users.id/))**
    4. `transaction_id` **(FK → [transactions.id](http://transactions.id/))** – link to the relevant transaction
    5. `stars` **(DECIMAL(2,1))** – 0–5 rating
    6. `comment` **(TEXT)** – optional
    7. `created_at` **(TIMESTAMP)**
    8. `updated_at` **(TIMESTAMP)**

---

## **13. Synonyms Table**

- **Table Name**: `synonyms`
- **Purpose**: Manage produce synonyms or tags for searching.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `name` **(VARCHAR)** – the main produce_tag 
    3. `words` **(JSON)** – array of synonyms (any language)
    4. `updated_at` **(TIMESTAMP)**

---

## **14. Notifications Table** (Optional Logging)

- **Table Name**: `notifications`
- **Purpose**: Logging notifications or marking them as read/unread.
- **Columns**:
    1. `id` **(PK, UUID)**
    2. `user_id` **(FK → [users.id](http://users.id/))**
    3. `type` **(VARCHAR)** – e.g. “OFFER_CREATED”
    4. `title` **(VARCHAR)**
    5. `message` **(TEXT)**
    6. `read` **(BOOLEAN)** – default false
    7. `read_at` **(TIMESTAMP)** – if read
    8. `created_at` **(TIMESTAMP)**

---

## **16. General Notes**

- **Primary Keys** are recommended as UUID for consistency and microservice compatibility.
- **Timestamps**: `created_at`, `updated_at` in each table for auditing.
- **Deletion**: Some tables might use **soft deletes** (e.g., `deleted_at`) to preserve historical data.
- **Lat/Long**: Using `lat_lng` as a single string (e.g., "12.9716-77.5946") if you prefer, or store as separate numeric columns (`lat`, `lng`).
- **Indices**:
    - Consider indexing columns frequently queried (like `status`, `farmer_id`, `buyer_id`, `produce_id`, `lat_lng` if using geospatial).
    - For synonyms-based searching, you may need text indexes or a dedicated search approach.

---