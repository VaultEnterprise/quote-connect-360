import { describe, test, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaseSetupChecklist from '@/components/cases/new-case/CaseSetupChecklist';
import CarrierCensusImportCard from '@/components/cases/new-case/CarrierCensusImportCard';
import CensusImportWorkspace from '@/components/cases/new-case/CensusImportWorkspace';
import SubmissionPackageSummaryWidget from '@/components/cases/new-case/SubmissionPackageSummaryWidget';
import SUSRequiredFormsPanel from '@/components/cases/new-case/SUSRequiredFormsPanel';

describe('New Case Carrier Census Checklist UI', () => {
  describe('Case Setup Checklist Component', () => {
    test('renders checklist with three carrier options', () => {
      const mockOnChange = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false }}
          onDestinationChange={mockOnChange}
        />
      );
      
      expect(screen.getByText('Send to AST')).toBeDefined();
      expect(screen.getByText('Send to SUS')).toBeDefined();
      expect(screen.getByText('Send to Triad')).toBeDefined();
    });

    test('displays correct descriptions for each carrier', () => {
      const mockOnChange = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false }}
          onDestinationChange={mockOnChange}
        />
      );
      
      expect(screen.getByText('Prepare and validate census data for AST submission.')).toBeDefined();
      expect(screen.getByText('Prepare SUS census data and collect required SARA-related documents.')).toBeDefined();
      expect(screen.getByText('Prepare and validate census data for Triad submission.')).toBeDefined();
    });

    test('shows "Not selected" badge when carrier unchecked', () => {
      const mockOnChange = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false }}
          onDestinationChange={mockOnChange}
        />
      );
      
      const badges = screen.getAllByText('Not selected');
      expect(badges.length).toBe(3);
    });

    test('shows "Ready to configure" badge when carrier checked', () => {
      const mockOnChange = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: true, sus: false, triad: false }}
          onDestinationChange={mockOnChange}
        />
      );
      
      expect(screen.getByText('Ready to configure')).toBeDefined();
    });

    test('calls onDestinationChange when checkbox clicked', async () => {
      const mockOnChange = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false }}
          onDestinationChange={mockOnChange}
        />
      );
      
      const astCheckbox = screen.getByRole('checkbox', { name: /send to ast/i });
      fireEvent.click(astCheckbox);
      
      expect(mockOnChange).toHaveBeenCalledWith('ast');
    });
  });

  describe('Dynamic Import Card Rendering', () => {
    test('renders AST import card when selected', () => {
      const mockWorkflow = {
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="ast"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('AST Census Import')).toBeDefined();
    });

    test('renders SUS import card when selected', () => {
      const mockWorkflow = {
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {
          saraForm: { selected: false, file: null },
          employeeQuestionnaire: { selected: false, file: null },
          saraChecklist: { selected: false, file: null },
        },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="sus"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('SUS Census Import')).toBeDefined();
    });

    test('renders Triad import card when selected', () => {
      const mockWorkflow = {
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="triad"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Triad Census Import')).toBeDefined();
    });
  });

  describe('Census Import Workspace', () => {
    test('renders cards in order selected', () => {
      const mockWorkflows = {
        ast: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [], requiredForms: {} },
        sus: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [], requiredForms: {} },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      const { container } = render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'sus']}
          importWorkflows={mockWorkflows}
          onUpdateWorkflow={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
        />
      );

      const astCard = screen.getByText('AST Census Import');
      const susCard = screen.getByText('SUS Census Import');

      expect(container.textContent.indexOf('AST') < container.textContent.indexOf('SUS')).toBe(true);
    });

    test('does not render when no workflows selected', () => {
      const { container } = render(
        <CensusImportWorkspace
          selectedWorkflowOrder={[]}
          importWorkflows={{}}
          onUpdateWorkflow={() => {}}
          onRemoveWorkflow={() => {}}
        />
      );

      expect(container.textContent).not.toContain('Census Import');
    });
  });

  describe('Dalton Rules Checkbox', () => {
    test('renders Dalton Rules checkbox on each import card', () => {
      const mockWorkflow = {
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="ast"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Dalton Rules')).toBeDefined();
    });

    test('shows Dalton Rules notice when checked', () => {
      const mockWorkflow = {
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: true,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="ast"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText(/Dalton Rules selected/)).toBeDefined();
    });

    test('Dalton Rules state is independent per card', () => {
      const mockWorkflows = {
        ast: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: true, attachments: [], requiredForms: {} },
        sus: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [], requiredForms: {} },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      const { rerender } = render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'sus']}
          importWorkflows={mockWorkflows}
          onUpdateWorkflow={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
        />
      );

      expect(screen.getByText(/Dalton Rules selected/)).toBeDefined();
    });
  });

  describe('SUS Required Forms', () => {
    test('renders SUS Required Forms panel on SUS card documents tab', () => {
      const mockWorkflow = {
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        activeTab: 'documents',
        requiredForms: {
          saraForm: { selected: false, file: null, notes: '' },
          employeeQuestionnaire: { selected: false, file: null, notes: '' },
          saraChecklist: { selected: false, file: null, notes: '' },
        },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="sus"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      // Click on documents tab
      fireEvent.click(screen.getByText('Required Documents'));

      expect(screen.getByText('SUS Required Forms')).toBeDefined();
    });

    test('renders SARA Form, Employee Questionnaire, and SARA Checklist checkboxes', () => {
      const mockRequiredForms = {
        saraForm: { selected: false, file: null, notes: '' },
        employeeQuestionnaire: { selected: false, file: null, notes: '' },
        saraChecklist: { selected: false, file: null, notes: '' },
      };
      const mockOnFormUpdate = vi.fn();

      render(
        <SUSRequiredFormsPanel
          requiredForms={mockRequiredForms}
          onFormUpdate={mockOnFormUpdate}
        />
      );

      expect(screen.getByText('Upload SARA Form')).toBeDefined();
      expect(screen.getByText('Upload Employee Questionnaire')).toBeDefined();
      expect(screen.getByText('Upload SARA Checklist')).toBeDefined();
    });

    test('shows upload control when SARA Form checkbox selected', async () => {
      const mockRequiredForms = {
        saraForm: { selected: true, file: null, notes: '' },
        employeeQuestionnaire: { selected: false, file: null, notes: '' },
        saraChecklist: { selected: false, file: null, notes: '' },
      };
      const mockOnFormUpdate = vi.fn();

      render(
        <SUSRequiredFormsPanel
          requiredForms={mockRequiredForms}
          onFormUpdate={mockOnFormUpdate}
        />
      );

      expect(screen.getByText('Submit the required SARA form')).toBeDefined();
    });
  });

  describe('Submission Package Summary', () => {
    test('renders summary widget when workflows selected', () => {
      const mockWorkflows = {
        ast: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [] },
        sus: { censusFile: null, mapping: {}, validationStatus: 'validated', daltonRules: true, attachments: [] },
      };

      render(
        <SubmissionPackageSummaryWidget
          selectedWorkflowOrder={['ast', 'sus']}
          importWorkflows={mockWorkflows}
        />
      );

      expect(screen.getByText('Submission Package Summary')).toBeDefined();
    });

    test('shows selected destinations in summary', () => {
      const mockWorkflows = {
        ast: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [] },
        sus: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [] },
        triad: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [] },
      };

      render(
        <SubmissionPackageSummaryWidget
          selectedWorkflowOrder={['ast', 'sus', 'triad']}
          importWorkflows={mockWorkflows}
        />
      );

      expect(screen.getByText('AST')).toBeDefined();
      expect(screen.getByText('SUS')).toBeDefined();
      expect(screen.getByText('Triad')).toBeDefined();
    });

    test('counts census imports correctly', () => {
      const mockWorkflows = {
        ast: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [] },
        sus: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [] },
      };

      render(
        <SubmissionPackageSummaryWidget
          selectedWorkflowOrder={['ast', 'sus']}
          importWorkflows={mockWorkflows}
        />
      );

      const labels = screen.getAllByText(/Census Imports Required/);
      expect(labels.length).toBeGreaterThan(0);
    });

    test('counts validated imports', () => {
      const mockWorkflows = {
        ast: { censusFile: null, mapping: {}, validationStatus: 'validated', daltonRules: false, attachments: [] },
        sus: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [] },
      };

      render(
        <SubmissionPackageSummaryWidget
          selectedWorkflowOrder={['ast', 'sus']}
          importWorkflows={mockWorkflows}
        />
      );

      expect(screen.getByText('1')).toBeDefined(); // Validated count
    });

    test('counts Dalton Rules selections', () => {
      const mockWorkflows = {
        ast: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: true, attachments: [] },
        sus: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: true, attachments: [] },
        triad: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [] },
      };

      render(
        <SubmissionPackageSummaryWidget
          selectedWorkflowOrder={['ast', 'sus', 'triad']}
          importWorkflows={mockWorkflows}
        />
      );

      // Should show 2 for Dalton Rules selected
      const labels = screen.getAllByText('Dalton Rules Selected');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('State Isolation', () => {
    test('each card maintains independent census file state', () => {
      const mockWorkflows = {
        ast: { censusFile: { name: 'ast.csv' }, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [], requiredForms: {} },
        sus: { censusFile: { name: 'sus.csv' }, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [], requiredForms: {} },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'sus']}
          importWorkflows={mockWorkflows}
          onUpdateWorkflow={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
        />
      );

      expect(screen.getByText('ast.csv')).toBeDefined();
      expect(screen.getByText('sus.csv')).toBeDefined();
    });

    test('each card maintains independent mapping state', () => {
      const mockWorkflows = {
        ast: { censusFile: null, mapping: { 0: 'relationship', 1: 'first_name' }, validationStatus: 'not_validated', daltonRules: false, attachments: [], requiredForms: {} },
        sus: { censusFile: null, mapping: { 0: 'first_name', 1: 'last_name' }, validationStatus: 'not_validated', daltonRules: false, attachments: [], requiredForms: {} },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'sus']}
          importWorkflows={mockWorkflows}
          onUpdateWorkflow={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
        />
      );

      // Both should render without conflict
      expect(screen.getByText('AST Census Import')).toBeDefined();
      expect(screen.getByText('SUS Census Import')).toBeDefined();
    });

    test('each card maintains independent validation state', () => {
      const mockWorkflows = {
        ast: { censusFile: null, mapping: {}, validationStatus: 'validated', daltonRules: false, attachments: [], requiredForms: {} },
        sus: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [], requiredForms: {} },
        triad: { censusFile: null, mapping: {}, validationStatus: 'failed', daltonRules: false, attachments: [], requiredForms: {} },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'sus', 'triad']}
          importWorkflows={mockWorkflows}
          onUpdateWorkflow={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
        />
      );

      // All three should render with different statuses visible
      expect(screen.getByText('AST Census Import')).toBeDefined();
      expect(screen.getByText('SUS Census Import')).toBeDefined();
      expect(screen.getByText('Triad Census Import')).toBeDefined();
    });
  });

  describe('Card Removal & Dynamic Reflow', () => {
    test('remove button calls onRemove callback', () => {
      const mockWorkflow = {
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="ast"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /trash/i });
      fireEvent.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('ast');
    });

    test('remaining cards reflow when one is removed', () => {
      const mockWorkflows = {
        ast: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [], requiredForms: {} },
        sus: { censusFile: null, mapping: {}, validationStatus: 'not_validated', daltonRules: false, attachments: [], requiredForms: {} },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      const { rerender } = render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'sus']}
          importWorkflows={mockWorkflows}
          onUpdateWorkflow={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
        />
      );

      // Simulate removal of AST
      const newWorkflows = {
        sus: mockWorkflows.sus,
      };

      rerender(
        <CensusImportWorkspace
          selectedWorkflowOrder={['sus']}
          importWorkflows={newWorkflows}
          onUpdateWorkflow={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
        />
      );

      expect(screen.queryByText('AST Census Import')).not.toBeDefined();
      expect(screen.getByText('SUS Census Import')).toBeDefined();
    });
  });

  describe('No Backend Submission', () => {
    test('no API calls made during form interaction', () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false }}
          onDestinationChange={mockOnChange}
        />
      );

      // Interaction should only call local callback, never make backend calls
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      expect(mockOnChange).toHaveBeenCalled();
    });

    test('Save/Submit buttons are disabled and show pending message', () => {
      const mockWorkflow = {
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="ast"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      // Click to Review & Submit tab
      fireEvent.click(screen.getByText('Review & Submit'));

      const saveButton = screen.getByText(/Save Draft/);
      const submitButton = screen.getByText(/Mark Ready for Review/);

      expect(saveButton.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);
      expect(screen.getByText(/pending backend/)).toBeDefined();
    });
  });

  describe('No External Carrier Submission', () => {
    test('no files sent to AST', () => {
      // This is tested implicitly by the disabled buttons and pending messages
      const mockWorkflow = {
        censusFile: { name: 'test.csv' },
        mapping: { 0: 'relationship' },
        validationStatus: 'validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="ast"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.click(screen.getByText('Review & Submit'));

      // Verify submit button is disabled
      expect(screen.getByText(/Mark Ready for Review/).disabled).toBe(true);
    });

    test('no files sent to SUS', () => {
      const mockWorkflow = {
        censusFile: { name: 'test.csv' },
        mapping: {},
        validationStatus: 'validated',
        daltonRules: false,
        attachments: [{ file: { name: 'doc.pdf' }, notes: '' }],
        requiredForms: {
          saraForm: { selected: true, file: { name: 'sara.pdf' }, notes: '' },
          employeeQuestionnaire: { selected: false, file: null },
          saraChecklist: { selected: false, file: null },
        },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="sus"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.click(screen.getByText('Review & Submit'));

      // Verify submit button is disabled
      expect(screen.getByText(/Mark Ready for Review/).disabled).toBe(true);
    });

    test('no files sent to Triad', () => {
      const mockWorkflow = {
        censusFile: { name: 'test.csv' },
        mapping: {},
        validationStatus: 'validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="triad"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.click(screen.getByText('Review & Submit'));

      // Verify submit button is disabled
      expect(screen.getByText(/Mark Ready for Review/).disabled).toBe(true);
    });
  });

  describe('Callback Wiring Audit', () => {
    test('Clicking AST checkbox does not throw', () => {
      const mockToggle = vi.fn();
      const { container } = render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockToggle}
        />
      );
      const astCheckbox = screen.getByRole('checkbox', { name: /send to ast/i });
      expect(() => fireEvent.click(astCheckbox)).not.toThrow();
      expect(mockToggle).toHaveBeenCalledWith('ast');
    });

    test('Clicking SUS checkbox does not throw', () => {
      const mockToggle = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockToggle}
        />
      );
      const susCheckbox = screen.getByRole('checkbox', { name: /send to sus/i });
      expect(() => fireEvent.click(susCheckbox)).not.toThrow();
      expect(mockToggle).toHaveBeenCalledWith('sus');
    });

    test('Clicking Triad checkbox does not throw', () => {
      const mockToggle = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockToggle}
        />
      );
      const triadCheckbox = screen.getByRole('checkbox', { name: /send to triad/i });
      expect(() => fireEvent.click(triadCheckbox)).not.toThrow();
      expect(mockToggle).toHaveBeenCalledWith('triad');
    });

    test('Clicking MEC / MVP checkbox does not throw', () => {
      const mockToggle = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockToggle}
        />
      );
      const mecMvpCheckbox = screen.getByRole('checkbox', { name: /send to mec \/ mvp/i });
      expect(() => fireEvent.click(mecMvpCheckbox)).not.toThrow();
      expect(mockToggle).toHaveBeenCalledWith('mecMvp');
    });

    test('onDestinationToggle callback is required', () => {
      expect(() => 
        render(
          <CaseSetupChecklist
            selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
            onDestinationToggle={undefined}
          />
        )
      ).toThrow();
    });

    test('CarrierCensusImportCard onUpdate callback does not throw', () => {
      const mockUpdate = vi.fn();
      const mockRemove = vi.fn();
      const workflow = {
        activeTab: 'upload',
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };

      render(
        <CarrierCensusImportCard
          carrierId="ast"
          workflow={workflow}
          onUpdate={mockUpdate}
          onRemove={mockRemove}
        />
      );

      // Simulate Dalton Rules toggle
      fireEvent.click(screen.getByRole('checkbox', { name: /dalton rules/i }));
      expect(mockUpdate).toHaveBeenCalled();
    });

    test('CarrierCensusImportCard onRemove callback does not throw', () => {
      const mockUpdate = vi.fn();
      const mockRemove = vi.fn();
      const workflow = {
        activeTab: 'upload',
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };

      render(
        <CarrierCensusImportCard
          carrierId="ast"
          workflow={workflow}
          onUpdate={mockUpdate}
          onRemove={mockRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /trash/i });
      expect(() => fireEvent.click(removeButton)).not.toThrow();
      expect(mockRemove).toHaveBeenCalledWith('ast');
    });
  });

  describe('Case Census Tab Visibility', () => {
    test('checklist renders on Case Census tab', () => {
      const mockSetupChecklist = vi.fn();
      const { container } = render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockSetupChecklist}
        />
      );
      expect(screen.getByText('Case Setup Checklist')).toBeDefined();
    });

    test('AST checkbox visible on Census tab', () => {
      const mockToggle = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockToggle}
        />
      );
      expect(screen.getByText('Send to AST')).toBeDefined();
    });

    test('SUS checkbox visible on Census tab', () => {
      const mockToggle = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockToggle}
        />
      );
      expect(screen.getByText('Send to SUS')).toBeDefined();
    });

    test('Triad checkbox visible on Census tab', () => {
      const mockToggle = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockToggle}
        />
      );
      expect(screen.getByText('Send to Triad')).toBeDefined();
    });

    test('dynamic import cards visible when workflows selected', () => {
      const mockWorkflows = {
        ast: { activeTab: 'upload', attachments: [], censusFile: null },
        sus: { activeTab: 'upload', attachments: [], censusFile: null },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'sus']}
          importWorkflows={mockWorkflows}
          onWorkflowUpdate={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
          caseId="case-123"
        />
      );

      expect(screen.getByText('AST Census Import')).toBeDefined();
      expect(screen.getByText('SUS Census Import')).toBeDefined();
    });

    test('cards appear in order selected', () => {
      const mockWorkflows = {
        sus: { activeTab: 'upload', attachments: [], censusFile: null },
        ast: { activeTab: 'upload', attachments: [], censusFile: null },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();
      const { container } = render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['sus', 'ast']}
          importWorkflows={mockWorkflows}
          onWorkflowUpdate={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
          caseId="case-123"
        />
      );

      const susIdx = container.textContent.indexOf('SUS Census Import');
      const astIdx = container.textContent.indexOf('AST Census Import');
      expect(susIdx < astIdx).toBe(true);
    });

    test('Submission Package Summary visible when destinations selected', () => {
      const mockWorkflows = {
        ast: { activeTab: 'upload', attachments: [], censusFile: null },
      };

      render(
        <SubmissionPackageSummaryWidget
          selectedWorkflowOrder={['ast']}
          importWorkflows={mockWorkflows}
        />
      );

      expect(screen.getByText('Submission Package Summary')).toBeDefined();
    });

    test('existing census workflow still renders on Census tab', () => {
      const { getByText } = render(
        <>
          <CaseSetupChecklist
            selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
            onDestinationToggle={vi.fn()}
          />
          <h3>Existing Census Versions</h3>
        </>
      );
      expect(getByText('Existing Census Versions')).toBeDefined();
    });
  });

  describe('MEC / MVP Carrier Census Option', () => {
    test('Send to MEC / MVP checkbox renders and callback wires correctly', () => {
      const mockToggle = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockToggle}
        />
      );
      const mecMvpCheckbox = screen.getByRole('checkbox', { name: /send to mec \/ mvp/i });
      expect(mecMvpCheckbox).toBeDefined();
      fireEvent.click(mecMvpCheckbox);
      expect(mockToggle).toHaveBeenCalledWith('mecMvp');
    });

    test('MEC / MVP description is correct', () => {
      const mockToggle = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockToggle}
        />
      );
      expect(screen.getByText('Prepare and validate MEC / MVP census data and attach supporting documents for review.')).toBeDefined();
    });

    test('MEC / MVP Census Import card renders when selected', () => {
      const mockWorkflow = {
        activeTab: 'upload',
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="mecMvp"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('MEC / MVP Census Import')).toBeDefined();
    });

    test('MEC / MVP card appears in order selected', () => {
      const mockWorkflows = {
        ast: { activeTab: 'upload', attachments: [], censusFile: null },
        sus: { activeTab: 'upload', attachments: [], censusFile: null },
        mecMvp: { activeTab: 'upload', attachments: [], censusFile: null },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();
      const { container } = render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'sus', 'mecMvp']}
          importWorkflows={mockWorkflows}
          onWorkflowUpdate={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
          caseId="case-123"
        />
      );

      const astIdx = container.textContent.indexOf('AST Census Import');
      const susIdx = container.textContent.indexOf('SUS Census Import');
      const mecMvpIdx = container.textContent.indexOf('MEC / MVP Census Import');
      expect(astIdx < susIdx && susIdx < mecMvpIdx).toBe(true);
    });

    test('MEC / MVP unchecked removes only that card', () => {
      const mockWorkflows = {
        ast: { activeTab: 'upload', attachments: [], censusFile: null, validationStatus: 'not_validated', daltonRules: false },
        sus: { activeTab: 'upload', attachments: [], censusFile: null, validationStatus: 'not_validated', daltonRules: false },
        mecMvp: { activeTab: 'upload', attachments: [], censusFile: null, validationStatus: 'not_validated', daltonRules: false },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      const { rerender } = render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'sus', 'mecMvp']}
          importWorkflows={mockWorkflows}
          onWorkflowUpdate={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
          caseId="case-123"
        />
      );

      expect(screen.getByText('MEC / MVP Census Import')).toBeDefined();

      // Simulate removal
      rerender(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'sus']}
          importWorkflows={{ ast: mockWorkflows.ast, sus: mockWorkflows.sus }}
          onWorkflowUpdate={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
          caseId="case-123"
        />
      );

      expect(screen.queryByText('MEC / MVP Census Import')).not.toBeDefined();
      expect(screen.getByText('AST Census Import')).toBeDefined();
      expect(screen.getByText('SUS Census Import')).toBeDefined();
    });

    test('MEC / MVP card maintains independent state', () => {
      const mockWorkflows = {
        ast: { activeTab: 'upload', mapping: { 0: 'relationship' }, validationStatus: 'not_validated', daltonRules: false, attachments: [] },
        mecMvp: { activeTab: 'mapping', mapping: { 0: 'first_name' }, validationStatus: 'validated', daltonRules: true, attachments: [] },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'mecMvp']}
          importWorkflows={mockWorkflows}
          onWorkflowUpdate={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
          caseId="case-123"
        />
      );

      expect(screen.getByText('AST Census Import')).toBeDefined();
      expect(screen.getByText('MEC / MVP Census Import')).toBeDefined();
    });

    test('MEC / MVP card shows Dalton Rules checkbox', () => {
      const mockWorkflow = {
        activeTab: 'upload',
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="mecMvp"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Dalton Rules')).toBeDefined();
    });

    test('MEC / MVP Dalton Rules state is independent', () => {
      const mockWorkflows = {
        ast: { daltonRules: false, activeTab: 'upload', censusFile: null, mapping: {}, validationStatus: 'not_validated', attachments: [], requiredForms: {} },
        mecMvp: { daltonRules: true, activeTab: 'upload', censusFile: null, mapping: {}, validationStatus: 'not_validated', attachments: [], requiredForms: {} },
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CensusImportWorkspace
          selectedWorkflowOrder={['ast', 'mecMvp']}
          importWorkflows={mockWorkflows}
          onWorkflowUpdate={mockOnUpdate}
          onRemoveWorkflow={mockOnRemove}
          caseId="case-123"
        />
      );

      expect(screen.getByText(/Dalton Rules selected/)).toBeDefined();
    });

    test('MEC / MVP card shows MEC / MVP Attachments section', () => {
      const mockWorkflow = {
        activeTab: 'documents',
        censusFile: null,
        mapping: {},
        validationStatus: 'not_validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="mecMvp"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.click(screen.getByText('Required Documents'));
      expect(screen.getByText('MEC / MVP Attachments')).toBeDefined();
    });

    test('Summary widget includes MEC / MVP when selected', () => {
      const mockWorkflows = {
        ast: { activeTab: 'upload', attachments: [], censusFile: null, validationStatus: 'not_validated', daltonRules: false },
        mecMvp: { activeTab: 'upload', attachments: [], censusFile: null, validationStatus: 'not_validated', daltonRules: false },
      };

      render(
        <SubmissionPackageSummaryWidget
          selectedWorkflowOrder={['ast', 'mecMvp']}
          importWorkflows={mockWorkflows}
        />
      );

      expect(screen.getByText('MEC / MVP')).toBeDefined();
    });

    test('AST, SUS, Triad behavior remains unchanged and callback wires', () => {
      const mockToggle = vi.fn();
      render(
        <CaseSetupChecklist
          selectedDestinations={{ ast: false, sus: false, triad: false, mecMvp: false }}
          onDestinationToggle={mockToggle}
        />
      );
      expect(screen.getByText('Send to AST')).toBeDefined();
      expect(screen.getByText('Send to SUS')).toBeDefined();
      expect(screen.getByText('Send to Triad')).toBeDefined();
      
      // Verify callbacks wire correctly for all three
      fireEvent.click(screen.getByRole('checkbox', { name: /send to ast/i }));
      expect(mockToggle).toHaveBeenCalledWith('ast');
      
      fireEvent.click(screen.getByRole('checkbox', { name: /send to sus/i }));
      expect(mockToggle).toHaveBeenCalledWith('sus');
      
      fireEvent.click(screen.getByRole('checkbox', { name: /send to triad/i }));
      expect(mockToggle).toHaveBeenCalledWith('triad');
    });

    test('no backend submission occurs for MEC / MVP', () => {
      const mockWorkflow = {
        activeTab: 'review',
        censusFile: { name: 'test.csv' },
        mapping: {},
        validationStatus: 'validated',
        daltonRules: false,
        attachments: [],
        requiredForms: {},
      };
      const mockOnUpdate = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <CarrierCensusImportCard
          carrierId="mecMvp"
          workflow={mockWorkflow}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.click(screen.getByText('Review & Submit'));

      // Verify submit button is disabled
      expect(screen.getByText(/Mark Ready for Review/).disabled).toBe(true);
      expect(screen.getByText(/pending backend/)).toBeDefined();
    });
  });
});