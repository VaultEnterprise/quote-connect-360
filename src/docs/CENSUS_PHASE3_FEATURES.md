# Census Management Phase 3: Polish & Enterprise Features

## Overview
Phase 3 implements **data quality insights**, **member-level fixes**, and **mapping templates** for production-grade census management.

---

## Feature Breakdown

### 1. **Member Detail Drawer** (`MemberDetailDrawer.jsx`)
**Purpose:** Click any member in the table to view/edit full details

#### Capabilities:
- **View Mode:** Display all member data + GradientAI risk profile
- **Edit Mode:** Inline editing for:
  - First/Last Name, DOB, Email, Phone
  - Annual Salary, Employment Status, Coverage Tier
  - Auto-saves to database on submit
- **Validation Summary:** Shows all validation issues with icons (error/warning)
- **Risk Profile:** Display GradientAI risk tier, score, predicted claims
- **Revert:** Cancel button restores original values

#### Integration:
```jsx
<MemberDetailDrawer
  member={selectedMember}
  open={drawerOpen}
  onOpenChange={setDrawerOpen}
  onMemberUpdate={handleMemberUpdate}
/>
```

#### UX Flow:
1. User clicks member row or "View" icon
2. Drawer slides from right
3. Shows all fields + validation issues
4. User clicks "Edit" to enter edit mode
5. User modifies fields and clicks "Save Changes"
6. Member record updates, re-fetches data

---

### 2. **Data Quality Insights** (`DataQualityInsights.jsx`)
**Purpose:** Surface statistical anomalies + data completeness alerts

#### Insights Calculated:
| Insight | Logic | Action |
|---------|-------|--------|
| **Salary Outliers** | >50% deviation from mean | Alert user to review |
| **Age Anomalies** | <20 or >70 years | Flag unusual demographics |
| **Duplicate Names** | Same first+last name | Show count, allow skip on import |
| **Missing Critical Fields** | first_name, last_name, email, dob | Error badge |
| **Field Completeness** | Percentage of non-null values | Sortable ranking |

#### Display:
- Appears in validation step of import modal
- Shows max 3 worst-case issues, links to all
- Color-coded: 🔴 error, 🟡 warning
- Prevents import if critical fields missing

#### Example Output:
```
⚠️ Data Quality Insights
┌─ 2 salary outliers (>50% deviation)
├─ Salary range: $25,000 - $850,000 (avg: $75,000)
├─ 3 unusual ages detected (<20 or >70)
├─ Age distribution: 22-67 (avg: 42)
└─ 5 potential duplicate names
```

---

### 3. **Census Version Comparison** (`CensusVersionComparison.jsx`)
**Purpose:** Side-by-side census version analysis

#### Comparison Metrics:
| Metric | Shows |
|--------|-------|
| **Member Count** | Previous vs Current total |
| **Added Members** | New members (with details) |
| **Removed Members** | Departed members (with details) |
| **Retention Rate** | % of members retained |
| **Turnover Rate** | % of members who left |
| **Avg Age Shift** | Previous avg age vs new avg age |

#### How to Use:
1. Go to Census page, select case
2. Click "Compare Versions" button on Import History
3. Click two versions to select them
4. Dialog opens showing detailed comparison
5. View added/removed member lists
6. See retention and demographic trends

#### Example Comparison:
```
Previous Total: 450 members
├─ Added:        +75 members (⬆️)
├─ Removed:      -25 members (⬇️)
├─ Retention:    94% ✓
├─ Turnover:     6%
└─ Avg Age:      42 → 41 (younger cohort)
```

---

### 4. **Enhanced Mapping Templates** (Improved `MappingProfileManager.jsx`)
**Purpose:** Save & reuse field mappings across organizations

#### Features:
- **Save Current Mapping:** After mapping fields, click "Save Mapping Profile"
- **Named Profiles:** e.g., "Acme Corp Standard", "Tech Startup Format"
- **One-Click Load:** Click "Load" to instantly apply saved mapping
- **Smart Display:** Shows # fields mapped + save date
- **Quick Delete:** Hover to show delete button

#### Use Cases:
```
Scenario: Acme Corp uploads census quarterly
Step 1: First upload → Map fields manually
Step 2: Click "Save Mapping Profile" → Save as "Acme Corp Standard"
Step 3: Next quarter → Upload new file → Click "Load" on profile
Step 4: All fields auto-mapped, skip to validation!
```

#### Data Storage:
Templates stored in **localStorage** (browser-based, per-workspace)
```javascript
// Example profile structure
{
  name: "Acme Corp Standard",
  savedAt: "2026-03-21T10:30:00Z",
  mapping: {
    first_name: "First Name",
    last_name: "Last Name",
    date_of_birth: "DOB",
    email: "Email Address",
    annual_salary: "Compensation",
    // ... additional fields
  }
}
```

---

### 5. **Enhanced Member Table**
**Improvements to `CensusMemberTable.jsx`:**

#### New Features:
1. **Clickable Rows:** Click any member to open detail drawer
2. **View Icon:** Right column with eye icon for quick access
3. **Hover State:** Rows highlight on hover
4. **Status Icons:** Visual validation status (✓ valid, ⚠️ warning, ✗ error)
5. **Issue Count:** Shows number of validation issues per member

#### Usage:
```
Member Row UI:
[Name]            [DOB]      [Employment]  [Coverage]  [Status]        [View ▾]
John Smith        1985-03-15 Active/FT    Family     ⚠️ 1 warning    [👁]
jane@acme.com
```

---

## Integration Points

### Census Upload Flow
```
Step 1: Upload File
  ↓
Step 2: Auto-Map Fields (use template if available)
  ↓
Step 3: Validate Rows
  ↓
Step 4: Show Validation Summary + Data Quality Insights
  ↓
Step 5: Review Duplicates + Transform Preview
  ↓
Step 6: Import
```

### Member Management Flow
```
View Census Members
  ↓
Click Member Row or View Icon
  ↓
Member Detail Drawer Opens
  ├─ Show validation issues
  ├─ Show GradientAI risk data
  ├─ Allow inline edits
  └─ Save to database
```

### Version Management Flow
```
View Import History
  ↓
Click "Compare Versions"
  ↓
Select Two Versions
  ↓
See Comparison Dialog
  ├─ Member count change
  ├─ Added/removed member lists
  ├─ Retention metrics
  └─ Demographic shifts
```

---

## Component Hierarchy
```
Census (page)
├── CensusVersionHistory
│   ├── Version Cards (clickable for comparison)
│   └── CensusVersionComparison (dialog)
├── RiskDashboard
├── GradientAIAnalysisPanel
└── CensusMemberTable
    ├── Search + Status Filter
    ├── Member Rows (clickable)
    └── MemberDetailDrawer (modal)

CensusUploadModal
├── Step 1: Upload (drag-drop)
├── Step 2: Mapping
│   └── MappingProfileManager (save/load templates)
├── Step 3: Validate
│   ├── CensusQualityDashboard (field completeness)
│   ├── DataQualityInsights (outliers, anomalies)
│   ├── DuplicateDetectionPanel
│   └── ErrorDetailPanel
└── Step 4: Done
```

---

## Production Readiness Checklist

- [x] Member detail drawer with edit capability
- [x] Inline field editing with auto-save
- [x] Data quality insights (outliers, demographics, completeness)
- [x] Census version comparison with retention metrics
- [x] Mapping template save/load (localStorage)
- [x] Enhanced member table with click-to-view
- [x] Validation issue display in drawer
- [x] GradientAI risk profile display in member details
- [x] Duplicate detection pre-import
- [x] Transform preview before commit
- [ ] Export census as CSV (Phase 3.1)
- [ ] Rollback version to prior census (Phase 3.2)
- [ ] Bulk member edit tools (Phase 3.3)

---

## Usage Examples

### Example 1: Correcting Census Data
```
User: "I found typos in 5 employee emails"
Action:
1. Open Census page → Select case
2. Click on member row → Detail drawer opens
3. Click "Edit" button
4. Correct email field
5. Click "Save Changes" → Database updates ✓
6. Dashboard refreshes member data
```

### Example 2: Reusing Mapping Template
```
User: "We get the same format every month from Acme Corp"
Action:
1. First month: Upload file → Auto-map fields → Save as "Acme Corp Standard"
2. Next month: Upload new file → Click "Load" on profile
3. All fields auto-mapped → Proceed to validation (saves 2 min!)
```

### Example 3: Detecting Anomalies
```
System identifies:
- Salary outlier: $1.2M (avg $75K)
- Age anomaly: 3 employees age 18 (unusual for firm)
- Duplicate names: 5 "John Smith" entries
- Missing data: Email field 70% complete

User action: Review outliers, skip duplicates on import, proceed
```

### Example 4: Comparing Quarterly Census
```
User: "Show me who left and who joined this quarter"
Action:
1. Open Census → Select case → Click "Compare Versions"
2. Select v3 (Q1) and v4 (Q2)
3. Dialog shows:
   - 450 → 475 members (+25 net)
   - 50 new hires, 25 departures
   - 94% retention rate
   - Avg age 42 → 41 (younger)
```

---

## API Reference

### MemberDetailDrawer Props
```typescript
{
  member: CensusMember;        // Current member object
  open: boolean;               // Dialog visibility
  onOpenChange: (open: boolean) => void;
  onMemberUpdate?: () => void; // Called after save (to refetch)
}
```

### DataQualityInsights Props
```typescript
{
  fieldStats: FieldStats;      // From analyzeDataQuality()
  rows: any[];                 // Raw CSV rows
}
```

### CensusVersionComparison Props
```typescript
{
  version1Id: string;
  version2Id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### MappingProfileManager Props
```typescript
{
  mapping: Record<string, string>;     // Current field mapping
  headers: string[];                   // CSV headers
  onLoadProfile: (mapping) => void;   // Called when loading template
}
```

---

## Performance Notes

- **Member Detail Drawer:** Renders on-demand (lazy load of GradientAI data)
- **Version Comparison:** Fetches both versions in parallel via React Query
- **Data Quality Insights:** Calculated in real-time during validation step
- **Mapping Templates:** Stored locally, no backend calls

---

## Future Enhancements (Phase 3.1+)

1. **Export Census as CSV** - Download validated census with all corrections
2. **Rollback to Prior Version** - Revert case to earlier census state
3. **Bulk Edit Tools** - Correct multiple members at once (salary increase, status change)
4. **Audit Trail** - Track all member edits with timestamps
5. **Smart Templates** - AI-suggest mapping based on file structure
6. **Census Import History** - Full log of all imports with user, timestamp, changes
7. **Dependent Data** - Extend member details to manage family members
8. **Scheduled Syncs** - Auto-import census from HRIS on schedule (via GSheet)

---

## Testing Notes

### Unit Tests
- Data quality insight calculations (outlier detection, age ranges)
- Mapping template save/load/delete
- Version comparison logic (added/removed/retained member calculation)

### Integration Tests
- Member detail drawer edit → Save → Database update → Re-fetch ✓
- Upload file → Show insights → Import → Member appears with status ✓
- Compare versions → Show proper retention metrics ✓

### E2E Tests
- Full census import workflow with outlier detection and correction
- Template save and reuse across multiple uploads
- Version comparison with proper member attribution

---

## Notes for Developers

- **MemberDetailDrawer** uses Sheet component (right-side drawer from Radix UI)
- **Mapping templates** use browser localStorage (add cloud sync in Phase 4 if needed)
- **Version comparison** uses email + name combo as unique identifier
- **Data quality insights** run during validation step, not on view
- All components follow existing design system (colors, spacing, typography)