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
User provides: location, quantity, 1-3 images, and optionally: location name, video URL, harvest date
System validates all inputs (coordinates, URLs, dates, quantities)
Creates produce with PENDING_AI_ASSESSMENT status
2. AI Assessment Process:
System uses the first image for AI analysis
Emits produce.created event with produce ID and image URL
AI analyzes the image to determine produce category and quality grade
3. Quality Assessment:
Once AI analysis completes, system receives quality.assessment.completed event
Validates quality grade (0-10) and category
Calculates inspection fee based on:
Nearest inspector's location (within 100km)
If no inspector found within 100km, applies maximum fee cap
Base fee + distance-based fee + category multiplier
Final Status Update:
If all steps succeed: Updates produce with quality grade, category, inspection fee, and sets status to AVAILABLE
If any step fails: Sets status to ASSESSMENT_FAILED
When successful, emits produce.ready event for offer generation

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

### 4.3. Multi-Language & Synonym Management

- **FR-7**: Maintain a **master produce name** plus local synonyms (e.g., “Okra” → “Bhindi” → “Vendakkai”).
- **FR-8**: Searching by any known synonym returns the same produce record.
- **FR-9**: Localization: display produce names, variety fields, color, etc. in the user’s preferred language (if translations exist).

### 4.4. Buyer Daily Price Range

- **FR-10**: Each buyer sets **min** and **max** daily prices for each produce category (or specific produce).
- **FR-11**: Admin can limit how often buyers can update these prices per day.

### 4.5. Automatic Offer Creation

- **FR-12**: Once a farmer’s produce is listed, the system finds **all buyers within 100 km**.
- **FR-13**: For each buyer, automatically compute an **offer price** using:
\[
\text{OfferPrice} = \text{MinPrice} +
\left(\frac{\text{QualityGrade}}{10}\right)
\times (\text{MaxPrice} - \text{MinPrice})
\]
- **FR-14**: Create an **offer** with `status = ACTIVE` for each buyer. Buyer does **not** manually create it.

### 4.6. Offer Lifecycle & Negotiation

- **FR-15**: Buyer sees offers in `ACTIVE`. They can:
    1. **Confirm** (→ `PENDING`),
    2. **Reject** (→ `REJECTED`), or
    3. **Modify** (optional negotiation, → `PENDING`).
- **FR-16**: Farmer views `PENDING` offers; can **Accept** (→ `ACCEPTED`) or **Reject** (→ `CANCELLED`).
- **FR-17**: On `ACCEPTED`, a **24-hour delivery window** opens (configurable).

### 4.7. Real-Time Offer Recalculation

- **FR-18**: If buyer updates daily min/max prices, **all `ACTIVE` offers** for matching categories must **recalculate** using the same formula.
- **FR-19**: Offers in other statuses (PENDING, ACCEPTED, etc.) remain as is.
- **FR-20**: Update the offer records and notify farmer (optional).

### 4.8. Inspection (AI & Manual)

- **FR-21**: **AI inspection** automatically runs on produce creation, populating category-specific fields.
- **FR-22**: **Manual inspection** can be requested by buyer or farmer once per item; inspector visits, uploads results, overrides AI fields if needed.
- **FR-23**: Inspection fee = **100 INR + 10 INR/km** (capped at 1000 INR).

### 4.9. Delivery & Transaction Completion

- **FR-24**: Farmer delivers goods within the set window (e.g., 24 hours). If not delivered, offer → `EXPIRED`.
- **FR-25**: Buyer inspects goods, marks `COMPLETED`; system creates a **transaction** record.
- **FR-26**: Payment and logistics occur **outside** the platform.

### 4.10. Rating & Feedback

- **FR-27**: After `COMPLETED`, both farmer and buyer rate each other (1–5), optionally leave textual feedback.
- **FR-28**: Ratings stored for user profiles/reputation.

### 4.11. Notifications

- **FR-29**: Push notifications for new/modified offers, inspection updates, acceptance, and completion.
- **FR-30**: Optional in-app notification center to store and mark read/unread.

---

## 5. Transaction Lifecycle Overview

1. **Create Produce** → AI-based classification & category-specific parameters
2. **Auto-Generate Offers** (ACTIVE) for all buyers in range
3. **Buyer** → Confirm/Reject/Modify (PENDING or REJECTED)
4. **Farmer** → Accept (ACCEPTED) or Reject (CANCELLED)
5. **Delivery Window** → If not delivered, EXPIRED; else buyer **marks COMPLETED**
6. **Transaction** recorded
7. **Ratings & Feedback** → End of process

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
    - Category-specific parameter names (e.g., “Moisture Content”) can also be translated if desired.

---

## 7. Acceptance Criteria

1. **Produce Creation & AI**
    - At least one photo required, AI classifies produce category, populates **all** mandatory parameters for that category.
2. **Category-Specific Fields**
    - Food Grains must have (Variety, Moisture %, Foreign Matter %, Protein %, Wastage %), etc.
3. **Buyer Daily Price → Auto Offers**
    - Offers auto-created for buyers within 100 km; price is computed from min/max and AI grade.
4. **Offer Recalculation**
    - Updating buyer’s price range modifies all `ACTIVE` offers in real-time.
5. **Manual Inspection**
    - Overwrites AI fields if requested, updates produce quality data.
6. **Transaction Completion**
    - After buyer marks COMPLETED, both parties can leave ratings.
7. **Multi-Language & Synonyms**
    - Searching by synonyms returns correct produce.
    - Produce details reflect user’s preferred language (if available).

---

## 9. Future Enhancements (Out of Scope for Initial Release)

1. **Integrated Payments**
    - In-app escrow or payment gateways.
2. **Logistics Integration**
    - Tying into transport services for shipping or last-mile delivery.
3. **Advanced ML Pricing**
    - Factoring market data, supply-demand curves.
4. **Complex Multi-Language Expansion**
    - Automated translations for all produce attributes.
5. **Multiple Price Ranges**
    - Buyers setting different min/max for sub-varieties or time-based pricing changes.

---

### Conclusion

This **Final PRD** encapsulates all requirements for a robust, AI-driven agricultural marketplace that **strictly** enforces category-specific quality parameters, automates offer creation and recalculation, supports multi-language functionality, and tracks transactions from listing to completion. The system aims to **simplify** produce trading for farmers and **streamline** the buying process by providing immediate, transparent offers aligned with each buyer’s daily price thresholds.