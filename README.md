# Project Name: DEVLENS 
### Internal Tech Issue & Feature Tracker

DEVLENS is a collaborative platform designed for software teams to report bugs, suggest features, and coordinate resolutions efficiently.

🔗 **Live URL:** [https://devpulse-api.vercel.app]


🎥 **Interview Video:** [Google Drive]
Question No 2:https://drive.google.com/file/d/15qiTMCvHL_49ywwCUAFx-McYoMbqVOws/view?usp=sharing
Question No 4:https://drive.google.com/file/d/1GrJbVE0gOUuWPYzDEDxtcWOkCaIo4NDS/view?usp=sharing


---

## 🛠️ Tech Stack
* **Runtime:** Node.js
* **Language:** TypeScript
* **Framework:** Express.js (Modular router architecture)
* **Database:** PostgreSQL (NeonDB)
* **Database Driver:** Native `pg` driver (Direct `pool.query()` only - No ORM)
* **Security:** `bcrypt` (Password hashing) & `jsonwebtoken` (JWT Authentication)

---

### ✨ Key Features
* **Role-Based Access (RBAC):** Distinct permissions for `contributor` and `maintainer` roles.
* **Input Validation:** Enforced Title (max 150 chars) and Description (min 20 chars) limits.
* **No-JOIN Fetching:** Reporter details are fetched using application logic instead of SQL JOINs.

------------------------------------------------------------

## ⚙️ Setup Steps

npm install           
npm run dev          
---------------------
API Endpoint List****
POST :/api/auth/signup -  (Public)

POST :/api/auth/login -  (Public)

POST :/api/issues -(Maintainer & Contributor)

GET :/api/issues - (With Sorting & Filtering ) (Public)

GET :/api/issues/:id - (Public)

PATCH :/api/issues/:id -(Protected)

DELETE :/api/issues/:id - (Maintainer Only)  

-------------------------------------------------------
## 🗄️ Database Schema Summary

### 1. `users` Table
* `id`: SERIAL (PRIMARY KEY)
* `name`: VARCHAR(255) (NOT NULL)
* `email`: VARCHAR(255) (UNIQUE, NOT NULL)
* `password`: VARCHAR(255) (NOT NULL)
* `role`: VARCHAR(50) (CHECK: 'contributor', 'maintainer')
* `created_at` / `updated_at`: TIMESTAMP (DEFAULT CURRENT_TIMESTAMP)

### 2. `issues` Table
* `id`: SERIAL (PRIMARY KEY)
* `title`: VARCHAR(255) (NOT NULL - Max 150 chars in application logic)
* `description`: TEXT (NOT NULL - Min 20 chars in application logic)
* `type`: VARCHAR(50) (CHECK: 'bug', 'feature_request')
* `status`: VARCHAR(50) (DEFAULT 'open', CHECK: 'open', 'in_progress', 'resolved', 'closed')
* `priority`: VARCHAR(50) (CHECK: 'low', 'medium', 'high')
* `reporter_id`: INT (REFERENCES users.id, ON DELETE CASCADE)
* `assignee_id`: INT (REFERENCES users.id, ON DELETE SET NULL)
* `created_at` / `updated_at`: TIMESTAMP (DEFAULT CURRENT_TIMESTAMP)


______________________________________________________

Developer Feedback:

I started implementing the refresh token, but I got many errors, which is why I didn't add this. Also, the assignment didn't require a refresh token...

I used gemini ai for remove error some times..Even I used Gemini for issue.service.ts page to solve ascending and descending problem, because I didn't know about this feature.


Thank you so much.....