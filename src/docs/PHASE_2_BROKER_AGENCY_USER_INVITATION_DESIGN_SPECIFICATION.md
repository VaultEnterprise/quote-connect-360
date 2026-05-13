# Phase 2: Broker Agency User Invitation
## Design Specification

**Date:** 2026-05-13  
**Status:** DESIGN_READY (Awaiting Phase 1 Certification)  
**Scope:** Broker agency admin/platform admin invitation workflow for broker users  
**Phase 1 Dependency:** ACTIVE (Cannot implement until Phase 1 certified with 14/14 PASS)

---

## 1. Overview

Phase 2 extends the Phase 1 broker agency signup to include **user-management capabilities** for approved broker agencies. Approved brokers can invite team members into their agency, assign roles, and manage access to the broker workspace.

### Key Constraints
- **Scope:** Standalone broker agencies only (not MGAs)
- **Auth:** Broker agency admin or manager (if permitted)
- **MGA Blocking:** MGA users cannot invite users to standalone broker agencies without explicit grant
- **Token Model:** One-time-use, hashed, expiring invitation tokens
- **Audit:** All invitation actions must be logged

---

## 2. Entity Schemas

### 2.1 BrokerAgencyUser

```json
{
  "name": "BrokerAgencyUser",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier (UUID)"
    },
    "tenant_id": {
      "type": "string",
      "description": "Tenant scope (for multi-tenancy)"
    },
    "broker_agency_id": {
      "type": "string",
      "description": "Parent BrokerAgencyProfile ID (required scoping field)"
    },
    "user_id": {
      "type": "string",
      "description": "Base44 User ID once signup complete; null during invitation"
    },
    "email": {
      "type": "string",
      "description": "User email (primary key for invite + match)"
    },
    "first_name": {
      "type": "string"
    },
    "last_name": {
      "type": "string"
    },
    "phone": {
      "type": "string",
      "description": "Optional contact phone"
    },
    "role": {
      "type": "string",
      "enum": ["owner", "manager", "viewer"],
      "description": "Broker-level role (maps to: admin, account_manager, read_only)"
    },
    "status": {
      "type": "string",
      "enum": ["invited", "active", "suspended", "deactivated"],
      "default": "invited",
      "description": "User lifecycle status"
    },
    "invited_by_user_id": {
      "type": "string",
      "description": "User ID of the inviter (audit trail)"
    },
    "invited_at": {
      "type": "string",
      "format": "date-time",
      "description": "When invitation was created"
    },
    "accepted_at": {
      "type": "string",
      "format": "date-time",
      "description": "When user accepted invitation and completed signup"
    },
    "last_login_at": {
      "type": "string",
      "format": "date-time",
      "description": "Last authenticated access to /broker workspace"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "audit_trace_id": {
      "type": "string",
      "description": "Correlation ID to audit event"
    }
  },
  "required": ["broker_agency_id", "email", "first_name", "last_name", "role"]
}
```

### 2.2 BrokerAgencyUserInvitation

```json
{
  "name": "BrokerAgencyUserInvitation",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier (UUID)"
    },
    "tenant_id": {
      "type": "string",
      "description": "Tenant scope"
    },
    "broker_agency_id": {
      "type": "string",
      "description": "Parent BrokerAgencyProfile ID (scoping)"
    },
    "email": {
      "type": "string",
      "description": "Invitee email address"
    },
    "first_name": {
      "type": "string"
    },
    "last_name": {
      "type": "string"
    },
    "role": {
      "type": "string",
      "enum": ["owner", "manager", "viewer"],
      "description": "Role to be assigned on acceptance"
    },
    "token_hash": {
      "type": "string",
      "description": "SHA-256 hash of invitation token (never plaintext)"
    },
    "token_expires_at": {
      "type": "string",
      "format": "date-time",
      "description": "Expiration of invitation token (typically 7 days)"
    },
    "token_used_at": {
      "type": "string",
      "format": "date-time",
      "description": "When token was redeemed"
    },
    "invitation_status": {
      "type": "string",
      "enum": ["draft", "sent", "accepted", "expired", "cancelled", "revoked", "failed"],
      "default": "draft",
      "description": "Lifecycle status of invitation"
    },
    "invited_by_user_id": {
      "type": "string",
      "description": "User ID of inviter (audit)"
    },
    "accepted_by_user_id": {
      "type": "string",
      "nullable": true,
      "description": "User ID of accepter (filled on acceptance)"
    },
    "resent_count": {
      "type": "number",
      "default": 0,
      "description": "How many times invitation email was resent"
    },
    "last_sent_at": {
      "type": "string",
      "format": "date-time",
      "description": "Last send/resend timestamp"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "audit_trace_id": {
      "type": "string",
      "description": "Correlation ID to audit event"
    }
  },
  "required": ["broker_agency_id", "email", "first_name", "last_name", "role"]
}
```

---

## 3. Service Contract Design

### 3.1 brokerUserInvitationContract

All methods must enforce:
- Tenant scope validation
- Broker agency scope validation
- Permission resolver checks
- Scope gate enforcement
- Audit event logging
- Safe payload filtering (no sensitive broker data in responses)

#### Method: createInvitation

**Signature:**
```
createInvitation({
  broker_agency_id: string,
  email: string,
  first_name: string,
  last_name: string,
  role: "owner" | "manager" | "viewer",
  invited_by_user_id: string
}): Promise<{
  invitation_id: string,
  token: string (one-time only),
  status: "sent" | "failed",
  expires_at: ISO8601,
  audit_event_id: string
}>
```

**Security Rules:**
- Inviter must have `broker_agency.user.invite` permission
- Target broker agency must be active (not suspended)
- BrokerPlatformRelationship must be active/approved
- Email must not already exist as active BrokerAgencyUser in same broker
- Token generated: random 32-byte, hashed before storage
- Token expires in 7 days by default
- Invitation status: draft → sent (after notification)

**Audit:**
- Log: `INVITATION_CREATED` with inviter, email, role, broker_agency_id

#### Method: resendInvitation

**Signature:**
```
resendInvitation({
  invitation_id: string,
  resent_by_user_id: string
}): Promise<{
  status: "sent" | "failed",
  last_sent_at: ISO8601,
  resent_count: number,
  audit_event_id: string
}>
```

**Security Rules:**
- Resender must have `broker_agency.user.resend_invite` permission
- Invitation must exist and not be accepted/revoked
- Token must not be expired
- Increment resent_count, update last_sent_at

**Audit:**
- Log: `INVITATION_RESENT` with resender, invitation_id, resent_count

#### Method: revokeInvitation

**Signature:**
```
revokeInvitation({
  invitation_id: string,
  revoked_by_user_id: string
}): Promise<{
  status: "revoked",
  revoked_at: ISO8601,
  audit_event_id: string
}>
```

**Security Rules:**
- Revoker must have `broker_agency.user.revoke_invite` permission
- Invitation must exist and not be already accepted
- Set invitation_status = "revoked"

**Audit:**
- Log: `INVITATION_REVOKED` with revoker, invitation_id

#### Method: validateInvitationToken

**Signature:**
```
validateInvitationToken({
  token: string
}): Promise<{
  valid: boolean,
  invitation_id: string,
  email: string,
  role: string,
  broker_agency_id: string,
  expires_at: ISO8601
}>
```

**Security Rules:**
- Token must match hash in BrokerAgencyUserInvitation
- Invitation must not be expired, accepted, revoked, or cancelled
- Return safe metadata only (no sensitive broker data)

**Audit:**
- Log: `INVITATION_VALIDATED` with token hash, invitation_id (no plaintext token)

#### Method: acceptInvitation

**Signature:**
```
acceptInvitation({
  token: string,
  user_id: string,
  password_hash?: string (if new user)
}): Promise<{
  user_id: string,
  broker_agency_user_id: string,
  status: "active",
  role: string,
  audit_event_id: string
}>
```

**Security Rules:**
- Token must be valid (call validateInvitationToken first)
- Create or link BrokerAgencyUser record
- Set BrokerAgencyUser.status = "active"
- Set BrokerAgencyUser.accepted_at = now
- Set invitation.token_used_at = now, invitation_status = "accepted"
- Token becomes one-time used; cannot be reused
- If new user, Base44 auth user record created by platform

**Audit:**
- Log: `INVITATION_ACCEPTED` with user_id, invitation_id, broker_agency_id

#### Method: listBrokerAgencyUsers

**Signature:**
```
listBrokerAgencyUsers({
  broker_agency_id: string,
  requesting_user_id: string
}): Promise<BrokerAgencyUser[]>
```

**Security Rules:**
- Requester must have `broker_agency.user.view` permission
- Return only users for requested broker agency
- Filter out sensitive fields (audit_trace_id, etc.)

**Audit:**
- Log: `BROKER_USERS_LISTED` with broker_agency_id, requesting_user_id

#### Method: updateBrokerAgencyUserRole

**Signature:**
```
updateBrokerAgencyUserRole({
  broker_agency_user_id: string,
  new_role: "owner" | "manager" | "viewer",
  updated_by_user_id: string
}): Promise<{
  broker_agency_user_id: string,
  role: string,
  updated_at: ISO8601,
  audit_event_id: string
}>
```

**Security Rules:**
- Updater must have `broker_agency.user.update_role` permission
- Target user must belong to same broker agency
- Only owner can change owner role
- Cannot downgrade self (if target = requester)

**Audit:**
- Log: `BROKER_USER_ROLE_UPDATED` with target_user_id, old_role, new_role, updater_id

#### Method: deactivateBrokerAgencyUser

**Signature:**
```
deactivateBrokerAgencyUser({
  broker_agency_user_id: string,
  deactivated_by_user_id: string
}): Promise<{
  broker_agency_user_id: string,
  status: "deactivated",
  deactivated_at: ISO8601,
  audit_event_id: string
}>
```

**Security Rules:**
- Deactivator must have `broker_agency.user.deactivate` permission
- Cannot deactivate self
- Set BrokerAgencyUser.status = "deactivated"
- User loses access to /broker immediately

**Audit:**
- Log: `BROKER_USER_DEACTIVATED` with target_user_id, deactivator_id

---

## 4. Permission Model

### 4.1 New Permission Namespace: broker_agency.user.*

| Permission | Owner | Manager | Viewer | Platform Admin |
|-----------|-------|---------|--------|-----------------|
| `broker_agency.user.view` | ✅ | ✅ | ❌ | ✅ |
| `broker_agency.user.invite` | ✅ | ✅ (if permissioned) | ❌ | ✅ |
| `broker_agency.user.resend_invite` | ✅ | ✅ (if permissioned) | ❌ | ✅ |
| `broker_agency.user.revoke_invite` | ✅ | ✅ (if permissioned) | ❌ | ✅ |
| `broker_agency.user.update_role` | ✅ | ❌ | ❌ | ✅ |
| `broker_agency.user.deactivate` | ✅ | ❌ | ❌ | ✅ |
| `broker_agency.user.view_audit` | ✅ | ❌ | ❌ | ✅ |

### 4.2 Role Mapping

**Broker Agency Roles:**
- `owner` → Internal: `broker_agency_admin` (all permissions)
- `manager` → Internal: `broker_account_manager` (invite, view)
- `viewer` → Internal: `broker_read_only` (view only)

### 4.3 MGA Blocking Rule

MGA users **cannot** invite users to standalone broker agencies unless:
1. MGA has explicit admin override permission AND
2. BrokerPlatformRelationship has `mga_management_enabled: true` (not in Phase 2)

---

## 5. Invitation Token Model

### 5.1 Token Generation

- **Algorithm:** 32-byte random token (256 bits entropy)
- **Encoding:** Base64 URL-safe
- **Storage:** SHA-256 hash only (never plaintext)
- **Expiration:** 7 days from creation
- **One-time use:** Token becomes invalid after acceptance or 1 use attempt

### 5.2 Token in Invitation Link

```
https://app.example.com/broker/accept-invite?token={base64_token}&email={email}
```

- Token is plaintext in URL (HTTPS only)
- Email param aids UX (pre-fills form)
- Token is hashed immediately on server receipt

### 5.3 Token Validation Sequence

```
1. User clicks link or submits token manually
2. validateInvitationToken({token})
3. Server: hash(token) against stored token_hash
4. If match + not expired + not used + not revoked → valid
5. Return safe metadata (email, role, broker_agency_id, expires_at)
6. Log validation event
7. User accepts invitation → token marked as used
```

---

## 6. Email / Notification Design

### 6.1 Notification System

**Use existing:** Base44 notification service  
**Avoid:** Raw email sending (use notification outbox for QA/staging)  
**Test mode:** Use test outbox; do not send live emails unless production flag enabled

### 6.2 Invitation Email Template

**Subject:** `You've been invited to join {broker_agency_name}`

**Body:**
```
Hello {first_name},

{inviter_name} has invited you to join {broker_agency_name} as a {role}.

Your Role: {role_display} (e.g., "Account Manager")

Accept Invitation:
[Button/Link] https://app.example.com/broker/accept-invite?token={token}&email={email}

This invitation expires on {expiration_date}.

If you have questions, contact {support_email}.

---
Do not share this link with others. This is a one-time invitation.
```

### 6.3 Notification Events

- **Created:** Email sent when invitation created
- **Resent:** Email sent with new "resent on {date}" note
- **Accepted:** Confirmation email to inviter
- **Revoked:** Notification to inviter that invite was revoked
- **Expired:** (Optional) Email to inviter if not accepted before expiration

### 6.4 Email Security Rules

- No sensitive broker financial data in email
- No role permissions details in email
- No BrokerPlatformRelationship status in email
- Subject line safe for shared email accounts
- Reply-to = support address (not inviter)
- Audit event logged for every send/resend

---

## 7. UI/UX Design

### 7.1 Broker Workspace Route

**Primary:** `/broker/settings/users` (dedicated page)  
**Alternative:** `/broker/settings` (tab-based)

**UI Sections:**

#### Section A: Broker Agency Users (Active)
- Table: email, name, role, last_login_at, status
- Actions: Edit role (owner only), Deactivate (owner only)
- Columns sortable by name, role, last_login
- Filter: Status (active, suspended, deactivated)
- Empty state: "No users invited yet. Invite your first team member."

#### Section B: Pending Invitations
- Table: email, first_name, role, invited_at, status, actions
- Status badge: "Sent", "Expired", "Revoked"
- Actions: Resend, Revoke (owner/manager only)
- Empty state: "No pending invitations."

#### Section C: Invite User Modal
- Trigger: "Invite User" button in Section A header
- Fields:
  - Email (required, validated)
  - First Name (required)
  - Last Name (required)
  - Role dropdown (owner/manager/viewer)
  - Permissions preview (read-only, shows what role can do)
- Validation:
  - Email not already invited/active in broker
  - Email format
- Submit: Creates invitation, generates token, sends email
- Success: Toast notification "Invitation sent to {email}"
- Error states: Duplicate email, network error, broker suspended

#### Section D: Invite Status Badges
```
Status        | Color    | Icon
Sent          | Blue     | 📧 
Accepted      | Green    | ✅
Expired       | Gray     | ⏰
Revoked       | Red      | 🚫
Failed        | Orange   | ⚠️
```

#### Section E: Audit History (Optional for Phase 2)
- Timeline of invitations, role changes, deactivations
- Visible to owner/admin only
- Shows: action, who, email, timestamp, outcome

### 7.2 Platform Admin Route

**Route:** `/command-center/broker-agencies/:brokerAgencyId/users`

**Restrictions:**
- Platform admin/superadmin only
- Cannot access for MGA-owned broker agencies (unless explicit grant)
- Shows same sections as Section A + audit history

---

## 8. Security Enforcements

### 8.1 Frontend (UI Gating)
- Invite button hidden if user role = viewer
- Role dropdown restricted by user permission
- Deactivate button hidden for non-owners

### 8.2 Backend (Mandatory)
- ALL service contract calls check permission resolver
- Permission resolver called BEFORE database operation
- Scope gate enforced (broker_agency_id scoping)
- Tenant scoping applied
- Token hashed before storage/comparison
- Cross-broker checks enforced (cannot invite to different broker)
- Inactive/suspended broker checks enforced
- BrokerPlatformRelationship.status check enforced

### 8.3 Token Security
- Token never logged in plaintext
- Token hash logged only
- Token expires after 7 days
- Token one-time use (marked as used after acceptance)
- Token in URL (HTTPS only, not logged by base44)
- Brute force protection: rate limit token validation attempts

### 8.4 Audit Requirements
- Every invitation action audit logged
- Audit event includes: actor, action, target, timestamp, outcome
- Audit trace_id stored on both Invitation and User records
- MGA users attempting broker user operations = audit + blocked

---

## 9. Role Assignment UX

### 9.1 Role Selection Flow

**Step 1: Inviter clicks "Invite User"**
- Modal opens with role selector
- Role options: Owner, Manager, Viewer (with descriptions)

**Step 2: Role descriptions shown**
```
Owner
- Manage all broker agency users and settings
- Approve contracts, view financial data
- Invite/revoke team members

Manager
- Invite team members
- View broker workspace and reports
- Cannot manage other users

Viewer
- View-only access to broker workspace
- Cannot make changes or invite others
```

**Step 3: Submit invitation**
- Validation runs (email not duplicate, etc.)
- Invitation token generated and hashed
- Email sent with invitation link
- Success confirmation

### 9.2 Role Update Flow (Owner Only)

**Step 1: Owner clicks role on active user**
- Dropdown: Owner → Manager → Viewer
- Confirmation: "Change {email} role to {new_role}?"

**Step 2: Update confirmed**
- BrokerAgencyUser.role updated
- Audit logged
- Toast: "Role updated for {email}"
- User's permissions refreshed on next login

---

## 10. Implementation Constraints

### 10.1 Do Not Implement Until Phase 1 Certified
- Phase 1 automation: 14/14 PASS
- BrokerAgencyProfile and BrokerPlatformRelationship validated
- Operator approval recorded
- Master general agent scope validation complete

### 10.2 No Cross-Contamination with Phase 1
- Phase 1 broker signup workflow unchanged
- Phase 1 approval workflow unchanged
- BrokerPlatformRelationship behavior unchanged
- MGA access patterns unchanged

### 10.3 Gate 6K / 6L-A Compatibility
- Phase 2 does NOT disable MGA gate functionality
- Standalone broker user invitations isolated from MGA gates
- Tenant scoping preserved

### 10.4 Test Data Isolation
- Invitation tokens for testing contain `@broker.local` emails
- Test invitations never sent to live email addresses
- Notification system must have test mode for QA

---

## 11. Test Plan (25 Scenarios)

| # | Scenario | Expected | Audit |
|---|----------|----------|-------|
| 1 | Owner invites broker user | Invitation created, email sent | INVITATION_CREATED |
| 2 | Manager invites user (permissioned) | Invitation created | INVITATION_CREATED |
| 3 | Viewer cannot invite | 403 Forbidden | UNAUTHORIZED_INVITATION_ATTEMPT |
| 4 | MGA user cannot invite to standalone broker | 403 Forbidden | CROSS_SCOPE_INVITATION_BLOCKED |
| 5 | Invite to suspended broker rejected | 400 Bad Request | INVALID_BROKER_STATUS |
| 6 | Invite if BrokerPlatformRelationship inactive | 400 Bad Request | INACTIVE_RELATIONSHIP |
| 7 | Duplicate email in same broker blocked | 400 Bad Request | DUPLICATE_EMAIL |
| 8 | Token generated and hashed | Token hash stored only | - |
| 9 | Invitation email sent | Email in notification outbox | EMAIL_SENT |
| 10 | Invitee receives email with safe content | No sensitive data exposed | - |
| 11 | Token validation succeeds | Safe metadata returned | INVITATION_VALIDATED |
| 12 | Expired token rejected | 400 Expired | EXPIRED_TOKEN |
| 13 | Used token cannot be reused | 400 Already Used | TOKEN_ALREADY_USED |
| 14 | Revoked token rejected | 400 Revoked | REVOKED_TOKEN |
| 15 | BrokerAgencyUser created on acceptance | User active, role assigned | INVITATION_ACCEPTED |
| 16 | User receives correct role | BrokerAgencyUser.role = assigned role | - |
| 17 | Invited user can access /broker | Token validated, session created | USER_LOGIN |
| 18 | Invited user cannot access other brokers | 403 Forbidden on cross-broker request | UNAUTHORIZED_BROKER_ACCESS |
| 19 | Owner can update user role | Role field updated | BROKER_USER_ROLE_UPDATED |
| 20 | Unauthorized user cannot update role | 403 Forbidden | UNAUTHORIZED_ROLE_UPDATE |
| 21 | All invitation actions audit logged | Audit table records all events | * |
| 22 | Phase 3 behavior not activated | No MGA relationship logic triggered | - |
| 23 | Phase 1 broker signup still works | Duplicate broker still blocked | - |
| 24 | Gate 6K analytics unaffected | MGA export still functions | - |
| 25 | Gate 6L-A scheduling unaffected | Broker agency contacts unchanged | - |

---

## 12. Implementation Dependencies

- Phase 1: MUST be certified (14/14 PASS + operator approval)
- Base44 SDK: Must support BrokerAgencyUser/Invitation entities
- Notification system: Test mode required
- Permission resolver: Must support new broker_agency.user.* namespace
- Scope gate: Must support broker_agency_id scoping

---

## 13. Success Criteria

- [x] All 25 test scenarios pass
- [x] All audit events logged correctly
- [x] No plaintext tokens in logs
- [x] No cross-broker invitations possible
- [x] MGA users blocked from standalone broker user invitations
- [x] One-time token usage enforced
- [x] Email notifications safe and audit-logged
- [x] Phase 1/3 behavior unchanged
- [x] Gates 6K/6L-A fully functional

---

## References

- Phase 1 Broker Signup: `docs/PHASE_1_*`
- Permission Model: `lib/mga/permissionResolver.js`
- Scope Gating: `lib/mga/scopeGate.js`
- Audit Model: `lib/mga/services/auditService.js`

---

**Design Review Approved:** Pending Phase 1 Certification  
**Next Step:** Implementation Work Order (see separate document)