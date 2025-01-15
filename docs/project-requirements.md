
# Backend System Requirements

## 1. Architectural & Technical Requirements

1. **Architecture Style**  
   - **Microservices** or **Modular Monolith** approach:
     - Clear separation of concerns (Auth, Produce, Offers, Inspection, etc.).
     - Each module/service should have well-defined APIs or interfaces.
   - **API-First** design with RESTful endpoints (potentially GraphQL, if needed).

2. **Programming Language & Framework**  
   - A modern backend framework (e.g., **Node.js/Express**, **Spring Boot/Java**, **Django/Flask** in Python, etc.).
   - Follow the organization’s standard or team preference, ensuring robust community support.

3. **Database & Storage**  
   - **Relational Database** (e.g., **PostgreSQL**, **MySQL**) with:
     - **Geospatial** support (e.g., PostGIS in PostgreSQL) for 100 km radius calculations.
   - Media (photos/videos) stored in **object storage** (e.g., Amazon S3, Google Cloud Storage), with URLs in the DB.
   - **Category-Specific Data Storage**:
     - Option A: Single `quality_assessment` table with a **JSONB** field for category parameters.
     - Option B: Separate child tables for each produce category (FoodGrains, Oilseeds, etc.).

4. **Authentication & Security**  
   - **Mobile OTP** workflow:
     - `/check_mobile`, `/register`, `/verify`, `/request_otp` endpoints.
   - **Token-based** authentication (JWT or similar).
   - **Role-Based Access Control** (RBAC) for Farmers, Buyers, Inspectors, Admin.
   - Secure all endpoints (HTTPS), handle input validation, implement rate-limiting where needed.

5. **AI Integration**  
   - **External call** to an AI Vision API (e.g., OpenAI Vision API or similar) after media upload.
   - Must handle potential timeouts and errors (retry mechanism or fallback strategy).
   - Store AI results (produce name, category, variety, quality grade, defects, recommendations).

6. **Manual Inspection Flow**  
   - Endpoint(s) for requesting inspection, assigning inspector, uploading manual inspection results.
   - Overwrites AI-based quality data if a manual inspection is performed.

7. **Offers & Pricing**  
   - Automatic creation of offers for **buyers within 100 km** of the produce location.
   - **Buyer daily min/max** price → formula with produce’s AI quality grade → final offer price.
   - Real-time recalculation if buyer updates min/max while the offer is still `ACTIVE`.

8. **Status Management & Workflow**  
   - Offers: `ACTIVE`, `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `EXPIRED`, `COMPLETED`.
   - Produce: created by farmer, linked to assessments, can only be sold once (or handle multiple if partial sales are allowed—business rule).
   - Transactions: created when an offer is marked `COMPLETED` by the buyer.

9. **Multi-Language & Synonyms**  
   - **Synonym management** for produce names (e.g., “Okra”, “Bhindi”, “Vendakkai”).
   - Store synonyms and language codes in DB, ensure searching by any synonym maps to the same produce ID.
   - Optional translation tables or fields for user interface text or produce descriptions.

10. **Notifications**  
    - **Push** notifications or in-app messaging whenever offers are created, confirmed, inspected, etc.
    - Integration with FCM, APNs, or an SMS provider.

---

## 2. Functional Requirements (Backend Endpoints & Logic)

1. **Authentication & User Management**  
   - Endpoints: `/check_mobile`, `/register`, `/request_otp`, `/verify`.
   - Store OTP in DB with expiration. Invalidate upon successful use.
   - Return user token (JWT) upon successful login or registration.

2. **Produce Management**  
   - **Create Produce** (POST `/produce`):
     - Accept photo(s), video (max 50MB), quantity, location, optional harvest date.
     - Trigger AI call → store AI results in `quality_assessment`.
   - **Retrieve/Update** produce details (GET/PUT `/produce/{id}`), with role-based permissions (only owner can update).

3. **Quality Assessment**  
   - **AI-based**:
     - Called automatically upon produce creation, store results in DB.
   - **Manual**:
     - Endpoint to request manual inspection (POST `/inspection/request`).
     - Inspector updates quality fields (PUT `/inspection/{id}`).
     - System marks manual as primary if done before produce is sold.

4. **Offers**  
   - **Auto-Generation**:
     - On produce creation, system calculates which buyers are in range (≤ 100 km).
     - For each buyer, compute offer price from min/max + AI grade.
     - Create an offer with `ACTIVE` status.
   - **Buyer Actions** (GET, PATCH `/offers`):
     - Confirm → `PENDING`, Reject → `REJECTED`, Modify → `PENDING` (with new price).
   - **Farmer Actions** (GET, PATCH `/offers`):
     - Accept → `ACCEPTED`, Reject → `CANCELLED`.
   - **Expiry Logic**:
     - After acceptance, 24-hour window to deliver. If missed, `EXPIRED`.

5. **Buyer Daily Pricing**  
   - Endpoints to set or update min/max price for each produce category.
   - Trigger recalculation for `ACTIVE` offers upon update.

6. **Transactions & Completion**  
   - Once buyer confirms delivery → `COMPLETED`, create a record in `transactions`.
   - **Rating & Feedback** endpoints for both farmer and buyer after completion.

7. **Category-Specific Quality Fields**  
   - Make sure each produce category (Food Grains, Oilseeds, Fruits, Vegetables, etc.) has the required parameters:
     - E.g., Food Grains: `Variety, Moisture Content (%), Foreign Matter (%), Protein Content (%), Wastage (%)`, etc.
   - Store them consistently in `quality_assessment` or related table.

8. **Multi-Language & Synonym Support**  
   - DB structure for storing synonyms with language codes.
   - Searching produce by any recognized synonym returns correct item.

---

## 3. Non-Functional Requirements

1. **Performance & Scalability**  
   - Handle large volume of concurrent listing and offer creation.  
   - DB must efficiently handle geo-distance queries (e.g., using PostGIS).  
   - Recalculation of offers in bulk should be done asynchronously if needed.

2. **Security**  
   - Enforce HTTPS for all external endpoints.  
   - Validate input to prevent SQL injection, XSS, etc.  
   - Use RBAC for sensitive operations (only ADMIN can change fee rules, only INSPECTOR can finalize manual assessments, etc.).

3. **Reliability & Availability**  
   - Aim for **99.9%** uptime of core services (produce listing, offer creation, etc.).  
   - Implement backups for critical data (users, produce, transactions).

4. **Maintainability**  
   - Well-structured code with separation of concerns (controllers, services, repositories).  
   - Use version control, continuous integration, and automated testing.  
   - API documentation with Swagger/OpenAPI.

5. **Logging & Monitoring**  
   - Centralized logging of all major events (offer created, inspection requested, etc.).  
   - Monitoring (metrics, alerts) for system health and performance.

6. **Extensibility**  
   - Easy to add new produce categories or additional AI parameters.  
   - Potential integration with payment gateways or logistics services in future.

7. **Localization**  
   - Potential translation of parameter labels for each language.  
   - Provide fallback to default language (e.g., English) if translation not available.

8. **Data Privacy**  
   - Minimal PII stored (name, mobile, role).  
   - GDPR or local data protection compliance if relevant to region.

---

## 4. Development & Delivery Requirements

1. **Environments**  
   - **Dev**, **Staging**, and **Production** environments.  
   - Automated CI/CD pipeline (build, test, deploy).

2. **Version Control & Branching**  
   - Use Git with a standard branching model (e.g., GitFlow or trunk-based).  
   - Pull requests, code reviews, and test coverage checks.

3. **Test Coverage**  
   - Unit tests for core modules (Auth, Offers, Produce).  
   - Integration tests for AI calls, geospatial distance checks, OTP flow, etc.  
   - Load testing to confirm performance at scale.

4. **Documentation**  
   - Maintain an **API specification** (Swagger/OpenAPI).  
   - Developer guides for environment setup and architecture overview.  
   - Release notes or changelog for new features.

5. **Deployment**  
   - Containerization (Docker) recommended for consistent deployments.  
   - Use orchestration (Kubernetes, ECS, etc.) if you anticipate high scale.
