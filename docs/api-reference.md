Below is a **consolidated list** of all the documented endpoints, **divided** into those typically used by the **Farmer App**, those used by the **Buyer App**, and the ones **shared/overlapping** (used by both or system-level). The **Admin** endpoints are also listed under “overlapping” or “admin-only” where relevant.

---

# 1. Farmer App Endpoints

These endpoints primarily serve **Farmers** to manage their **profiles**, **produce listings**, **offers** from buyers, and **transactions** from their perspective.

### 1.1 Auth (Farmer-Specific Context)
- `POST /auth/register` (with `"isFarmer": true`)  
- `POST /auth/login`  
- `GET /auth/validate`  
- `POST /auth/block/:userId` (Farmer can block a buyer if you allow that logic)  
- `POST /auth/unblock/:userId`  

*(Note: The same Auth endpoints can be used by Buyers too, but if you’re building a separate “Farmer App,” these are how the Farmer registers/logs in.)*

### 1.2 Farmers Service
- `POST /farmers` – **Create Farmer Profile**  
- `GET /farmers` – **Get All Farmers** (for a farmer to see other farmers? or the system’s directory)  
- `GET /farmers/:id` – **Get Farmer Profile**  
- `PATCH /farmers/:id` – **Update Farmer Profile**  
- `GET /farmers/:id/produce-history` – **Get Farmer’s Produce History**  

### 1.3 Produce Service (Farmer Perspective)
- `POST /produce` – **Create Produce Listing** (farmer-owned produce)  
- `GET /produce/:id` – **Get Produce Details** (owner/farmer can see it)  
- `PATCH /produce/:id` – **Update Produce**  
- `DELETE /produce/:id` – **Delete Produce**  
- `GET /produce` – Possibly to list all produce (a Farmer might see their own or global).  
- `GET /produce/nearby` – Not typical for a Farmer to see produce, but if the app allows them to see others’ produce, it’s relevant.

### 1.4 Offers Service (Farmer Perspective)
- **Auto-generated offers** arrive when produce is assigned a quality grade, or a buyer sets daily price.  
- `POST /offers/:id/accept` – **Accept Offer**  
- `POST /offers/:id/reject` – **Reject Offer**  
- `POST /offers/:id/cancel` – (Farmers typically don’t cancel Buyer-initiated offers, but if your logic allows it, it might be relevant. Usually the **buyer** cancels.)

> Farmers typically **do not** create offers to buy (that’s buyer’s domain). However, they see, accept, or reject them.

### 1.5 Transactions (Farmer Perspective)
- `GET /transactions` – A farmer may see all transactions relevant to them (filtered by farmer?).  
- `GET /transactions/:id` – Check details of a particular transaction.  
- `PATCH /transactions/:id` – Possibly update shipping or confirm details if needed.  
- `POST /transactions/:id/complete` – Mark transaction as completed (farmer side).  

*(Exact usage depends on whether the farmer is the one driving the transaction flow or if the buyer is.)*

### 1.6 Quality & Inspection (Farmer Perspective)
- `POST /quality` – Farmers can request a quality assessment for their produce.  
- `GET /quality/:id` – See the result.  
- `POST /quality/:id/finalize` – Possibly a farmer or an inspector finalizes the assessment.  
- `POST /inspections` – **Schedule Inspection**  
- `GET /inspections/:id` – **Get Inspection Details**  

### 1.7 Ratings (Farmer Perspective)
- `POST /ratings` – After a transaction completes, a farmer might rate the buyer.  
- `GET /ratings` – Farmer can see ratings they’ve received or given (depending on business logic).  
- `GET /ratings/:id` – See a specific rating.

### 1.8 Support (Farmer Perspective)
- `POST /support` – **Create Support Ticket** if the farmer has an issue.  
- `GET /support` – Farmer can see or track their own tickets.  
- `GET /support/:id` – Detailed ticket info.  
- `PATCH /support/:id` – Possibly update the ticket (like “CLOSED” from the farmer side).

### 1.9 Notifications (Farmer Perspective)
- `GET /notifications` – Get user’s notifications (new offers, accepted offers, etc.).  
- `GET /notifications/unread/count` – For the farmer’s unread notifications.  
- `POST /notifications/:id/read` – Mark a notification as read.

---

# 2. Buyer App Endpoints

These endpoints primarily serve **Buyers** to set daily prices, discover produce, place or override offers, and manage transactions from a buyer’s viewpoint.

### 2.1 Auth (Buyer-Specific Context)
- `POST /auth/register` (with `"isBuyer": true`)  
- `POST /auth/login`  
- `GET /auth/validate`  
- `POST /auth/block/:userId` – If buyers can block farmers, or other buyers, depending on your logic.

### 2.2 Buyers Service
- `POST /buyers` – **Create Buyer Profile**  
- `GET /buyers` – **Get All Buyers** (list)  
- `GET /buyers/nearby` – Find Buyers near a location (somewhat unusual for a buyer to see other buyers, but it’s in your doc).  
- `POST /buyers/:buyerId/prices` – **Set Daily Price for Quality Grade**  
- `GET /buyers/:buyerId/prices` – **Get Buyer’s Active Prices**  
- `GET /buyers/:buyerId/prices/:grade` – **Get Current Price for Specific Grade**

### 2.3 Produce Service (Buyer Perspective)
- `GET /produce` – Buyer can browse produce.  
- `GET /produce/:id` – Buyer sees details of a produce listing.  
- `GET /produce/nearby` – Find produce near them.  

*(Buyers typically **don’t** create produce listings, that’s the farmer’s domain.)*

### 2.4 Offers Service (Buyer Perspective)
- `POST /offers` – **Create Offer** (Buyer manually creating an offer).  
- **Auto-generated offers** also appear if a buyer’s daily price matches produce grade.  
- `PUT /offers/:id/override` – Buyer can override an **auto-generated** offer.  
- `PUT /offers/:id/price` – Buyer can update or override the price for a **manually** created offer.  
- `POST /offers/:id/cancel` – Buyer can cancel their own pending offer.  
- `GET /offers/buyer/:buyerId` – Buyer sees offers they have created or auto-offers assigned to them.

### 2.5 Transactions (Buyer Perspective)
- `POST /transactions` – Buyer might initiate a transaction after an offer is accepted (depending on your flow).  
- `GET /transactions` – Possibly see all transactions.  
- `GET /transactions/:id` – Buyer sees a specific transaction.  
- `PATCH /transactions/:id` – Buyer can update (e.g., quantity or shipping details?).  
- `POST /transactions/:id/cancel` – If the buyer can cancel a transaction.  
- `POST /transactions/:id/complete` – Buyer might mark the transaction completed if your flow requires buyer confirmation.  
- `GET /transactions/buyer/:buyerId` – Buyer sees all of their transactions.

### 2.6 Quality & Inspection (Buyer Perspective)
- In many flows, the buyer *might* request an inspection. If so:
  - `POST /inspections` – They can schedule an inspection.  
  - `GET /inspections/:id` – They check the inspection details.  

*(But typically the farmer is the one pushing for quality assessments. Business rules vary.)*

### 2.7 Ratings (Buyer Perspective)
- `POST /ratings` – Buyer might rate a farmer post-transaction.  
- `GET /ratings` – Buyer can see ratings they’ve given or received if your system allows.  
- `GET /ratings/:id`

### 2.8 Support (Buyer Perspective)
- Similar to Farmer, the buyer can open or track tickets:
  - `POST /support`  
  - `GET /support`  
  - `GET /support/:id`  
  - `PATCH /support/:id`  
  - `DELETE /support/:id`  

### 2.9 Notifications (Buyer Perspective)
- `GET /notifications` – Buyer sees notifications about accepted offers, updated produce status, etc.  
- `GET /notifications/unread/count`  
- `POST /notifications/:id/read`

---

# 3. Shared / Overlapping Endpoints

These are **common** to both Farmer and Buyer (and potentially the broader system):

1. **Auth**  
   - `POST /auth/login`, `GET /auth/validate`, `POST /auth/block/:userId`, etc.  
   - Registration can be used by either role (just set `isFarmer` / `isBuyer`).

2. **Admin Service**  
   - `GET /admin/users`  
   - `GET /admin/users/:id`  
   - `POST /admin/users/:id/block`  
   - `POST /admin/users/:id/unblock`  
   - `GET /admin/support`  
   - `PATCH /admin/support/:id`  

3. **Notifications**  
   - `GET /notifications`  
   - `GET /notifications/unread/count`  
   - `POST /notifications/:id/read`  

4. **Support**  
   - `POST /support`, `GET /support`, `PATCH /support/:id`, etc. (both roles can create tickets).  

5. **Quality** & **Inspection** (depending on your business logic, both Farmer and Buyer might have partial or full access).  

6. **Ratings** (both can read or create, depending on if they completed a transaction together).

7. **Offers** (some endpoints are buyer-only, some farmer-only, but the “auto-generated offer logic” is an overlapping system event).

8. **Transactions** (both parties interact with the same transaction, though from different angles).

---

## 4. Summary

- **Farmer App** endpoints revolve around *managing produce*, *accepting/rejecting offers*, and *finalizing or tracking transactions* from the seller’s side.
- **Buyer App** endpoints revolve around *setting daily prices*, *placing or overriding offers*, and *initiating transactions* from the buyer’s side.
- **Overlapping** or *shared* endpoints are those that both roles need to access (authentication, notifications, support, admin privileges, etc.) or that represent *system-level events* (like auto-generation of offers, quality/inspection statuses).

This **division** should help clarify which endpoints are typically used on the **Farmer App** vs. the **Buyer App**, while also acknowledging the **shared** endpoints that both roles (or the system at large) consume.