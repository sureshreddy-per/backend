## 1. Farmer Creates a Produce Entry

1. **Upload Photos (Required + Optional)**
    - Farmer uploads the first (required) photo of the produce.
    - The app **prompts** for up to two additional (optional) photos.  (Total up to 3 photos)
2. **Enter Other Values**
    - After the photos are uploaded, the farmer enters the **quantity, location(String), harvested date(optional), video_url(optional)** of the produce.
3. **Create Produce (API Call)**
    - The app calls the backend API to **create a produce record** in the database.
    - Then system calls OpenAI API with the three images to:
        - Name of the Produce(ex: tur dal, Rice, Cotton, Sugarcane, ground nut, sunflower….)
        - Identify to select produce_**category**(FOOD_GRAINS, OILSEEDS, FRUITS, VEGETABLES, SPICES, FIBERS, SUGARCANE, FLOWERS, MEDICINAL_PLANTS).
        - **Identify product variety(ex for Rice  : Sonamasuri, GRG, Kaveri….. )**
        - Calculate qualityGrade(1-10), confidence(0 - 100), defects([String]), recommendations: string[]
        - Description of produce
        - Generate a **quality assessment for** produce_**category based params from (**FoodGrainsFilterDto,
          OilseedsFilterDto,
          FruitsFilterDto,
          VegetablesFilterDto,
          SpicesFilterDto,
          FibersFilterDto,
          SugarcaneFilterDto,
          FlowersFilterDto,
          MedicinalPlantsFilterDto**)**.
    - The returned AI data is used to create Produce:
        - **name, Produce category,** description, **product variety** in the Produce table.
        - **Quality assessment report** in the Quality Assessment table, linked to this Produce.

---

## 2. Generating Offers

1. **Offers**
    - After produce is added potential offers for buyers within a **100 km radius** of the farmer’s location calculated.
    - The offer price is **automatically** generated based on:
        - **AI Quality** assessment.
        - Buyer’s daily prices who falls within the relevant radius and criteria.
2. **Offers Visible on Mobile App**
    - These offers are shown to both:
        - **Farmer** in the “Pending Offers” section.
        - **Buyers** who fall within the relevant radius and criteria.

---

## 3. Offer States and Actions

### 3.1. Buyer Actions on Offers

1. **View Pending Offers**
    - Buyers see new or available offers(ACTIVE) for produce in their location range.
2. **Accept or Modify (Counter-Offer)**
    - If buyer **accepts** the offer as-is:
        - The offer moves from “ACTIVE” to “PENDING”
        - The farmer sees it in “Accepted Offers” on the **farmer** side.
    - If buyer **modifies** the offer:
        - Farmer will get push notification.
        - This effectively means the buyer is also accepting, but with different price terms.
        - Once the modification is done, it stays on PENDING until farmer confirm
3. **Reject Offer**
    - If buyer **rejects**  the offer, it is moved to “REJECTED” state.
    - The farmer sees it as “REJECTED” on their side.

### 3.2. Farmer Actions on Offers

1. **View Offers**
    - Farmer can see all newly generated or buyer-modified offers
2. **Accept or Reject Price**
    - If farmer **confirm** the buyer’s price:
        - The offer moves to “ACCEPTED” status.
        - A **24-hour delivery window** (configurable) is opened for the farmer to deliver the goods.
        - After 24hrs offer will move to EXPIRED state
        - Then farmer will have option to change offer to ACTIVE State
    - If farmer **rejects** the offer:
        - The offer is moved to a “CANCELLED” state.
        - Buyer will get Notification

---

## 4. Delivery & Completion

1. **Delivery**
    - Once the farmer has confirmed an offer, the farmer is expected to deliver the produce within the set time (e.g., 24 hours).
    - Transportation and Payments will be not bothered as of now
2. **Mark Transaction as Complete**
    - After **goods are delivered**, the buyer inspects/receives them and **marks the Offer will be moved to ”COMPLETED” status** which will trigger transaction creation
    - A notification is sent to both farmer and buyer.
3. **Rating & Feedback**
    - **Both parties** are prompted to rate each other:
        - The buyer rates the farmer.
        - The farmer rates the buyer.
    - These ratings are stored for future reference.

---

## 5. Inspection Requests

Produce status is AVAILABLE or IN_PROGRESS  **either party** can request a manual inspection:

1. **Farmer Requests Inspection**
    - Farmer can request an inspection to **verify produce quality.**
    - This will involve a **fee** that the farmer pays on inspection time just need to inform this to farmer
    - An inspector will be assigned (no slot booking).
2. **Buyer Requests Inspection**
    - Buyer can also request manual inspection for **one or multiple** produce.
    - Buyer will be shown fee to be paid to Inspector mobile number.
    - No implementation for payment related procedure
3. **Inspection Process**
    - **Inspector** visits the farm/produce location at his available time.
    - Inspector **uploads images/documentation** of the produce’s condition.
    - The system updates the produce’s **Quality Assessment** with the **manual inspector’s** results as the **primary** rating.
    - The **AI-generated** assessment remains on record as **secondary**.
    - Admin should have ability to set inspection price
4. **Notifications & Further Actions**
    - **Farmer** is notified with the official inspection results in the app (under the produce details).
    - **Buyer** is also notified about the inspection results.
    - The buyer then can **accept** or **reject** based on new findings, or **request price modification**.

---

## 6. Summary of Transaction Lifecycle

1. **Create Produce** → **AI-based Quality Assessment → Generate Offers**
2. **Inspection request by Buyer/Farmer**
3. **Viewed by Buyer**
4. **Buyer Accept/Modify/Reject** → **Farmer Accept/Reject**
5. **Final Acceptance** →  **Mark Complete**
6. **Rate & Feedback** → **Transaction Ends**

---

### Key Points & Terminology Clarification

- **“ACTIVE Offers”**: Offers visible but not **accepted** yet by either farmer or buyer.
- **“Accepted Offers”** : Offers that have been **mutually agreed upon** and are in the process of delivery.
- **“Rejected Offers”**: Offers refused by either side.
- **Inspection**: Manual verification overrides AI-based results.
- **24-hour Delivery Window**: Example timeframe (can be changed by admin) for farmer to deliver goods after acceptance.