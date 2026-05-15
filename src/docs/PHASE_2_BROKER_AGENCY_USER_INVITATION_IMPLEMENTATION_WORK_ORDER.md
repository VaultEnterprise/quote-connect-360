# Phase 2: Broker Agency User Invitation
## Implementation Work Order

**Date:** 2026-05-13  
**Status:** WORK_ORDER_READY (Blocked until Phase 1 Certification)  
**Target Sprint:** Immediately after Phase 1 certification  
**Estimated Effort:** 80–120 hours (3–4 weeks, 2 FTE)

---

## 1. Pre-Implementation Gate

**BLOCKING CONDITION:** Phase 1 must be certified with:

- [x] 14/14 automated test PASS
- [x] Actual BrokerAgencyProfile ID recorded
- [x] Actual BrokerPlatformRelationship ID recorded
- [x] Broker approval workflow validated
- [x] Operator approval signed
- [x] Phase 1 QA finalization checklist complete

**Once gate is opened:**

All Phase 2 implementation UNBLOCKS.  
No feature flags required.  
No gradual rollout.  
Phase 2 is production-ready upon completion.

---

## 2. Entity Creation (Week 1, Day 1–2)

### Task 2.1: Create BrokerAgencyUser Entity

**Deliverable:** `src/entities/BrokerAgencyUser.json`

**Schema:** (from design spec §2.1)
- Standard fields: id, tenant_id, broker_agency_id, user_id, email, name, phone, role, status
- Audit fields: invited_by_user_id, invited_at, accepted_at, last_login_at, created_at, updated_at, audit_trace_id
- Validation: role enum (owner/manager/viewer), status enum (invited/active/suspended/deactivated)
- Index: broker_agency_id (scope), email (uniqueness), status

**Effort:** 2 hours

### Task 2.2: Create BrokerAgencyUserInvitation Entity

**Deliverable:** `src/entities/BrokerAgencyUserInvitation.json`

**Schema:** (from design spec §2.2)
- Standard fields: id, tenant_id, broker_agency_id, email, name, role
- Token fields: token_hash, token_expires_at, token_used_at
- Status: invitation_status enum (draft/sent/accepted/expired/cancelled/revoked/failed)
- Audit fields: invited_by_user_id, accepted_by_user_id, resent_count, last_sent_at
- Index: broker_agency_id (scope), email, token_hash

**Effort:** 2 hours

**Total Task 2 Effort:** 4 hours

---

## 3. Backend Service Contract (Week 1, Day 2–3)

### Task 3.1: Create brokerUserInvitationContract

**Deliverable:** `lib/broker/brokerUserInvitationContract.js`

**Methods to Implement:**
1. `createInvitation({broker_agency_id, email, first_name, last_name, role, invited_by_user_id})`
2. `resendInvitation({invitation_id, resent_by_user_id})`
3. `revokeInvitation({invitation_id, revoked_by_user_id})`
4. `validateInvitationToken({token})`
5. `acceptInvitation({token, user_id, password_hash?})`
6. `listBrokerAgencyUsers({broker_agency_id, requesting_user_id})`
7. `updateBrokerAgencyUserRole({broker_agency_user_id, new_role, updated_by_user_id})`
8. `deactivateBrokerAgencyUser({broker_agency_user_id, deactivated_by_user_id})`

**Security Implementation:**

For each method:
- [ ] Call permissionResolver with specific permission (e.g., `broker_agency.user.invite`)
- [ ] Apply scopeGate to validate broker_agency_id access
- [ ] Tenant scoping enforced
- [ ] Check BrokerAgencyProfile status (not suspended)
- [ ] Check BrokerPlatformRelationship.status (must be active)
- [ ] Validate no MGA cross-scope access (unless explicit override)
- [ ] Hash token before storage/comparison (SHA-256)
- [ ] Generate audit event with outcome

**Token Implementation:**
- [ ] Token: 32-byte random, Base64 URL-safe
- [ ] Storage: SHA-256 hash only
- [ ] Expiration: 7 days
- [ ] One-time use enforcement

**Audit Implementation:**
- [ ] Use auditService to log all invitation actions
- [ ] Log event names: `INVITATION_CREATED`, `INVITATION_RESENT`, `INVITATION_REVOKED`, etc.
- [ ] Include: actor_id, actor_role, action, target, outcome, timestamp
- [ ] Store audit_trace_id on both Invitation and User records

**Effort:** 32 hours

### Task 3.2: Create Backend Invitation Functions

**Deliverable:** Multiple functions in `src/functions/`

Functions to create:
- `brokerCreateInvitation.js` — Public endpoint for invite creation
- `brokerResendInvitation.js` — Resend logic
- `brokerRevokeInvitation.js` — Revoke logic
- `brokerValidateInvitationToken.js` — Token validation
- `brokerAcceptInvitation.js` — Acceptance + user creation
- `brokerListUsers.js` — List broker users with filtering
- `brokerUpdateUserRole.js` — Update user role
- `brokerDeactivateUser.js` — Deactivate user

**Each function must:**
- [ ] Call brokerUserInvitationContract method
- [ ] Handle errors gracefully (400/403 responses)
- [ ] Validate incoming payload
- [ ] Return safe JSON (no sensitive data)
- [ ] Log outcome to audit trail

**Effort:** 24 hours

**Total Task 3 Effort:** 56 hours

---

## 4. Frontend Components (Week 1, Day 4 – Week 2, Day 3)

### Task 4.1: Create Broker Settings Layout

**Deliverable:** `pages/BrokerSettings.jsx`

- Tab navigation: Profile | Users | Billing (future) | Security (future)
- Route: `/broker/settings` → handles sub-routes via query param or child route
- Auth gate: User must be authenticated and have active BrokerAgencyUser record
- Load broker agency profile data

**Effort:** 6 hours

### Task 4.2: Create Broker Users Tab Component

**Deliverable:** `components/broker/BrokerUsersPanel.jsx`

**Features:**
- [ ] Section A: Active Users Table
  - Columns: Email, Name, Role, Last Login, Actions (Edit/Deactivate)
  - Sortable, filterable by status
  - Empty state message
- [ ] Section B: Pending Invitations Table
  - Columns: Email, Role, Invited At, Status, Actions (Resend/Revoke)
  - Status badges (Sent/Expired/Revoked)
- [ ] Section C: "Invite User" Button
  - Triggers modal (below)
- [ ] Section E: Audit History (expandable)
  - Timeline of recent invitation/role changes
  - Owner-only visibility

**Data Loading:**
- [ ] useQuery for BrokerAgencyUser list
- [ ] useQuery for BrokerAgencyUserInvitation list
- [ ] Subscription for real-time updates on user/invitation changes

**Effort:** 18 hours

### Task 4.3: Create Invite User Modal

**Deliverable:** `components/broker/InviteUserModal.jsx`

**Fields:**
- [ ] Email input (required, validated)
- [ ] First Name input (required)
- [ ] Last Name input (required)
- [ ] Role selector dropdown (Owner/Manager/Viewer)
  - Show role descriptions
  - Gray out roles user cannot assign (e.g., Manager cannot assign Owner)

**Validation:**
- [ ] Email format check
- [ ] Email not already invited/active in broker
- [ ] Broker agency status check (not suspended)

**Submit Handling:**
- [ ] Call `brokerCreateInvitation` backend function
- [ ] Handle error states (duplicate, network, etc.)
- [ ] Show success toast with email
- [ ] Refresh pending invitations table
- [ ] Close modal

**Effort:** 12 hours

### Task 4.4: Create Invitation Status Badges

**Deliverable:** `components/broker/InvitationStatusBadge.jsx`

- Map status → color + icon
- Reusable across tables

**Effort:** 2 hours

### Task 4.5: Create Invite Acceptance Page

**Deliverable:** `pages/BrokerAcceptInvite.jsx`

**Route:** `/broker/accept-invite?token={token}&email={email}`

**Flow:**
- [ ] Extract token and email from URL
- [ ] Call `brokerValidateInvitationToken` to validate
- [ ] If valid, show form: Password setup + confirmation
- [ ] Call `brokerAcceptInvitation` on submit
- [ ] Redirect to `/broker` on success
- [ ] Show error state if token invalid/expired

**Effort:** 10 hours

**Total Task 4 Effort:** 48 hours

---

## 5. Permission & Authorization (Week 2, Day 1)

### Task 5.1: Add Permissions to Resolver

**Deliverable:** Updates to `lib/mga/permissionResolver.js`

**Add namespace:** `broker_agency.user.*`

**Permissions to register:**
```
broker_agency.user.view
broker_agency.user.invite
broker_agency.user.resend_invite
broker_agency.user.revoke_invite
broker_agency.user.update_role
broker_agency.user.deactivate
broker_agency.user.view_audit
```

**Role mapping:**
- Owner role → All broker_agency.user.* permissions
- Manager role → view, invite, resend_invite
- Viewer role → (none)
- Platform admin → All broker_agency.user.* permissions

**Effort:** 4 hours

### Task 5.2: Update scopeGate for Broker Agency Scoping

**Deliverable:** Updates to `lib/mga/scopeGate.js`

**Add broker agency scope enforcement:**
- [ ] Validate `broker_agency_id` param against user's accessible brokers
- [ ] MGA users: blocked from non-MGA-affiliated brokers (unless override)
- [ ] Standalone broker users: can only access their own broker

**Effort:** 4 hours

**Total Task 5 Effort:** 8 hours

---

## 6. Notification System Integration (Week 2, Day 2)

### Task 6.1: Create Invitation Email Template

**Deliverable:** `lib/broker/invitationEmailTemplate.js`

**Template:**
```
Subject: You've been invited to join {broker_agency_name}

Body:
- Inviter name
- Broker agency name
- Assigned role (with description)
- Secure invitation link with token
- Expiration date
- Support contact
```

**Rules:**
- [ ] No sensitive broker data in email
- [ ] No role permissions details (keep simple)
- [ ] Safe subject for shared email accounts
- [ ] Reply-to = support address

**Effort:** 3 hours

### Task 6.2: Integration with Notification Service

**Deliverable:** Updates to `brokerUserInvitationContract.js`

**Hooks:**
- [ ] On `createInvitation` → Queue email notification
- [ ] On `resendInvitation` → Queue email notification
- [ ] On `acceptInvitation` → Optional confirmation email to inviter

**Test Mode:**
- [ ] Use notification outbox for QA (no live emails)
- [ ] Production flag controls actual email sending

**Effort:** 6 hours

**Total Task 6 Effort:** 9 hours

---

## 7. Testing (Week 2, Day 3 – Week 3, Day 2)

### Task 7.1: Unit Tests for Contract

**Deliverable:** `tests/broker/brokerUserInvitationContract.test.js`

**Test coverage (unit):**
- [ ] Token generation (hashing, expiration)
- [ ] Permission validation (mock)
- [ ] Scope gating (mock)
- [ ] Database state transitions

**Test scenarios covered:**
- 1, 2, 3 (Invite permissions by role)
- 8, 11, 12, 13, 14 (Token lifecycle)
- 15, 16 (User creation + role assignment)

**Effort:** 12 hours

### Task 7.2: E2E Tests for Invitation Workflow

**Deliverable:** `tests/e2e/broker-invitation-workflow.spec.js`

**Test scenarios covered (all 25 from design spec §11):**
- Invitation creation (scenarios 1–7)
- Token validation + acceptance (scenarios 8–17)
- Role updates + deactivation (scenarios 18–20)
- Audit logging (scenario 21)
- Cross-contamination tests (scenarios 22–25)

**Browser automation:**
- [ ] Create invitation via UI
- [ ] Extract token from email (notification outbox)
- [ ] Accept invitation with valid token
- [ ] Verify user access to /broker
- [ ] Verify role permissions enforced
- [ ] Verify Phase 1 unaffected

**Effort:** 20 hours

### Task 7.3: Security Testing

**Deliverable:** Manual security checklist + automated tests

**Security checks:**
- [ ] No plaintext tokens in logs
- [ ] Cross-broker invitation blocked
- [ ] MGA cannot invite to standalone broker
- [ ] Expired/used tokens rejected
- [ ] Token brute force protection (rate limiting)
- [ ] CSRF protection on invitation endpoints
- [ ] XSS protection in email templates

**Effort:** 8 hours

**Total Task 7 Effort:** 40 hours

---

## 8. Documentation (Week 3, Day 1–2)

### Task 8.1: Create Backend API Documentation

**Deliverable:** `docs/PHASE_2_BACKEND_API_REFERENCE.md`

- Each function documented
- Request/response schemas
- Error codes
- Example curl commands
- Permission requirements

**Effort:** 6 hours

### Task 8.2: Create User Manual / Help Content

**Deliverable:** Updates to help system

- How to invite a user
- Role descriptions
- Invitation link distribution
- Troubleshooting (expired token, etc.)

**Effort:** 4 hours

### Task 8.3: Update Main Documentation

**Deliverable:** Updates to `docs/` for Phase 2 completion

- Update framework ledger
- Add Phase 2 completion report
- Record implementation dates + effort

**Effort:** 3 hours

**Total Task 8 Effort:** 13 hours

---

## 9. Integration & Final Validation (Week 3, Day 3)

### Task 9.1: Full System Integration Test

**Deliverable:** Run complete 25-scenario test suite

- [ ] All backend functions deployed
- [ ] All frontend components linked
- [ ] Notification system integrated
- [ ] Permission resolver active
- [ ] Audit logging functional
- [ ] All 25 test scenarios PASS

**Effort:** 8 hours

### Task 9.2: Regression Testing (Phase 1 + Gates 6K/6L-A)

**Deliverable:** Verify no contamination

- [ ] Phase 1 broker signup still works
- [ ] Duplicate broker signup still blocked
- [ ] Gate 6K (MGA analytics) unaffected
- [ ] Gate 6L-A (broker contacts) unaffected
- [ ] MGA user access patterns unchanged

**Effort:** 4 hours

### Task 9.3: Performance Testing

**Deliverable:** Verify scalability

- [ ] Invitation creation < 500ms
- [ ] User list retrieval < 1s (100 users)
- [ ] Token validation < 100ms
- [ ] No database N+1 queries

**Effort:** 4 hours

**Total Task 9 Effort:** 16 hours

---

## 10. Deployment & Monitoring (Week 4, Day 1)

### Task 10.1: Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code review approved
- [ ] Documentation complete
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Backup strategy in place

**Effort:** 4 hours

### Task 10.2: Deploy to Staging

- [ ] Deploy entities (BrokerAgencyUser, BrokerAgencyUserInvitation)
- [ ] Deploy backend functions
- [ ] Deploy frontend components
- [ ] Update routes in App.jsx
- [ ] QA validation on staging

**Effort:** 4 hours

### Task 10.3: Deploy to Production

- [ ] Final smoke test
- [ ] Monitor logs for errors
- [ ] Verify notification delivery
- [ ] Confirm audit events recorded
- [ ] Alert on any failures

**Effort:** 4 hours

### Task 10.4: Post-Deployment Monitoring

- [ ] 24-hour monitoring window
- [ ] Check error rates
- [ ] Verify email delivery
- [ ] Monitor token usage
- [ ] Rollback plan ready (if needed)

**Effort:** 8 hours

**Total Task 10 Effort:** 20 hours

---

## 11. Summary of Work Items

| Task | Deliverable | Effort | Status |
|------|-------------|--------|--------|
| 2.1 | BrokerAgencyUser entity | 2h | READY |
| 2.2 | BrokerAgencyUserInvitation entity | 2h | READY |
| 3.1 | Service contract | 32h | READY |
| 3.2 | Backend functions | 24h | READY |
| 4.1 | Broker settings page | 6h | READY |
| 4.2 | Users panel component | 18h | READY |
| 4.3 | Invite modal | 12h | READY |
| 4.4 | Status badges | 2h | READY |
| 4.5 | Acceptance page | 10h | READY |
| 5.1 | Permission resolver | 4h | READY |
| 5.2 | Scope gate | 4h | READY |
| 6.1 | Email template | 3h | READY |
| 6.2 | Notification integration | 6h | READY |
| 7.1 | Unit tests | 12h | READY |
| 7.2 | E2E tests | 20h | READY |
| 7.3 | Security testing | 8h | READY |
| 8.1 | API documentation | 6h | READY |
| 8.2 | User manual | 4h | READY |
| 8.3 | Main docs | 3h | READY |
| 9.1 | System integration | 8h | READY |
| 9.2 | Regression testing | 4h | READY |
| 9.3 | Performance testing | 4h | READY |
| 10.1 | Pre-deployment | 4h | READY |
| 10.2 | Staging deploy | 4h | READY |
| 10.3 | Production deploy | 4h | READY |
| 10.4 | Post-deployment monitoring | 8h | READY |

**Total Effort:** 240 hours (8 weeks, 1.5 FTE OR 4 weeks, 2 FTE)

---

## 12. Sprint Breakdown (2 FTE, 4-Week Timeline)

### Week 1 (40 hours)
- Task 2.1–2.2: Entity schemas (4h)
- Task 3.1–3.2: Backend service contract + functions (40h) [OVERFLOW TO WEEK 2]

### Week 2 (40 hours)
- Task 3.2: Backend functions (24h) [CONTINUED]
- Task 4.1–4.5: Frontend components (40h) [OVERFLOW TO WEEK 3]
- Task 5.1–5.2: Permissions (8h)
- Task 6.1–6.2: Notifications (9h)

### Week 3 (40 hours)
- Task 4: Frontend (48h) [OVERFLOW, REDUCED]
- Task 7: Testing (40h)

### Week 4 (40 hours)
- Task 8: Documentation (13h)
- Task 9: Integration (16h)
- Task 10: Deployment (20h) [EXTENDED]

**Note:** With aggressive parallelization and 2 FTE, this can compress to 3.5–4 weeks.

---

## 13. Success Criteria

### Functional
- [ ] All 25 test scenarios PASS
- [ ] Invitation email templates generated correctly
- [ ] Token validation enforces one-time use
- [ ] Role assignment works for all role types
- [ ] Deactivation blocks user access immediately

### Security
- [ ] No plaintext tokens in logs
- [ ] No cross-broker invitations
- [ ] MGA users blocked from standalone broker user invitations
- [ ] All invitation actions audit-logged
- [ ] Permission resolver enforced on all operations

### Quality
- [ ] 100% unit test coverage for contract
- [ ] All E2E scenarios PASS
- [ ] No regressions to Phase 1 / Gates
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved

### Documentation
- [ ] API reference complete
- [ ] User manual written
- [ ] Phase 2 completion report filed

---

## 14. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Token collision | HIGH | Use cryptographically secure randomness, validate uniqueness on insert |
| Email delivery | MEDIUM | Use reliable notification service, log all sends, implement retry |
| Permission logic error | HIGH | Comprehensive unit tests, code review required |
| Cross-contamination with Phase 1 | HIGH | Isolated scope validation, regression tests mandatory |
| Database schema issues | MEDIUM | Entity peer review before creation, test migrations |
| UI/UX confusion | LOW | User testing during development, clear role descriptions |

---

## 15. Sign-Off Gate

**BLOCKING:** Phase 1 certification must be complete with:
- [x] 14/14 E2E test PASS
- [x] Operator approval on record
- [x] Actual database IDs recorded

**Once gate is cleared:**
- Phase 2 implementation work can begin immediately
- All tasks above are unblocked
- Expected deployment: 4 weeks after Phase 1 sign-off

---

## References

- Design Specification: `docs/PHASE_2_BROKER_AGENCY_USER_INVITATION_DESIGN_SPECIFICATION.md`
- Phase 1 Broker Signup: `docs/PHASE_1_*`
- Permission Resolver: `lib/mga/permissionResolver.js`
- Scope Gate: `lib/mga/scopeGate.js`
- Audit Service: `lib/mga/services/auditService.js`

---

**Prepared:** 2026-05-13  
**Status:** WORK_ORDER_READY (BLOCKED UNTIL PHASE 1 CERTIFICATION)  
**Next Step:** Execute Phase 1 automated QA → Obtain operator sign-off → Unblock Phase 2