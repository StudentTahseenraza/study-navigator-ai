# 🤖 AI Counsellor

### Plan Your Study-Abroad Journey with a Guided AI Counsellor

AI Counsellor is a **stage-based intelligent platform** designed to help students plan their study-abroad journey with clarity and confidence.

Instead of overwhelming students with thousands of university listings or generic chatbot answers, the platform uses a **structured AI decision system** that analyzes a student’s **academic background, study goals, budget, and readiness**, then guides them step-by-step from **profile building → university discovery → decision locking → application preparation**.

This project was built as a **functional prototype for a hackathon challenge**, focusing on **AI guidance, decision clarity, and structured execution**.

---

# ✨ Core Idea

Most study-abroad platforms behave like **search engines**.

AI Counsellor behaves like a **decision system**.

Instead of browsing thousands of options, students are **guided through a structured journey** where each stage unlocks the next.

```
Landing Page
     ↓
Signup / Login
     ↓
Mandatory Onboarding
     ↓
Dashboard
     ↓
AI Counsellor
     ↓
University Discovery
     ↓
University Locking
     ↓
Application Guidance
```

This ensures students move from **confusion → clarity → commitment → execution**.

---

# 🧠 Key Features

| Feature                     | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| 🧑‍🎓 Structured Onboarding | Collects academic background, goals, budget, and readiness |
| 🤖 AI Counsellor            | AI assistant that analyzes profile and guides decisions    |
| 🎓 University Discovery     | Recommends Dream / Target / Safe universities              |
| 🔒 University Locking       | Focus mechanism before application preparation             |
| 📊 Dashboard                | Displays progress, profile strength, and next steps        |
| ✅ AI Task Generator         | Automatically generates application tasks                  |
| 🧾 Application Guidance     | Shows required documents and preparation steps             |
| 🔄 Dynamic Updates          | Profile edits recalculate recommendations                  |

---

# 🎯 Product Flow

## 1️⃣ Landing Page

The landing page introduces the platform with a simple message:

> **Plan your study-abroad journey with a guided AI counsellor**

Features include:

* Clean hero section
* Animated background
* Clear call-to-action buttons
* Minimal UI

---

## 2️⃣ Authentication

Authentication is handled using **Supabase Auth**.

Users can:

* Sign up with email
* Log in securely
* Manage sessions automatically

### Signup Fields

* Full Name
* Email
* Password

After signup, users are redirected to **mandatory onboarding**.

---

## 3️⃣ Mandatory Onboarding

The onboarding process collects essential information needed to generate **personalized recommendations**.

### Academic Background

* Current education level
* Degree / major
* Graduation year
* GPA / percentage

### Study Goals

* Intended degree
* Field of study
* Target intake year
* Preferred countries

### Budget

* Annual study budget
* Funding source

### Exams & Readiness

* IELTS / TOEFL status
* GRE / GMAT status
* SOP readiness

Until onboarding is completed, **AI Counsellor access remains locked**.

---

## 4️⃣ Dashboard

The dashboard acts as the **control center of the platform**.

It answers three questions:

1. Where am I right now?
2. What should I do next?
3. How strong is my profile?

### Dashboard Components

* Profile Summary
* Profile Strength Indicator
* Stage Progress Tracker
* AI-generated To-Do List

### Study Journey Stages

```
Stage 1 → Building Profile
Stage 2 → Discovering Universities
Stage 3 → Finalizing Universities
Stage 4 → Preparing Applications
```

---

## 5️⃣ AI Counsellor

The AI Counsellor is the **core intelligence of the platform**.

Unlike traditional chatbots, it **guides decisions and performs actions**.

### Capabilities

* Understands student profile
* Explains strengths and weaknesses
* Recommends universities
* Explains risks
* Shortlists universities
* Locks universities
* Generates application tasks

Example recommendation:

```
Dream: University of Toronto
Target: University of British Columbia
Safe: Simon Fraser University
```

Each recommendation includes:

* Fit explanation
* Risk level
* Estimated acceptance chance
* Cost level

---

## 6️⃣ University Discovery

Universities are suggested using profile-based filtering.

Recommendations consider:

* Academic profile
* Budget
* Preferred countries
* Admission competitiveness

Universities are categorized into:

| Category | Meaning                         |
| -------- | ------------------------------- |
| Dream    | Highly competitive              |
| Target   | Moderate acceptance probability |
| Safe     | High likelihood of admission    |

Each university card displays:

* Estimated tuition
* Risk level
* Acceptance likelihood
* Fit explanation

---

## 7️⃣ University Locking

To prevent decision paralysis, users must **lock at least one university**.

Once locked:

* Strategy becomes university-specific
* Application guidance unlocks
* AI generates preparation tasks

Users can unlock later with a **confirmation warning**.

---

## 8️⃣ Application Guidance

After locking a university, the platform provides structured guidance for application preparation.

Information displayed includes:

* Required documents
* High-level timeline
* AI-generated to-do tasks

Example tasks:

* Prepare Statement of Purpose
* Register for IELTS
* Upload academic transcripts
* Complete application form

Users can mark tasks as **completed**.

---

# 🎨 UI & Design

The interface focuses on **clarity and modern user experience**.

### Design Highlights

* Animated floating background
* Glassmorphism UI cards
* Smooth transitions
* Stage progress indicators
* Fully responsive design

Design inspiration includes:

* Notion
* Linear
* Modern EdTech platforms

---

# 🛠 Tech Stack

| Category         | Technology          |
| ---------------- | ------------------- |
| Frontend         | React / Next.js     |
| Styling          | CSS / Glassmorphism |
| Animation        | Framer Motion       |
| 3D Effects       | React Three Fiber   |
| Database         | PostgreSQL          |
| Backend Platform | Supabase            |
| Authentication   | Supabase Auth       |
| ORM & Queries    | Supabase Client     |
| AI Model         | Gemini API          |
| Deployment       | Vercel              |

---

# 🧩 System Architecture

```
Frontend (Next.js / React)
        │
        ▼
Supabase Backend Platform
        │
        ├── Authentication (Supabase Auth)
        ├── PostgreSQL Database
        ├── API Queries
        │
        ▼
AI Counsellor Engine (Gemini API)
```

---

# 📊 Database Structure (Simplified)

### Users

```
id
name
email
created_at
```

### Profiles

```
user_id
education_level
major
graduation_year
target_degree
preferred_country
budget
exam_status
```

### Universities

```
id
name
country
tuition
acceptance_rate
category
```

### Tasks

```
id
user_id
task
status
deadline
```

---

# ⚡ AI Logic

The AI Counsellor uses Gemini to:

1. Analyze user profile
2. Identify strengths and gaps
3. Recommend universities
4. Categorize Dream / Target / Safe
5. Generate application tasks

Example prompt:

```
Analyze the student's profile and recommend universities
categorized as Dream, Target, and Safe.

Explain:
- why the university fits
- risk factors
- estimated acceptance probability
```

---

# 🧪 Future Improvements

Possible extensions include:

* Scholarship matching
* Visa guidance
* Real university API integration
* AI SOP writing assistant
* Voice-based counselling
* Deadline reminders

---

# 🏆 Hackathon Objectives Achieved

✔ AI-guided decision system
✔ Stage-based student journey
✔ University recommendation engine
✔ Decision locking mechanism
✔ Structured application preparation


