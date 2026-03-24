// Case-related utilities
export const getCaseColumns = () => [
  { key: "employer_name", label: "Employer", visible: true },
  { key: "case_type", label: "Type", visible: true },
  { key: "stage", label: "Stage", visible: true },
  { key: "priority", label: "Priority", visible: true },
  { key: "assigned_to", label: "Assigned", visible: true },
  { key: "employee_count", label: "Employees", visible: false },
  { key: "effective_date", label: "Effective Date", visible: false },
  { key: "target_close_date", label: "Target Close", visible: false },
  { key: "quote_count", label: "Quotes", visible: false },
  { key: "task_count", label: "Tasks", visible: false },
];

export const filterByDateRange = (cases, dateFilter, type = "effective") => {
  if (!dateFilter || !dateFilter.start) return cases;
  return cases.filter(c => {
    const fieldDate = new Date(c[`${type}_date`]);
    return fieldDate >= dateFilter.start && fieldDate <= dateFilter.end;
  });
};

export const filterByLastActivity = (cases, activityFilter) => {
  if (activityFilter === "all") return cases;
  const now = new Date();
  const days = { "7d": 7, "14d": 14, "30d": 30 }[activityFilter] || 0;
  
  if (activityFilter === "none") {
    return cases.filter(c => !c.last_activity_date || (now - new Date(c.last_activity_date)) / 86400000 > 30);
  }
  
  const cutoff = new Date(now.getTime() - days * 86400000);
  return cases.filter(c => c.last_activity_date && new Date(c.last_activity_date) >= cutoff);
};

export const filterByEmployeeCount = (cases, employeeFilter) => {
  if (!employeeFilter) return cases;
  return cases.filter(c => {
    const count = c.employee_count || 0;
    return count >= employeeFilter.min && count <= employeeFilter.max;
  });
};

export const exportCasesToPDF = async (cases, format = "summary") => {
  // Placeholder: integrate with jsPDF library
  console.log("Exporting", cases.length, "cases as PDF:", format);
};

export const emailBulkCases = async (caseIds, recipientEmail, template = "summary") => {
  // Placeholder: integrate with email backend function
  console.log("Emailing cases", caseIds, "to", recipientEmail);
};

export const cloneCase = async (caseId, newEmployerName) => {
  // Placeholder: clone case logic
  console.log("Cloning case", caseId, "for", newEmployerName);
};