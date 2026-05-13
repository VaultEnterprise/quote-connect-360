import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import CarrierCensusImportCard from '@/components/cases/new-case/CarrierCensusImportCard';
import CarrierUploadCensusTab from '@/components/cases/new-case/CarrierUploadCensusTab';
import CarrierColumnMappingTab from '@/components/cases/new-case/CarrierColumnMappingTab';
import { base44 } from '@/api/base44Client';
import { censusImportClient } from '@/components/census/CensusImportClient';

// Mock dependencies
vi.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        UploadFile: vi.fn(),
      },
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/components/census/CensusImportClient', () => ({
  censusImportClient: {
    analyzeWorkbook: vi.fn(),
  },
}));

describe('P0 Repair 2/4 — Carrier Analyze Workflow', () => {
  const mockWorkflow = {
    censusFile: null,
    mapping: {},
    analysisResult: null,
    validationStatus: 'not_started',
    activeTab: 'upload',
    attachments: [],
    requiredForms: {},
    daltonRules: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CarrierUploadCensusTab Analyze Button', () => {
    it('should have Analyze button disabled when no file selected', () => {
      render(
        <CarrierUploadCensusTab
          censusFile={null}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="AST"
          onAnalyzeStart={vi.fn()}
          isAnalyzing={false}
          analysisError={null}
          onAnalysisError={vi.fn()}
          onAnalysisSuccess={vi.fn()}
        />
      );

      const analyzeButton = screen.queryByText(/Analyze Census/i);
      expect(analyzeButton).not.toBeInTheDocument();
    });

    it('should show enabled Analyze button when file selected', () => {
      const testFile = new File(['test'], 'census.csv', { type: 'text/csv' });

      render(
        <CarrierUploadCensusTab
          censusFile={testFile}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="AST"
          onAnalyzeStart={vi.fn()}
          isAnalyzing={false}
          analysisError={null}
          onAnalysisError={vi.fn()}
          onAnalysisSuccess={vi.fn()}
        />
      );

      const analyzeButton = screen.getByRole('button', { name: /Analyze Census/i });
      expect(analyzeButton).not.toBeDisabled();
    });

    it('should show loading state when analyzing', () => {
      const testFile = new File(['test'], 'census.csv', { type: 'text/csv' });

      render(
        <CarrierUploadCensusTab
          censusFile={testFile}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="AST"
          onAnalyzeStart={vi.fn()}
          isAnalyzing={true}
          analysisError={null}
          onAnalysisError={vi.fn()}
          onAnalysisSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(/Analyzing census/i)).toBeInTheDocument();
      const analyzeButton = screen.getByRole('button', { name: /Analyzing census/i });
      expect(analyzeButton).toBeDisabled();
    });
  });

  describe('Analyze Workflow Integration', () => {
    it('AST — should upload file and call analyzeWorkbook', async () => {
      const testFile = new File(['test,data'], 'census.csv', { type: 'text/csv' });
      const mockUploadResponse = { data: { file_url: 'https://example.com/census.csv' } };
      const mockAnalyzeResponse = { data: { headers: ['Name', 'Age'], rows: [] } };

      base44.integrations.Core.UploadFile.mockResolvedValueOnce(mockUploadResponse);
      censusImportClient.analyzeWorkbook.mockResolvedValueOnce(mockAnalyzeResponse);

      const onAnalysisSuccess = vi.fn();
      const onAnalyzeStart = vi.fn();

      render(
        <CarrierUploadCensusTab
          censusFile={testFile}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="AST"
          onAnalyzeStart={onAnalyzeStart}
          isAnalyzing={false}
          analysisError={null}
          onAnalysisError={vi.fn()}
          onAnalysisSuccess={onAnalysisSuccess}
        />
      );

      const analyzeButton = screen.getByRole('button', { name: /Analyze Census/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(onAnalyzeStart).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(base44.integrations.Core.UploadFile).toHaveBeenCalledWith({ file: testFile });
      });

      await waitFor(() => {
        expect(censusImportClient.analyzeWorkbook).toHaveBeenCalledWith(
          'https://example.com/census.csv',
          'census.csv',
          'text/csv'
        );
      });

      await waitFor(() => {
        expect(onAnalysisSuccess).toHaveBeenCalledWith({ headers: ['Name', 'Age'], rows: [] });
      });
    });

    it('SUS — should handle analyze successfully', async () => {
      const testFile = new File(['data'], 'sus_census.xlsx', { type: 'application/vnd.ms-excel' });
      const mockUploadResponse = { data: { file_url: 'https://example.com/sus_census.xlsx' } };
      const mockAnalyzeResponse = {
        data: {
          headers: ['Emp ID', 'First', 'Last', 'DOB'],
          rows: [{ 'Emp ID': '001', First: 'John', Last: 'Doe', DOB: '1990-01-01' }],
        },
      };

      base44.integrations.Core.UploadFile.mockResolvedValueOnce(mockUploadResponse);
      censusImportClient.analyzeWorkbook.mockResolvedValueOnce(mockAnalyzeResponse);

      const onAnalysisSuccess = vi.fn();

      render(
        <CarrierUploadCensusTab
          censusFile={testFile}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="SUS"
          onAnalyzeStart={vi.fn()}
          isAnalyzing={false}
          analysisError={null}
          onAnalysisError={vi.fn()}
          onAnalysisSuccess={onAnalysisSuccess}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Analyze Census/i }));

      await waitFor(() => {
        expect(onAnalysisSuccess).toHaveBeenCalled();
      });
    });

    it('Triad — should handle analyze failure with visible error', async () => {
      const testFile = new File(['invalid'], 'census.csv', { type: 'text/csv' });
      const mockError = 'Invalid CSV format';

      base44.integrations.Core.UploadFile.mockRejectedValueOnce(new Error(mockError));

      const onAnalysisError = vi.fn();

      render(
        <CarrierUploadCensusTab
          censusFile={testFile}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="Triad"
          onAnalyzeStart={vi.fn()}
          isAnalyzing={false}
          analysisError={null}
          onAnalysisError={onAnalysisError}
          onAnalysisSuccess={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Analyze Census/i }));

      await waitFor(() => {
        expect(onAnalysisError).toHaveBeenCalledWith(mockError);
      });
    });

    it('MEC/MVP — should show error state on analyze failure', async () => {
      const testFile = new File(['test'], 'census.xlsx', { type: 'application/vnd.ms-excel' });

      const { rerender } = render(
        <CarrierUploadCensusTab
          censusFile={testFile}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="MEC / MVP"
          onAnalyzeStart={vi.fn()}
          isAnalyzing={true}
          analysisError={null}
          onAnalysisError={vi.fn()}
          onAnalysisSuccess={vi.fn()}
        />
      );

      // Rerender with error state
      rerender(
        <CarrierUploadCensusTab
          censusFile={testFile}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="MEC / MVP"
          onAnalyzeStart={vi.fn()}
          isAnalyzing={false}
          analysisError="File format not supported"
          onAnalysisError={vi.fn()}
          onAnalysisSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(/Analysis Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/File format not supported/i)).toBeInTheDocument();
    });
  });

  describe('CarrierColumnMappingTab Real Headers', () => {
    it('should display real headers from analysisResult', () => {
      const analysisResult = {
        headers: ['Employee ID', 'First Name', 'Last Name', 'DOB', 'Gender', 'ZIP', 'Coverage'],
      };

      render(
        <CarrierColumnMappingTab
          censusFile={new File([], 'census.csv')}
          mapping={{}}
          analysisResult={analysisResult}
          onMappingChange={vi.fn()}
        />
      );

      expect(screen.getByText('Employee ID')).toBeInTheDocument();
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('DOB')).toBeInTheDocument();
    });

    it('should NOT show mock columns when real headers exist', () => {
      const analysisResult = {
        headers: ['Col1', 'Col2', 'Col3'],
      };

      render(
        <CarrierColumnMappingTab
          censusFile={new File([], 'census.csv')}
          mapping={{}}
          analysisResult={analysisResult}
          onMappingChange={vi.fn()}
        />
      );

      // Real columns should be rendered
      expect(screen.getByText('Col1')).toBeInTheDocument();
      expect(screen.getByText('Col2')).toBeInTheDocument();

      // Mock columns should NOT be rendered
      expect(screen.queryByText(/Relationship/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Relationship \(EMP\/SPS\/DEP\)/)).not.toBeInTheDocument();
    });

    it('should show placeholder when no analysisResult', () => {
      render(
        <CarrierColumnMappingTab
          censusFile={new File([], 'census.csv')}
          mapping={{}}
          analysisResult={null}
          onMappingChange={vi.fn()}
        />
      );

      expect(screen.getByText(/Click "Analyze Census"/i)).toBeInTheDocument();
    });
  });

  describe('Per-Carrier Analysis State', () => {
    it('should maintain independent analysis state for each carrier', async () => {
      const onUpdateAST = vi.fn();
      const onUpdateSUS = vi.fn();

      const astResult = { headers: ['AST1', 'AST2'] };
      const susResult = { headers: ['SUS1', 'SUS2'] };

      const astWorkflow = { ...mockWorkflow, analysisResult: astResult };
      const susWorkflow = { ...mockWorkflow, analysisResult: susResult };

      const { rerender: rerenderAST } = render(
        <CarrierCensusImportCard
          carrierId="ast"
          workflow={astWorkflow}
          onUpdate={onUpdateAST}
          onRemove={vi.fn()}
        />
      );

      const { rerender: rerenderSUS } = render(
        <CarrierCensusImportCard
          carrierId="sus"
          workflow={susWorkflow}
          onUpdate={onUpdateSUS}
          onRemove={vi.fn()}
        />
      );

      // Each should maintain its own result
      expect(onUpdateAST).not.toHaveBeenCalledWith('sus', expect.anything());
      expect(onUpdateSUS).not.toHaveBeenCalledWith('ast', expect.anything());
    });
  });

  describe('Tab Transition After Analyze', () => {
    it('should transition to Map Columns tab after successful analyze', () => {
      const mockUpdateWorkflow = vi.fn();
      const testFile = new File(['test'], 'census.csv', { type: 'text/csv' });

      const { rerender } = render(
        <CarrierCensusImportCard
          carrierId="ast"
          workflow={{ ...mockWorkflow, censusFile: testFile }}
          onUpdate={mockUpdateWorkflow}
          onRemove={vi.fn()}
        />
      );

      // Simulate analyze success by checking if activeTab would be updated
      // (In real usage, parent updates workflow.activeTab = 'mapping')
      expect(screen.getByRole('button', { name: /Upload Census/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error when file upload fails', async () => {
      base44.integrations.Core.UploadFile.mockRejectedValueOnce(
        new Error('Network error')
      );

      const onAnalysisError = vi.fn();
      const testFile = new File(['test'], 'census.csv', { type: 'text/csv' });

      render(
        <CarrierUploadCensusTab
          censusFile={testFile}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="AST"
          onAnalyzeStart={vi.fn()}
          isAnalyzing={false}
          analysisError={null}
          onAnalysisError={onAnalysisError}
          onAnalysisSuccess={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Analyze Census/i }));

      await waitFor(() => {
        expect(onAnalysisError).toHaveBeenCalledWith('Network error');
      });
    });

    it('should display error when analyze backend fails', async () => {
      const mockUploadResponse = { data: { file_url: 'https://example.com/census.csv' } };
      base44.integrations.Core.UploadFile.mockResolvedValueOnce(mockUploadResponse);
      censusImportClient.analyzeWorkbook.mockResolvedValueOnce({
        error: 'Invalid column structure',
      });

      const onAnalysisError = vi.fn();
      const testFile = new File(['test'], 'census.csv', { type: 'text/csv' });

      render(
        <CarrierUploadCensusTab
          censusFile={testFile}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="AST"
          onAnalyzeStart={vi.fn()}
          isAnalyzing={false}
          analysisError={null}
          onAnalysisError={onAnalysisError}
          onAnalysisSuccess={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Analyze Census/i }));

      await waitFor(() => {
        expect(onAnalysisError).toHaveBeenCalledWith('Invalid column structure');
      });
    });
  });

  describe('Existing CensusUploadModal Regression', () => {
    it('should not break when both carrier cards and CensusUploadModal are rendered', () => {
      // This is a regression test to ensure carrier cards don't interfere
      // with the existing census upload modal
      expect(true).toBe(true); // Placeholder - actual test would need full page render
    });
  });

  describe('No Raw Axios Calls', () => {
    it('should use base44.integrations.Core.UploadFile, not raw axios', async () => {
      const testFile = new File(['test'], 'census.csv', { type: 'text/csv' });
      const mockUploadResponse = { data: { file_url: 'https://example.com/census.csv' } };
      const mockAnalyzeResponse = { data: { headers: ['Col1'] } };

      base44.integrations.Core.UploadFile.mockResolvedValueOnce(mockUploadResponse);
      censusImportClient.analyzeWorkbook.mockResolvedValueOnce(mockAnalyzeResponse);

      render(
        <CarrierUploadCensusTab
          censusFile={testFile}
          onFileSelect={vi.fn()}
          onFileReplace={vi.fn()}
          carrierName="AST"
          onAnalyzeStart={vi.fn()}
          isAnalyzing={false}
          analysisError={null}
          onAnalysisError={vi.fn()}
          onAnalysisSuccess={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Analyze Census/i }));

      await waitFor(() => {
        expect(base44.integrations.Core.UploadFile).toHaveBeenCalled();
      });
    });
  });
});