# Migration Guide: Base44 to PostgreSQL + Node.js

## Overview
Migrate your insurance management app from Base44 to a self-hosted PostgreSQL + Node.js backend with full HIPAA compliance control.

---

## Phase 1: Export & Assessment

### Step 1: Export Your Code
1. Go to **Dashboard → Settings → Export**
2. Download as **ZIP** or sync to GitHub
3. Extract and review structure:
   - `src/pages/` — React components (keep as-is)
   - `src/components/` — UI components (keep as-is)
   - `entities/*.json` — Your data schemas (convert to PostgreSQL)
   - `functions/` — Backend logic (adapt to Node.js)

### Step 2: Inventory Your Entities
Your app has 25+ entities. These become PostgreSQL tables. Key ones:
- `EmployerGroup`, `BenefitCase`, `BenefitPlan`, `CensusMember`
- `Proposal`, `QuoteScenario`, `EnrollmentWindow`
- `Document`, `ActivityLog`, `ExceptionItem`

---

## Phase 2: PostgreSQL Schema Migration

### Step 1: Create Base Tables
Each entity becomes a PostgreSQL table. Example for `EmployerGroup`:

```sql
CREATE TABLE employer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  ein VARCHAR(20),
  employee_count INT,
  status VARCHAR(50) DEFAULT 'prospect',
  primary_contact_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  FOREIGN KEY (agency_id) REFERENCES agencies(id)
);
```

### Step 2: Add JSONB Columns for Flexibility
For complex nested data (like `gradient_ai_data` in `CensusMember`):

```sql
CREATE TABLE census_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  census_version_id UUID NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  gradient_ai_data JSONB,  -- Store complex AI risk scoring
  validation_issues JSONB,  -- Array of issue objects
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (census_version_id) REFERENCES census_versions(id)
);
```

### Step 3: Create Indexes
For performance:

```sql
CREATE INDEX idx_employer_groups_agency ON employer_groups(agency_id);
CREATE INDEX idx_employer_groups_status ON employer_groups(status);
CREATE INDEX idx_census_members_gradient_ai ON census_members USING GIN(gradient_ai_data);
CREATE INDEX idx_census_members_validation ON census_members USING GIN(validation_issues);
```

---

## Phase 3: Node.js Backend

### Step 1: Project Setup
```bash
npm init -y
npm install express pg jsonwebtoken bcryptjs cors dotenv helmet
npm install -D nodemon
```

### Step 2: Database Connection
Create `src/db/pool.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
```

### Step 3: Authentication (JWT)
Create `src/auth/auth.js`:

```javascript
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

module.exports = { verifyToken };
```

### Step 4: API Endpoints
Create `src/routes/employers.js`:

```javascript
const express = require('express');
const pool = require('../db/pool');
const { verifyToken } = require('../auth/auth');

const router = express.Router();

// List employers
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employer_groups ORDER BY updated_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create employer
router.post('/', verifyToken, async (req, res) => {
  const { agency_id, name, ein, employee_count, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO employer_groups (agency_id, name, ein, employee_count, status, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [agency_id, name, ein, employee_count, status, req.user.email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

### Step 5: Main Server
Create `src/server.js`:

```javascript
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const employersRouter = require('./routes/employers');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/employers', employersRouter);
// Add more routes for other entities

app.listen(process.env.PORT || 3001, () => {
  console.log('Server running on port 3001');
});
```

---

## Phase 4: Update React Frontend

### Replace Base44 SDK with Fetch/Axios
**Before (Base44):**
```javascript
const { base44 } = await import('@/api/base44Client');
const employers = await base44.entities.EmployerGroup.list();
```

**After (PostgreSQL):**
```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const token = localStorage.getItem('auth_token');

const fetchEmployers = async () => {
  const { data } = await axios.get(`${API_URL}/api/employers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};
```

### Update .env
```
REACT_APP_API_URL=http://localhost:3001
```

---

## Phase 5: HIPAA Compliance Setup

### 1. Encryption at Rest
Use PostgreSQL `pgcrypto`:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store sensitive fields encrypted
ALTER TABLE census_members ADD COLUMN ssn_encrypted BYTEA;
UPDATE census_members SET ssn_encrypted = pgp_sym_encrypt(ssn_last4, 'your-encryption-key');
```

### 2. Audit Logging
Track all data access:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255),
  action VARCHAR(50),
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. TLS for Data in Transit
Deploy with HTTPS (AWS/Azure/GCP automatically enforces this).

### 4. Access Control
Implement role-based permissions:
```javascript
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

---

## Phase 6: Deployment Options

### AWS RDS + EC2/ECS
- **RDS PostgreSQL** — Managed, HIPAA-eligible
- **EC2** or **ECS** — Run Node.js app
- **AWS BAA** — Sign Business Associate Agreement

### Azure Database for PostgreSQL
- Built-in encryption, compliance
- Azure App Service for Node.js
- **Azure HIPAA** — Enterprise compliance

### Google Cloud
- **Cloud SQL** for PostgreSQL
- **App Engine** or **Cloud Run** for backend
- **GCP HIPAA** — Healthcare compliance ready

---

## Migration Checklist

- [ ] Export Base44 code (ZIP/GitHub)
- [ ] Create PostgreSQL database locally
- [ ] Write migration scripts for all 25+ entities
- [ ] Build Node.js backend with CRUD endpoints
- [ ] Update React frontend API calls
- [ ] Implement JWT authentication
- [ ] Add encryption for sensitive fields
- [ ] Set up audit logging
- [ ] Test all workflows end-to-end
- [ ] Choose cloud provider (AWS/Azure/GCP)
- [ ] Set up HIPAA BAA with provider
- [ ] Deploy and test production environment
- [ ] Data migration from Base44 to PostgreSQL

---

## Timeline Estimate
- **Phase 1-2** (Export + Schema): 2-3 days
- **Phase 3-4** (Backend + Frontend): 5-7 days
- **Phase 5** (HIPAA setup): 2-3 days
- **Phase 6** (Deployment): 2-3 days

**Total: 2-3 weeks** for a healthcare-compliant production app.

---

## Need Help?
This is a significant migration. Would you like me to:
1. Generate PostgreSQL schema SQL for all 25+ entities?
2. Create a complete Node.js backend scaffold?
3. Build API route templates?
4. Set up authentication/authorization code?

Let me know which piece you want to focus on first.