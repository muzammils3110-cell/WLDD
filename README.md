# Meme'd Campaign Payout Tracker

A creator marketplace where brands run campaigns with a milestone payout ladder, and creators submit Instagram or YouTube post links and earn the payout of the highest milestone their post has crossed. Total payouts can never exceed a campaign's budget.

## Live links

| | URL |
|---|---|
| Frontend (Vercel) | https://wldd-lac.vercel.app/ |
| Backend API (Render) | https://wldd-vtl7.onrender.com/api |
| Health check | https://wldd-vtl7.onrender.com/api/health |
| Repository | https://github.com/muzammils3110-cell/WLDD |

> The backend runs on Render's free tier and sleeps after a period of inactivity. The first request after a pause can take 30 to 60 seconds. If signup or login seems stuck, wait a minute and try again.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Brand | brand@wlld.com | brand@123 |
| Creator | creator@wlld.com | creator@123 |

You can also create new accounts on the signup page.

### Trying it out

1. Log in as a **brand** and create a campaign (name, platform, total budget, milestone ladder).
2. Log in as a **creator** (use a second browser or a private window) and submit a post link for that campaign. The link must match the campaign's platform.
3. On the creator dashboard, use **Simulate views** on a submission to stand in for platform data. Enter a total view count; if it crosses a milestone, the payout is added.
4. Check the brand dashboard to see the campaign's spent and remaining budget update.

Because the brief says view counts simulate platform data, the views endpoint has no role check. The Simulate views control on the creator dashboard is a convenience so reviewers can see payouts without calling the API by hand.

## Tech stack

- **Backend:** Node.js, TypeScript, Express, MongoDB with Mongoose, JWT auth, bcrypt
- **Frontend:** Next.js (App Router), TypeScript, plain CSS
- **Tests:** Jest (unit tests and concurrency tests)
- **Hosting:** MongoDB Atlas, Render (backend), Vercel (frontend)

## Repository structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/        env loading and database connection
│   │   ├── controllers/   request handlers (auth, campaigns, submissions)
│   │   ├── lib/           pure payout calculation (no database access)
│   │   ├── middleware/    auth, role check, error handling
│   │   ├── models/        Mongoose schemas (User, Campaign, Submission)
│   │   ├── routes/        route definitions
│   │   ├── services/      transactional payout engine
│   │   ├── types/         shared types
│   │   └── utils/         validators, async handler
│   └── tests/             payout.test.ts, payout.concurrency.test.ts
└── frontend/
    └── src/
        ├── app/           pages: login, signup, brand, creator
        ├── components/    common, brand and creator components
        ├── context/       auth context
        ├── lib/           API client and formatting helpers
        └── types/
```

## Local setup

### Prerequisites

- Node.js 20.19 or newer
- A MongoDB database. A free MongoDB Atlas cluster works. The payout engine uses transactions, so the database must be a replica set (Atlas clusters are).

### Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in the values below
npm run dev                 # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

On Windows PowerShell use `Copy-Item .env.example .env` instead of `cp`.

## Environment variables

### `backend/.env`

| Variable | Description |
|---|---|
| `PORT` | API port. Defaults to `5000`. |
| `MONGODB_URI` | MongoDB connection string, for example `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/memed?retryWrites=true&w=majority` |
| `JWT_SECRET` | Long random string used to sign tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token lifetime. Defaults to `1d`. |
| `CLIENT_URL` | Allowed CORS origin. `http://localhost:3000` locally, the Vercel URL in production (no trailing slash). |

### `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL including `/api`, for example `http://localhost:5000/api` |

## Scripts

Backend: `npm run dev` (watch mode), `npm run build` (compile to `dist`), `npm start` (run compiled build), `npm test` (Jest).

Frontend: `npm run dev`, `npm run build`, `npm start`, `npm run lint`.

## API reference

All paths are under `/api`. Requests and responses are JSON. Errors return `{ "message": "..." }`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | none | Health check |
| POST | `/auth/signup` | none | Body `{ email, password (min 8), role }`. Returns `{ token, user }` |
| POST | `/auth/login` | none | Body `{ email, password }`. Returns `{ token, user }` |
| GET | `/auth/me` | any user | Current user |
| POST | `/campaigns` | brand | Body `{ name, platform, totalBudget, milestones[] }`. Returns `{ campaign }` |
| GET | `/campaigns/mine` | brand | The brand's campaigns with budget spent and remaining |
| GET | `/campaigns` | any user | Live campaigns (creators browse these) |
| POST | `/submissions` | creator | Body `{ campaignId, postUrl }`. Returns `{ submission }` |
| GET | `/submissions/mine` | creator | Returns `{ totalEarnings, submissions[] }` |
| PATCH | `/submissions/:id/views` | none (by design) | Body `{ views }`. Returns `{ submission, payoutAdded, budgetCapped, campaignRemainingBudget }` |

Authenticated routes expect `Authorization: Bearer <token>`.

Roles: `brand` and `creator`. Brands create campaigns and see budget metrics. Creators browse live campaigns, submit posts and see earnings.

## Payout rules and assumptions

The brief leaves some cases open. These are the decisions I made.

1. **Highest milestone wins.** A milestone is crossed when `views >= threshold`. If one update crosses several milestones, the creator is paid the highest milestone's payout as a total, not the sum of the milestones.
2. **Incremental payouts.** Each update pays `highest milestone payout - amount already paid`. Sending the same view count twice therefore pays nothing extra.
3. **No clawback.** If a view count goes down, the count is updated but the payout never decreases.
4. **Budget cap.** An increment is limited to `totalBudget - spentBudget`. If the budget runs out mid-payout, the creator receives only what is left, and the response flags `budgetCapped`. A negative remaining budget is treated as zero.
5. **Concurrency safety.** The payout runs inside a MongoDB transaction. It reads the submission and campaign, calculates the payout, then updates the campaign with a guarded `findOneAndUpdate` (the condition `spentBudget + increment <= totalBudget`), and updates the submission only if its `currentPayout` is still what was read. A failed guard returns a 409. Transient write conflicts are retried by the transaction helper.
6. **Money is whole rupees** stored as integers. Milestones must strictly increase in both views and payout, and a campaign has between 1 and 20 milestones.
7. **A post can only be submitted once per campaign.** Post links are normalised (`www.` and `m.` removed, trailing slashes stripped, YouTube watch links keep their `?v=` parameter) before the duplicate check. The host must match the campaign's platform.
8. **The brand id always comes from the JWT**, never the request body, and clients cannot set `spentBudget`.
9. **The views endpoint is unauthenticated** because the brief says it simulates platform data. In a real system it would be protected, for example with a signed webhook or an API key.
10. **JWTs are stored in `localStorage`** to keep the frontend simple. Production would use httpOnly cookies. Route protection on the frontend is a convenience only; the backend enforces roles.

## Tests

```bash
cd backend
npm test
```

- `tests/payout.test.ts` covers the pure payout calculation: below the first milestone, exact thresholds, multiple milestones in one jump, moving up a milestone, an unsorted ladder, repeated and decreasing views, the budget cap (partial, exact, zero and negative remaining) and invalid input.
- `tests/payout.concurrency.test.ts` tests the payout engine against a real replica set: five creators against a 1,000 budget never overspend, a 1,200 budget splits exactly as 500 + 500 + 200, eight simultaneous identical updates pay once, repeated updates pay once, and an unknown submission returns 404.

By default the concurrency tests start an in-memory replica set (the first run downloads a MongoDB binary). If that does not work in your environment, point them at any replica set, such as an Atlas cluster, with:

```bash
TEST_MONGODB_URI="mongodb+srv://..." npm test
```

In that mode the tests use a separate database called `memed_test`, never the application's own database.

## Deployment

- **Database:** MongoDB Atlas free (M0) cluster, with network access open so Render can connect.
- **Backend (Render):** root directory `backend`, build command `npm install --include=dev && npm run build`, start command `npm start`, with the backend environment variables above.
- **Frontend (Vercel):** root directory `frontend`, with `NEXT_PUBLIC_API_URL` set to the Render URL plus `/api`.
- After the frontend URL is known, set `CLIENT_URL` on Render to that exact origin and redeploy, otherwise browsers block requests with CORS errors.

## Known limitations and next steps

- Views are entered manually through the simulate control or the API. A real system would ingest them from the Instagram and YouTube APIs.
- No refresh tokens, password reset or email verification.
- No rate limiting on the API.
- Optional extras from the brief (Redis caching of the live campaign list, spike flagging, Docker) are not included.