# Liferiverchurch Monorepo

## Structure
- `frontend/` React + Vite
- `backend/` FastAPI + PostgreSQL
- `shared/` Schemas and docs

## Quick Start
### Frontend
1. `cd frontend`
2. Copy `frontend/.env.example` to `frontend/.env`
3. `npm install`
4. `npm run dev`

### Backend
1. `cd backend`
2. `python -m venv .venv`
3. `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`
4. `.\.venv\Scripts\uvicorn.exe app.main:app --reload`

## Database
1. Create DB schema: `psql -d Church -f shared/schema.sql`
2. Seed data (sites + dashboard sample): `psql -d Church -f shared/seed.sql`
