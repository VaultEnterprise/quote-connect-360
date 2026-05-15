# Census Management - Quick Start Guide

## Phase 3 Features Overview

### 🎯 What Users Can Do Now

#### 1. **Import Census with Data Quality Insights**
```
Steps:
1. Census page → Select a case
2. Click "Upload Census"
3. Upload CSV file
4. Auto-map fields (or load saved template)
5. System shows:
   - Salary outliers ($1M vs $75K avg)
   - Age anomalies (18 yo when avg is 45)
   - Duplicate names (5 "John Smith" entries)
   - Missing critical data (email 70% complete)
6. Review, then import
```

**Result:** Members imported with validation status visible in member table

---

#### 2. **View & Edit Member Details**
```
Steps:
1. Open Census → Select case → View Members
2. Click any member row (or View icon)
3. Drawer opens showing:
   ✓ All member info (name, email, salary, DOB)
   ✓ Validation issues (with severity: error/warning)
   ✓ GradientAI health risk profile
4. Click "Edit" to modify fields
5. Save changes → Database updates instantly
```

**Result:** Typos corrected, data quality improved without re-importing

---

#### 3. **Save & Reuse Mapping Templates**
```
First Upload (Acme Corp):
1. Upload CSV → Map fields manually → "Compliance Code" = "Class Code", etc.
2. Click "Save Mapping Profile"
3. Enter name: "Acme Corp Standard"
4. ✓ Profile saved locally

Next Upload (Acme Corp):
1. Upload new CSV file
2. In mapping step, see "Saved Profiles"
3. Click "Load" on "Acme Corp Standard"
4. ✓ All fields auto-mapped in 1 click!
5. Proceed to validation
```

**Result:** Save 5+ minutes per upload (especially for recurring clients)

---

#### 4. **Compare Census Versions**
```
Steps:
1. Census page → Select case
2. Click "Compare Versions" (appears if 2+ versions)
3. Click on first version (v1)
4. Click on second version (v2)
5. Dialog shows:
   ┌─ Members: 450 → 475 (+25 net)
   ├─ Added: 50 new hires
   ├─ Removed: 25 departures
   ├─ Retention: 94%
   ├─ Turnover: 6%
   └─ Avg Age: 42 → 41
6. View added/removed member lists
```

**Result:** Understand workforce changes quarter-over-quarter

---

### 📊 Data Quality Insights Explained

| Issue | What It Means | Action |
|-------|---------------|--------|
| **Salary Outlier** | Someone paid 2x+ average | Review for data entry errors |
| **Age Anomaly** | Age <20 or >70 | May be correct (interns, late-career) |
| **Duplicate Names** | Multiple "John Smith" | Verify they're different people |
| **Missing Email** | Email field <95% complete | Consider making it required |
| **Invalid Dates** | DOB format unrecognized | Check date format in mapping |

---

### 🛠️ Common Workflows

#### Workflow 1: Correcting Typos (Post-Import)
```
Manager: "I found 3 email typos in the census"

Broker Action:
1. Open Census page
2. Select case → View Members
3. Search for incorrect name
4. Click member row → Detail drawer opens
5. Click "Edit" → Correct email
6. Click "Save Changes"
✓ Corrected instantly, no re-import needed
```

#### Workflow 2: Monthly Recurring Import
```
Acme Corp sends new census every month on 1st

Broker:
Month 1:
- Upload file → Manually map 15 fields → Save as "Acme Monthly"

Months 2-12:
- Upload new file → Load "Acme Monthly" template
- All 15 fields auto-mapped → Validate → Import
- Saves ~5 min per month = 55 min/year ✓

Result: 11 months of quick imports saved!
```

#### Workflow 3: Analyzing Workforce Changes
```
CFO: "Show me who left and who joined Q1"

Broker:
1. Open Census → Select Acme Corp
2. Click "Compare Versions"
3. Select Q1 Start census (v1) and Q1 End census (v2)
4. See:
   - 450 → 475 employees
   - 50 new hires
   - 25 departures
   - 94% retention
5. Export for CFO presentation ✓
```

#### Workflow 4: Spotting Data Quality Issues
```
System: "Data Quality Check"
┌─ 5 salary outliers detected
├─ CEO: $3M (avg: $150K)
├─ Intern: $5K (avg: $150K)
├─ 3 age anomalies
└─ Email field 92% complete

Broker Action:
1. Review flagged members in member table
2. Click each to verify (real or data error?)
3. If error → Edit and fix
4. If real → Import as-is with note
```

---

### ✅ Best Practices

1. **Save Templates Early**
   - First import from a company? Save the mapping
   - Reuse saves time on subsequent imports

2. **Check Data Quality Before Import**
   - Review insights on validation step
   - Fix outliers if they're data errors
   - Proceed if they're legitimate

3. **Use Version Comparison**
   - Compare each quarterly census
   - Understand turnover/retention trends
   - Spot anomalies in retention rate

4. **Edit Members Post-Import**
   - Found typo after import? Just click and edit
   - Don't re-upload entire census
   - Changes sync immediately

5. **Document Issues**
   - Add notes when uploading (visible in history)
   - Helps team understand data context

---

### 🔍 Data Quality Insights: Deep Dive

#### What Gets Calculated?

**Financial Metrics:**
- Min/Max/Avg salary
- Salary outliers (>50% deviation from mean)
- Salary distribution shape

**Demographic Metrics:**
- Min/Max/Avg age
- Age outliers (<20 or >70)
- Workforce aging trend

**Completeness:**
- % of employees with email
- % with phone
- % with full address
- Rankings of fields by completeness

**Duplication:**
- Duplicate first+last names
- Likely data quality issues

#### Example Output:
```
Data Quality Insights
┌─ Annual Salary
│  ├─ Min: $25,000
│  ├─ Avg: $75,000
│  ├─ Max: $850,000
│  └─ ⚠️ 2 outliers detected (>50% deviation)
├─ Age Demographics
│  ├─ Min: 22
│  ├─ Avg: 42
│  ├─ Max: 67
│  └─ ⚠️ 3 unusual ages detected
├─ Field Completeness
│  ├─ First Name: 100% ✓
│  ├─ Email: 92% (38 missing)
│  └─ Phone: 65% (158 missing)
└─ Potential Issues
   └─ 5 duplicate names detected
```

---

### 📞 Support Scenarios

**Q: "I saved a mapping template but it disappeared"**
A: Templates are stored in browser storage. If you:
- Cleared browser cache → Gone
- Use different browser/computer → Not visible
- Solution: Re-save templates or use cloud sync (future feature)

**Q: "Why can't I rollback to a prior census?"**
A: Coming in Phase 3.1! For now, versions are read-only. Plan ahead with notes.

**Q: "Can I bulk-edit all salaries (increase by 3%)?"**
A: Coming in Phase 3.3! For now, edit individually via member drawer.

**Q: "Why does the comparison show John Smith as added and removed?"**
A: System matches by email first, then first+last name. If John Smith has no email, it might match differently in each version.

---

### 🎯 Key Metrics to Track

For **census quality**:
- % fields complete by version
- # validation errors
- # duplicate detections
- Avg member edit count post-import

For **version changes**:
- Turnover rate per quarter
- Retention rate trends
- Workforce age trend
- New hire + departure counts

---

### 🚀 Future Enhancements (Planned)

- **Export Census as CSV** - Download validated census for compliance
- **Rollback Version** - Revert case to prior census state
- **Bulk Edit** - Correct multiple members at once
- **Cloud-Sync Templates** - Access templates across devices
- **Audit Trail** - Log all member edits with user/timestamp
- **Smart Mapping** - AI suggests field mapping based on file structure
- **Scheduled Syncs** - Auto-import census from HRIS (Google Sheets, etc.)

---

### 📚 Component Reference

| Component | Purpose | Where |
|-----------|---------|-------|
| **MemberDetailDrawer** | View/edit individual members | Member table (click row) |
| **DataQualityInsights** | Show outliers, anomalies, completeness | Import validation step |
| **CensusVersionComparison** | Compare two versions | Import history (click "Compare") |
| **MappingProfileManager** | Save/load field mappings | Import mapping step |
| **CensusMemberTable** | List all members with validation status | Census page member view |

---

### 🎓 Training Checklist

For new census brokers, cover:
- [ ] How to upload a census file
- [ ] Understanding data quality insights
- [ ] Saving and reusing mapping templates
- [ ] Viewing and editing member details
- [ ] Comparing census versions
- [ ] Understanding validation status icons
- [ ] When to contact support (Phase 3.1+ features)

---

**Last Updated:** March 21, 2026  
**Version:** Phase 3 (Full Polish)  
**Status:** Production Ready ✓