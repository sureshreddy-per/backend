# Final Product Requirements Document (PRD)

## 1. Product Overview

**Product Name**: 

**Purpose**:

A digital platform that allows **farmers** to list produce with AI-based quality assessments and enables **buyers** to automatically receive offers based on daily price ranges and produce quality. The system also supports manual inspections, multi-language interfaces, synonyms for produce names, and thorough tracking from listing to final transaction.

**Stakeholders**:

- **Farmers**: Create produce listings, deliver goods, and rate buyers.
- **Buyers**: Set daily price ranges, confirm or reject offers, and rate farmers.
- **Inspectors**: Perform manual assessments (if requested).
- **Administrators**: Configure fees, oversee user roles, manage synonyms and translations, and resolve disputes.

---

## 2. Goals & Objectives

1. **Streamlined Onboarding**: Easy registration/login via mobile OTP.
2. **AI-Driven Quality Assessment**: Automatically classify produce, provide category-specific parameters (moisture, brix, fiber length, etc.).
3. **Automatic Offer Generation**: Leverage the buyer’s daily min/max price and produce’s AI quality grade to create offers without buyer input.
4. **Real-Time Recalculation**: Update existing active offers instantly if a buyer changes their daily price.
5. **Category-Specific Quality Data**: Ensure each produce type (Food Grains, Oilseeds, etc.) captures its unique metrics.
6. **Location-Based Matching**: Generate offers for buyers within a 100 km radius (configurable).
7. **Multi-Language & Synonym Support**: Harmonize produce names across multiple languages/regions.
8. **End-to-End Tracking**: Comprehensive offer lifecycle, optional manual inspection, final transaction, and user ratings.


## produce creation and assessment flow:

1. Initial Produce Creation:
   - User provides: location, quantity, 1-3 images (at least one image required)
   - Optional inputs: location name, video URL, harvest date, initial name
   - System validates all inputs (coordinates, URLs, dates, quantities)
   - If name not provided, sets default as "Unidentified Produce"
   - Creates produce with PENDING_AI_ASSESSMENT status

2. AI Assessment Process:
   - System uses the first image for AI analysis
   - Emits produce.created event with produce ID and image URL
   - AI analyzes the image to:
     * Detect produce name
     * Determine produce category
     * Assess quality grade (0-10)
     * Calculate confidence level
     * Identify specific attributes

3. Name Processing and Verification:
   - STEP 1: Initial Database Check
     * Checks detected name against existing produce names
     * Searches for similar names in existing synonyms (80% similarity)
     * If match found, uses existing produce name
   
   - STEP 2: AI Synonym Generation (if no match in Step 1)
     * Generates synonyms in English
     * Creates translations in all supported Indian languages
     * Includes regional variations and market names
   
   - STEP 3: Generated Terms Verification
     * Checks all AI-generated terms against existing database
     * Includes both synonyms and translations
     * If match found with any generated term, uses existing produce name
     * Only creates new entries if no matches found in any step

4. Quality Assessment:
   - Validates quality grade (0-10) and category
   - Updates produce with quality assessment results
   - Status Update Logic:
     * If confidence level ≥ 80%: Sets status to AVAILABLE
     * If confidence level < 80%: Sets status to PENDING_INSPECTION
   - When successful, emits produce.ready event for offer generation

5. Inspection Fee Calculation:
   - Calculates fee based on:
     * Nearest inspector's location (within 100km)
     * Base fee + distance-based fee
     * Category-specific multipliers
   - If no inspector found within 100km, applies maximum fee cap

Key Features:
- Mandatory image requirement for AI assessment
- Three-step name verification to prevent duplicates
- Intelligent synonym matching with 80% similarity threshold
- Prioritized Indian language support
- Comprehensive logging for debugging
- Graceful error handling at each step

Error Handling:
- If AI assessment fails: Sets status to ASSESSMENT_FAILED
- If image validation fails: Rejects produce creation
- If name processing fails: Maintains original name
- Logs all errors for monitoring and debugging

## 3. Key Features & Scope

1. **Mobile OTP Authentication**
    - Quick registration and secure login.
2. **Produce Creation**
    - Photo/Video upload; AI-based classification of category, variety, and quality.
    - Category-specific parameters captured (moisture, oil content, brix, etc.).
3. **Automatic Offers**
    - Buyer daily min/max price → Computed offer price based on AI grade.
4. **Offer Lifecycle**
    - Active → Pending → Accepted → Delivery Window → Completed (or Rejected/Canceled/Expired).
5. **Manual Inspection**
    - Overrides AI assessment if requested.
6. **Real-Time Updates**
    - Recalculate any Active offers upon buyer price changes.
7. **Multi-Language & Synonyms**
    - Unified produce data across local/regional names.
8. **Rating & Feedback**
    - Post-transaction, both farmer and buyer rate each other.

---

## 4. Detailed Functional Requirements

### 4.1. Authentication & User Management

- **FR-1**: Users register/log in via **mobile OTP**.
- **FR-2**: Roles = **FARMER**, **BUYER**, **ADMIN**, **INSPECTOR** (extendable).
- **FR-3**: Issue secure tokens (e.g., JWT). Validate on all subsequent requests.

### 4.2. Produce Creation & AI Assessment

- **FR-4**: **Farmer** creates a produce entry with:
    - **1 required photo**, up to **2 optional photos**, **1 optional video** (≤ 50 MB).
    - **quantity**, **location** (string or lat/long), optional **harvest date**.
- **FR-5**: **AI** identifies:
    - Produce **name** (e.g., Rice, Cotton).
    - **Category** (Food Grains, Oilseeds, Fruits, Vegetables, etc.).
    - **Variety** (e.g., Sonamasuri).
    - **Quality Grade** (1–10), **Confidence** (0–100), **defects**, and **recommendations**.
- **FR-6**: **Inspection Fee** (if relevant) = 100 INR base + 10 INR/km, capped at 1000 INR.

### 4.2.1. Category-Specific Quality Parameters

For each category, **AI** (or **manual** inspection) must capture the following fields **strictly**:

1. **Food Grains**
    - **Variety**, **Moisture Content (%)**, **Foreign Matter (%)**, **Protein Content (%)**, **Wastage (%)**
2. **Oilseeds**
    - **Oil Content (%)**, **Seed Size** (small/medium/large), **Moisture Content (%)**
3. **Fruits**
    - **Sweetness (Brix)**, **Size** (small/medium/large), **Color** (e.g., yellow/red), **Ripeness** (ripe/unripe)
4. **Vegetables**
    - **Freshness Level** (fresh/slightly wilted), **Size** (small/medium/large), **Color**
5. **Spices**
    - **Volatile Oil Content (%)**, **Aroma Quality** (strong/mild), **Purity (%)**
6. **Fibers**
    - **Staple Length (mm)**, **Fiber Strength (g/tex)**, **Trash Content (%)**
7. **Sugarcane**
    - **Variety**, **Brix Content (%)**, **Fiber Content (%)**, **Stalk Length (cm)**
8. **Flowers**
    - **Freshness Level** (fresh/slightly wilted), **Fragrance Quality** (strong/mild), **Stem Length (cm)**
9. **Medicinal & Aromatic Plants**
    - **Essential Oil Yield (%)**, **Purity of Extracts (%)**, **Moisture Content (%)**

**FR-CAT-1**: System must store these fields in the `quality_assessment` data or in a separate but linked structure.

**FR-CAT-2**: The UI must display them clearly for both **AI** and **manual** inspections.

### 4.3. Buyer Preferences & Daily Price Range

- **FR-10**: Each buyer sets preferences for:
    - List of specific produce names they are interested in
    - Notification preferences (enabled/disabled)
    - Notification methods (EMAIL, SMS)
- **FR-11**: When buyer updates preferences:
    1. System cancels all pending/active offers for produce no longer in preferences
    2. Notifies farmers about cancelled offers
    3. Generates new offers for produce that matches updated preferences
- **FR-12**: Each buyer sets **min** and **max** daily prices for each produce name they are interested in
- **FR-13**: Admin can limit how often buyers can update these prices per day

### 4.4. Automatic Offer Creation

- **FR-14**: Once a farmer's produce is listed, the system:
    1. Validates the produce name against the synonym service
    2. Finds **all buyers within 100 km** who have listed this produce in their preferences
    3. Only generates offers for buyers whose preferences include the produce name
- **FR-15**: For each eligible buyer, automatically compute an **offer price** using:
\[
\text{OfferPrice} = \text{MinPrice} +
\left(\frac{\text{QualityGrade}}{10}\right)
\times (\text{MaxPrice} - \text{MinPrice})
\]
- **FR-16**: Create an **offer** with `status = ACTIVE` for each eligible buyer. Buyer does **not** manually create it.

### 4.5. Offer Lifecycle & Negotiation

- **FR-17**: Buyer sees offers in `ACTIVE`. They can:
    1. **Confirm** (→ `PENDING`),
    2. **Reject** (→ `REJECTED`), or
    3. **Modify** (optional negotiation, → `PENDING`).
- **FR-18**: Farmer views `PENDING` offers; can **Accept** (→ `ACCEPTED`) or **Reject** (→ `CANCELLED`).
- **FR-19**: On `ACCEPTED`, a **24-hour delivery window** opens (configurable).

### 4.6. Real-Time Offer & Preference Updates

- **FR-18**: If buyer updates their preferences:
    1. System identifies all pending/active offers
    2. Cancels offers for produce no longer in preferences
    3. Sends notifications to affected farmers
    4. Generates new offers for newly added produce names
- **FR-19**: If buyer updates daily min/max prices:
    1. **All `ACTIVE` offers** for matching produce names must **recalculate** using the same formula
    2. Offers in other statuses (PENDING, ACCEPTED, etc.) remain unchanged
    3. Update the offer records and notify farmer
- **FR-20**: All preference and price updates are validated against the synonym service to ensure canonical produce names are used

### 4.7. Inspection (AI & Manual)

- **FR-21**: **AI inspection** automatically runs on produce creation, populating category-specific fields.
- **FR-22**: **Manual inspection** can be requested by buyer or farmer once per item; inspector visits, uploads results, overrides AI fields if needed.
- **FR-23**: Inspection fee = **100 INR + 10 INR/km** (capped at 1000 INR).

### 4.8. Delivery & Transaction Completion

- **FR-24**: Farmer delivers goods within the set window (e.g., 24 hours). If not delivered, offer → `EXPIRED`.
- **FR-25**: Buyer inspects goods, marks `COMPLETED`; system creates a **transaction** record.
- **FR-26**: Payment and logistics occur **outside** the platform.

### 4.9. Rating & Feedback

- **FR-27**: After `COMPLETED`, both farmer and buyer rate each other (1–5), optionally leave textual feedback.
- **FR-28**: Ratings stored for user profiles/reputation.

### 4.10. Notifications

- **FR-29**: Push notifications for new/modified offers, inspection updates, acceptance, and completion.
- **FR-30**: Optional in-app notification center to store and mark read/unread.

---

## 5. Transaction Lifecycle Overview

1. **Create Produce** → AI-based classification & produce-specific parameters
2. **Validate Produce Name** → Check against synonym service
3. **Auto-Generate Offers** (ACTIVE) for buyers who:
   - Are within range (100km)
   - Have matching produce name in preferences
   - Have set valid price ranges
4. **Buyer** → Confirm/Reject/Modify (PENDING or REJECTED)
5. **Farmer** → Accept (ACCEPTED) or Reject (CANCELLED)
6. **Delivery Window** → If not delivered, EXPIRED; else buyer **marks COMPLETED**
7. **Transaction** recorded
8. **Ratings & Feedback** → End of process

---

## 6. Non-Functional Requirements

1. **Performance**
    - Must handle concurrency of many produce listings and automatic offer generations.
    - Recalculation for buyer price changes should be near real-time for `ACTIVE` offers.
2. **Scalability**
    - Up to 1 million users, potentially thousands of offers for a single produce listing.
    - Use geospatial indexing (e.g., PostGIS) for distance queries.
3. **Security**
    - All endpoints require valid tokens; OTP codes have short expiry.
    - Role-based access for inspector or admin privileges.
4. **Reliability & Availability**
    - 99.9% uptime for core produce and offer features.
    - Frequent DB backups and recovery plan.
5. **Usability**
    - Farmers can create listings in ≤ 5 steps (photo, location, quantity, etc.).
    - Buyers can easily set daily price ranges and see updated offers instantly.
6. **Localization**
    - Multi-language support for produce names, synonyms, and UI strings.
    - Category-specific parameter names (e.g., "Moisture Content") can also be translated if desired.

---

## 7. Acceptance Criteria

1. **Produce Creation & AI**
    - At least one photo required
    - AI classifies produce name (validated against synonyms)
    - Populates **all** mandatory parameters for that produce type
2. **Buyer Preferences**
    - Preferences must use canonical produce names from synonym service
    - Updating preferences properly handles existing offers
    - New offers only generated for produce matching preferences
3. **Buyer Daily Price → Auto Offers**
    - Offers auto-created only for buyers:
      * Within 100 km
      * With matching produce name in preferences
      * With valid price ranges
4. **Offer Recalculation**
    - Updating preferences cancels irrelevant offers
    - Updating price range modifies all `ACTIVE` offers in real-time

---

## 9. Future Enhancements (Out of Scope for Initial Release)

1. **Integrated Payments**
    - In-app escrow or payment gateways.
2. **Logistics Integration**
    - Tying into transport services for shipping or last-mile delivery.
3. **Advanced ML Pricing**
    - Factoring market data, supply-demand curves.
4. **Complex Multi-Language Expansion**
    - ~~Automated translations for all produce attributes.~~ (Now implemented via AI-powered synonym generation)
5. **Multiple Price Ranges**
    - Buyers setting different min/max for sub-varieties or time-based pricing changes.
6. **Enhanced Synonym Generation**
    - Real-time synonym updates based on user feedback
    - Integration with agricultural databases for specialized terms
    - Regional dialect support and vernacular variations

---

## 8. Database Schema & Tables

### Core Tables

1. **`produce`**
   - `id` (UUID, PK)
   - `farmer_id` (UUID, FK)
   - `farm_id` (UUID, FK, nullable)
   - `name` (TEXT)
   - `description` (TEXT)
   - `product_variety` (TEXT)
   - `produce_category` (ENUM)
   - `quantity` (DECIMAL)
   - `unit` (TEXT)
   - `price_per_unit` (DECIMAL)
   - `location` (TEXT)
   - `location_name` (TEXT)
   - `inspection_fee` (DECIMAL)
   - `is_inspection_requested` (BOOLEAN)
   - `inspection_requested_by` (UUID)
   - `inspection_requested_at` (TIMESTAMP)
   - `images` (TEXT[])
   - `status` (ENUM)
   - `harvested_at` (TIMESTAMP)
   - `expiry_date` (TIMESTAMP)
   - `quality_grade` (INTEGER)
   - `video_url` (TEXT)
   - `assigned_inspector` (UUID)

2. **`quality_assessments`**
   - `id` (UUID, PK)
   - `produce_id` (UUID, FK)
   - `produce_name` (TEXT)
   - `category` (ENUM)
   - `quality_grade` (FLOAT)
   - `confidence_level` (FLOAT)
   - `defects` (TEXT[])
   - `recommendations` (TEXT[])
   - `category_specific_assessment` (JSONB)
   - `metadata` (JSONB)

3. **`offers`**
   - `id` (UUID, PK)
   - `produce_id` (UUID, FK)
   - `buyer_id` (UUID, FK)
   - `farmer_id` (UUID, FK)
   - `price_per_unit` (DECIMAL)
   - `quantity` (DECIMAL)
   - `status` (ENUM)
   - `valid_until` (TIMESTAMP)
   - `is_auto_generated` (BOOLEAN)
   - `buyer_min_price` (DECIMAL)
   - `buyer_max_price` (DECIMAL)
   - `quality_grade` (INTEGER)
   - `distance_km` (DECIMAL)
   - `inspection_fee` (DECIMAL)
   - `rejection_reason` (TEXT)
   - `cancellation_reason` (TEXT)
   - `is_price_overridden` (BOOLEAN)
   - `price_override_reason` (TEXT)
   - `price_override_at` (TIMESTAMP)
   - `metadata` (JSONB)

4. **`transactions`**
   - `id` (UUID, PK)
   - `offer_id` (UUID, FK)
   - `farmer_id` (UUID, FK)
   - `buyer_id` (UUID, FK)
   - `produce_id` (UUID, FK)
   - `status` (ENUM)
   - `final_price` (DECIMAL)
   - `quantity` (DECIMAL)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

5. **`ratings`**
   - `id` (UUID, PK)
   - `from_user_id` (UUID, FK)
   - `to_user_id` (UUID, FK)
   - `rating_value` (INTEGER)
   - `comments` (TEXT)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

6. **`notifications`**
   - `id` (UUID, PK)
   - `user_id` (UUID, FK)
   - `type` (ENUM)
   - `title` (TEXT)
   - `message` (TEXT)
   - `metadata` (JSONB)
   - `is_read` (BOOLEAN)
   - `created_at` (TIMESTAMP)

### Category-Specific Quality Parameters

1. **Food Grains**
    - **Variety**: Type of grain
    - **Moisture Content (%)**: Acceptable range varies by grain type
    - **Foreign Matter (%)**: Impurities and non-grain material
    - **Protein Content (%)**: Nutritional value indicator
    - **Wastage (%)**: Damaged or unusable grains
    - **Broken Grains (%)**: Percentage of broken kernels

2. **Oilseeds**
    - **Oil Content (%)**: Primary quality indicator
    - **Seed Size**: small/medium/large classification
    - **Moisture Content (%)**: Critical for storage stability
    - **Foreign Matter (%)**: Impurities level

3. **Fruits**
    - **Sweetness (Brix)**: Sugar content measurement
    - **Size**: small/medium/large classification
    - **Color**: Specific to fruit type (e.g., yellow/red)
    - **Ripeness**: ripe/unripe assessment
    - **Brix Content**: Numerical sweetness measure

4. **Vegetables**
    - **Freshness Level**: fresh/slightly wilted assessment
    - **Size**: small/medium/large classification
    - **Color**: Specific to vegetable type
    - **Moisture Content (%)**: Freshness indicator
    - **Foreign Matter (%)**: Cleanliness measure

5. **Spices**
    - **Volatile Oil Content (%)**: Flavor strength indicator
    - **Aroma Quality**: strong/mild assessment
    - **Purity (%)**: Absence of adulterants
    - **Oil Content (%)**: Essential oils presence
    - **Moisture Content (%)**: Storage stability indicator

6. **Fibers**
    - **Staple Length (mm)**: Fiber length measurement
    - **Fiber Strength (g/tex)**: Durability indicator
    - **Trash Content (%)**: Impurities level

7. **Sugarcane**
    - **Variety**: Type of sugarcane
    - **Brix Content (%)**: Sugar content indicator
    - **Fiber Content (%)**: Structural composition
    - **Stalk Length (cm)**: Physical measurement

8. **Flowers**
    - **Freshness Level**: fresh/slightly wilted assessment
    - **Fragrance Quality**: strong/mild assessment
    - **Stem Length (cm)**: Physical measurement
    - **Color**: Variety-specific assessment

9. **Medicinal & Aromatic Plants**
    - **Essential Oil Yield (%)**: Active compound content
    - **Purity of Extracts (%)**: Quality measure
    - **Moisture Content (%)**: Storage stability indicator

### Error Handling & Validation

1. **Produce Creation**
   - Validate quantity > 0
   - Validate price_per_unit >= 0
   - Validate inspection_fee >= 0
   - Validate quality_grade between -1 and 10
   - Validate required images array is not empty
   - Validate location format

2. **Offer Management**
   - Validate price_per_unit >= 0
   - Validate quantity > 0
   - Validate buyer_min_price <= buyer_max_price
   - Validate distance_km within configured radius
   - Validate offer expiry dates

3. **Quality Assessment**
   - Validate confidence_level between 0 and 100
   - Validate quality_grade between 0 and 10
   - Validate category-specific parameters within acceptable ranges
   - Handle missing or invalid assessment data gracefully

4. **System-wide Error Handling**
   - Log all errors with appropriate context
   - Implement retry mechanisms for transient failures
   - Provide clear error messages for client applications
   - Maintain audit logs for critical operations

### Notification Types & Events

1. **Produce Related**
   - New produce listing created
   - AI assessment completed
   - Manual inspection requested
   - Manual inspection completed
   - Produce status updates

2. **Offer Related**
   - New offer generated
   - Offer confirmed by buyer
   - Offer accepted by farmer
   - Offer rejected
   - Offer cancelled
   - Offer expired
   - Price recalculation updates

3. **Transaction Related**
   - Transaction initiated
   - Delivery window started
   - Transaction completed
   - Rating received

4. **User Preferences**
   - Buyer preference updates
   - Daily price range updates
   - New produce matching preferences

### Transaction Status Flow

1. **Status Types**
   - `INITIATED`: When offer is accepted
   - `IN_DELIVERY`: During 24-hour delivery window
   - `COMPLETED`: After buyer confirms delivery
   - `CANCELLED`: If either party cancels
   - `EXPIRED`: If delivery window passes

2. **Status Transitions**
   - INITIATED → IN_DELIVERY: When delivery window starts
   - IN_DELIVERY → COMPLETED: When buyer confirms
   - IN_DELIVERY → EXPIRED: After 24 hours without confirmation
   - Any Status → CANCELLED: On explicit cancellation

3. **Status Validations**
   - Only allow forward transitions
   - Validate all required fields for each status
   - Ensure proper user permissions for transitions
   - Maintain status change history in metadata

---

### User Roles & Permissions

1. **FARMER**
   - Create and manage produce listings
   - Upload images and videos
   - View and respond to offers
   - Request manual inspections
   - Rate buyers after transactions
   - View own transaction history

2. **BUYER**
   - Set and update preferences
   - Set daily price ranges
   - View and respond to auto-generated offers
   - Request manual inspections
   - Rate farmers after transactions
   - View purchase history

3. **INSPECTOR**
   - View assigned inspection requests
   - Perform manual quality assessments
   - Override AI-generated assessments
   - Upload inspection photos
   - Set inspection status

4. **ADMIN**
   - Manage user roles and permissions
   - Configure system parameters
   - Handle dispute resolution
   - View system metrics and reports
   - Manage produce synonyms
   - Configure inspection fees

### Buyer Preferences Structure

1. **Produce Preferences**
   - List of preferred produce names
   - Category-specific preferences
   - Quality grade requirements
   - Quantity ranges
   - Location preferences

2. **Price Settings**
   - Daily min/max prices per produce
   - Price update frequency limits
   - Auto-offer price calculation rules
   - Price override permissions

3. **Notification Settings**
   - Notification types (EMAIL, SMS, PUSH)
   - Frequency of notifications
   - Event-specific preferences
   - Quiet hours configuration

4. **Location Settings**
   - Primary location
   - Maximum distance radius
   - Multiple location support
   - Geofencing options

5. **Quality Requirements**
   - Minimum quality grade
   - Category-specific requirements
   - Inspection preferences
   - Certification requirements

### System Configurations

1. **Fee Structure**
   - Base inspection fee
   - Distance-based fee calculation
   - Category-specific multipliers
   - Maximum fee caps

2. **Time Windows**
   - Delivery window duration
   - Offer validity period
   - Price update frequency limits
   - Rating submission window

3. **Distance Settings**
   - Maximum radius for offers
   - Distance calculation method
   - Location validation rules
   - Geofencing parameters

4. **Quality Assessment**
   - AI confidence thresholds
   - Manual inspection triggers
   - Override rules
   - Category-specific parameters

---

### Conclusion

This **Final PRD** encapsulates all requirements for a robust, AI-driven agricultural marketplace that **strictly** enforces category-specific quality parameters, automates offer creation and recalculation, supports multi-language functionality, and tracks transactions from listing to completion. The system aims to **simplify** produce trading for farmers and **streamline** the buying process by providing immediate, transparent offers aligned with each buyer's daily price thresholds.