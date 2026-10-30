# Unifix

### Database Setup
Unifix requires PostgreSQL to be installed and running.

**Local Setup (Default)**
- Install PostgreSQL (e.g., `brew install postgresql` on macOS)
- Start service, ensure database `unifix` exists
- `.env` should contain:
  `DATABASE_URL="postgresql://localhost:5432/unifix"`

**Supabase Setup**
1. Go to Supabase project dashboard > Database
2. Copy connection string (format: `postgres://<user>:<password>@<host>:<port>/<db>`)
3. Update `.env`:
   `DATABASE_URL="<copied_connection_string>"`

> ⚠️ Ensure the database instance is reachable at the URL specified in `DATABASE_URL` before running migrations.
