import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Map all targets with basic help content
    // Generate content for UI components based on their type and context
    const generateComponentHelp = (target) => {
      const { target_code, target_label, target_type, module_code, page_code, section_code } = target;
      
      // Generic help templates by component type
      const typeTemplates = {
        'page': (label) => ({ 
          short: `${label}`,
          detailed: `# ${label}\n\nThis page provides access to ${label.toLowerCase()} functionality.`
        }),
        'card': (label) => ({ 
          short: `${label} - Information card`,
          detailed: `# ${label}\n\nThis card displays ${label.toLowerCase()} information. Click to view or interact with this data.`
        }),
        'button': (label) => ({ 
          short: `${label} - Action button`,
          detailed: `# ${label}\n\nClick this button to ${label.toLowerCase().replace(' button', '').toLowerCase()}.`
        }),
        'filter': (label) => ({ 
          short: `${label} - Filter control`,
          detailed: `# ${label}\n\nUse this filter to narrow results by ${label.toLowerCase().replace(' filter', '')}.`
        }),
        'section': (label) => ({ 
          short: `${label} - Content section`,
          detailed: `# ${label}\n\nThis section contains ${label.toLowerCase()} information and controls.`
        }),
        'tab': (label) => ({ 
          short: `${label} - Tab navigation`,
          detailed: `# ${label}\n\nClick this tab to view ${label.toLowerCase()} content.`
        }),
        'status': (label) => ({ 
          short: `${label} - Status indicator`,
          detailed: `# ${label}\n\nThis status represents ${label.toLowerCase()}.`
        }),
        'field': (label) => ({ 
          short: `${label} - Data field`,
          detailed: `# ${label}\n\nThis field displays ${label.toLowerCase()}.`
        }),
        'badge': (label) => ({ 
          short: `${label} - Status badge`,
          detailed: `# ${label}\n\nThis badge indicates ${label.toLowerCase()}.`
        }),
        'action': (label) => ({ 
          short: `${label} - Action item`,
          detailed: `# ${label}\n\nUse this to ${label.toLowerCase().replace(' action', '')}.`
        }),
        'toggle': (label) => ({ 
          short: `${label} - Toggle switch`,
          detailed: `# ${label}\n\nToggle this to enable or disable ${label.toLowerCase().replace(' flag', '')}.`
        }),
        'grid': (label) => ({ 
          short: `${label} - Data grid`,
          detailed: `# ${label}\n\nThis table displays ${label.toLowerCase()}.`
        }),
        'workflow_step': (label) => ({ 
          short: `${label} - Workflow stage`,
          detailed: `# ${label}\n\nThis represents the ${label.toLowerCase()} stage in the workflow.`
        }),
        'select_option': (label) => ({ 
          short: `${label} - Selection option`,
          detailed: `# ${label}\n\nSelect this option for ${label.toLowerCase()}.`
        }),
        'radio_option': (label) => ({ 
          short: `${label} - Radio selection`,
          detailed: `# ${label}\n\nChoose this option for ${label.toLowerCase()}.`
        }),
      };
      
      const template = typeTemplates[target_type] || typeTemplates['section'];
      const help = template(target_label);
      
      return {
        short_help_text: help.short,
        detailed_help_text: help.detailed,
        feature_capabilities_text: `${target_label} (${target_type})`,
        process_meaning_text: `Part of ${page_code} page in ${module_code} module`,
        expected_user_action_text: `Interact with this ${target_type} as needed`,
        examples_text: `See the ${module_code} module documentation for examples`,
        search_keywords: `${target_label}, ${target_type}, ${module_code}, ${page_code}`.toLowerCase()
      };
    };

    // Sample help content for each page (from manual)
    const helpContentMap = {
      'cases': {
        short_help: 'Central dashboard for managing benefit cases from initial contact through closure.',
        detailed: '# Cases Management\n\nThe Cases page serves as the central dashboard for managing benefit cases, providing tools to view, search, and perform bulk operations on employer records.\n\n## Key Features:\n- **Case Pipeline View**: Visual representation of cases by stage\n- **List View**: Detailed table of all cases with filtering\n- **Bulk Actions**: Assign, change stage, or update priority for multiple cases\n- **Case Metrics**: View KPIs including pending cases, overdue tasks, and enrollment status\n\n## Navigation:\n- Click case name to open detailed view\n- Use filters to narrow results by stage, priority, or assigned user\n- Export data to CSV for external reporting',
        feature_capabilities: 'Create cases, assign to brokers, track stage progression, manage priorities, bulk update multiple cases, export data',
        process_meaning: 'Cases represent benefit engagements with employers, tracking from initial contact through plan implementation and renewal.',
        expected_user_action: 'View assigned cases, update status, create new cases, assign to team members',
        examples: 'Create new case for ABC Corp, filter by "ready_for_quote" stage, bulk assign high-priority cases',
      },
      'census': {
        short_help: 'Manage employee census files with validation, risk analysis, and member editing capabilities.',
        detailed: '# Census Management\n\nAdvanced census file management with validation, member editing, risk analysis, and version control.\n\n## Upload Process:\n1. Click "Upload Census" button\n2. Drag and drop or select CSV/Excel file (max 10MB, 5000 members)\n3. Map columns to required fields\n4. System performs automatic validation\n5. Review errors and warnings\n\n## Validation Rules:\n- Duplicate SSN/Email detection\n- Age range validation (16-100)\n- Date format checking\n- Required field verification\n\n## Member Management:\n- Edit individual records inline\n- View GradientAI risk scores per member\n- Filter by risk tier, eligibility, or status\n- Compare census versions\n\n## Risk Analysis:\n- Automatic GradientAI risk scoring\n- Risk tier breakdown (Preferred/Standard/Elevated/High)\n- Top 10 high-risk members identified\n- Claim prediction estimates',
        feature_capabilities: 'Upload and validate census files, analyze member risk profiles, compare versions, export data, manage individual records',
        process_meaning: 'Census data forms the foundation for rating and enrollment; accuracy is critical for plan implementation.',
        expected_user_action: 'Upload employee list, validate data quality, review risk analysis, correct errors, advance to quoting stage',
        examples: 'Upload monthly census update, review 3 high-risk employees, download member report with risk scores',
      },
      'quotes': {
        short_help: 'Build and compare benefit plan scenarios with rates, contributions, and cost modeling.',
        detailed: '# Quotes Module\n\nQuote scenario building with plan selection, rate loading, cost calculation, and comparison.\n\n## Scenario Creation:\n1. Click "Create Scenario"\n2. Select plans from plan library\n3. Choose contribution strategy (percentage, flat dollar, or defined contribution)\n4. Set effective date\n5. System calculates monthly costs\n\n## Contribution Strategies:\n- **Percentage**: Employer pays 80% of EE, 50% of dependents\n- **Flat Dollar**: Employer pays fixed amount per employee\n- **Defined Contribution**: Fixed budget per employee\n\n## Cost Breakdown:\n- Total monthly premium (all plans combined)\n- Employer monthly cost\n- Employee costs by coverage tier (EE, ES, EC, Family)\n- Per-member costs\n\n## Comparison Tools:\n- Compare up to 5 scenarios side-by-side\n- PolicyMatch AI recommends optimal scenario\n- View per-member cost details\n- Export scenarios as PDF',
        feature_capabilities: 'Create quote scenarios, load plans with rates, calculate costs, model contributions, compare scenarios, create proposals',
        process_meaning: 'Quotes demonstrate plan options and costs to employers for benefit selection and budgeting.',
        expected_user_action: 'Create 2-3 scenarios with different plan mixes, set employer contribution levels, compare costs, select for proposal',
        examples: 'Build scenario with PPO medical + dental, set 80% employer contribution, compare with HDHP option',
      },
      'proposals': {
        short_help: 'Create formal benefit proposals, track engagement, and manage employer approvals.',
        detailed: '# Proposals Module\n\nFormal benefit proposal creation, tracking, and engagement monitoring.\n\n## Proposal Generation:\n1. Select quote scenario\n2. Write cover message\n3. System generates PDF with:\n   - Cover page with broker info\n   - Executive summary (costs, coverage)\n   - Plan details and benefits\n   - SBC (Summary of Benefits and Coverage)\n   - Provider networks\n   - Contribution breakdown\n\n## Tracking Features:\n- Email delivery tracking\n- Portal view tracking (when opened, how long)\n- Employer approval timestamps\n- Multiple versions (if revisions needed)\n\n## Engagement Metrics:\n- Date sent\n- Date first viewed\n- Number of views\n- Time to decision\n- Approval status\n\n## Actions:\n- Send reminder email\n- Create new version\n- Mark as approved (admin)\n- Archive or export',
        feature_capabilities: 'Generate proposal PDFs, send to employers, track opens and views, capture approvals, manage multiple versions',
        process_meaning: 'Proposals formalize the benefit recommendation and enable employer decision-making.',
        expected_user_action: 'Generate proposal from scenario, send to employer email, follow up if not viewed, record approval',
        examples: 'Create proposal from scenario, send to CFO, track when opened, send reminder after 3 days',
      },
      'enrollment': {
        short_help: 'Create and manage employee enrollment windows with participation tracking.',
        detailed: '# Enrollment Windows\n\nManage the employee benefit election process with window creation, invitations, and completion tracking.\n\n## Window Creation:\n1. Define enrollment dates (start and end)\n2. Set effective date (when benefits begin)\n3. System creates unique URLs for each employee\n4. Optional: Enable DocuSign for document signing\n\n## Participation Tracking:\n- Total eligible employees\n- Invited count\n- Completed enrollments\n- Waivers\n- Pending responses\n- Participation rate %\n\n## Employee Experience:\n- View available plans\n- Compare plans side-by-side\n- Select coverage tier\n- Choose specific plans\n- Add dependent information\n- Sign documents electronically\n\n## Reminders:\n- Automated email reminders (1 week before close)\n- Broker can see pending list\n- Optional: Lock coverage for non-respondents\n\n## Finalization:\n- Lock enrollment window\n- Generate enrollment report\n- Create carrier files\n- Archive signed documents',
        feature_capabilities: 'Create enrollment windows, send employee invitations, track participation, manage plan selections, sign documents',
        process_meaning: 'Enrollment is where employees elect their benefit coverage and confirm selections.',
        expected_user_action: 'Create window with dates, send invitations, monitor participation, follow up on pending, finalize results',
        examples: 'Open 30-day window on Jan 15, track 65% completion rate, send reminder after 10 days, finalize on Feb 15',
      },
      'renewals': {
        short_help: 'Forecast, market, and execute annual renewal cycles with rate comparison.',
        detailed: '# Renewals Management\n\nManage the annual renewal process from rate review through decision and implementation.\n\n## Renewal Workflow:\n1. System identifies approaching renewal dates (90 days before)\n2. Broker reviews current rates and recommendations\n3. Optionally market with competing carriers\n4. Prepare renewal options\n5. Present to employer for decision\n6. Implement chosen option\n\n## Key Metrics:\n- Current premium vs. renewal premium\n- Rate change percentage\n- Disruption score (impact of plan changes)\n- Claims experience\n- Renewal recommendation (renew, market, or terminate)\n\n## Renewal Options:\n- Renew with same plans\n- Renew with plan changes\n- Market (solicit new bids)\n- Terminate (non-renewal)\n\n## Calendar View:\n- Visual representation of upcoming renewals\n- Filter by month or status\n- Track in parallel (multiple employers)\n\n## Outputs:\n- Rate comparison worksheets\n- Renewal proposal documents\n- Enrollment reconciliation\n- Carrier setup files',
        feature_capabilities: 'Track renewal dates, review rates, create renewal proposals, compare options, execute renewals',
        process_meaning: 'Renewals manage the annual transition to new plan years, ensuring continuous coverage.',
        expected_user_action: 'Review renewal rates, prepare comparison, present options to employer, execute decision',
        examples: 'Review 3.5% rate increase on Medical, market with 2 alternatives, present to employer by month-end',
      },
      'employee-portal': {
        short_help: 'Self-service benefits enrollment and management for employees.',
        detailed: '# Employee Portal\n\nProvides employees with a self-service interface to enroll in benefits and manage their elections.\n\n## Portal Features:\n- **Enrollment Wizard**: Multi-step plan selection process\n- **Plan Comparison**: Side-by-side plan comparison tool\n- **Coverage Selection**: Choose employee only, spouse, children, or family\n- **Dependent Management**: Add dependent information\n- **Document Signing**: Electronic signature integration (DocuSign)\n- **Benefit Summary**: View elected coverage and costs\n\n## Employee Workflow:\n1. Access via secure enrollment link\n2. Review available plans\n3. Compare plan options\n4. Select coverage tier\n5. Choose specific plans\n6. Confirm dependents and costs\n7. Sign enrollment documents\n8. Submit elections\n\n## Life Events:\n- Support mid-year changes (marriage, birth, etc.)\n- Waiver options if declining coverage\n- Timely notice requirements\n\n## Access Control:\n- Token-based authentication\n- Session timeout for security\n- Unique URLs per employee',
        feature_capabilities: 'Self-service enrollment, plan comparison, dependent management, document signing, election confirmation',
        process_meaning: 'Employee portal enables individual benefit elections without HR intervention.',
        expected_user_action: 'Employee accesses portal link, reviews plans, selects coverage, signs documents, submits choices',
        examples: 'Employee logs in during open enrollment, compares PPO vs HDHP medical plans, selects family coverage',
      },
      'employer-portal': {
        short_help: 'Employer-facing dashboard for case status, proposals, and enrollment monitoring.',
        detailed: '# Employer Portal\n\nProvides employers with visibility into their benefit case and decision-making tools.\n\n## Portal Sections:\n- **Case Status**: Current stage and progress\n- **Proposal Review**: View and approve proposals\n- **Enrollment Monitoring**: Track employee participation\n- **Document Center**: Access all relevant documents\n- **Communication**: Q&A forum with broker\n\n## Key Functions:\n- Review proposal details\n- Download plan documents (SBC, networks)\n- Monitor enrollment progress in real-time\n- Submit questions to broker\n- Approve or reject proposals\n- Access implementation timeline\n\n## Document Access:\n- Proposals\n- Plan comparison worksheets\n- Summary of Benefits and Coverage (SBC)\n- Provider network lists\n- Enrollment forms\n- Implementation guides',
        feature_capabilities: 'Proposal review and approval, enrollment monitoring, document access, Q&A with broker',
        process_meaning: 'Employer portal provides transparency and engagement in the benefits decision process.',
        expected_user_action: 'Review proposal, access plan documents, monitor employee enrollment, submit questions',
        examples: 'Employer reviews proposal, downloads SBC documents, monitors enrollment at 60% completion',
      },
      'plans': {
        short_help: 'Manage the plan library with plan details, rates, and comparison tools.',
        detailed: '# Plan Library\n\nCentralized repository of available benefit plans with searchable database and comparison tools.\n\n## Plan Information:\n- Plan name and code\n- Carrier\n- Plan type (Medical, Dental, Vision, Life, STD, LTD)\n- Network type (HMO, PPO, HDHP, POS)\n- Coverage details:\n  - Deductibles (individual, family)\n  - Out-of-pocket maximums\n  - Copays\n  - Coinsurance\n  - RX coverage\n- Effective dates\n- Status (active, archived)\n\n## Rate Tables:\n- Age-banded rates (by age range)\n- Composite rates (single rate)\n- Coverage tier rates (EE, ES, EC, Family)\n- Modifiers (location, gender, health)\n\n## Functionality:\n- Search by carrier, type, or plan name\n- Filter by state and effective date\n- Compare plans side-by-side\n- View rate tables\n- Archive old plans\n- Import plans from carriers\n- Export for external use',
        feature_capabilities: 'Search and filter plans, view plan details, compare benefits, manage rates, archive plans',
        process_meaning: 'Plan library is the master list of available benefit options for quote scenario creation.',
        expected_user_action: 'Search for applicable plans, review coverage details, select for quote scenario',
        examples: 'Find all PPO medical plans in California, compare deductibles, select for quote scenario',
      },
      'contributions': {
        short_help: 'Model contribution strategies and analyze employer cost impacts.',
        detailed: '# Contribution Modeling\n\nBuilding and analyzing employer contribution strategies with budget constraints and cost forecasting.\n\n## Contribution Strategies:\n- **Percentage-Based**: Employer pays X% of EE, Y% of dependents\n- **Flat Dollar**: Employer pays fixed amount per employee\n- **Defined Contribution**: Fixed budget per employee\n- **Custom**: Per-class or per-plan variations\n\n## Modeling Tools:\n- Sliders to adjust contribution percentages\n- Real-time cost recalculation\n- Budget constraint inputs\n- Per-class override capability\n- Dependent handling options\n\n## Outputs:\n- Total employer monthly cost\n- Total employee monthly cost\n- Average cost per employee (by tier)\n- ACA affordability compliance check\n- Cost comparison with previous year\n\n## Scenarios:\n- Compare multiple contribution models\n- Test budget constraints\n- Analyze impact of plan changes\n- Forecast enrollment by plan\n\n## Compliance:\n- ACA affordability threshold check (9.5%)\n- Minimum essential coverage validation\n- Section 125 compliance alerts',
        feature_capabilities: 'Build contribution models, test scenarios, analyze costs, check compliance, export models',
        process_meaning: 'Contribution modeling helps employers balance cost, employee value, and compliance requirements.',
        expected_user_action: 'Create contribution model, adjust percentages, verify affordability, compare alternatives',
        examples: 'Model 80% EE / 50% dependent contribution, verify ACA compliance, compare to 70% model',
      },
      'policymatch': {
        short_help: 'AI-powered recommendation engine for plan matching and renewal predictions.',
        detailed: '# PolicyMatch AI\n\nLeverage artificial intelligence for plan recommendations, renewal predictions, and risk analysis.\n\n## Recommendation Features:\n- **Plan Matching**: Recommends optimal plans based on census and employer profile\n- **Scenario Scoring**: Rates quote scenarios on competitiveness and value\n- **Disruption Analysis**: Predicts impact of plan changes on employees\n- **Enrollment Forecasting**: Estimates participation by plan\n- **Rate Prediction**: Forecasts next year renewal rates\n\n## How It Works:\n1. Analyzes census data (demographics, health profile)\n2. Reviews plan options and costs\n3. Compares to market benchmarks\n4. Generates recommendation score (0-100)\n5. Provides explanation for recommendation\n\n## Use Cases:\n- Find recommended quote scenario\n- Identify optimal contribution level\n- Predict enrollment rates by plan\n- Assess renewal competitiveness\n- Benchmark against similar employers\n\n## Outputs:\n- Recommendation score with rationale\n- Risk assessment per plan\n- Enrollment predictions\n- Market comparison analysis\n- Alternative suggestions',
        feature_capabilities: 'AI-powered plan recommendations, scenario scoring, renewal forecasting, enrollment predictions',
        process_meaning: 'PolicyMatch AI provides intelligent decision support for brokers to optimize client outcomes.',
        expected_user_action: 'Review AI recommendation, compare to alternatives, use insights to guide employer decision',
        examples: 'AI recommends Scenario B (80/50 PPO) over Scenario A, predicts 72% enrollment, forecasts 4% renewal increase',
      },
      'tasks': {
        short_help: 'Create and manage case-related tasks with status tracking and deadline alerts.',
        detailed: '# Tasks Management\n\nTask creation and assignment workflow for case management activities.\n\n## Task Types:\n- **Action Required**: Broker must complete a task\n- **Follow Up**: Remind broker to contact employer\n- **Review**: Administrator review needed\n- **Approval**: Approval gate (employer, carrier, etc.)\n- **Document**: Document needed\n- **System**: Automated system tasks\n\n## Task Status:\n- Pending (awaiting start)\n- In Progress (being worked)\n- Completed (finished)\n- Cancelled (not needed)\n- Blocked (waiting on external)\n\n## Features:\n- Assign to specific user\n- Set due date with alerts\n- Link to related entity (case, enrollment, etc.)\n- Add notes and comments\n- Track completion timestamp\n- Filter by status, priority, or assignee\n- Bulk actions (reassign, complete, cancel)\n\n## Task Lifecycle:\n1. System or user creates task\n2. Assigned to responsible party\n3. Status updated as work progresses\n4. Completed when done\n5. Task dashboard shows status\n\n## Automations:\n- Automatic task creation for case stage changes\n- Reminders for overdue tasks\n- Escalation to manager if overdue',
        feature_capabilities: 'Create tasks, assign to users, track status, set deadlines, bulk update, filter by priority',
        process_meaning: 'Tasks ensure nothing falls through the cracks and provide accountability for case activities.',
        expected_user_action: 'Create task for broker action, set due date, monitor progress, mark complete when done',
        examples: 'Create task "Upload Census" due in 3 days, assign to broker, mark complete when file received',
      },
      'exceptions': {
        short_help: 'Manage and resolve data quality and process exceptions with tracking.',
        detailed: '# Exceptions Queue\n\nException handling and triage workflow for data quality and process issues.\n\n## Exception Categories:\n- **Census**: Data quality issues (missing fields, invalid dates)\n- **Quote**: Calculation errors or missing rates\n- **Enrollment**: Participation issues or invalid elections\n- **Carrier**: Carrier rejections or issues\n- **Document**: Document validation failures\n- **Billing**: Cost calculation discrepancies\n- **System**: Technical errors\n\n## Severity Levels:\n- **Low**: Minor issue, no impact\n- **Medium**: Issue with potential impact\n- **High**: Significant blocking issue\n- **Critical**: System blocking, immediate action needed\n\n## Exception Lifecycle:\n1. New: Exception detected\n2. Triaged: Reviewed and categorized\n3. In Progress: Being resolved\n4. Waiting External: Awaiting external response\n5. Resolved: Fix confirmed\n6. Dismissed: No action needed\n\n## Management:\n- Assign exception to responsible party\n- Set resolution due date\n- Add suggested actions\n- Track resolution\n- Link to case or document\n- Bulk actions for similar issues\n\n## Analytics:\n- Exception trends\n- Most common issues\n- Resolution time metrics\n- By category analysis',
        feature_capabilities: 'Triage exceptions, assign resolution, track status, analyze trends, bulk actions',
        process_meaning: 'Exceptions ensure data quality and process compliance throughout case lifecycle.',
        expected_user_action: 'Review new exception, understand issue, assign resolution, verify fix, close exception',
        examples: 'Exception: Missing SSN for 3 census members, assign to admin, request from employer, resolve',
      },
      'help': {
        short_help: 'Self-service help center with articles, FAQs, and AI-powered chat assistant.',
        detailed: '# Help Center\n\nComprehensive help resources for users including documentation, FAQs, and AI support.\n\n## Content Organization:\n- **Browse by Module**: Articles organized by Dashboard, Cases, Census, etc.\n- **Search**: Full-text search across all articles\n- **Topics**: Curated topics with related articles\n- **AI Assistant**: Ask questions in natural language\n\n## Article Types:\n- **How-to Guides**: Step-by-step procedures\n- **FAQs**: Frequently asked questions\n- **Concepts**: Explain key ideas\n- **Troubleshooting**: Problem resolution\n- **References**: Field definitions, rules\n\n## AI Assistant:\n- Natural language questions\n- Context-aware answers\n- Links to relevant articles\n- Escalation to support if needed\n\n## Features:\n- Search with autocomplete\n- Rate article helpfulness\n- Report issues with content\n- Video tutorials (if available)\n- Print or export articles\n- Mobile-friendly design',
        feature_capabilities: 'Search help articles, browse by topic, use AI chat, rate content, access tutorials',
        process_meaning: 'Help center provides immediate self-service support for user questions.',
        expected_user_action: 'Search for question, read relevant article, try suggested solution, escalate if needed',
        examples: 'Search "How to upload census", find step-by-step guide, follow instructions, upload file',
      },
      'settings': {
        short_help: 'Administrative settings for user management, integrations, and system configuration.',
        detailed: '# Settings Panel\n\nAdministrative controls for system configuration and management.\n\n## User Management:\n- Invite new users\n- Manage user roles (Admin, User)\n- Change user permissions\n- Revoke access\n- View user activity\n\n## Integrations:\n- **Zoho CRM**: Sync employer and case data\n- **DocuSign**: Electronic signature setup\n- **GradientAI**: Risk scoring configuration\n- Custom webhooks: Configure webhook endpoints\n\n## API Configuration:\n- API key generation\n- Webhook URL management\n- Rate limiting settings\n- Test endpoints\n\n## Billing:\n- Subscription plan\n- Usage metrics\n- Invoice history\n- Payment method\n\n## Preferences:\n- Branding (logo, colors)\n- Email templates\n- Default settings\n- Notification preferences\n\n## Audit & Compliance:\n- View audit logs\n- User activity reports\n- Data export\n- Compliance settings',
        feature_capabilities: 'Manage users and roles, configure integrations, manage API keys, view audit logs',
        process_meaning: 'Settings provide administrative control and system configuration.',
        expected_user_action: 'Invite users, configure integrations, manage API keys, review audit logs',
        examples: 'Invite new broker as User, enable Zoho CRM sync, generate API key for custom app',
      },
      'employers': {
        short_help: 'Centralized hub for managing employer/company records and details.',
        detailed: '# Employers Management\n\nCentral hub for managing employer/company records and associated data.\n\n## Main Features:\n- **Search & Filter**: Find employers by name, EIN, location, industry\n- **Grid & List Views**: Switch between visual cards and detailed table\n- **Employer Cards**: Show name, location, employee count, active cases\n- **Detail Page**: Comprehensive employer information\n\n## Employer Information:\n- Company name and DBA\n- EIN (Employer Identification Number)\n- Address, city, state, zip\n- Phone and email\n- Website\n- Industry and SIC code\n- Employee count\n- Renewal date\n- Status (active, inactive, suspended)\n\n## Employer Detail Tabs:\n- **Profile**: Basic info, address, contacts\n- **Cases**: All cases for this employer\n- **Contacts**: Primary and additional contacts\n- **Documents**: Stored files\n- **Activity**: Timeline of events\n\n## Actions:\n- Create new employer\n- Edit employer details\n- Create case from employer\n- View all cases\n- Add contacts\n- Upload documents\n- View activity history',
        feature_capabilities: 'Search and filter employers, view details, manage contacts, track cases, upload documents',
        process_meaning: 'Employers are the foundation; all cases are tied to an employer.',
        expected_user_action: 'Search for employer, view existing cases, create new case, update contact info',
        examples: 'Search "ABC Corp", view 3 active cases, update primary contact, create new renewal case',
      },
    };

    // Get all existing HelpTarget records to link content to
    const helpTargets = await base44.asServiceRole.entities.HelpTarget.list();
    const targetsByCode = {};
    helpTargets.forEach(target => {
      targetsByCode[target.help_target_code] = target;
    });

    // Create HelpContent for each target (page-level and UI components)
    const resultsCreated = [];
    const resultsFailed = [];

    for (const target of helpTargets) {
      try {
        // Check if content already exists
        const existing = await base44.asServiceRole.entities.HelpContent.filter({
          help_target_code: target.help_target_code
        });
        
        if (existing.length > 0) {
          // Skip if content already exists
          continue;
        }

        // Generate help content for this target
        const help = generateComponentHelp(target);

        // Create HelpContent record
        const contentRecord = await base44.asServiceRole.entities.HelpContent.create({
          help_target_id: target.id,
          help_target_code: target.help_target_code,
          module_code: target.module_code,
          page_code: target.page_code,
          content_source_type: 'system_generated',
          content_status: 'draft',
          version_no: 1,
          language_code: 'en',
          help_title: target.target_label,
          short_help_text: help.short_help_text,
          detailed_help_text: help.detailed_help_text,
          feature_capabilities_text: help.feature_capabilities_text,
          process_meaning_text: help.process_meaning_text,
          expected_user_action_text: help.expected_user_action_text,
          examples_text: help.examples_text,
          search_keywords: help.search_keywords,
          is_primary: target.target_type === 'page',
          is_active: true,
          review_required: false
        });

        resultsCreated.push({
          targetCode: target.help_target_code,
          targetLabel: target.target_label,
          targetType: target.target_type,
          contentId: contentRecord.id,
          status: 'created'
        });
      } catch (error) {
        resultsFailed.push({
          targetCode: target.help_target_code,
          targetLabel: target.target_label,
          reason: error.message
        });
      }
    }

    return Response.json({
      message: 'Help content population complete',
      totalCreated: resultsCreated.length,
      totalFailed: resultsFailed.length,
      created: resultsCreated,
      failed: resultsFailed
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});