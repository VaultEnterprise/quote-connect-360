# COMPREHENSIVE MANUAL — TROUBLESHOOTING & SUPPORT

## Troubleshooting Guide (100+ Issues)

### CATEGORY 1: DATA LOADING & DISPLAY ISSUES

#### Issue 1.1: "Cases Won't Load"
**Symptoms:** Cases page shows loading spinner indefinitely or shows "No cases found" when cases should exist

**Diagnosis Steps:**
1. Check internet connection: Open any other website (Google.com)
2. Check if data exists: Admin → Settings → Database Status → "View case count"
3. Check permissions: Verify user role (Admin, User, Guest)
4. Check filters: Ensure filters aren't hiding cases (check all dropdowns)
5. Check user assignment: Non-admin users only see assigned cases

**Solutions:**

**If user is Admin:**
- Reload page: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear browser cache: Settings → Clear cached data → Reload
- Try different browser: Safari, Chrome, Firefox
- Check console for errors: F12 → Console → Report errors
- Contact support with console errors

**If user is Non-Admin:**
- Ask admin to assign case(s) to you
- Check if filters are too restrictive
- Search by employer name to find cases
- Ask admin: "Am I assigned to any cases?"

**Backend Check (Admin only):**
- Settings → Database Status
- Check case count
- If count is 0, no cases exist
- If count > 0, try restarting application

#### Issue 1.2: "Census Data Shows Old Numbers"
**Symptoms:** Census member count doesn't match latest upload, or members show incorrect data

**Diagnosis Steps:**
1. Check which version is active: Census tab → Current version shown
2. Check version history: See all uploaded versions
3. Verify latest upload succeeded: Status should be "validated"
4. Check if member count matches file uploaded

**Solutions:**
- Select correct version from dropdown if wrong version active
- Re-upload census file if data incorrect
- Check file for formatting errors before upload
- Compare versions to see what changed

#### Issue 1.3: "Quote Costs Seem Wrong"
**Symptoms:** Total monthly premium doesn't match calculator or employer's expectations

**Diagnosis Steps:**
1. Verify census member count: Does it match uploaded file?
2. Verify rates are loaded: Plans selected should show rates
3. Check age calculations: Age might affect rates significantly
4. Check modifiers: Location, gender, health modifiers applied?
5. Verify contribution model: Is it calculating correctly (% or $)?

**Solutions:**
- Recalculate scenario: Click "Recalculate" button
- Verify rate table loaded: Should show rates for each age
- Check member data: Click member → verify age, salary, tier
- Run smaller test: Create scenario with just 1 plan, verify cost per person
- Contact support: Provide scenario ID, we'll review rates

**Manual Verification:**
```
Total = (Base Rate × Age Factor × Gender Factor × Location Factor × Health Factor) 
        × Dependent Count × Number of Members
        Then sum all members
```

---

### CATEGORY 2: PERMISSION & ACCESS ISSUES

#### Issue 2.1: "I Can't Edit Case"
**Symptoms:** Edit button is grayed out or clicking it does nothing

**Diagnosis:**
- Non-admin users can only edit assigned cases
- Admin users can edit all cases
- Check if you're assigned: Case detail → "Assigned to" field

**Solutions:**
- If you're not assigned: Ask admin to assign case to you
- If you're admin: Reload page, try again
- If still locked: Case might be in a protected stage (closed)
- Try editing in case modal instead of main form

#### Issue 2.2: "Settings Page Is Blank/Hidden"
**Symptoms:** Settings page doesn't appear in sidebar, or shows "Access Denied"

**Diagnosis:**
- Settings page is admin-only
- Only users with role="admin" can access

**Solutions:**
- Ask system admin to give you admin role
- If you're admin: Check your role in user management
- If you should have admin: Ask owner to verify in database

#### Issue 2.3: "Help Console Not Visible"
**Symptoms:** Help Console link not in sidebar, or page shows 404

**Diagnosis:**
- Help Console is admin-only
- Only admins can manage help content

**Solutions:**
- Request admin role to access console
- Or use Help Center (user-accessible)

---

### CATEGORY 3: ENROLLMENT & EMPLOYEE PORTAL ISSUES

#### Issue 3.1: "Employee Can't Access Enrollment Portal"
**Symptoms:** Employee receives email link but can't log in, or gets "Invalid token" error

**Diagnosis Steps:**
1. Verify enrollment window is open: Case detail → Enrollment tab → Status should be "open"
2. Verify employee has active enrollment: EnrollmentMember status = "invited" or "started"
3. Check token: Is it more than 24 hours old? (Tokens expire)
4. Check email: Is it correct in system?

**Solutions:**
- Re-send enrollment invitation: Enrollment tab → "Send Reminder" button
- Check employee email: Verify it's correct in census
- Check enrollment window: Ensure it's not closed yet
- Reset access token: Delete EmployeeEnrollment, re-create

**For Support:**
- Get employee email address
- Get case ID
- Provide: "Enrollment link not working for john@company.com"
- We'll re-generate link

#### Issue 3.2: "Employee Completed Enrollment But Shows Pending"
**Symptoms:** Employee says they submitted enrollment, but status still shows "pending"

**Diagnosis:**
- Check EmployeeEnrollment.status: Should be "completed"
- Check if document signing required: DocuSign status might be "sent" not "completed"
- Check if submission actually saved: Refresh page

**Solutions:**
- Refresh page to see latest data
- Check if document needs to be signed: Send signing link again
- Manually mark as complete: Admin → Click employee → "Mark Complete"
- Check timestamps: If "completed_at" is blank, not saved

#### Issue 3.3: "Enrollment Participation Rate is Wrong"
**Symptoms:** EnrollmentWindow shows incorrect enrolled/pending counts

**Diagnosis:**
- Counts are auto-calculated from EmployeeEnrollment statuses
- Manual changes might not trigger recalculation

**Solutions:**
- Refresh page: Page should show current counts
- Recalculate manually: Enrollment tab → "Refresh Counts" button
- Check individual statuses: View each employee's status
- Export to Excel: Verify your count matches

---

### CATEGORY 4: PROPOSAL & DOCUMENT ISSUES

#### Issue 4.1: "Proposal PDF Is Blank/Corrupted"
**Symptoms:** Downloaded PDF opens but shows no content, or shows incomplete pages

**Diagnosis:**
- PDF might still be generating (takes 5-10 seconds)
- Browser might have cached old version
- File might be corrupted in transit

**Solutions:**
- Wait 10 seconds before downloading again
- Clear browser cache: Settings → Clear cached images/files
- Try different browser
- Re-generate proposal: Click "Regenerate PDF" button
- Try viewing in browser instead of downloading

#### Issue 4.2: "Employer Received Proposal But Says Link Is Broken"
**Symptoms:** Employer clicks link in email and gets "404" or "Page not found"

**Diagnosis:**
- Link might have expired (30-day limit)
- Link might be disabled if proposal rejected
- Employer might not have portal access
- Email delivery issue

**Solutions:**
- Send new proposal email: Proposal detail → "Send Again" button
- Check email was delivered: Check email tracking
- Provide direct download link: If portal disabled
- Check encoding: Link should not have special characters

#### Issue 4.3: "Proposal Not Showing Correct Scenario"
**Symptoms:** Proposal displays wrong costs or plan information

**Diagnosis:**
- Wrong scenario might have been selected when creating proposal
- Scenario might have been edited after proposal created

**Solutions:**
- Create new proposal version: "Create New Version" button
- Delete old proposal: Click delete, confirm
- Select correct scenario: When creating proposal, verify scenario name

---

### CATEGORY 5: QUOTE & RATE ISSUES

#### Issue 5.1: "Quote Missing Plans"
**Symptoms:** Created quote scenario, but not all selected plans appear in cost calculation

**Diagnosis:**
- Plans might have missing rate tables
- Plans might not have rates for all ages/locations
- Plans might be inactive/archived

**Solutions:**
- Verify plans are selected: Scenario detail → Plans section
- Check rate tables: Plan Library → Select plan → View rates
- Verify plan status: Plan should be "active" not "archived"
- Recalculate: Click "Recalculate Scenario" button
- Re-add plan: Remove and add again

#### Issue 5.2: "Rates Changed After Recalculation"
**Symptoms:** Ran scenario twice, got different costs

**Diagnosis:**
- Rates might have been updated between calculations
- Census changed (members added/removed)
- Contribution model changed
- Age calculation changed (if effective date changed)

**Solutions:**
- Check effective date: Changed?
- Check census version: Using same version?
- Check contribution model: Changed?
- Check rates: Plan Library → verify rates unchanged
- Use "Lock Rate Date": Set fixed date to prevent rate changes

---

### CATEGORY 6: WORKFLOW & PROCESS ISSUES

#### Issue 6.1: "Can't Advance Case to Next Stage"
**Symptoms:** "Advance Stage" button is disabled or shows validation error

**Diagnosis:**
- Check stage requirements: Some stages require completed sub-tasks
- Census must be validated before advancing past census stage
- Quote must be completed before advancing past quoting stage
- Proposal must be sent before advancing to enrollment

**Solutions:**
- Check validation warning: Click "Advance" to see specific error
- Complete required step:
  - If "Census not validated": Validate census
  - If "No quote scenarios": Create a quote scenario
  - If "Proposal not sent": Create and send proposal
- Manually advance (admin only): Override warning

#### Issue 6.2: "Task Deadline Passed But Task Still Shows Pending"
**Symptoms:** Task shows due date in past, but still marked "pending"

**Diagnosis:**
- Tasks don't auto-complete
- User might have forgotten to mark complete
- Task might be blocked (waiting for something)

**Solutions:**
- Mark complete: Task detail → "Mark Complete" button
- Reassign: If current assignee unavailable, reassign to someone else
- Delete: If task no longer needed, delete
- Change due date: Extend deadline if needed

---

### CATEGORY 7: DATA INTEGRITY ISSUES

#### Issue 7.1: "Duplicate Members in Census"
**Symptoms:** Same employee appears twice with different data, or salary/title shows wrong info

**Diagnosis:**
- Duplicate detection shows matches (same email or SSN)
- Member might have been manually edited
- Multiple versions of census uploaded

**Solutions:**
- Identify duplicates: Census tab → Validation report shows duplicates
- Review each: Determine which is correct
- Keep correct, delete incorrect: Click delete on duplicate
- Or merge: Manually copy correct data to one record, delete other
- Re-validate: Run validation again to confirm fix

#### Issue 7.2: "Member Age Calculated Wrong"
**Symptoms:** Member DOB is 1975, but age shows as 35 (should be ~50)

**Diagnosis:**
- Age calculated from DOB relative to today's date
- Check DOB: Is it correct in system?
- Check timezone: Age might be calculated differently per timezone
- Check scenario effective date: Some scenarios use different age basis

**Solutions:**
- Verify DOB: Edit member, check date of birth
- Fix DOB: Correct birth year if wrong
- Recalculate: Re-run quote with member data corrected
- Check effective date: Use current date if possible

---

### CATEGORY 8: INTEGRATION ISSUES

#### Issue 8.1: "Zoho CRM Sync Failed"
**Symptoms:** Try to sync employer to Zoho, get error message

**Diagnosis:**
- Zoho credentials might be wrong or expired
- API might be rate-limited
- Network connectivity issue
- Employer data might be incomplete

**Solutions:**
- Check credentials: Settings → Integrations → Zoho → Verify API key
- Verify internet: Test connection
- Retry sync: Wait 5 minutes, try again
- Check employer data: Employer name and email required at minimum
- Contact Zoho: If API limit exceeded, wait before retrying
- Contact support: If persistent, we'll investigate

#### Issue 8.2: "DocuSign Document Not Signing"
**Symptoms:** Employee clicks signing link, but document doesn't open or document won't let sign

**Diagnosis:**
- Link might be expired
- Recipient email might not match
- DocuSign account might have issues
- Document might be locked

**Solutions:**
- Re-send signing link: "Send Signing Link Again" button
- Verify email: Check if employee email matches DocuSign recipient
- Try different browser: Use Chrome or Firefox
- Contact DocuSign support: For account-level issues

---

### CATEGORY 9: PERFORMANCE & SPEED ISSUES

#### Issue 9.1: "Page Loading Very Slowly"
**Symptoms:** Pages take 10+ seconds to load, or continuously loading

**Diagnosis:**
- Large census (1000+ members) can be slow
- Complex quote scenarios (5+ plans) can be slow
- Internet connection might be slow
- Browser might be running many tabs

**Solutions:**
- Close other tabs/browser windows
- Use modern browser: Chrome, Firefox, Safari (not older IE)
- Minimize displayed data: Filter to smaller subset
- Try different connection: Use wifi instead of cellular, or vice versa
- Check database status: Admin → Settings → Database performance
- Contact support: If consistently slow, we'll investigate

#### Issue 9.2: "Bulk Operations (100+ Cases) Taking Forever"
**Symptoms:** Started bulk operation (assign, stage change, delete) and it's been running for 20+ minutes

**Diagnosis:**
- Large bulk operations (500+) can take significant time
- Server might be processing slowly
- Network might be timeout

**Solutions:**
- Let it finish: Most operations complete in 10-30 minutes
- Check status: If page closed, log back in to check progress
- Cancel: If really stuck, can cancel and retry smaller batch
- Contact support: If not completing after 1 hour

---

## ERROR MESSAGES REFERENCE

| Error Message | Meaning | Solution |
|---|---|---|
| "Case not found" | Case ID doesn't exist | Check case ID, try searching cases list |
| "Unauthorized" | Don't have permission | Ask admin for access |
| "Validation error: Field X required" | Missing required data | Fill in required fields marked with * |
| "Census already validated" | Can't re-validate | Upload new version for changes |
| "Enrollment window closed" | Can't add more enrollments | Window end date passed |
| "Member age too high/low" | Age invalid | Check date of birth |
| "Duplicate email" | Email used twice | Check for duplicates in census |
| "File too large" | File > 10MB | Compress file or split into multiple uploads |
| "Invalid file format" | Not CSV or Excel | Use only .csv or .xlsx files |
| "Rate table missing" | Can't calculate cost | Upload rate table for plan |
| "Network timeout" | Request took too long | Reload page, try again |
| "Payment required" | Out of credits | Add credits via billing |
| "Forbidden: Admin access required" | Only admin can do this | Ask admin or request role change |
| "Conflict: Record modified" | Someone else edited it | Reload to get latest version |

---

## SYSTEM LIMITS & CONSTRAINTS

### Data Limits

| Item | Limit | Impact |
|------|-------|--------|
| Census file size | 10 MB | Max ~5,000 members per upload |
| Members per case | 10,000 | Split large employers into multiple cases |
| Quote scenarios per case | Unlimited | But performance degrades > 50 scenarios |
| Proposals per case | Unlimited | Only affects document storage |
| Documents per case | 500 | Storage not unlimited |
| Plans per scenario | 20 | Don't create overly complex scenarios |
| Cases per admin | Unlimited | But performance affects if > 10,000 |

### Performance Thresholds

| Operation | Limit | Time |
|-----------|-------|------|
| Load cases page | 500 cases | ~2 seconds |
| Load census members | 1000 members | ~3 seconds |
| Recalculate scenario | 5000 members | ~5 seconds |
| Bulk assign cases | 500 cases | ~30 seconds |
| Export to CSV | 5000 records | ~10 seconds |
| Generate PDF proposal | — | ~10 seconds |

### Concurrent Users

- Maximum 100 concurrent users per organization
- If exceeded: Users receive "System at capacity" message
- Retry after 5 minutes

---

## WHEN TO CONTACT SUPPORT

**Contact support if:**
- Issue persists after 15 minutes of troubleshooting
- Error message doesn't match any in reference
- Feature not working as documented
- Data appears corrupted
- System performance very slow (> 30 sec per operation)
- Receiving recurring error on multiple pages

**DO NOT contact support for:**
- Permission requests (contact admin)
- Feature requests (submit via feature request form)
- General "how to" questions (search help center first)
- Billing inquiries (contact sales team)

**Support Contact:**
- Email: support@connectquote360.com
- Response time: 2-4 hours (business hours)
- Emergency: Call +1-888-QUOTE-360 (enterprise customers)

---

End of Troubleshooting Guide