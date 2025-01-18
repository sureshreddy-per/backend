# System Documentation

## 1. Introduction

### 1.1 Purpose

This document provides a **detailed technical overview** of the backend system that powers the agricultural marketplace platform. It is intended for developers, architects, and DevOps engineers who need to understand the **architecture**, **data model**, **APIs**, **deployment**, and **operational aspects** of the system.

### 1.2 Scope

- **Backend Architecture**: Microservices or modular architecture, including how they interact.  
- **Core Modules**: Authentication, Produce Management, AI Integration, Offers, Inspections, Transactions, etc.  
- **Data Model**: Database schema (tables, relationships) and rationale.  
- **Workflow**: End-to-end flows (produce creation, offer generation, acceptance, completion).  
- **Security**: Role-based access control, authentication methods, data protection.  
- **Deployment & Monitoring**: Environment setup, CI/CD, logging, and monitoring strategies.

---

## 2. High-Level Architecture

Below is a conceptual diagram showing major components and interactions:

```
                           +-------------------------+
                           |       Mobile App        |
                           | (Farmer / Buyer / ...)  |
                           +-----------+-------------+
                                       |
                                       v  (HTTPS/REST)
                  +-----------------------------------------+
                  |       API Gateway / Load Balancer       |
                  +-----------------+------------------------+
                                    | (Routes requests)
     +------------------------------+------------------------------+
     |                             |                              |
     v                             v                              v
+-----------+                +------------+                 +-------------+
| Auth Svc  |                | Produce Svc|                 | Offers Svc  |
|           |                |            |                 |             |
| - OTP     |                | - AI calls |                 | - Auto-generate
| - JWT     |                | - Media    |                 |   offers
| - RBAC    |                | - Quality  |                 | - Lifecycle
+-----------+                +------------+                 +-------------+
     |                                                          |
     v                                                          |
+-----------+                                           +----------------+
|User Mgmt  |                                           | Inspection Svc |
| (Roles,   |                                           | - Manual Inspec|
|  Profiles)|                                           | - Fee Calc     |
+-----------+                                           +----------------+
                                                                |
                                                                v
                                                        +-----------------+
                                                        | Transaction Svc |
                                                        | - Offer -> Tx   |
                                                        | - Completion    |
                                                        +-----------------+

                  +-----------------------------------------+
                  |         Database (e.g., PostgreSQL)     |
                  |   (Geospatial / Category-Specific Data) |
                  +-----------------------------------------+

                  +-----------------------------------------+
                  |           Object Storage (S3)           |
                  |   (Photos/Videos for produce listings)  |
                  +-----------------------------------------+
```

### 2.1 Major Components

1. **Auth Service**  
   - Manages user registration/login via mobile OTP. Issues and validates JWT tokens.  
   - Maintains RBAC (Role-Based Access Control) for different user roles (FARMER, BUYER, INSPECTOR, ADMIN).

2. **Produce Service**  
   - Handles creation and management of produce listings.  
   - Integrates with an external AI Vision API for produce classification and category-specific quality metrics.  
   - Manages media uploads (photos/videos), stored in an object storage solution (e.g., S3).

3. **Offers Service**  
   - Automatically generates offers for buyers within a 100 km radius.  
   - Uses buyer daily price ranges (min/max) and produce’s AI quality grade to compute initial offer price.  
   - Manages offer states (ACTIVE, PENDING, ACCEPTED, etc.) and triggers real-time **recalculation** if the buyer updates daily pricing.

4. **Inspection Service**  
   - Supports manual inspection requests by buyer or farmer.  
   - Inspector uploads results, which override AI-based data.  
   - Calculates inspection fees (base + distance, capped at 1000 INR).

5. **Transactions Service**  
   - Once an offer is marked COMPLETED, creates a transaction record.  
   - Coordinates rating/feedback between buyer and farmer after completion.

6. **Database**  
   - **PostgreSQL** recommended (with **PostGIS** for geospatial support).  
   - Contains user data, produce listings, offers, quality assessments, synonyms for multi-language, and transaction records.

7. **Object Storage**  
   - E.g., Amazon S3 or Google Cloud Storage for storing large media files.  
   - The system stores file metadata/URLs in the DB, not the binary files themselves.

---

## 3. Services & Modules (Detailed)

### 3.1 Authentication Service

- **Responsibilities**:  
  1. **OTP Generation & Verification**:  
     - `/check_mobile`, `/register`, `/request_otp`, `/verify` endpoints.  
     - Stores OTP codes in `user_otp` table with expiration timestamps.  
  2. **JWT Token Issuance**:  
     - Generates JWTs upon successful OTP verification.  
  3. **Role Management**:  
     - Default role = FARMER or BUYER upon registration, can be updated by ADMIN.  
  4. **Security**:  
     - Validates tokens in a shared library or via an API gateway before routing to other services.

### 3.2 Produce Service

- **Responsibilities**:  
  1. **Produce Creation**:  
     - Create DB record with farmer ID, quantity, location (lat/long or string), optional harvest date.  
  2. **Media Handling**:  
     - Accept up to 3 photos (1 mandatory) + 1 optional video (up to 50MB).  
     - Upload to object storage, store references in `produce_media` table.  
  3. **AI Integration**:  
     - After media is uploaded, calls external AI Vision API → returns name, category, variety, quality grade, confidence, defects, recommendations, and **category-specific** parameters (moisture, brix, etc.).  
     - Stores these in `quality_assessment`.  
  4. **Location & Fee Calculation**:  
     - If an inspection is requested, calculates 100 + 10/km (capped at 1000).  
     - (Optional) Expose method for distance-based queries to find the nearest inspector or to confirm 100 km radius for offers.

### 3.3 Quality Assessment Module

- Can be a sub-module within **Produce Service** or a separate microservice.  
- **Data Storage**:  
  - `quality_assessment` or specialized tables for each category.  
- **Category-Specific Fields**:  
  - Food Grains: `Variety`, `Moisture Content`, etc.  
  - Oilseeds: `Oil Content`, `Seed Size`, `Moisture Content`, etc.  
  - And so on for Fruits, Vegetables, Spices, Fibers, Sugarcane, Flowers, Medicinal Plants.  
- **Override Mechanism**:  
  - If a manual inspection happens, the new data becomes the **primary** reference.

### 3.4 Offers Service

- **Key Logic**:  
  1. **Offer Generation**:  
     - On produce creation → find buyers within 100 km (using lat/long + geospatial queries).  
     - For each buyer, retrieve buyer’s daily min/max pricing → compute price using AI quality grade.  
     - Create `offers` record with `status = ACTIVE`.  
  2. **Offer Lifecycle Management**:  
     - **Buyer Actions**: Confirm (→ `PENDING`), Reject (→ `REJECTED`), Modify (→ `PENDING`).  
     - **Farmer Actions**: Accept (→ `ACCEPTED`), Reject (→ `CANCELLED`).  
     - **Automatic Expiry**: If accepted, a 24-hour window to deliver. If missed, → `EXPIRED`.  
  3. **Price Recalculation**:  
     - If buyer changes min/max pricing, recalculate any `ACTIVE` offer in real time.

### 3.5 Inspection Service

- **Manual Inspection Process**:  
  1. Farmer/Buyer requests an inspection (only once per produce if unsold).  
  2. System assigns an **INSPECTOR** (role-based) who physically visits.  
  3. Inspector uploads photos, documents new category-specific metrics, possibly overriding AI data.  
  4. New `quality_assessment` record or an update marking manual data as primary.  
  5. Notification to farmer/buyer with revised produce quality details.

### 3.6 Transactions Service

- **Responsibilities**:  
  1. **Transaction Creation**:  
     - When buyer marks an offer COMPLETED, create a `transaction` record.  
  2. **Rating & Feedback**:  
     - Provide endpoints for buyer/farmer to rate each other (1–5).  
     - Store in `ratings` table.  
  3. **History & Reporting**:  
     - Retrieve past transactions, optionally allow basic analytics (e.g., total transactions, average rating).

### 3.7 Multi-Language & Synonym Handling

- **Synonyms Table**:  
  - `produce_synonyms` (example) with fields: `produce_id`, `language_code`, `synonym`.  
  - Searching by any recognized synonym → returns the canonical `produce_id`.  
- **Localization**:  
  - The system can store multi-language fields or rely on front-end localization.  
  - For **variety**, **color**, etc., store them in a structured format allowing language-based display.

---

## 4. Data Model & Database Schema

### 4.1 Core Tables (Simplified)

1. **`users`**  
   - `user_id (PK)`, `name`, `mobile_number (unique)`, `role`, `created_at`, `updated_at`.

2. **`produce`**  
   - `produce_id (PK)`, `farmer_id (FK->users)`, `name`, `category`, `variety`, `quantity`, `location` (string or lat/long), `harvested_date`, `description`, `created_at`, `updated_at`.

3. **`produce_media`**  
   - `media_id (PK)`, `produce_id (FK->produce)`, `media_type (PHOTO/VIDEO)`, `media_url`, `file_size_mb`, `created_at`, `updated_at`.

4. **`quality_assessment`**  
   - `quality_assessment_id (PK)`, `produce_id (FK->produce)`, `assessment_type (AI/MANUAL)`, `quality_grade (1–10)`, `confidence (0–100)`, `defects` (array/JSON), `recommendations` (array/JSON), `category_specific_data` (JSON or references to child table), `created_at`, `updated_at`.

5. **`offers`**  
   - `offer_id (PK)`, `produce_id (FK->produce)`, `buyer_id (FK->users)`, `price`, `status (ACTIVE, PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED, COMPLETED)`, `created_at`, `updated_at`.

6. **`transactions`**  
   - `transaction_id (PK)`, `offer_id (FK->offers)`, `produce_id (FK->produce)`, `buyer_id (FK->users)`, `farmer_id (FK->users)`, `completed_at`, `created_at`, `updated_at`.

7. **`ratings`**  
   - `rating_id (PK)`, `from_user_id`, `to_user_id`, `rating_value (1–5)`, `comments (nullable)`, `created_at`, `updated_at`.

8. **`user_otp`**  
   - `user_otp_id (PK)`, `user_id (FK->users)`, `otp_code`, `is_valid`, `created_at`, `expires_at`.

9. **`produce_synonyms`** (Optional)  
   - `synonym_id (PK)`, `produce_id (FK->produce)`, `language_code`, `synonym`.

10. **`inspection`** (If separate from `quality_assessment`)  
    - `inspection_id (PK)`, `produce_id (FK->produce)`, `inspector_id (FK->users)`, `fee_amount`, `created_at`, `updated_at`.

*(Additional indexing and constraints—especially geospatial—are recommended but not shown in detail.)*

---

## 5. Data Flow & Workflows

### 5.1 Produce Creation Flow

1. **Farmer** calls **POST** `/produce` with the basic produce data + media.  
2. **System** stores produce record, uploads media to object storage, references in `produce_media`.  
3. **System** triggers **AI Vision** to classify produce → receives:
   - `name, category, variety, quality_grade, confidence, defects, recommendations, category-specific data`.
4. **System** inserts a record in `quality_assessment`.  
5. **(Optional)** Show the calculated inspection fee to farmer.

### 5.2 Offer Generation Flow

1. **On produce creation** or update, the **Offers Service** queries all buyers within 100 km (geospatial).  
2. For each buyer:
   - Retrieve **daily min/max** for that category (or produce).  
   - Calculate price = `Min + (QualityGrade/10)*(Max-Min)`.  
   - Insert a new record in `offers` with `status = ACTIVE`.  
3. **Buyer** sees these offers in “Active Offers” list.

### 5.3 Buyer Confirms or Modifies Offer

1. **Buyer** calls **PATCH** `/offers/{offer_id}` to confirm or reject (or modify the price if allowed).  
2. If confirmed → `status = PENDING`.  
3. **Farmer** sees the PENDING offer → can **accept** or **reject** it.

### 5.4 Delivery & Transaction Completion

1. Once **farmer** accepts → `status = ACCEPTED`, 24-hour delivery window starts.  
2. Farmer delivers produce.  
3. **Buyer** marks the offer as `COMPLETED`.  
4. **System** creates a **transaction** record.  
5. Both parties can leave **ratings**.

### 5.5 Manual Inspection Flow

1. **Farmer** or **Buyer** requests a manual inspection **before** produce is sold.  
2. **Inspection Service** assigns an **INSPECTOR**.  
3. Inspector visits location, updates data in `quality_assessment` (manual overrides AI).  
4. Farmers/buyers receive notification of the updated results.

### 5.6 Recalculation of Offer Price (Buyer Updates Min/Max)

1. **Buyer** updates daily min/max price for a category.  
2. **Offers Service** finds all `ACTIVE` offers for that buyer in the same category.  
3. Recomputes new `price` using the same formula.  
4. Updates `offers` record, optionally notifies the farmer if needed.

---

## 6. Security & Authentication

- **Mobile OTP Flow**  
  1. User enters mobile number at `/check_mobile`.  
  2. If not registered, `/register` triggers OTP to that number.  
  3. User enters OTP at `/verify` → upon success, user record created or updated → JWT issued.  
- **JWT Tokens**  
  - Passed in `Authorization: Bearer <token>`.  
  - Decoded by **Auth Service** or a shared middleware.  
  - Expires after a configurable time (e.g., 24 hours).  
- **RBAC**  
  - FARMER can create/edit own produce, see own offers.  
  - BUYER can see offers in their range, confirm or reject.  
  - INSPECTOR role can finalize manual inspection.  
  - ADMIN can manage user roles, synonyms, fee caps, etc.

---

## 7. Deployment & Environments

### 7.1 Recommended Environments

1. **Development**  
   - Local or small-scale environment for feature development.  
2. **Staging**  
   - Mirroring production environment, running final QA tests and integration tests.  
3. **Production**  
   - High-availability setup with load balancers, auto-scaling, monitoring, and backups.

### 7.2 CI/CD Pipeline

- **Version Control**: Use Git with a standard branching strategy (e.g., GitFlow).  
- **Build & Test**: Automated unit and integration tests run on each pull request.  
- **Security Scans**: Tools like SonarQube or Snyk for code analysis and vulnerability checks.  
- **Deploy**: Use your preferred deployment platform (AWS, GCP, Azure, etc.) with appropriate scaling and monitoring setup.

### 7.3 Monitoring & Logging

- **Centralized Logging**: Aggregate logs from all microservices (e.g., ELK stack, Datadog, or Splunk).  
- **Metrics**: Track resource usage (CPU/memory), number of active offers, OTP success rates, etc.  
- **Alerting**: Set thresholds for downtime or performance degradation, send alerts via Slack/email/SMS.

---

## 8. Operational Considerations

### 8.1 Performance & Scalability

- **Geospatial Indexing**:  
  - Use PostGIS to handle the “within 100 km” radius queries efficiently.  
- **Bulk Offer Creation**:  
  - If a produce listing triggers thousands of offers, handle creation asynchronously (e.g., using background jobs or message queues).  
- **AI Calls**:  
  - Batch or queue requests to the external AI service if media volume is large.  
  - Implement retry logic or fallback if AI service is unavailable.

### 8.2 Data Consistency & Concurrency

- **Offer State**:  
  - Once an offer is `PENDING`, the buyer’s updated min/max pricing should not alter the price.  
- **Optimistic Locking**:  
  - Potential approach for critical data updates, ensuring no double acceptance or conflicting edits.

### 8.3 Disaster Recovery

- **Backups**:  
  - Regular backups of PostgreSQL (daily or more frequent).  
  - Retain media in redundant object storage (versioning or cross-region replication if critical).  
- **Rollback Strategy**:  
  - Keep scripts or runbooks for quickly reverting failed deployments.  
  - Database migrations should be reversible or carefully versioned.

---

## 9. Future Enhancements & Extensions

- **Payments**:  
  - Integrate a payment gateway for in-app escrow if desired in a future phase.  
- **Logistics**:  
  - Tie into external APIs for shipping or driver assignment.  
- **Complex Pricing Models**:  
  - Real-time supply-demand analytics, dynamic pricing adjustments.  
- **Advanced Localization**:  
  - Deeper multi-language support, automated translations for produce descriptions.  
- **Analytics & BI**:  
  - Provide dashboards for admin, generate insights on produce quality trends, buyer patterns, etc.

---

## 10. Conclusion

The **system architecture** laid out here provides a **scalable**, **modular**, and **secure** foundation for the agriculture marketplace platform. By integrating **AI-based produce classification**, **category-specific quality assessments**, **automatic offer generation**, and **manual inspections**, the platform delivers a streamlined experience to **farmers** and **buyers** alike. Careful consideration of **geospatial queries**, **OTP-based authentication**, **RBAC**, **transaction management**, and **notifications** ensures reliability and clarity throughout the transaction lifecycle. 

Ongoing improvements—such as deeper multi-language localization, payment integration, and advanced analytics—can be added over time, leveraging the microservices structure. Adhering to this documentation will help maintain **consistent design and implementation** across all development teams and environments.

**End of Document**