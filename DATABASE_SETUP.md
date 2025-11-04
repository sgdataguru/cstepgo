# 🗄️ Database Setup Guide - StepperGO

Hi Mayu! Let's get your PostgreSQL database set up quickly.

---

## Option 1: Supabase (Recommended - 5 minutes) ⚡

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Fill in:
   - **Name**: `steppergo`
   - **Database Password**: (create a strong password - SAVE THIS!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
3. Click "Create new project"
4. Wait 2-3 minutes for project to initialize

### Step 3: Get Connection String
1. In your project, click "Settings" (gear icon)
2. Click "Database" in the left sidebar
3. Scroll to "Connection string"
4. Select "URI" tab
5. Copy the connection string
6. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with your actual password

### Step 4: Update .env File
```bash
# Open .env and replace DATABASE_URL with:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

### Step 5: Run Migrations
```bash
cd /Users/maheshkumarpaik/StepperGO
npx prisma migrate dev --name init
```

**Done!** ✅ Your database is ready!

---

## Option 2: Neon (Alternative - 5 minutes) ⚡

### Step 1: Create Neon Account
1. Go to https://neon.tech
2. Click "Sign up"
3. Sign in with GitHub

### Step 2: Create Project
1. Click "Create Project"
2. Fill in:
   - **Name**: `steppergo`
   - **Region**: Choose closest
   - **Postgres version**: Latest (16)
3. Click "Create project"

### Step 3: Get Connection String
1. You'll see your connection string immediately
2. Copy the "Connection string" (starts with `postgresql://`)
3. It looks like:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb
   ```

### Step 4: Update .env File
```bash
# Open .env and replace DATABASE_URL with:
DATABASE_URL="your_copied_connection_string_here"
```

### Step 5: Run Migrations
```bash
cd /Users/maheshkumarpaik/StepperGO
npx prisma migrate dev --name init
```

**Done!** ✅ Your database is ready!

---

## Option 3: Local PostgreSQL (If you prefer local) ⚙️

### Step 1: Install PostgreSQL
```bash
# Install PostgreSQL with Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15
```

### Step 2: Create Database
```bash
# Create a database called steppergo
createdb steppergo
```

### Step 3: Update .env File
```bash
# Open .env and replace DATABASE_URL with:
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/steppergo"

# Replace YOUR_USERNAME with your Mac username (usually your name in lowercase)
# You can find it by running: whoami
```

### Step 4: Run Migrations
```bash
cd /Users/maheshkumarpaik/StepperGO
npx prisma migrate dev --name init
```

**Done!** ✅ Your database is ready!

---

## After Setup - Verify Everything Works ✅

### 1. Check Database Connection
```bash
npx prisma db pull
```
Should show: "Prisma schema loaded from prisma/schema.prisma"

### 2. Open Prisma Studio (Visual Database Editor)
```bash
npx prisma studio
```
Opens browser at http://localhost:5555

You should see all your tables:
- User
- Driver
- Trip
- Booking
- Payment
- Payout
- AnalyticsEvent
- WebhookLog
- Session
- Notification

### 3. Verify Migration
```bash
ls -la prisma/migrations
```
Should show a folder named something like `20250103_init`

---

## Common Issues & Fixes 🔧

### Issue: "Can't reach database server"
**Fix**: Check your connection string is correct in `.env`

### Issue: "Password authentication failed"
**Fix**: Make sure you replaced `[YOUR-PASSWORD]` with actual password

### Issue: "Database does not exist"
**Fix**: If using local PostgreSQL, run `createdb steppergo`

### Issue: "Connection string is not valid"
**Fix**: Make sure it starts with `postgresql://` (not `postgres://`)

---

## What's Next? 🚀

Once database is set up, we can:

1. ✅ **Seed sample data** (test users, trips, bookings)
2. ✅ **Build Booking API** (create/read/update/delete)
3. ✅ **Build Payment API** (Stripe integration)
4. ✅ **Build Driver API** (applications, approvals)
5. ✅ **Build Frontend** (booking forms, checkout)

---

## Quick Commands Reference 📝

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Run existing migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Reset database (careful!)
npx prisma migrate reset

# Check database
npx prisma db pull

# Format schema
npx prisma format
```

---

## My Recommendation 💡

**Use Supabase** because:
- ✅ Free forever tier
- ✅ 500MB database
- ✅ Automatic backups
- ✅ Built-in dashboard
- ✅ No credit card required
- ✅ Easy to scale later

---

## Need Help? 🆘

Just tell me:
1. **"I got the Supabase connection string"** - I'll help you update .env
2. **"I'm using local PostgreSQL"** - I'll help you set it up
3. **"I'm stuck"** - Tell me the error and I'll fix it

**Which option are you choosing?** Let me know and I'll help you complete the setup! 🎯
