# Teacher Allocation Portal — Saharsa District, Bihar

A bilingual (English / हिन्दी) web app for fairly allocating teachers to
panchayats based on the teachers' own ranked preferences and their
performance scores.

- **Teachers** open the public site, **pick their name** from the roster the
  admin uploaded, enter their designation, mobile number and present posting,
  then submit **5 ranked panchayat preferences**. The mobile number prevents
  duplicate entries.
- **The administrator** (District Education Office) logs in, uploads the
  official roster + performance scores and the panchayat list, then runs an
  **automatic, auditable allocation**. Teachers then check their result online.
- Hosted free on **GitHub Pages**, with a free **Firebase** backend for the
  shared database and admin login.

> ℹ️ **Panchayat data:** [`data/saharsa-panchayats.csv`](data/saharsa-panchayats.csv)
> contains the **full official list of all 135 panchayats** across the 10 blocks
> of Saharsa (English + Hindi). The Hindi spellings are transliterations — verify
> and correct any before going live. [`data/sample-teachers.csv`](data/sample-teachers.csv)
> is a small illustrative roster; replace it with your real teacher list.

> ⚠️ **Integrity note:** teachers identify themselves by selecting their name
> (there is no login/verification), so the system trusts that they pick their
> own name. The mobile-number check blocks duplicates, and the admin can delete
> any registration. This suits a low-stakes, self-service process.

---

## Table of contents

1. [How it works](#how-it-works)
2. [Project structure](#project-structure)
3. [One-time setup (do this once)](#one-time-setup)
4. [Loading your data](#loading-your-data)
5. [Running an allocation round](#running-an-allocation-round)
6. [How the allocation algorithm works](#how-the-allocation-algorithm-works)
7. [Local testing](#local-testing)
8. [Security notes](#security-notes)
9. [हिन्दी सारांश (Hindi quick reference)](#हिन्दी-सारांश)

---

## How it works

GitHub Pages can only serve static files — it cannot run a database. So the
app uses **Firebase** (Google's free service) for the two things a static
site can't do itself:

```
   Teachers' phones / laptops            Admin's computer
   (public site, no login)               (signed-in admin)
            │                                   │
            │  read panchayats / roster         │  read & write everything
            │  write own submission ────────────┤  run allocation, publish
            ▼                                   ▼
        ┌───────────────────────────────────────────┐
        │                FIREBASE                     │
        │  • Firestore (database)                     │
        │  • Authentication (admin email/password)    │
        │  • Security Rules (firestore.rules)         │
        └───────────────────────────────────────────┘
```

- **Performance scores are never exposed** to the public — they live in an
  admin-only collection (`teachers_private`). The public roster has names only.
- **Duplicate submissions are blocked**: a teacher can submit once, and each
  mobile number can be used once (enforced by create-only security rules).
- **Results are hidden** until the admin clicks **Publish**.
- The Firebase "web config" you paste in is **not a secret** — your data is
  protected by the security rules and the admin login, not by hiding keys.

---

## Project structure

```
smart-teacher-allocation/
├── index.html          # Teacher portal (submit preferences)
├── results.html        # Public result lookup
├── admin.html          # Admin dashboard (login required)
├── firestore.rules     # Firebase security rules → paste into console
├── css/
│   └── styles.css
├── js/
│   ├── firebase-config.js   # ← YOU paste your Firebase keys here
│   ├── firebase-init.js     # Firebase setup + data access layer
│   ├── i18n.js              # English/Hindi translations
│   ├── common.js            # Shared UI + CSV helpers
│   ├── allocation.js        # Pure allocation engine (deferred acceptance)
│   ├── teacher.js           # Teacher portal logic
│   ├── admin.js             # Admin dashboard logic
│   └── results.js           # Result lookup logic
└── data/
    ├── saharsa-panchayats.csv   # Official 135 panchayats (EN + HI)
    └── sample-teachers.csv       # Illustrative roster — replace with real list
```

There is **no build step** — it's plain HTML/CSS/JavaScript. What you see is
what gets deployed.

---

## One-time setup

You'll need a free **Google account** and a free **GitHub account**.

### Step 1 — Create a Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it e.g. `saharsa-teacher-allocation`. (You can disable Google
   Analytics — it's not needed.)

### Step 2 — Create the Firestore database

1. In the project, open **Build → Firestore Database → Create database**.
2. Choose **Production mode** (we'll paste proper rules in Step 5).
3. Pick a location close to India, e.g. `asia-south1 (Mumbai)`.

### Step 3 — Enable admin login

1. Open **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Go to the **Users** tab → **Add user**. Create the **single admin
   account**, e.g. `deo.saharsa@example.gov.in` with a strong password.
   > Create **only this one account.** Everyone signed in is treated as the
   > administrator.

### Step 4 — Connect the app to Firebase

1. In Firebase, open **Project settings** (⚙️) → **General** → scroll to
   **Your apps** → click the **Web** icon `</>` → register an app
   (any nickname, no need for Hosting).
2. Firebase shows a `firebaseConfig = { ... }` block. Copy those values.
3. Open [`js/firebase-config.js`](js/firebase-config.js) in this project and
   paste each value, replacing every `PASTE_...` placeholder:

   ```js
   export const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "saharsa-teacher-allocation.firebaseapp.com",
     projectId: "saharsa-teacher-allocation",
     storageBucket: "saharsa-teacher-allocation.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef...",
   };
   ```

### Step 5 — Publish the security rules

1. In Firebase, open **Firestore Database → Rules**.
2. Delete what's there and paste the entire contents of
   [`firestore.rules`](firestore.rules).
3. Click **Publish**.

### Step 6 — Deploy to GitHub Pages

1. Create a GitHub repository (e.g. `smart-teacher-allocation`) and push all
   these files to the `main` branch. From this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial deploy"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo>.git
   git push -u origin main
   ```

2. On GitHub, open the repo → **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**,
   pick branch **`main`** and folder **`/ (root)`**, then **Save**.
4. After a minute, GitHub shows your live URL, e.g.
   `https://<your-username>.github.io/<repo>/`.

### Step 7 — Authorise the GitHub Pages domain in Firebase

Admin login will be blocked from an unknown domain until you allow it:

1. Firebase → **Authentication → Settings → Authorized domains → Add domain**.
2. Add `<your-username>.github.io`.

✅ **Setup complete.** Visit `…github.io/<repo>/admin.html` and log in with the
admin account.

---

## Loading your data

Log in to the **Admin** page, then:

1. **Panchayats tab** → **Import CSV** and choose
   [`data/saharsa-panchayats.csv`](data/saharsa-panchayats.csv) — the full
   official list of 135 panchayats is loaded for you.
   - `capacity` is the number of seats per panchayat (default `1`). Edit a row,
     or the CSV column, if a panchayat needs more than one teacher.
   - Columns: `name_en, name_hi, block, capacity`.
2. **Teacher Roster tab** → **Import CSV** with your official teacher list.
   - Columns: `name_en, name_hi, school, block, performance_score`
     (`school`/`block` are optional but help teachers pick the right name when
     two teachers share a name).
   - Higher `performance_score` = higher priority when two teachers want the
     same panchayat. **Scores are never shown to teachers.**
   - See [`data/sample-teachers.csv`](data/sample-teachers.csv) for the format.

That's all the admin needs to prepare — there are no access codes to generate
or distribute. Teachers simply pick their name on the public site.

---

## Running an allocation round

The normal workflow:

1. **Overview tab → Open submissions.** Teachers can now visit the site, pick
   their name, fill their details and submit their 5 preferences. Each teacher
   can submit once; to let someone re-submit, delete their registration.
2. Watch progress in the **Teacher Roster** (Registered/Pending) and
   **Registrations** tabs. To let a teacher change their choices, open the
   **Registrations** tab and **Delete** their entry — they can then submit again.
3. When the deadline passes, **Overview tab → Close submissions** (so
   preferences can't change while you allocate).
4. **Allocation tab → Run allocation.** Results compute instantly. Review the
   results table and the **Unallocated teachers** list.
5. For any unallocated teacher, use **Manual assignment** to place them into a
   panchayat that still has a free seat.
6. Happy with the outcome? **Publish results.** Teachers can now look
   themselves up (by name) on the **Check Result** page.
   - Not happy? **Re-run (new random seed)** reshuffles only the tie-breaks,
     or fix the data and run again. Results stay hidden until you publish.
7. **Export results CSV** for your records.

The **random seed** used for the run is shown on the Allocation tab — keep it
for your records; the same seed always reproduces the same result.

---

## How the allocation algorithm works

The engine ([`js/allocation.js`](js/allocation.js)) uses **teacher-proposing
deferred acceptance** (the Gale–Shapley algorithm):

1. Every teacher "proposes" to their **1st preference**.
2. Each panchayat tentatively **holds** the highest-priority proposer(s) up to
   its capacity and **rejects** the rest.
3. Rejected teachers propose to their **next preference**; panchayats again
   keep the best proposers seen so far. This repeats until no one is rejected.

**Priority = performance score** (higher wins). When two teachers have the
**exact same score** and want the same seat, the tie is broken by a value from
a **seeded random generator** — so ties are fair *and* every run is fully
reproducible from its seed (important for audit and transparency).

A teacher who is rejected by all 5 of their preferences is listed as
**unallocated** and is placed manually by the admin.

> Because every panchayat ranks teachers the same way (by performance), this
> produces exactly the same outcome as a performance-priority "serial
> dictatorship", but is written as deferred acceptance so it stays correct if
> per-panchayat priorities are ever added.

---

## Local testing

Because the app uses JavaScript modules, open it through a local web server
(not by double-clicking the HTML file):

```bash
# from the project folder
python3 -m http.server 8000
# then visit http://localhost:8000
```

To let admin login work locally, add `localhost` under Firebase →
Authentication → Authorized domains.

---

## Security notes

- **No login for teachers** — they identify by picking their name. There is no
  identity verification, so this is a low-stakes, trust-based process. The
  controls are: one submission per teacher, one submission per mobile number
  (both enforced by *create-only* Firestore rules), and the admin's ability to
  delete any registration.
- **Performance scores** are stored in `teachers_private`, which the public can
  never read. The public roster (`roster`) holds names only.
- **Submissions** are readable only by the admin, keeping every teacher's
  mobile number and choices private.
- **Results** become publicly readable only after **Publish**.
- To restrict the admin role to one specific email, edit the `isAdmin()`
  function in [`firestore.rules`](firestore.rules) (an example is in the
  comments) and re-publish.
- Firebase's free **Spark** plan is sufficient for a district-scale round. If
  you ever exceed the daily free read/write quota, runs will pause until the
  next day — re-running later is safe.

---

## हिन्दी सारांश

यह **सहरसा ज़िला** के लिए शिक्षक आवंटन ऐप है। शिक्षक अपनी **5 वरीयताएँ** भरते हैं,
और प्रशासक (ज़िला शिक्षा कार्यालय) **प्रदर्शन अंक** के आधार पर स्वतः आवंटन करते हैं।

**एक बार का सेटअप (ऊपर अंग्रेज़ी चरण देखें):**
1. Firebase प्रोजेक्ट बनाएँ → Firestore डेटाबेस बनाएँ।
2. Authentication में **Email/Password** चालू करें और **केवल एक प्रशासक खाता** बनाएँ।
3. Firebase का "web config" कॉपी करके `js/firebase-config.js` में पेस्ट करें।
4. `firestore.rules` की सामग्री Firebase → Firestore → Rules में पेस्ट करके **Publish** करें।
5. कोड को GitHub पर पुश करें और **Settings → Pages** से साइट चालू करें।
6. Firebase → Authentication → Authorized domains में अपना `…github.io` डोमेन जोड़ें।

**हर आवंटन चक्र:**
1. प्रशासक पंचायत सूची (saharsa-panchayats.csv) और शिक्षक सूची (नाम + प्रदर्शन अंक) CSV से अपलोड करें।
2. **सबमिशन खोलें** → शिक्षक साइट पर अपना **नाम चुनें**, पदनाम, मोबाइल व वर्तमान पदस्थापन भरें, फिर 5 वरीयताएँ चुनें।
   - मोबाइल नंबर दोहरी प्रविष्टि रोकता है। किसी शिक्षक को दोबारा भरने देने हेतु प्रशासक **पंजीकरण** टैब से उसकी प्रविष्टि हटाएँ।
3. समय समाप्त होने पर **सबमिशन बंद करें** → **आवंटन चलाएँ**।
4. अनावंटित शिक्षकों को **मैन्युअल आवंटन** से रखें → **परिणाम प्रकाशित करें**।
5. शिक्षक **परिणाम देखें** पृष्ठ पर अपना नाम चुनकर आवंटन देख सकते हैं।

**आवंटन नियम:** अधिक प्रदर्शन अंक = अधिक प्राथमिकता। समान अंक होने पर एक *सीडेड रैंडम*
मान से टाई तोड़ा जाता है, जिससे हर रन पुनरुत्पाद्य व पारदर्शी रहता है।

---

_Education Department, Saharsa District · Government of Bihar_
