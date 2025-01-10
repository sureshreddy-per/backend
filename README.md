# **README for Agricultural Marketplace Backend**

Below are the **essential requirements** for constructing an **agricultural marketplace** backend that connects **Farmers**, **Buyers**, and **Admins**. The system must handle **authentication**, **role management**, **produce listings**, **offers**, **transactions**, **quality checks**, **inspections**, **synonyms**, **file uploads**, **notifications**, and more. These requirements should guide the AI agent’s code generation or scaffolding process.

---

## 1. **Authentication & Authorization**

1. **User Registration & Login**  
   - Phone-based (OTP).  
   - Roles: FARMER, BUYER, ADMIN.

2. **Token Issuance & Validation**  
   - Issues JWT tokens (user ID, roles, expiration).  
   - Public endpoints (OTP request/verify) vs. protected endpoints (must have valid token).

3. **Logout & Account Deletion**  
   - Invalidate tokens, log users out.  
   - Schedule data removal only after the “delete user” action.

---

## 2. **User & Role Management**

1. **User Profiles**  
   - Basic info: name, mobile, email, blocked status, profilePicture.  
   - Statuses: ACTIVE, INACTIVE (for logged out), SUSPENDED, PENDING_VERIFICATION, DELETED.  
   - Block/unblock (isBlocked, blockReason).  
   - Must track lastLoginAt, deletedAt, scheduledForDeletionAt.  
   - Ability to update name, mobile, email, blocked status, profilePicture.

2. **Roles & Permissions**  
   - **FARMER**: manage produce, accept/reject offers, request premium inspection, etc.  
   - **BUYER**: browse produce, create/cancel offers, modify orders up to 2 times, request premium inspection, etc.  
   - **ADMIN**: oversee data, moderate users, etc.

---

## 3. **Farmer-Specific Capabilities**

1. **Farmer Profile**  
   - A separate Farmer table linked to Users.  
   - Extended info: rating, totalRatings, produce items, quality assessments.  
   - Multiple Farms possible, each with location, size, address, image.

2. **Bank Account Management**  
   - Multiple accounts, one marked primary.  
   - Fields: id (PK, UUID), farmer_id, account_name, bank_name, branch_code, is_primary, created_at, updated_at.  
   - Endpoints to add/fetch/delete/update bank details.

3. **Nearby Farmers Search**  
   - Endpoint to find farmers within a radius.

4. **Produce History**  
   - Summaries of sold/in-progress produce, with offers/transaction info.

5. **Farms List**  
   - Add, delete, update farms.  
   - Fetch all farms for a given farmer.

Suggestion: Use a calculation from the ratings table rather than storing a single field that might get out of sync. Or if stored, recalc whenever new ratings appear.
Suggestion: Add a DB check or application-level rule preventing farm deletion if produce items are referencing that farm. Return a 409 Conflict or similar error.
Use FK constraints with ON DELETE CASCADE or ON DELETE SET NULL as appropriate. If a user is fully deleted, ensure their farmer record is also removed or invalidated.
---

## 4. **Buyer-Specific Capabilities**

1. **Buyer Profile**  
   - A separate Buyer table linked to Users.  
   - Extended fields: id (PK, UUID), buyer_id, account_name, bank_name, branch_code, is_primary, created_at, updated_at.  
   - A list of Produce_Tag items the buyer is interested in.  
   - Buyer location: lat, lng, address, GST, businessName, registrationNumber.

2. **Daily Price Management**  
   - Set grade-based or produce-type-based daily prices (e.g., Tur Dal, Basmati).  
   - Auto-generates offers for matching produce.

3. **Produce_Tag Management**  
   - Buyer can select multiple tags from the Synonyms table.  
   - Can list produce based on these tags.

4. **Profile Management**  
   - Update location (lat, lng), address, GST, businessName.  
   - Update Produce_Tag entries.

5. **Ability to Buy/Cancel Offers**  
   - Buyers can buy or cancel offers within the specified Offer Lifecycle rules.

Suggestion1: Same approach as farmers: enforce FK constraints and handle user deletion carefully.
Suggestion2: store daily price data in a separate table, ensure references are consistent (e.g., buyer_id + references to synonyms or produce tag). Consider a timestamp for validity/expiration.
Suggestion3: Validate that lat_lng is in a correct format (like FLOAT-FLOAT). Return 400 if invalid.
---

## 5. **Produce Management**

1. **Create/Update/Delete Produce**  
   - Fields: name, produce_category, quantity, price, location, images, etc.  
   - Statuses: AVAILABLE, IN_PROGRESS, SOLD, CANCELLED.  
   - A produce item can have a one-to-one relationship with a Produce_Tag (Synonyms) entry.

2. **Search & Filters**  
   - Query produce by synonyms, price range, category, location radius, or farm ID.  
   - Pagination & sorting (distance, newest, price, status).

3. **Relationships**  
   - Linked to a Farmer (one farmer can have many produce items).  
   - Linked to Offers (one produce item can have many offers).  
   - Optional one-to-one link with a Transaction (if sold).

4. **Geospatial**  
   - “Nearby produce” endpoints using the Haversine formula or geospatial indexing.

Misuse of Status
Case: Farmer tries to mark produce as SOLD while an active offer is pending.
Suggestion: Add logic to the service layer preventing contradictory status changes.

Suggestion: Enforce FK with on-delete rules. Or prevent produce creation if the farmer is in a blocked or inactive state.

Suggestion: If produce is updated and the image is removed from S3, remove it from the DB as well.

Suggestion: Validate lat-lng format ("12.9716-77.5946"). If using separate columns (lat, lng), ensure they’re within valid ranges (-90 <= lat <= 90, -180 <= lng <= 180).
---

## 6. **Offers Lifecycle**

1. **Create Offers**  
   - Auto-generated: based on a buyer’s daily price, creating pending offers. The buyer confirms to show the offer to the farmer.  
   - Inspected Offer: after a manual inspection of the auto-generated offer, the buyer can reconfirm it.  
   - Buyer can update price before confirmation.  
   - A buyer-confirmed offer has a 24-hour shelf life.  
   - Buyer can request manual inspection on auto-generated offers (confirmed or not).

2. **Status Changes**  
   - Farmer can accept (PENDING → ACCEPTED) or reject (PENDING → REJECTED).  
   - Buyer can cancel (→ CANCELLED).  
   - Buyer can confirm (PENDING → CONFIRMED).  
   - Manual inspection triggers can revert any state → PENDING.  
   - Auto-expiry after validUntil (→ EXPIRED) in 24 hours.  
   - Manual inspection applies only to auto-generated offers.

3. **Offer Validation**  
   - Only PENDING offers can be updated or moved to manual inspection.  
   - Price and quantity must be positive.

4. **Post-Confirmation**  
   - Buyer can mark the order COMPLETE upon receiving goods.  
   - Farmer has 48 hours to deliver; otherwise, status reverts to PENDING.

5. **Excluded**  
   - Logistics and payment functionalities are not implemented here.

Stale or Overlapping Offers
Case: Multiple pending offers for the same produce with contradictory quantities.
Suggestion: The service layer should handle concurrency. If produce’s quantity is limited, you might need a partial acceptance logic or an approach that blocks conflicting offers once accepted.
Auto-Generated Offers
Case: System auto-creates an offer, but the buyer never confirms or the daily price changes.
Suggestion: Keep a validUntil or a robust logic to auto-expire or override auto-generated offers if daily prices are updated.
Manual Inspection
Case: Buyer triggers a manual inspection on an already confirmed or accepted offer.
Suggestion: Validate transitions carefully. If manual inspection can revert an offer to PENDING, ensure the code doesn’t break the acceptance or cause data corruption in concurrency.
Expired Offers
Case: Offers not removed or updated after validUntil.
Suggestion: A cron job or background worker to mark them as EXPIRED. Or do it lazily upon retrieval if NOW() > validUntil.
---

## 7. **Transactions**

1. **Transaction Creation**  
   - Triggered once an offer is marked COMPLETE; stores final price and quantity.

2. **Transaction Statuses**  
   - PENDING, COMPLETED, CANCELLED.

3. **Transaction Access**  
   - Buyer and Farmer can view relevant transactions and rate each other afterwards.


Transaction Without a Valid Offer
Case: offer_id references an offer that is incomplete or invalid.
Suggestion: Only create a transaction once an offer is in a COMPLETED or CONFIRMED state.
Mismatch in Final Price
Case: The transaction stores a final price different from the accepted offer’s price.
Suggestion: The service layer should copy final price/quantity from the offer at the moment of completion. Possibly store a “final_price” field.
Ratings & Reviews
Case: Ratings can’t be posted if transaction status isn’t COMPLETED.
Suggestion: The service logic should check transaction status before allowing a rating row to be inserted.
---

## 8. **Quality & Inspection**

1. **Quality Assessment**  
   - Manual/AI grading (A, B, C, D).  
   - A QualityAssessment table with notes, timestamps, inspector ID, up to 3 images.

2. **Inspection Scheduling**  
   - Inspectors schedule visits or upload reports.  
   - Produce may link to these inspection records.

3. **Event Handling**  
   - Possibly update produce.qualityGrade after finalization.

4. **Produce Category–Based Quality Parameters**  
   - Json for below produce_category:
   - Food Grains : Variety, Moisture Content (%) , Foreign Matter (%) , Protein Content (%).
   - Oilseeds : Oil Content (%), Seed Size (small/medium/large), Moisture Content (%).     
   - Fruits : Sweetness (Brix level), Size (small/medium/large), Color (e.g., yellow/red), Ripeness Level (e.g., ripe/unripe).
   - Vegetables : Freshness Level (e.g., fresh/slightly wilted), Size (small/medium/large), Color (e.g., green/red).
   - Spices : Volatile Oil Content (%), Aroma Quality (e.g., strong/mild), Purity (%).
   - Fibers : Staple Length (mm), Fiber Strength (g/tex), Trash Content (%).
   - Sugarcane : Variety, Brix Content (%), Fiber Content (%), Stalk Length (cm).
   - Flowers : Freshness Level (e.g., fresh/slightly wilted), Fragrance Quality (e.g., strong/mild), Stem Length (cm).
   - Medicinal and Aromatic Plants: Essential Oil Yield (%), Purity of Extracts (%), Moisture Content (%).


QualityAssessments
Case: Produce is marked “A” grade but a new assessment says “C.” Data might conflict.
Suggestion: Either store only the latest assessment or keep multiple records but have a pointer to the “active” one.
Ensure produce’s quality_grade is updated consistently if needed.
Inspection
Case: No inspector is assigned or the location is out of range.
Suggestion: Validate that an inspection request can only happen if lat-lng is valid and there’s an available inspector within 50 km. If none found, handle gracefully.
---

## 9. **Ratings & Reviews**

1. **Ratings Table**  
   - Linked to a completed transaction, storing a star rating (0–5) + optional comment.

2. **User vs. User**  
   - Farmers can rate buyers or buyers can rate farmers, depending on the domain logic.

3. **Averaging & Summaries**  
   - A user’s overall rating is the average of multiple transaction ratings.


Double Rating
Case: A buyer or farmer tries to rate multiple times for the same transaction.
Suggestion: Enforce a unique (transaction_id, rating_user_id) constraint. The service logic can also check if a rating already exists.
Deleted Transactions
Case: The transaction is removed or canceled, but the rating persists.
Suggestion: Use a FK with cascade or set an application rule that once a transaction is canceled, ratings are voided.
---

## 10. **Inspection**

1. **Inspection Management**  
   - If triggered by a farmer or buyer, an inspector is notified by email with the farmer’s info.  
   - A separate Inspection table (not linked to Users) stores name, location, mobile, and OfferId if relevant.

2. **Communication**  
   - Linked to the Offer table if an inspection is triggered within 50 km among available inspectors.  
   - No additional direct links to other tables.

No direct user linkage
Case: If there’s confusion about which user triggered an inspection or who the inspector is.
Suggestion: Possibly store fields like triggered_by_user_id and inspector_id if the specification changes. If your requirement is strictly “no direct link,” handle references carefully in the service layer.
Manual vs. Auto
Case: Mixed logic if some inspections are auto-scheduled.
Suggestion: A trigger_source field (manual, auto, buyer request, farmer request) might clarify.
---


## 12. **Synonyms Module**

1. **Synonyms Management**  
   - An independent table for produce synonyms.  
   - Each record: `name` (the main Produce_Tag), `words` (an array of synonyms in any language).
2. **Integration**  
   - Used for robust produce searches.
   - Endpoints to update/create/delete synonyms.

Synonyms Not Linked
Case: The synonyms list is large, but produce doesn’t reference it, resulting in inconsistent search logic.
Suggestion: If you want a direct link (like produce.synonym_id), define it. Or keep it purely for searching references in the service code.
Duplicates
Case: Multiple synonyms sets with overlapping words can lead to confusion.
Suggestion: Keep a business rule to avoid duplication or store synonyms in a single place with effective searching logic.
---

## 13. **Notifications**

1. **Real-Time Events**  
   - Triggered by new offers, status updates, inspection events, transaction changes.

2. **Firebase Push Notification**  
   - A gateway or message queue that pushes events to the correct users.

3. **Logging**  
   - Possibly store or track read/unread notifications in a `notifications` table.

Missing or Delayed Marking
Case: Notification is never marked as read.
Suggestion: This is more of a UX issue, but you might keep old unread notifications forever. Define a retention or automatic pruning policy.
Invalid user_id
Case: If the referenced user is deleted.
Suggestion: Use a FK with on-delete set to null or cascade. Or keep historical notifications for auditing.
---

## 14. **File Upload & Media Management**

1. **Image Upload**  
   - For produce/user profile images, typically stored in S3 with public URLs.

2. **Video Upload**  
   - Single produce video allowed, up to 50MB.

3. **Delete / Update**  
   - Replace outdated images or videos.

4. **Constraints**  
   - Images up to ~5MB (JPEG, PNG, etc.), videos up to 50MB.


Lost File References
Case: A produce item references an image that’s deleted from S3.
Suggestion: Provide either a file reference table or a cleanup job ensuring DB references match S3 objects.
Exceeding Size
Case: A user tries to upload a 100MB video despite the 50MB limit.
Suggestion: The service layer or an upload proxy must reject or chunk. Return 413 Payload Too Large or a custom error.
---

## 15. **Admin & Monitoring**

1. **Admin Panel**  
   - View users, produce, offers, transactions.  
   - Manage suspicious listings, moderate user statuses.

2. **System Analytics**  
   - Possibly track produce posted, daily offer acceptance, etc.

3. **Error Logs & Health**  
   - Log performance metrics, handle load balancing or scaling.

---

## 16. **Error Handling & Validation**

1. **Common Error Codes**  
   - 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict).

2. **Validation**  
   - Price > 0, quantity > 0, lat/long stored as a single string separated by “-” (e.g., `"12.9716-77.5946"`).
   - Mandatory fields cannot be null.

3. **Fallbacks**  
   - Return structured JSON errors with `statusCode`, `message`, and optional `errors[]`.

---

## 17. **Architectural Notes**

1. **Microservices or Modular**  
   - Services like Auth, Farmers, Buyers, Produce, Offers, Transactions, etc., can be separate or combined in a monolith with modular boundaries.

2. **Event-Driven**  
   - “offer.created” or “offer.accepted” events can be used for real-time or microservice bridging.

3. **Scalability**  
   - Use Redis or Postgres geospatial indexes, plus message queues for tasks like auto-expiry checks.

---