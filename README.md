# Campus Stores · Product Engineer Practical

Campus Stores is a dependency-free, offline-ready web application modeling an equipment desk at a fictional campus. This document contains the submission writeup for the Product Engineer practical, detailing what the product handles well, what was redesigned, the prototype built, the job walkthrough, and real-counter validation.

---

## 1. One Thing the Product Does Well (with Evidence)

### The physical 1:1 slip abstraction makes split returns natural
The core data model assigns **one loan slip per physical unit** (`register()` / `s.loans`), rather than treating an entire multi-item request as a single monolithic checkout bundle.

* **Evidence:** In Scene 2 (Friday 7:30 pm), Kabir returns only 2 of the 3 items issued for the Film Society screening (`PR-04` projector and `SP-02` speaker), while Leela keeps the `AD-12` adapter overnight. Because slips are tracked per unit, closing two slips (`L-402`, `L-403`) leaves slip `L-404` open. The **Outstanding** filter in the Loan register immediately surfaces the exact missing physical unit without requiring any bespoke "partial return" state machine or complex order splitting.

---

## 2. One Thing to Change (with Evidence)

### The approved request was treated as passive paper, not the governing rule
Before this change, the approved request had no programmatic enforcement on desk workflows:
1. **Unconstrained Issue Choices:** The issue form offered every available unit on the shelf, including units belonging to unrelated clubs (e.g. microphones and cameras), and allowed issuing duplicate quantities beyond what was approved.
2. **Disconnected Due Dates:** The "Return by" dropdown was a static list of strings (`Fri 8 pm`, `Sat 9 am`, `Sat 10 am`, `Sat noon`) unrelated to the request. A clerk could issue a kit due at Friday 8:00 pm with a Saturday noon return slip with zero warnings.
3. **Missing Returner Identity:** Slips stored only the collector (`who`), so when Leela returned the adapter on Saturday morning, the record still permanently attributed the transaction to Kabir.
4. **Repetitive Multi-Item Overhead:** Checking out a 3-item kit required filling out the full form three separate times, manually picking requests and units repeatedly.
5. **Silent Shift Handovers:** Advancing the clock had no checks or automatic logging. The night shift could close with units still out, leaving the morning shift with no handover note unless manually typed into the desk book.

---

## 3. The Prototype: What Was Changed

We transitioned the application to an **obligation-first architecture** with streamlined checkout and automated shift audit trails:

### 1. Dedicated `Issue out` Tab & 1-Click Checkout
* Replaced manual repetitive slip creation with an **`Issue out`** workspace (`issueOutPage()`).
* **Grouped by Parent Request:** Displays all approved requests with pending items (e.g. `RQ-214` Film Society), showing due dates, club notes (e.g. the USB-C laptop warning), and required items.
* **Auto-Assigned Units:** Available working units from inventory are matched to approved types with bin locations displayed (`PR-04 · Bin A2`, `SP-02 · Bin B1`, `AD-12 · Bin C4`). Units in repair (`PR-06`) or on loan are excluded.
* **Only Asks Who Is Collecting:** The clerk selects the collector name once and clicks **Issue out (3 items)** to generate all loan slips in a single click. Individual item checkout is also supported.

### 2. Derived Due Dates & Exact Lateness Tracking
* Due dates derive strictly from the parent request (`getReq(l.req).dueAt`).
* Overdue loans dynamically calculate overdue time in the exact format: `Overdue - by 13 hr - since Fri 8 pm`.

### 3. Returner Attribution
* Recording a return (`[data-return]`) requires specifying who brought the unit in. The slip preserves both: `RQ-214 · Kabir Sen · Due Fri 8 pm · Back via Leela Das`.

### 4. Programmatic Shift-End Handover Notes
* When shift time ends (either advancing to the next shift or using the two-step skip guard), `getShiftEndSummary()` programmatically generates a comprehensive handover log in the **Desk book**:
  * Exactly which units are still out on loan (`Slip #`, `Asset ID`, `Model`, `Collector`, `Request`, `Due time`).
  * Any approved items that remain pending checkout.
* The morning clerk opens the desk book to find an automatic audit trail of overnight loans waiting for them.

### 5. Shift Task Strip & Two-Step Guard
* The top yellow shift strip derives real-time status (`Kit issued.`, `Ready for handover.`, `Kit accounted for.`).
* Advancing with unfinished work prompts a confirmation guard (`Work still open` / `Advance anyway` / `Not yet`), preventing accidental shift jumps while logging skipped work.

---

## 4. Walkthrough of the Shift

### Scene 1 — Friday 3:45 pm (Pickup)
1. In the top bar, `RQ-214` indicates `3 left`. Clicking **Issue** navigates directly to the new **Issue out** tab.
2. Under `RQ-214 · Film Society`, the clerk sees the 3 required items pre-assigned to `PR-04`, `SP-02`, and `AD-12` with bin locations.
3. The clerk selects **Kabir Sen** in *Who is collecting?* and clicks **Issue out (3 items)**.
4. Slips `L-402`, `L-403`, and `L-404` are created in one click. The bar updates to `Kit issued.`.
5. The clerk clicks **Move to return time**. A handover note is programmatically saved to the Desk book summarizing the active loans.

### Scene 2 — Friday 7:30 pm (Partial Return)
1. In **Loan register**, Kabir returns the projector (`PR-04`) and speaker (`SP-02`). The clerk clicks **Record return** on each, selects **Kabir Sen**, and confirms.
2. The slips update to `Back via Kabir Sen`. The adapter (`AD-12`) remains open on slip `L-404`.
3. The shift task strip reaches target completion (`Ready for handover.`).
4. The clerk clicks **Move to next morning**. The app programmatically logs:
   > *Shift handover — Still out on loan: L-404 · AD-12 (USB-C → HDMI adapter) with Kabir Sen (RQ-214, due Fri 8 pm); L-401 · MI-09 (Wireless microphone) with Tara Shah (RQ-209, due Sat 10 am). Still pending issue: Digital camera (RQ-217 · Photo Circle).*

### Scene 3 — Saturday 9:00 am (Morning Handover)
1. The morning clerk arrives. The Desk book already lists what was left overnight.
2. In **Loan register**, slip `L-404` is prominently badged: `Overdue - by 13 hr - since Fri 8 pm`.
3. Leela Das hands in the adapter. The clerk clicks **Record return**, chooses **Leela Das**, and confirms.
4. The slip records `RQ-214 · Kabir Sen · Due Fri 8 pm · Back via Leela Das`.
5. The shift task strip displays `Kit accounted for.`, and the **Outstanding** register shows only Tara Shah's microphone (`L-401`, due 10 am).

---

## 5. What Was Kept

* **One slip per physical unit:** Preserved the fundamental architecture that makes split returns clean and reliable.
* **Desk book as a permanent human and system log:** Kept manual handover notes alongside the new programmatic shift-end summaries.
* **Offline single-page architecture:** Vanilla HTML, CSS, and JavaScript with zero external frameworks, dependencies, or build tooling.
* **Persistent Browser Storage:** Maintained backwards-compatible schema migration in `localStorage` under `campus-stores.shift.v1`.

---

## 6. Real-Counter Observation

To verify whether this change helped in a live physical equipment counter:

* **Primary Metric (Speed & Confidence at Handover):** Can a clerk starting their shift answer *"What is still out, who has it, and when was it due?"* within **5 seconds** from the register or desk book, without consulting external chat apps or hunting through paper forms?
* **Secondary Metric (Error Reduction):** The rate of **mismatched due dates** (slips with return times differing from approved club requests) and **misattributed returns** (returns credited to the wrong club member) drops to **zero**.

---

## 7. Code Structure

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, SVG icon definitions, candidate brief, accessibility attributes |
| `app.js` | State management (`s`), `issueOutPage()`, `register()`, `getShiftEndSummary()`, derived task obligations, and storage migration |
| `styles.css` | Container queries, responsive layout (desktop & mobile <420px), tags, form styles |

---

## 8. Running the App

Open `index.html` directly in any modern browser, or run a local HTTP server:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit `http://localhost:8000`. Use **Restart sample shift** at any time to restore the initial shift state.

---

## 9. Submission Details

1. [Fork Campus Stores](https://github.com/virinchi-healthcare/campus-stores/fork) into your GitHub account. Complete the candidate brief and push your changes to your public fork. In your README, point reviewers to your work and explain the decision you made.
2. In your fork, open **Commits**, select the final commit you want reviewed, and copy the page URL (`https://github.com/YOUR-USERNAME/campus-stores/commit/COMMIT-SHA`).
3. [Submit your work through the Google Form](https://docs.google.com/forms/d/e/1FAIpQLScvzoh1R4WS-SkiwAVBQbMvniieJYSoOEfLMyVo5CyjOvYUgQ/viewform). Enter your **roll number** and **email ID** in the form only.
