# RECI Transport — Complete System Documentation

**Version:** 1.0  
**Last Updated:** May 2025  
**Brand:** RECI Transport, Berlin

---

## Table of Contents

**Part 1 — For Customers**
- [1.1 Welcome to RECI Transport](#11-welcome-to-reci-transport)
- [1.2 Browsing Vehicles](#12-browsing-vehicles)
- [1.3 Using the AI Search Assistant](#13-using-the-ai-search-assistant)
- [1.4 The 5-Step Booking Process](#14-the-5-step-booking-process)
- [1.5 The RECI Rewards Program](#15-the-reci-rewards-program)
- [1.6 Managing Your Account](#16-managing-your-account)
- [1.7 Corporate Accounts](#17-corporate-accounts)
- [1.8 Frequently Asked Questions (Customers)](#18-frequently-asked-questions-customers)

**Part 2 — For Business Owners and Admin Staff**
- [2.1 Who This Section Is For](#21-who-this-section-is-for)
- [2.2 Accessing the Admin Portal](#22-accessing-the-admin-portal)
- [2.3 The Dashboard](#23-the-dashboard)
- [2.4 Managing the Fleet](#24-managing-the-fleet)
- [2.5 Managing Bookings](#25-managing-bookings)
- [2.6 The Fleet Calendar](#26-the-fleet-calendar)
- [2.7 Managing Customers](#27-managing-customers)
- [2.8 Pricing Management](#28-pricing-management)
- [2.9 Availability and Date Blocking](#29-availability-and-date-blocking)
- [2.10 Predictive Maintenance (AI-Powered)](#210-predictive-maintenance-ai-powered)
- [2.11 Account Settings — Changing Your Password](#211-account-settings--changing-your-password)
- [2.12 User and Staff Management](#212-user-and-staff-management)
- [2.13 Roles and Permissions Reference](#213-roles-and-permissions-reference)
- [2.14 Booking Status Reference](#214-booking-status-reference)
- [2.15 Daily Operations Checklist](#215-daily-operations-checklist)

**Part 3 — For Technical Staff**
- [3.1 Who This Section Is For](#31-who-this-section-is-for)
- [3.2 System Architecture Overview](#32-system-architecture-overview)
- [3.3 Environment Variables Reference](#33-environment-variables-reference)
- [3.4 Starting and Stopping the System](#34-starting-and-stopping-the-system)
- [3.5 Database — Supabase](#35-database--supabase)
- [3.6 Payments — Stripe](#36-payments--stripe)
- [3.7 Email — Resend](#37-email--resend)
- [3.8 AI Features — Anthropic Claude](#38-ai-features--anthropic-claude)
- [3.9 Common Issues and Fixes](#39-common-issues-and-fixes)
- [3.10 Webhook Reference](#310-webhook-reference)
- [3.11 Deployment Notes](#311-deployment-notes)

---

---

# Part 1 — For Customers

## 1.1 Welcome to RECI Transport

RECI Transport is Berlin's AI-native car rental platform. This means you can search for a car the way you would describe it to a person — in plain language — and the system understands you.

This section explains everything you need to know as a customer:

- How to browse and search for vehicles
- How to complete a booking in five steps
- How the RECI Rewards program earns you discounts
- How to manage your account and bookings

**Getting to the website:**  
Open your browser and go to the RECI Transport website. The address will be provided by the team, or you can access it at the URL you were given when you signed up.

---

## 1.2 Browsing Vehicles

When you arrive on the home page, you will see a grid of all vehicles that are currently available to rent. Each vehicle card shows:

- **Make, model, and year** — for example, BMW 3 Series (2023)
- **Category** — such as Economy, Compact, SUV, Luxury, or Van
- **Fuel type** — petrol, diesel, electric, or hybrid
- **Transmission** — automatic or manual
- **Price per day** — shown in euros

[Screenshot: Vehicle grid showing cards with car images, category labels, and daily rates]

**Filtering by category:**  
Above the vehicle grid, you will find category filter buttons. Click any category to show only vehicles of that type. Click again to clear the filter.

> **Tip:** If a vehicle card shows an "Exact Model Guaranteed" badge, that is the specific car you will receive — no substitutions. Vehicles without this badge may be exchanged for a similar model of equal or greater value.

---

## 1.3 Using the AI Search Assistant

At the top of the home page, above the date and location fields, is the AI search bar. You can describe your trip in plain language, and the AI will fill in the search form for you.

**Examples you can type:**

- "I need a car for 3 days next week"
- "I'm looking for an SUV from 15 June to 22 June"
- "Compact car, pick up Friday, return Monday"
- "Electric car for a week"

After you type your request and press Enter or click the search button, the AI will:

1. Work out your pick-up and drop-off dates from your description
2. Identify the vehicle category if you mentioned one
3. Fill in the date fields automatically
4. Filter the vehicle grid to show matching results

> **Tip:** You do not have to use the AI assistant. You can ignore it entirely and use the manual date and category fields below it — whichever you prefer.

> **Note:** The AI understands natural language but works best with clear date references. If you say "next Friday", it will calculate the date based on today. If the dates are unclear, the fields will remain empty for you to fill manually.

---

## 1.4 The 5-Step Booking Process

Once you have found a vehicle you want, click the "Book" or "View" button on its card. This takes you into the booking flow, which has five steps shown as a progress bar at the top of the page.

---

### Step 1 — Select Your Vehicle and Dates

On this screen you will see the full details of the vehicle you selected: its image, specifications, features, and daily rate.

**What to do:**

1. Review the vehicle details.
2. Enter your **Pick-up Date** and **Drop-off Date** using the date pickers. The drop-off date must be at least one day after pick-up.
3. If you want to return the vehicle to a different location than where you picked it up, select a **Return Location** from the dropdown. A note will appear confirming this is a one-way rental and that a surcharge will be confirmed by email.
4. The **Price Preview** panel on the right will update automatically as you choose dates, showing a subtotal based on the number of days.
5. Click **Continue to Extras** when ready.

**Example:**  
You pick up on 10 June and return on 13 June. The system calculates 3 days. At €85/day, the subtotal shows €255. Extras are added in the next step.

[Screenshot: Step 1 date picker with price preview panel on the right]

> **Warning:** You cannot select a drop-off date that is the same as or before your pick-up date. The system will show an error and prevent you from continuing.

---

### Step 2 — Choose Extras

This step shows optional add-ons you can include with your rental. Common extras include:

- GPS / Navigation device
- Child seat (infant, toddler, or booster)
- Insurance upgrade (collision damage waiver, theft protection)
- Additional driver

Each extra shows its price. Some extras are charged **per day** (multiplied by your rental length), and others are a **one-time flat fee** (charged once regardless of how many days you rent).

> **Tip:** The AI may suggest extras based on your vehicle type and rental length. For example, it might suggest GPS for an SUV on a long rental, or a child seat if the vehicle has high passenger capacity. These suggestions appear as highlighted recommendations. You are never required to add them.

**To add an extra:** Click the toggle or the "Add" button next to it.  
**To remove it:** Click the toggle or button again.

The **Order Summary** panel on the right updates in real time as you add or remove extras.

Click **Continue to Driver Details** when you are done. You may also click **Back** to return and change your vehicle or dates.

[Screenshot: Extras page showing GPS, child seat, and insurance options with per-day pricing]

---

### Step 3 — Enter Driver Details

This step collects the information needed to complete your booking.

**Required fields:**

- **First name** and **last name**
- **Email address** — your confirmation will be sent here
- **Phone number**
- **Driving licence number**

**Optional — Redeem Loyalty Points:**  
If you have a RECI Rewards account with points, a redemption section will appear showing your available balance. You can choose how many points to redeem. Every 100 points equals €1 discount, and you can redeem up to 20% of the booking total.

**Example:**  
Your booking total is €255. You have 500 points available. You can redeem up to 51 points (20% of €255 = €51, but you only have 500 points = €5 value, so €5 is deducted). Your new total would be €250.

Click **Continue to Payment** when all details are filled in.

[Screenshot: Driver details form with loyalty points redemption section]

---

### Step 4 — Payment

Your booking details are displayed on the right. The left panel shows a secure payment form powered by **Stripe**, a trusted global payment service used by millions of businesses.

**What to enter:**

- Your credit or debit card number
- Card expiry date
- CVC security code

> **Security note:** Your card details are entered directly into Stripe's secure form and are never stored on RECI Transport's servers. The padlock icon and "Secured by Stripe" notice confirm this.

Click **Pay €[amount]** to complete the payment. The button will show "Processing…" while your payment is being authorised.

**If payment fails:**  
A clear error message will appear (for example, "Your card was declined"). Your booking is still reserved — nothing has been charged. You can try again with a different card or correct the details.

[Screenshot: Payment form with Stripe card fields and total amount]

---

### Step 5 — Confirmation

When payment is successful, you will be redirected to the confirmation page.

**What you will see:**

- A green checkmark and "Booking Confirmed!" heading
- Your **booking reference** displayed prominently — for example: `RECI-2025-00001`
- Vehicle details, pick-up and drop-off dates and times
- Driver name and extras summary
- Total amount charged
- A "What happens next" section explaining what to bring to the pick-up

A confirmation email will also be sent to the email address you provided. Keep your booking reference safe — you will need it if you contact us.

> **Note:** If you see "Confirming your booking…" with a spinner after payment, do not refresh or close the page. The system is waiting for payment confirmation from Stripe. This usually takes under 30 seconds.

**Trip Co-pilot:**  
After confirmation, an AI-powered Trip Co-pilot assistant appears. You can ask it questions about your trip, such as fuel station locations near your pick-up point, what to check when collecting the vehicle, or what to do if you have a problem during the rental.

[Screenshot: Confirmation page with booking reference RECI-2025-00001 and green tick]

---

## 1.5 The RECI Rewards Program

RECI Rewards is a loyalty programme that earns you points every time you spend with us. Those points convert to discounts on future bookings.

### How You Earn Points

- You earn **1 point for every €1 spent** on a confirmed booking.
- Points are awarded **after payment is confirmed** — they are not available until your booking status changes from "pending" to "confirmed".
- Points appear in your account within minutes of payment confirmation.

**Example:**  
You pay €255 for a 3-day rental. After payment is confirmed, 255 points are added to your account.

---

### How You Redeem Points

- At Step 3 of the booking process, you will see your current points balance.
- Every **100 points = €1 discount**.
- You may redeem up to **20% of the booking total** per booking.
- Redemption is optional and does not affect earning — you earn points on the amount actually paid after any discount.

**Example:**  
Booking total: €400. Maximum redemption: €80 (20%). You have 1,200 points = €12 value. You can redeem all 1,200 points for a €12 discount, bringing your total to €388.

---

### Membership Tiers

Your tier is based on your **total lifetime points earned** (not your current balance). Tiers never go backwards.

| Tier | Lifetime Points Required | Colour |
|---|---|---|
| Bronze | 0 (starting tier) | Bronze |
| Silver | 500 points | Silver |
| Gold | 2,000 points | Gold |
| Platinum | 5,000 points | Diamond/Platinum |

Each tier unlocks additional perks, which may include:

- **Silver:** Small discount on base rates, early access to new vehicles
- **Gold:** Larger discount, free vehicle upgrades when available, priority customer support
- **Platinum:** Maximum discount, dedicated account manager, complimentary extras on selected bookings

> **Tip:** Tier perks are shown on your Rewards page under "All Tiers". Click on any tier to see its full list of benefits.

---

### Viewing Your Rewards

1. Sign in to your account.
2. Go to **Account** in the top navigation, then click **Rewards**.

The Rewards page shows:

- Your current points balance and lifetime total
- Your current tier and a progress bar showing how far you are from the next tier
- A full transaction history — every booking that earned points and every redemption

[Screenshot: Rewards page showing Bronze tier card with 255 points balance and tier progress bar]

---

## 1.6 Managing Your Account

### Signing In

Click **Sign In** in the top-right corner of any page. Enter the email address and password you registered with. If you have forgotten your password, click "Forgot password" and follow the instructions sent to your email.

### Your Profile

Go to **Account > Profile** to view and update your name, email address, and phone number.

### Your Bookings

Go to **Account > Bookings** to see a list of all your past and current bookings. Each entry shows:

- Booking reference (e.g. RECI-2025-00001)
- Vehicle name
- Dates
- Status (confirmed, active, completed, etc.)
- Total charged

Click any booking to view its full details.

---

## 1.7 Corporate Accounts

If you are booking vehicles on behalf of a company, you may be eligible for a corporate account. Corporate accounts can offer:

- Custom rates negotiated with the RECI team
- Centralised billing
- Multiple authorised users on one account

To apply, go to **Account > Corporate** and complete the application form. The RECI team will review your application and contact you.

---

## 1.8 Frequently Asked Questions (Customers)

**Q: Can I cancel my booking?**  
Contact RECI Transport using the phone number or email on your confirmation. Cancellation terms depend on how far in advance you cancel.

**Q: What if I need the car for longer than planned?**  
Call or email RECI Transport before your drop-off time. Extensions are subject to availability and may be charged at the standard daily rate.

**Q: What do I need to bring when I collect the car?**  
Your driving licence and the confirmation email (printed or on your phone). The booking reference will be sufficient for staff to find your booking.

**Q: Can someone else drive the car?**  
Only if you added an "Additional Driver" extra during booking. Unauthorised drivers are not covered by the insurance.

**Q: Why are my points not showing yet?**  
Points are only awarded after a payment is fully confirmed. If your booking status is still "pending", the points have not been awarded yet. This normally resolves within a few minutes.

**Q: Can I change my pick-up or drop-off date after booking?**  
Contact RECI Transport directly. Date changes are subject to availability and may result in a price adjustment.

---

---

# Part 2 — For Business Owners and Admin Staff

## 2.1 Who This Section Is For

This section is for anyone who manages the day-to-day operation of RECI Transport using the admin portal — including business owners, managers, and front-desk staff. Technical knowledge is not required to use any feature described here.

The admin portal is separate from the customer website. All management functions are in the admin portal.

---

## 2.2 Accessing the Admin Portal

**Development (testing) URL:** `http://localhost:3001/admin`  
**Production URL:** `https://[your-domain].com/admin` (provided by your technical team)

Log in with your staff or admin credentials. If you cannot log in, contact your technical team — your account may need the correct staff role assigned.

> **Note:** The admin portal does not exist at the customer website address. If you go to the customer website by mistake, look for no "Admin" navigation — that confirms you are on the wrong URL.

---

## 2.3 The Dashboard

The Dashboard is the first screen you see after logging in. It gives you an overview of the business right now.

[Screenshot: Dashboard showing four KPI cards and recent bookings list]

### KPI Cards

Four summary cards appear at the top:

| Card | What It Shows |
|---|---|
| Pickups Today | Number of confirmed or active bookings with a pick-up scheduled for today |
| Monthly Revenue | Total revenue from confirmed payments this calendar month, in euros |
| Active Bookings | Bookings currently in "confirmed" or "active" status |
| Fleet Size | Number of vehicles marked as active in the fleet |

### Pending Payment Alert

If any bookings are awaiting payment, a yellow alert banner appears below the KPI cards. Click **Review** to go directly to the list of pending bookings.

### Recent Bookings

A scrollable table shows the 10 most recent bookings, each with:

- Booking reference in green monospace text (e.g. RECI-2025-00001)
- Status badge (colour-coded)
- Customer name and vehicle
- Total price

Click any row to open the full booking detail.

### Quick Actions

On the right side, a panel provides one-click links to the most common tasks:

- All Bookings
- Manage Fleet
- Fleet Calendar
- Block Dates

### Status Overview

A small summary panel shows live counts for Active bookings, Pending bookings, and Fleet total.

### Demand Signals

Below the status overview, a demand card (if configured) shows the current demand score per vehicle category. This can indicate when to expect high booking volumes.

---

## 2.4 Managing the Fleet

Go to **Fleet** in the left navigation.

[Screenshot: Fleet page showing vehicle cards in a grid with make, model, plate, and status]

### The Fleet Grid

Each vehicle is shown as a card with:

- Vehicle image
- Make, model, and year
- Registration plate
- Category (Economy, Compact, SUV, Luxury, Van, etc.)
- Current location
- Status (Available, Rented, Maintenance, Inactive)
- A maintenance badge if the vehicle is overdue for service

### Adding a New Vehicle

Click the **Add Vehicle** button (usually in the top-right corner or accessible via Fleet > New).

Fill in the vehicle form:

- **Make and model** — for example, "Volkswagen" and "Golf"
- **Year**
- **Registration plate** (the licence plate number)
- **Category** — select from the dropdown
- **Fuel type** — petrol, diesel, electric, or hybrid
- **Transmission** — manual or automatic
- **Daily rate** — this is the base price before any pricing rules are applied
- **Mileage** — current odometer reading
- **Last service mileage** — odometer reading at the last service (used for maintenance alerts)
- **Features** — any extras the car has (e.g. heated seats, sunroof)
- **Location** — where the vehicle is currently based
- **Images** — upload one or more photos
- **Exact Model Guaranteed** — toggle this on if you want to promise customers this specific vehicle (a badge appears on the listing)

Click **Save** to add the vehicle to the fleet.

### Editing a Vehicle

Click any vehicle card to open its detail page, then click **Edit**. You can update any field, including activating or deactivating the vehicle.

### Deactivating a Vehicle

Deactivating a vehicle removes it from the customer-facing website so it cannot be booked. It remains in the admin fleet view. Use this for vehicles that are off-road long-term (accident repairs, off-season storage, sold).

> **Warning:** Deactivating a vehicle does not cancel existing confirmed bookings for that vehicle. Check the calendar first to confirm the vehicle has no upcoming confirmed bookings before deactivating.

---

## 2.5 Managing Bookings

Go to **Bookings** in the left navigation.

[Screenshot: Bookings table showing columns for reference, customer, vehicle, dates, status, and total]

### The Bookings Table

The table shows all bookings with the following columns:

- **Booking Ref** — unique reference like RECI-2025-00001
- **Status** — colour-coded badge
- **Customer** — driver first and last name
- **Vehicle** — make and model
- **Pick-up** — date and time
- **Drop-off** — date and time
- **Total** — amount charged in euros

You can filter the table by status using the tabs or filter at the top (e.g. show only "pending" bookings).

### Viewing a Booking

Click any row to open the booking detail page. This shows:

- Full driver details (name, email, phone, licence number)
- Extras included
- Payment status and amount
- Timeline of status changes

### Updating a Booking Status

On the booking detail page, you can update the status. Use the status dropdown or buttons provided. See the Booking Status Reference in section 2.13 for what each status means and when to use it.

**Common transitions you will perform:**

- Mark a booking **Active** when the customer collects the vehicle
- Mark a booking **Completed** when the vehicle is returned
- Mark a booking **No-show** if the customer does not appear at the agreed pick-up time
- Mark a booking **Cancelled** if the customer cancels before pick-up

---

## 2.6 The Fleet Calendar

Go to **Calendar** in the left navigation.

[Screenshot: FullCalendar resource timeline view showing vehicles as rows and bookings as coloured blocks]

The Fleet Calendar shows all vehicles as rows, with their bookings displayed as coloured blocks across a timeline. This is the fastest way to see:

- Which vehicles are booked on any given day
- Which vehicles are free
- Any gaps between bookings

Use the navigation arrows to move forward or backward by week or month. Click a booking block to see its reference and customer details.

> **Tip:** Use the calendar before blocking a vehicle for maintenance (see section 2.9). Confirm there are no confirmed bookings in the date range you plan to block.

---

## 2.7 Managing Customers

Go to **Customers** in the left navigation.

This page shows a list of all registered customer accounts. You can search by name or email. Click a customer to view their profile, booking history, and loyalty points balance.

---

## 2.8 Pricing Management

Go to **Pricing** in the left navigation.

Pricing in RECI Transport works in two layers:

1. **Base Rates** — the standard daily price per vehicle category
2. **Seasonal Overrides** — percentage surcharges applied on top of base rates during specific date ranges (for example, summer peak or public holidays)

> **Important:** Prices are calculated at the time a booking is made. Changing a base rate or override does not retroactively change the price of existing confirmed bookings. Existing bookings keep the price that was calculated when they were created.

[Screenshot: Pricing page showing base rates table and seasonal overrides table]

### Setting a Base Rate

1. Scroll to the **Base Rates** section.
2. In the "Add Base Rate" form, select a **Category** from the dropdown.
3. Enter the **Rate (€/day)** — for example, 75.00 for Economy.
4. Set the **Effective from** date. If you want the rate to start immediately, leave today's date.
5. Click **Add rate**.

The rate appears in the table. The label "Current" shows the most recent (active) rate for each category. Older entries are labelled "Superseded" and kept as a historical record.

**Example:**  
Economy was €65/day. On 1 June you add a new rate of €75/day. From 1 June onwards, new Economy bookings are priced at €75. Bookings made before 1 June keep €65.

### Setting a Seasonal Override

Seasonal overrides add a percentage surcharge on top of the base rate during a date range.

1. Scroll to the **Seasonal Overrides** section.
2. In the "Add Override" form, enter a **Name** — for example, "Summer Peak" or "Christmas".
3. Enter the **Surcharge %** — for example, 25 means +25% on top of base rates.
4. Set the **Start date** and **End date**.
5. Click **Add override**.

The override appears in the table with a status badge showing whether it is Upcoming, Active, or Expired.

**Example:**  
Base rate for an SUV: €120/day. You add a "Summer Peak" override of +20% from 1 July to 31 August. A booking for an SUV in July will be priced at €120 × 1.20 = €144/day.

### Deleting a Rate or Override

Click **Delete** next to any row. You will be asked to confirm. Deleting a historical base rate does not affect existing bookings. However, deleting the current (active) rate for a category will mean that category falls back to its previous rate for new bookings.

> **Warning:** Only delete a base rate if you are immediately adding a replacement. Do not leave a category with no rate — new bookings for that category may show as €0.

---

## 2.9 Availability and Date Blocking

Go to **Availability** in the left navigation.

Use this page to block specific vehicles from being booked during a date range. Use cases include:

- Vehicle in for routine maintenance or MOT
- Vehicle reserved for a corporate client offline
- Vehicle being repaired after an incident

[Screenshot: Availability page showing the block form and a table of current blocks]

### Creating a Block

1. In the **Block Vehicle** form, select the vehicle from the dropdown.
2. Enter the **Start date** and **End date**.
3. Optionally enter a **Reason** — for example, "Scheduled service", "MOT", "Booked privately". This is for internal reference only and is not shown to customers.
4. Click **Block dates**.

The block appears in the table below and the vehicle will be unavailable for customer bookings during that period.

> **Tip:** After creating a block, open the Fleet Calendar to visually confirm the block period looks correct.

### Removing a Block

Find the block in the table and click **Remove**. You will be asked to confirm. Once removed, the vehicle is available for booking in that date range again.

---

## 2.10 Predictive Maintenance (AI-Powered)

Go to **Maintenance** in the left navigation.

RECI Transport automatically monitors each vehicle's mileage and flags vehicles that are overdue or approaching their service interval. An AI generates a plain-English recommendation for each flagged vehicle.

[Screenshot: Maintenance page with one critical alert showing a 2022 BMW with 19,000 km since last service]

### How It Works

The system compares each vehicle's current mileage (entered when you update the vehicle record) with the mileage recorded at its last service. The difference is called **km since last service**.

Three severity levels trigger alerts:

| Severity | Colour | Threshold |
|---|---|---|
| Warning | Yellow | 8,000 km or more since last service |
| Alert | Orange | 12,000 km or more since last service |
| Critical | Red | 18,000 km or more since last service |

### Summary Cards

At the top of the Maintenance page, four summary cards show:

- **Total Flagged** — total vehicles currently requiring attention
- **Critical** — vehicles at 18,000+ km
- **Alert** — vehicles at 12,000+ km
- **Warning** — vehicles at 8,000+ km

### Flagged Vehicle Cards

Each flagged vehicle is shown as a card with a coloured left border indicating severity. The card shows:

- Vehicle make, model, year, and registration plate
- Severity badge
- Total mileage and km since last service
- Last service date (if recorded)
- Category and location
- An AI-generated recommendation sentence

**Example AI recommendation:**  
"This vehicle has exceeded the recommended 10,000 km service interval by 9,000 km — schedule an oil change and inspection immediately to avoid warranty issues."

### Resolving a Maintenance Alert

When a vehicle has been serviced:

1. Click **Mark Serviced** on the vehicle's card.
2. The system resets the `last_service_mileage` to the vehicle's current odometer reading.
3. The card disappears from the maintenance list.
4. The km-since-service counter resets to zero.

> **Note:** After marking a vehicle as serviced, you should also update the vehicle's **Last Service Date** in the Fleet > Edit Vehicle form for accurate record-keeping. The "Mark Serviced" button resets the mileage counter but does not update the date field automatically.

> **Warning:** If a vehicle shows on the maintenance page but you are sure it has been recently serviced, the `last_service_mileage` field in the vehicle record may be blank or set to zero. Click "Edit vehicle" on the maintenance card and update the last service mileage to the correct odometer reading.

---

## 2.11 Account Settings — Changing Your Password

Go to **Settings** in the left navigation (available to all logged-in admin and staff users).

### How to Change Your Password

1. Click **Settings** in the left sidebar.
2. Enter your new password in the **New Password** field (minimum 8 characters).
3. Re-enter it in the **Confirm New Password** field.
4. Click **Update Password**.
5. A green confirmation banner appears when the change is saved.

> **Tip:** Use the eye icon next to each field to show or hide the password as you type.

> **First login:** If you were given a temporary password by your administrator, change it immediately using this page. Do not share your password with anyone.

**Example:** Admin logs in with `Admin@2025!` → navigates to Settings → enters a new personal password → clicks Update Password → confirmation shown. Next login uses the new password.

---

## 2.12 User and Staff Management

Go to **Users** in the left navigation. This section is visible only to users with the **admin** role.

Here you can:

- View all staff accounts
- Create new staff accounts
- Change a staff member's role (staff, admin, corporate_manager)
- Deactivate accounts for staff who have left

> **Security:** Never share login credentials. Each staff member should have their own account. If a staff member leaves, deactivate their account immediately — do not simply change the password.

---

## 2.13 Roles and Permissions Reference

| Role | What They Can Access |
|---|---|
| `customer` | Customer website only — cannot access the admin portal |
| `staff` | Full admin portal access except the Users tab |
| `admin` | Full admin portal access including Users tab (manage other accounts) |
| `corporate_manager` | Corporate account features on the customer side |

The correct role must be set for the admin portal to work. If a staff member can log in but sees a "403 Forbidden" or "401 Unauthorised" error, their role has not been set correctly. Ask your technical team to resolve this.

---

## 2.14 Booking Status Reference

| Status | Meaning | When to Set It |
|---|---|---|
| `pending` | Booking created; payment not yet confirmed | Automatic — set when customer completes driver details step |
| `confirmed` | Payment received and confirmed; booking is live | Automatic — set by Stripe webhook after successful payment |
| `active` | Vehicle has been collected; rental is in progress | Staff marks this manually when the customer picks up |
| `completed` | Vehicle returned; rental finished | Staff marks this manually when the vehicle comes back |
| `cancelled` | Booking cancelled before pick-up | Staff marks this when a customer cancels |
| `no_show` | Customer did not appear at pick-up time and did not contact us | Staff marks this after waiting the agreed grace period |

---

## 2.15 Daily Operations Checklist

Use this checklist to start each day:

1. Open the **Dashboard** and note today's "Pickups Today" count.
2. If there is a yellow pending alert, click "Review" and action any bookings awaiting payment.
3. Go to the **Fleet Calendar** and confirm you know which vehicles are being collected and returned today.
4. Check the **Maintenance** page for any critical or alert-level vehicles. Schedule service for any vehicle at "Alert" or above before its next booking.
5. As customers collect vehicles, change the booking status from "confirmed" to **Active**.
6. As customers return vehicles, change the booking status from "active" to **Completed**, and update the vehicle mileage in the Fleet record.

---

---

# Part 3 — For Technical Staff

## 3.1 Who This Section Is For

This section is for developers, systems administrators, and IT staff responsible for deploying, maintaining, and troubleshooting the RECI Transport system. It assumes familiarity with Next.js, Node.js, environment variables, and external API services.

---

## 3.2 System Architecture Overview

RECI Transport is a monorepo built with pnpm workspaces and Turborepo.

```
reci-transport/
  apps/
    web/        # Customer-facing Next.js app (port 3000)
    admin/      # Admin portal Next.js app (port 3001)
    mobile/     # Mobile app (separate, not covered in this document)
  packages/     # Shared utilities (e.g., price calculation logic)
  supabase/     # Database migrations, seed files, edge functions
  scripts/      # One-off scripts (seed, create admin user, etc.)
```

**Technology stack:**

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Payments | Stripe (Payment Intents, Webhooks) |
| Email | Resend |
| AI features | Anthropic Claude API |
| Hosting | Vercel (recommended) or Node.js server |

**Admin portal authentication:**  
The admin portal uses Supabase Auth with a JWT claim check. The user's `app_metadata.role` must be set to `staff` or `admin` in Supabase Auth (so the JWT includes the role). The `user_profiles` table must also have the matching role. Both must be set — one alone is insufficient.

---

## 3.3 Environment Variables Reference

All environment variables must be set in `.env.local` (development) or in your hosting provider's environment settings (production). Do not commit any `.env` file containing secrets to version control.

| Variable | App | Description | Expose to Client? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Both | Supabase project URL (e.g. `https://xxxx.supabase.co`) | Yes (safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both | Supabase public anon key for client-side DB access | Yes (safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Both (server only) | Supabase service role key — bypasses row-level security. Never expose. | No — server only |
| `STRIPE_SECRET_KEY` | Both (server only) | Stripe secret API key. Never expose to client. | No — server only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | web | Stripe publishable key — loaded into the payment form | Yes (safe) |
| `STRIPE_WEBHOOK_SECRET` | web (server only) | Validates incoming Stripe webhook payloads. | No — server only |
| `ANTHROPIC_API_KEY` | Both (server only) | Claude AI API key. Used for maintenance recommendations, AI search, extras recommendations, and trip co-pilot. | No — server only |
| `RESEND_API_KEY` | web (server only) | Resend email API key for sending booking confirmations. | No — server only |
| `RESEND_FROM_EMAIL` | web (server only) | Sender email address (must be from a verified domain in Resend). | No — server only |

> **Security:** Any variable not prefixed with `NEXT_PUBLIC_` is server-side only and never sent to the browser. Never move a secret variable into a `NEXT_PUBLIC_` prefixed name, as this would expose it to all visitors.

---

## 3.4 Starting and Stopping the System

### Development

Start all apps from the monorepo root:

```bash
pnpm dev
```

This starts:
- Customer website at `http://localhost:3000`
- Admin portal at `http://localhost:3001`

### Stopping a Process on a Specific Port (Windows)

```bash
# Find the PID using the port
netstat -ano | findstr :3000

# Kill the process (replace 12345 with actual PID)
taskkill /F /PID 12345
```

### Production Build

```bash
pnpm build
pnpm start
```

If deploying on Vercel, the build and start are handled automatically on push.

### Running Database Seed Scripts

```bash
# From the root
node seed.mjs

# Or using the PowerShell wrapper
./run_seed.ps1
```

### Creating an Admin User

```bash
node create_admin.mjs
```

This script is also available inside `apps/web/`:

```bash
node apps/web/create_admin.mjs
```

---

## 3.5 Database — Supabase

**Dashboard:** [https://supabase.com](https://supabase.com) → Your project

### Key Tables

| Table | Purpose |
|---|---|
| `vehicles` | Fleet records including mileage, last_service_mileage, is_active |
| `bookings` | All bookings with status, driver details, pricing |
| `payments` | Payment records linked to bookings |
| `user_profiles` | Extended user data including role |
| `loyalty_points` | Points balance and lifetime total per user |
| `loyalty_transactions` | Full transaction history (earned, redeemed, adjusted) |
| `loyalty_tiers` | Tier definitions (Bronze, Silver, Gold, Platinum) |
| `extras` | Available add-ons (GPS, child seat, etc.) |
| `pricing_rules` | Base rate per category with effective dates |
| `pricing_overrides` | Seasonal surcharge rules |
| `availability_blocks` | Manual date blocks on vehicles |
| `vehicle_categories` | Category definitions (Economy, SUV, etc.) |
| `locations` | Pick-up and drop-off location records |

### Migrations

Migrations are in `supabase/migrations/`. To apply new migrations locally, use the Supabase CLI:

```bash
supabase db push
```

### Row-Level Security (RLS)

RLS is enabled. Server-side operations that need elevated access (such as confirming a booking from a webhook) use `SUPABASE_SERVICE_ROLE_KEY`. Client-side operations use the anon key and are governed by RLS policies.

---

## 3.6 Payments — Stripe

**Dashboard:** [https://dashboard.stripe.com](https://dashboard.stripe.com)

### Payment Flow

1. Customer completes Step 3 (driver details). A booking record is created in the database with `status = pending`.
2. Customer proceeds to Step 4 (payment). The web app calls `/api/payments/intent` with the `booking_id`.
3. The server creates a Stripe Payment Intent and returns the `client_secret` to the browser.
4. The browser renders the Stripe `PaymentElement`, which the customer fills in and submits.
5. Stripe processes the payment and redirects the browser to `/book/confirmation?booking_id=...&redirect_status=succeeded`.
6. Stripe also sends a webhook event (`payment_intent.succeeded`) to `/api/webhooks/stripe`.
7. The webhook handler updates the booking status to `confirmed` and awards loyalty points.

### Webhook Configuration

The Stripe webhook endpoint is:  
`https://[your-domain]/api/webhooks/stripe`

Register this URL in Stripe Dashboard > Developers > Webhooks. The webhook must be subscribed to at minimum:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`

The signing secret from Stripe must match `STRIPE_WEBHOOK_SECRET` in your environment.

### Testing Payments in Development

Use Stripe's test card numbers. The most useful are:

- **Success:** `4242 4242 4242 4242` — any future date, any 3-digit CVC
- **Declined:** `4000 0000 0000 0002`
- **Requires authentication (3DS):** `4000 0025 0000 3155`

For webhooks in development, use the Stripe CLI to forward events to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The Stripe CLI will output a local webhook signing secret — use that as `STRIPE_WEBHOOK_SECRET` in development.

---

## 3.7 Email — Resend

**Dashboard:** [https://resend.com](https://resend.com)

Resend is used to send booking confirmation emails after payment is confirmed. The email is triggered inside the Stripe webhook handler once a booking is confirmed.

### Verified Domain Requirement

`RESEND_FROM_EMAIL` must use a domain that has been verified in your Resend account. Sending from an unverified domain will result in all emails failing silently or with an API error.

### Checking Failed Sends

In the Resend dashboard, go to **Logs** to see all send attempts with their status. Failed sends show the error reason (e.g., invalid recipient, domain not verified, rate limit).

---

## 3.8 AI Features — Anthropic Claude

**Console:** [https://console.anthropic.com](https://console.anthropic.com)

The Anthropic API key is used in three places:

| Feature | Route | Model Used |
|---|---|---|
| AI search assistant | `POST /api/ai/search` | Claude (latest available) |
| Extras recommendations | `POST /api/ai/extras-recommend` | Claude |
| Predictive maintenance notes | `GET /admin/api/admin/maintenance` | Claude |
| Trip Co-pilot | `POST /api/ai/trip-copilot` (streaming) | Claude |

All AI calls are server-side only. The API key is never sent to the browser.

**Soft failure design:**  
All AI features are designed to fail gracefully. If the Anthropic API is unavailable or returns an error:

- The AI search assistant falls back to showing all vehicles
- The extras recommendations do not display (the extras page still works)
- The maintenance page loads without AI notes (mileage-based alerts still appear)
- The Trip Co-pilot shows an error message but the confirmation page remains functional

This means an Anthropic API outage does not break the core booking flow.

---

## 3.9 Common Issues and Fixes

### Issue 1: Customer cannot log in

**Symptom:** Customer reports they cannot sign in, sees "Email not confirmed" or "Invalid credentials".

**Fix steps:**
1. Go to **Supabase Dashboard** > Authentication > Users.
2. Find the user by email.
3. Check if **Email confirmed** is marked Yes. If No, click the user and manually confirm their email, or trigger a resend confirmation email.
4. Check that the Supabase Auth **Redirect URLs** setting includes the deployed domain (Settings > Authentication > URL Configuration). A mismatch here prevents the email confirmation link from working.

---

### Issue 2: Booking created but no confirmation email sent

**Symptom:** Customer has a confirmed booking but did not receive an email.

**Fix steps:**
1. Go to **Resend Dashboard** > Logs and search for the customer's email address.
2. Check the status of the send attempt. Common errors:
   - `Domain not verified` — verify `RESEND_FROM_EMAIL` uses a verified domain.
   - `Invalid API key` — check `RESEND_API_KEY` is set correctly.
   - No entry at all — the webhook may not have fired (see Issue 3).

---

### Issue 3: Points not awarded after payment

**Symptom:** Customer paid but their points balance did not increase.

**Root cause:** Points are awarded inside the Stripe webhook handler. If the webhook did not fire or failed, points are not awarded.

**Fix steps:**
1. Go to **Stripe Dashboard** > Developers > Webhooks.
2. Find your endpoint and click on it. Look at recent events.
3. Find the `payment_intent.succeeded` event for the relevant payment. Check the delivery attempts — if it shows a non-200 response or timed out, click "Resend" to attempt delivery again.
4. Check server logs for errors in the `/api/webhooks/stripe` handler.
5. Verify `STRIPE_WEBHOOK_SECRET` in your environment matches the signing secret shown in the Stripe Dashboard for that webhook endpoint.

> **Note:** If a webhook event was missed and points need to be manually awarded, a staff or admin user can perform a loyalty adjustment directly in the Supabase `loyalty_transactions` table using the Supabase Dashboard.

---

### Issue 4: Maintenance page shows no vehicles despite known overdue vehicles

**Symptom:** The Maintenance page shows "All clear" but you know some vehicles are overdue.

**Root cause:** Vehicles need both `mileage` and `last_service_mileage` to be set in the database. If `last_service_mileage` is NULL, the system defaults to 0, meaning any vehicle with mileage over 8,000 km will show. If no vehicles appear at all, all vehicles may have mileage set to NULL or to 0.

**Fix steps:**
1. Go to **Fleet** in the admin portal and open the affected vehicle.
2. Check that the **Mileage** field is filled in with a current odometer reading.
3. Check that the **Last Service Mileage** field is also filled in.
4. If either is missing, update the vehicle record.

Alternatively, query the `vehicles` table in Supabase and look for records where `mileage IS NULL` or `mileage = 0`.

---

### Issue 5: Admin portal returns 401 Unauthorised

**Symptom:** A staff member can log in but sees a 401 error when accessing the admin portal pages or API.

**Root cause:** The admin portal checks the JWT's `app_metadata.role` claim. This claim is not automatically set when a user is created. Both the Supabase Auth metadata and the `user_profiles` table must have the role set.

**Fix steps:**

1. In Supabase Dashboard > Authentication > Users, find the user.
2. Click the user and open the JSON editor for **App Metadata**.
3. Add or update: `{ "role": "staff" }` (or `"admin"` for full access).
4. In the **Table Editor**, find the `user_profiles` table.
5. Find the row for this user and set the `role` column to `staff` or `admin`.
6. The user must sign out and sign back in for the new JWT claim to take effect.

> **Note:** Use the Supabase service role key (from the server) to update `app_metadata` — this cannot be done with the anon key.

---

### Issue 6: "Or similar" versus "Exact model" toggle

**Symptom:** A customer complains they were given a different car than pictured, or a badge is missing/unexpected on a listing.

**Fix:**  
In Fleet > Edit Vehicle, find the **Exact Model Guaranteed** toggle.

- **On:** A badge appears on the customer listing. The customer must receive this specific vehicle.
- **Off:** The listing shows "or similar model". The customer may receive a vehicle of equivalent category and value.

Ensure this toggle accurately reflects your operational promise for each vehicle.

---

### Issue 7: Price does not update after changing pricing rules

**Symptom:** A pricing rule was updated but existing bookings still show the old price.

**Expected behaviour:** This is by design. Pricing is calculated and locked at booking creation time. Changing a pricing rule only affects new bookings created after the change. Existing confirmed bookings are not recalculated.

If you need to adjust the price on an existing booking, this must be done manually in the Supabase `bookings` table or through a Stripe refund/additional charge as appropriate.

---

## 3.10 Webhook Reference

### Stripe Webhook Handler

**Path:** `/api/webhooks/stripe`  
**Method:** POST  
**Authentication:** Stripe signature validation using `STRIPE_WEBHOOK_SECRET`

Events handled:

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Update booking status to `confirmed`, create payment record, award loyalty points, send confirmation email |
| `payment_intent.payment_failed` | Update booking status to `payment_failed` |

---

## 3.11 Deployment Notes

### Vercel (Recommended)

The project includes a `vercel.json` at the root. The two Next.js apps (`web` and `admin`) are deployed as separate Vercel projects with separate environment variables.

**Checklist before deploying to production:**

1. All environment variables are set in the Vercel project settings — verify each one.
2. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set for the correct production Supabase project (not the development project).
3. Stripe webhook endpoint is registered in Stripe Dashboard pointing to the production domain, not localhost.
4. `STRIPE_WEBHOOK_SECRET` in Vercel matches the production webhook signing secret from Stripe.
5. `RESEND_FROM_EMAIL` uses a domain that is verified in Resend.
6. Supabase Auth redirect URLs include the production domain.
7. Run `pnpm build` locally before pushing to confirm there are no TypeScript or build errors.

### After Any Environment Variable Change

Vercel picks up new environment variables on the next deployment. If the server is running manually (not Vercel), kill and restart the process after any `.env` change — a running process does not pick up changes to environment variables automatically.

### Database Migrations in Production

Apply migrations to the production Supabase project using the Supabase CLI:

```bash
supabase db push --db-url [production-db-url]
```

Always back up the database before applying migrations to production. Supabase provides point-in-time restore for Pro-tier projects.

---

*End of RECI Transport System Documentation*

---

*For support or questions about this documentation, contact the RECI Transport technical team.*

---

## 4. Coming Soon — Planned Features

This section lists features that are planned or partially prepared in the system. Business owners and staff can expect these to be available in future releases.

---

### 4.1 Mobile App

RECI Transport will have a native mobile app for iOS and Android. Customers will be able to browse vehicles, make bookings, view their loyalty balance, and receive push notifications for booking reminders — all from their phone.

**What to expect:**
- Full booking flow on mobile
- Push notifications: booking confirmation, 24-hour pickup reminder, return reminder
- Loyalty balance and tier progress visible at a glance

---

### 4.2 Dynamic (Demand-Based) Pricing

The database already tracks demand signals per vehicle category. In a future release, prices will automatically adjust based on how busy a given period is.

**Example:** If SUVs are almost fully booked for a weekend, the price per day may increase by 10–15% to reflect high demand. When demand is low, prices may be slightly reduced to encourage bookings.

Admins will be able to view a demand heatmap and configure how aggressively pricing responds to demand.

---

### 4.3 White-Label AI API (for Business Partners)

RECI will offer its AI-powered vehicle search and availability API to other businesses — for example, a travel agency that wants to embed RECI vehicle search into their own website.

Business partners will receive an API key and can query vehicle availability, pricing, and make bookings programmatically.

---

### 4.4 AI Damage Detection

At vehicle pickup and return, staff or customers will be able to upload photos. The system will use AI (Claude vision) to:
- Compare pickup vs return photos automatically
- Identify new damage (scratches, dents, etc.)
- Classify severity as none, minor, or major
- Generate a written damage report instantly

Admins will be able to review the AI report, view both photo sets side by side, and override the assessment if needed.

---

### 4.5 AI Driving Licence Verification

Customers will be able to upload a photo of their driving licence directly in their account. The AI will:
- Automatically read the name, date of birth, licence number, and expiry date
- Verify the information matches their account
- Flag expired or unclear licences for admin review

Once verified, the customer's account is marked as licence-verified, which may unlock faster checkout on future bookings.

---

### 4.6 Automated Email Reminders

Currently the system sends booking confirmation emails. Future releases will add:
- **Pickup reminder** — sent 24 hours before the pickup time
- **Return reminder** — sent 2 hours before the scheduled return time
- **Loyalty tier upgrade** — a congratulations email when a customer reaches Silver, Gold, or Platinum
- **Maintenance alert** — an internal email to admin staff when a vehicle reaches critical maintenance status

---

### 4.7 Corporate Invoice Payments

Corporate account customers will be able to pay by invoice rather than card. This means:
- The booking is created without requiring immediate card payment
- An invoice PDF is generated and sent by email
- The admin portal will track outstanding invoices and allow marking them as paid
- Credit limits per corporate account are enforced automatically

---

### 4.8 Refunds

Admins will be able to issue full or partial refunds directly from the booking detail page. The refund is processed through Stripe and the customer receives a confirmation email. Any loyalty points earned on the refunded booking will be reversed automatically.

---

### 4.9 Seasonal / Event Pricing Overrides

Admins will be able to add surcharges for specific date ranges — for example, a 15% surcharge during a trade fair or a flat €20 surcharge for airport pickup during peak holiday periods. These stack on top of the base rate and are applied automatically at checkout.

---

### 4.10 Real-Time Availability in Date Picker

The booking calendar will be updated to show unavailable dates in real time. Dates when a specific vehicle is already booked, under maintenance, or manually blocked will be greyed out and unselectable — preventing customers from choosing unavailable slots.

> **Note for staff:** If you need to block a vehicle (for servicing or any other reason), use the **Availability** page in the admin portal. The block will reflect in the customer-facing date picker once this feature is live.

---

*End of RECI Transport System Documentation*
