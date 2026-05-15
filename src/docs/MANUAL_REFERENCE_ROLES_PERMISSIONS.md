# COMPREHENSIVE MANUAL — REFERENCE: ROLES, PERMISSIONS & ACCESS CONTROL

## Complete Role-Based Access Control Matrix

### Admin Role — Full System Access

**Case Management:**
- ✓ Create, read, update, delete ANY case
- ✓ View all cases (not just assigned)
- ✓ Assign cases to any user
- ✓ Advance case stages (bypass some validations)
- ✓ Close cases
- ✓ Clone cases
- ✓ Export cases (bulk)

**Census Management:**
- ✓ Upload census for any case
- ✓ Validate/validate-only own uploads
- ✓ View all census data (not redacted)
- ✓ Delete census versions
- ✓ Edit individual member records

**Quotes & Proposals:**
- ✓ Create scenarios for any case
- ✓ Create/send proposals for any case
- ✓ Edit proposals before sending
- ✓ View all quotes/proposals (not just own)
- ✓ Delete scenarios

**Enrollment:**
- ✓ Create enrollment windows for any case
- ✓ Send invitations
- ✓ Override enrollment decisions
- ✓ View all participant data
- ✓ Manually mark as enrolled/waived
- ✓ Close early/extend deadlines
- ✓ Download participant files

**Renewals:**
- ✓ Create renewal cycles for any case
- ✓ Market all renewals
- ✓ Manage renewal decisions
- ✓ View all renewal data

**Bulk Operations:**
- ✓ Assign (multiple cases to user)
- ✓ Change stage (multiple cases)
- ✓ Change priority (multiple cases)
- ✓ Export (multiple cases)
- ✓ Delete (multiple cases) — requires confirmation

**User Management:**
- ✓ Invite new users
- ✓ Change user roles
- ✓ Revoke access
- ✓ View audit logs of user actions
- ✓ Reset user passwords
- ✓ Manage team assignments

**Integrations:**
- ✓ Configure Zoho CRM sync
- ✓ Configure DocuSign integration
- ✓ Configure webhooks
- ✓ View integration logs
- ✓ Test integrations
- ✓ Manage API keys

**Settings:**
- ✓ Company branding (logo, colors)
- ✓ Email templates
- ✓ Workflow automation rules
- ✓ Data retention policies
- ✓ Billing & subscription
- ✓ Feature toggles

**Help System:**
- ✓ Create/edit help content
- ✓ Approve AI-generated content
- ✓ View help analytics
- ✓ Manage user manual
- ✓ View help center audit logs

**Reporting & Analytics:**
- ✓ View all reports
- ✓ Create custom reports
- ✓ Schedule report delivery
- ✓ Export all data (CSV/Excel)
- ✓ View real-time dashboards

**Other:**
- ✓ Access Integration Infrastructure page
- ✓ Run help master seed (system admin)
- ✓ View audit trail for any record
- ✓ Monitor system health/performance

---

### User Role — Standard Access

**Case Management:**
- ✓ Create cases
- ✓ View own cases (assigned_to = user.email)
- ✓ Edit own cases
- ✓ Cannot delete cases
- ✗ Cannot assign to others
- ✗ Cannot view all cases
- ✗ Cannot bulk delete

**Census Management:**
- ✓ Upload census to own case
- ✓ Validate census
- ✓ View census (not other users')
- ✗ Cannot delete versions
- ✗ Cannot see all census data (redacted PII)

**Quotes & Proposals:**
- ✓ Create scenarios for own case
- ✓ Create proposals for own case
- ✓ View own proposals
- ✗ Cannot view other users' quotes
- ✗ Cannot delete scenarios

**Enrollment:**
- ✓ Create enrollment windows for own case
- ✓ Send invitations from own case
- ✓ View participation (own case)
- ✗ Cannot override enrollment decisions
- ✗ Cannot view other users' enrollments

**Renewals:**
- ✓ Create renewals for own case
- ✓ Manage renewals (own case)
- ✗ Cannot view other users' renewals

**Bulk Operations:**
- ✓ Assign (only own cases)
- ✓ Change stage (only own cases)
- ✓ Change priority (only own cases)
- ✓ Export (only own cases)
- ✗ Cannot bulk delete

**User Management:**
- ✗ Cannot invite users
- ✗ Cannot change roles
- ✗ Cannot view other users

**Integrations:**
- ✗ Cannot configure integrations
- ✗ Cannot access integration infra page

**Settings:**
- ✗ Cannot access settings
- (Can update own profile: password, preferences)

**Help System:**
- ✗ Cannot access help console
- ✓ Can use help center (search, read)

**Reporting:**
- ✓ View reports on own cases
- ✗ Cannot access all reports
- ✗ Cannot export bulk data

---

### Guest Role (if enabled) — Read-Only Access

- ✓ View cases (read-only)
- ✓ View case details (read-only)
- ✓ View enrollment status (read-only)
- ✓ View proposals (read-only)
- ✗ Cannot create anything
- ✗ Cannot edit anything
- ✗ Cannot delete anything
- ✗ Cannot see PII (email, phone, address redacted)

---

## Page-by-Page Access Control

### Pages Visible to Admin, User, Guest

| Page | Admin | User | Guest | Notes |
|------|-------|------|-------|-------|
| Dashboard | ✓ | ✓ | ✓ | Shows different data per role |
| Cases | ✓ | ✓ | ✓ (RO) | Users see own cases only |
| Case Detail | ✓ | ✓ (own) | ✓ (RO) | Access based on assignment |
| Census | ✓ | ✓ (own) | ✓ (RO) | PII redacted for guest |
| Quotes | ✓ | ✓ (own) | ✗ | Users see own quotes |
| Proposals | ✓ | ✓ (own) | ✓ (RO) | View-only for guests |
| Enrollment | ✓ | ✓ (own) | ✓ (RO) | Users manage own windows |
| Renewals | ✓ | ✓ (own) | ✗ | Users manage own renewals |
| Tasks | ✓ | ✓ (own) | ✗ | Users see assigned tasks |
| Exceptions | ✓ | ✓ (assigned) | ✗ | Users see assigned exceptions |
| Employers | ✓ | ✓ | ✓ (RO) | Reference data (read-only) |
| Plans | ✓ | ✓ | ✓ (RO) | Reference data (read-only) |
| Employee Portal | ✓ | — | — | Only accessible to employees |
| Employee Mgmt | ✓ | ✓ (own) | ✗ | Users manage their employees |
| Employer Portal | ✓ | — | — | Only for employers |
| PolicyMatch | ✓ | ✓ | ✗ | AI recommendations |
| Contribution Modeling | ✓ | ✓ (own) | ✗ | Users model for own cases |
| ACA Library | ✓ | ✓ | ✓ | Reference data |
| Settings | ✓ | ✗ | ✗ | Admin only |
| Help Center | ✓ | ✓ | ✓ | All users |
| Help Console | ✓ | ✗ | ✗ | Admin only |
| Integration Infra | ✓ | ✗ | ✗ | Admin only |

---

## Frontend Permission Checks

The app implements **two-tier permission checking:**

### 1. Frontend (UI-level)
- Pages conditionally render based on user role
- Buttons disabled if user lacks permission
- Modals hidden if not allowed

Example:
```jsx
// Hidden for non-admin users
{user?.role === "admin" && (
  <Button onClick={() => setShowUserMgmt(true)}>
    Manage Users
  </Button>
)}
```

### 2. Backend (API-level)
- All mutations validated server-side
- Returns 403 Forbidden if user not authorized
- All permission denials logged to audit trail

Example:
```javascript
// Backend function validates role before allowing
const user = await base44.auth.me();
if (user?.role !== 'admin') {
  return Response.json(
    { error: 'Forbidden: Admin access required' }, 
    { status: 403 }
  );
}
// Proceed with operation
```

---

## Context-Based Permissions

**Assigned User vs. Non-Assigned User:**

For cases, when a user is assigned:
- Can view case (owns it)
- Can edit case info
- Can advance stage
- Can create census, quotes, proposals
- Can create tasks, manage enrollments

When not assigned:
- Cannot edit
- Cannot advance
- Can only view (if admin)

**Enforcement Example:**
```javascript
// In case edit mutation
const caseData = await base44.entities.BenefitCase.filter({
  id: caseId
}).then(r => r[0]);

if (user?.role !== 'admin' && caseData.assigned_to !== user?.email) {
  return Response.json(
    { error: 'Forbidden: Not assigned to this case' }, 
    { status: 403 }
  );
}
```

---

## Real-Time Permission Auditing

All permission denials are logged:

```
┌─────────────────────────────────────────┐
│ User: john@example.com                   │
│ Action: Try to delete case (admin-only)  │
│ Resource: Case ID 12345                  │
│ Result: DENIED (User role not admin)     │
│ Timestamp: 2026-03-23 14:32:15 UTC      │
│ IP: 192.168.1.100                        │
└─────────────────────────────────────────┘
```

View in:
- Settings → Audit Logs (admin only)
- By user, action, resource, time range
- Export to CSV

---

## Permission Inheritance

Permissions cascade hierarchically:

```
Organization
├─ Admin
│  └─ Full access to all
├─ Team
│  ├─ User (assigned to cases)
│  │  └─ Full access to own cases
│  │  └─ Limited access to shared data
│  └─ User (not assigned)
│     └─ Read-only access
└─ Guest
   └─ Read-only across app
```

---

## Role Change Impact

When a user role is changed by admin:

1. **Immediate:** UI updates for changed user (if logged in)
2. **Backend:** All future API requests evaluated with new role
3. **Audit:** Role change logged with timestamp, changed-by
4. **Notifications:** User receives email of role change
5. **Session:** If more restrictive, some pages hidden; less restrictive, pages unlocked

---

## Invitation & Onboarding

**Admin invites user:**
1. Settings → User Management → "Invite User"
2. Enter email
3. Select role (Admin or User)
4. Send invitation
5. System emails user with signup link
6. User creates password
7. User logs in with new role
8. First login shows onboarding flow

**Onboarding by role:**
- **Admin:** Settings tour, integration setup, user management
- **User:** Dashboard tour, create first case, upload census
- **Guest:** Help center orientation

---

## Special Permission Scenarios

### Multi-Tenant Scenarios (if applicable)

If system supports multiple organizations:
- Admin can only manage their organization's users
- User can only see their organization's cases
- Cross-org access restricted via tenant_id check

### Delegation Permissions

Broker A can delegate case to Broker B:
1. Open case → Click "Assign"
2. Select Broker B email
3. Broker B now assigned_to (full access)
4. Broker A retains view-only access
5. Audit trail shows: "Case assigned to Broker B by Broker A"

### Temporary Permissions

For ad-hoc scenarios (rare):
- Admin can grant temporary edit access to case
- Duration specified (e.g., 7 days)
- Access revoked automatically
- Logged in audit trail

---

## Security Best Practices

1. **Principle of Least Privilege:** Users get minimum permissions needed for role
2. **Dual Verification:** Frontend + Backend permission checks
3. **Audit Everything:** All permission decisions logged
4. **Regular Review:** Admins should quarterly review user roles
5. **Revoke Promptly:** When user leaves, immediately revoke access
6. **Role Separation:** Don't give admin to casual users

---

End of Reference Section