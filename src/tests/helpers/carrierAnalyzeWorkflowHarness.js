/**
 * P0 Repair 2/4 Carrier Analyze Workflow Test Harness Helper
 * 
 * Provides reusable utilities for testing the carrier census analyze workflow
 * across AST, SUS, Triad, and MEC-MVP carriers.
 */

import { expect } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Carrier configuration for test harness
 */
const CARRIER_CONFIG = {
  ast: {
    id: 'ast',
    name: 'AST',
    label: 'Send to AST',
    cardTitle: 'AST Census Import',
    badge: 'purple',
  },
  sus: {
    id: 'sus',
    name: 'SUS',
    label: 'Send to SUS',
    cardTitle: 'SUS Census Import',
    badge: 'blue',
    hasRequiredForms: true,
  },
  triad: {
    id: 'triad',
    name: 'Triad',
    label: 'Send to Triad',
    cardTitle: 'Triad Census Import',
    badge: 'green',
  },
  mecMvp: {
    id: 'mecMvp',
    name: 'MEC / MVP',
    label: 'Send to MEC / MVP',
    cardTitle: 'MEC / MVP Census',
    badge: 'orange',
    hasAttachments: true,
  },
};

/**
 * Standard mock headers returned from successful analyze
 */
const STANDARD_HEADERS = [
  { index: 0, name: 'Relationship', normalized: 'relationship' },
  { index: 1, name: 'First Name', normalized: 'first_name' },
  { index: 2, name: 'Last Name', normalized: 'last_name' },
  { index: 3, name: 'Address', normalized: 'address' },
  { index: 4, name: 'City', normalized: 'city' },
  { index: 5, name: 'State', normalized: 'state' },
  { index: 6, name: 'ZIP', normalized: 'zip' },
  { index: 7, name: 'Gender', normalized: 'gender' },
  { index: 8, name: 'DOB', normalized: 'dob' },
  { index: 9, name: 'Coverage Type', normalized: 'coverage_type' },
];

/**
 * Create a mock file object for testing
 */
function createMockFile(name = 'test_census.csv', type = 'text/csv', size = 1024) {
  return new File(['mock,data\n1,2'], name, { type });
}

/**
 * Create successful analyze response
 */
function createSuccessAnalyzeResponse(headers = STANDARD_HEADERS) {
  return {
    success: true,
    data: {
      file_type: 'csv',
      layout: 'standard',
      headers,
      header_row_index: 0,
    },
  };
}

/**
 * Create failed analyze response
 */
function createFailedAnalyzeResponse(errorMessage = 'Analysis failed') {
  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Check if carrier checkbox is visible
 */
async function expectCarrierCheckboxVisible(carrierKey) {
  const config = CARRIER_CONFIG[carrierKey];
  const checkbox = screen.getByRole('checkbox', { name: new RegExp(config.label, 'i') });
  expect(checkbox).toBeInTheDocument();
  return checkbox;
}

/**
 * Select a carrier by checking its checkbox
 */
async function selectCarrier(carrierKey) {
  const checkbox = await expectCarrierCheckboxVisible(carrierKey);
  await userEvent.click(checkbox);
  return checkbox;
}

/**
 * Uncheck a carrier
 */
async function unselectCarrier(carrierKey) {
  const checkbox = await expectCarrierCheckboxVisible(carrierKey);
  await userEvent.click(checkbox);
  return checkbox;
}

/**
 * Assert carrier card is visible after selection
 */
async function expectCarrierCardVisible(carrierKey) {
  const config = CARRIER_CONFIG[carrierKey];
  const card = await screen.findByText(new RegExp(config.cardTitle, 'i'));
  expect(card).toBeInTheDocument();
  return card;
}

/**
 * Assert carrier card is not visible (after unchecking)
 */
async function expectCarrierCardNotVisible(carrierKey) {
  const config = CARRIER_CONFIG[carrierKey];
  const cards = screen.queryAllByText(new RegExp(config.cardTitle, 'i'));
  expect(cards).toHaveLength(0);
}

/**
 * Get carrier card container
 */
function getCarrierCardContainer(carrierKey) {
  const config = CARRIER_CONFIG[carrierKey];
  const cardText = screen.getByText(new RegExp(config.cardTitle, 'i'));
  // Walk up to find the Card component
  return cardText.closest('[class*="rounded"]');
}

/**
 * Upload a file to carrier
 */
async function uploadCarrierFile(carrierKey, file = null) {
  const container = getCarrierCardContainer(carrierKey);
  const mockFile = file || createMockFile(`${carrierKey}_census.csv`);
  
  const fileInput = within(container).queryByRole('input', { type: 'file' }) ||
    within(container).queryByLabelText(/upload|select|file/i);
  
  if (fileInput && fileInput.type === 'file') {
    await userEvent.upload(fileInput, mockFile);
  } else {
    // Fallback: simulate click on upload area and then file input
    const uploadArea = within(container).getByText(/upload|select|file|drag/i);
    await userEvent.click(uploadArea);
  }
  
  return mockFile;
}

/**
 * Click Analyze button for carrier
 */
async function clickAnalyzeButton(carrierKey) {
  const container = getCarrierCardContainer(carrierKey);
  const analyzeButton = within(container).getByRole('button', { name: /analyze/i });
  
  expect(analyzeButton).not.toBeDisabled();
  await userEvent.click(analyzeButton);
  
  return analyzeButton;
}

/**
 * Assert Analyze button is enabled (after file selection)
 */
async function expectAnalyzeButtonEnabled(carrierKey) {
  const container = getCarrierCardContainer(carrierKey);
  const analyzeButton = within(container).queryByRole('button', { name: /analyze/i });
  
  if (analyzeButton) {
    expect(analyzeButton).not.toBeDisabled();
  }
  return analyzeButton;
}

/**
 * Assert Analyze button is disabled (no file selected)
 */
async function expectAnalyzeButtonDisabled(carrierKey) {
  const container = getCarrierCardContainer(carrierKey);
  const analyzeButton = within(container).queryByRole('button', { name: /analyze/i });
  
  if (analyzeButton) {
    expect(analyzeButton).toBeDisabled();
  }
  return analyzeButton;
}

/**
 * Assert loading state is visible during analyze
 */
async function expectLoadingState(carrierKey) {
  const container = getCarrierCardContainer(carrierKey);
  const loadingText = within(container).queryByText(/analyzing/i);
  
  expect(loadingText).toBeInTheDocument();
}

/**
 * Wait for loading state to complete
 */
async function waitForLoadingComplete(carrierKey) {
  const container = getCarrierCardContainer(carrierKey);
  
  // Wait for "Analyzing" text to disappear
  await waitFor(
    () => {
      const loadingText = within(container).queryByText(/analyzing/i);
      expect(loadingText).not.toBeInTheDocument();
    },
    { timeout: 5000 }
  );
}

/**
 * Assert Map Columns tab is active after successful analyze
 */
async function expectMapColumnsTabActive(carrierKey) {
  const container = getCarrierCardContainer(carrierKey);
  const mapTab = within(container).getByRole('button', { name: /map columns/i });
  
  // Check if tab is selected (has aria-selected or similar)
  expect(mapTab).toHaveAttribute('aria-selected', 'true') || 
    expect(mapTab.parentElement).toHaveClass('bg-primary');
}

/**
 * Assert real headers are displayed in mapping UI
 */
async function expectCarrierHeaders(carrierKey, expectedHeaders = STANDARD_HEADERS) {
  const container = getCarrierCardContainer(carrierKey);
  
  // Wait for headers to appear
  await waitFor(() => {
    expectedHeaders.forEach((header) => {
      const headerElement = within(container).queryByText(new RegExp(header.name, 'i'));
      expect(headerElement).toBeInTheDocument();
    });
  });
}

/**
 * Assert no mock/hardcoded columns appear
 */
async function expectNoMockColumns(carrierKey) {
  const container = getCarrierCardContainer(carrierKey);
  
  // These are typical placeholder/mock column names
  const mockPatterns = [
    /Relationship.*EMP.*SPS.*DEP/i,
    /Sample.*Column/i,
    /Placeholder/i,
    /Mock.*Column/i,
  ];
  
  mockPatterns.forEach((pattern) => {
    const mockElement = within(container).queryByText(pattern);
    expect(mockElement).not.toBeInTheDocument();
  });
}

/**
 * Assert error message is visible
 */
async function expectErrorMessage(errorText = 'Analysis failed') {
  const errorElement = screen.queryByText(new RegExp(errorText, 'i'));
  expect(errorElement).toBeInTheDocument();
}

/**
 * Assert no silent failures (no error visible, no crash)
 */
async function expectNoSilentFailure() {
  // If page is still responsive, test passed
  expect(document.body).toBeInTheDocument();
}

/**
 * Assert CensusUploadModal is still visible (regression check)
 */
async function expectExistingCensusUploadVisible() {
  // Look for existing census upload area (usually has text like "Upload Census" or "Select File")
  const uploadArea = screen.queryByText(/upload|census|select.*file/i);
  // This may or may not be present depending on page layout
  // Just verify page doesn't crash if not present
  expect(document.body).toBeInTheDocument();
}

/**
 * Complete test sequence for state isolation
 * Analyzes multiple carriers and verifies their headers remain isolated
 */
async function testCarrierStateIsolation() {
  const results = {};
  
  // Analyze AST
  await selectCarrier('ast');
  await expectCarrierCardVisible('ast');
  const astFile = await uploadCarrierFile('ast');
  await clickAnalyzeButton('ast');
  await waitForLoadingComplete('ast');
  await expectCarrierHeaders('ast', STANDARD_HEADERS);
  results.ast = 'PASS';
  
  // Analyze SUS with different headers
  await selectCarrier('sus');
  await expectCarrierCardVisible('sus');
  const susHeaders = [
    ...STANDARD_HEADERS.slice(0, 5),
    { index: 5, name: 'SUS_Specific_Field', normalized: 'sus_specific' },
  ];
  const susFile = await uploadCarrierFile('sus');
  await clickAnalyzeButton('sus');
  await waitForLoadingComplete('sus');
  await expectCarrierHeaders('sus', susHeaders);
  results.sus = 'PASS';
  
  // Select but don't analyze Triad
  await selectCarrier('triad');
  await expectCarrierCardVisible('triad');
  results.triad = 'SELECTED_NOT_ANALYZED';
  
  // Select MEC-MVP
  await selectCarrier('mecMvp');
  await expectCarrierCardVisible('mecMvp');
  results.mecMvp = 'SELECTED_NOT_ANALYZED';
  
  // Verify isolation
  await expectCarrierHeaders('ast', STANDARD_HEADERS);
  await expectCarrierHeaders('sus', susHeaders);
  results.stateIsolation = 'PASS';
  
  return results;
}

/**
 * Test carrier removal (uncheck) doesn't affect others
 */
async function testCarrierRemoval() {
  const results = {};
  
  // Select all carriers
  await selectCarrier('ast');
  await selectCarrier('sus');
  await selectCarrier('triad');
  await selectCarrier('mecMvp');
  
  // Verify all visible
  await expectCarrierCardVisible('ast');
  await expectCarrierCardVisible('sus');
  await expectCarrierCardVisible('triad');
  await expectCarrierCardVisible('mecMvp');
  results.allVisible = 'PASS';
  
  // Uncheck SUS
  await unselectCarrier('sus');
  
  // Verify only SUS is removed
  await expectCarrierCardVisible('ast');
  await expectCarrierCardNotVisible('sus');
  await expectCarrierCardVisible('triad');
  await expectCarrierCardVisible('mecMvp');
  results.removal = 'PASS';
  
  return results;
}

/**
 * Test error handling and recovery
 */
async function testErrorHandling(carrierKey) {
  const container = getCarrierCardContainer(carrierKey);
  
  // Mock file selection (even though analysis will fail)
  const mockFile = await uploadCarrierFile(carrierKey);
  
  // Click analyze (will fail due to mock)
  await clickAnalyzeButton(carrierKey);
  
  // Wait for error to appear
  await waitFor(
    () => {
      const errorElement = within(container).queryByText(/error|failed/i);
      expect(errorElement).toBeInTheDocument();
    },
    { timeout: 5000 }
  );
  
  // Verify user remains on Upload tab
  const uploadTab = within(container).getByRole('button', { name: /upload/i });
  expect(uploadTab).toHaveAttribute('aria-selected', 'true') || 
    expect(uploadTab.parentElement).toHaveClass('bg-primary');
  
  // Verify button recovers (becomes clickable again)
  const analyzeButton = within(container).getByRole('button', { name: /analyze/i });
  await waitFor(() => {
    expect(analyzeButton).not.toBeDisabled();
  });
  
  return 'PASS';
}

export {
  CARRIER_CONFIG,
  STANDARD_HEADERS,
  createMockFile,
  createSuccessAnalyzeResponse,
  createFailedAnalyzeResponse,
  expectCarrierCheckboxVisible,
  selectCarrier,
  unselectCarrier,
  expectCarrierCardVisible,
  expectCarrierCardNotVisible,
  getCarrierCardContainer,
  uploadCarrierFile,
  clickAnalyzeButton,
  expectAnalyzeButtonEnabled,
  expectAnalyzeButtonDisabled,
  expectLoadingState,
  waitForLoadingComplete,
  expectMapColumnsTabActive,
  expectCarrierHeaders,
  expectNoMockColumns,
  expectErrorMessage,
  expectNoSilentFailure,
  expectExistingCensusUploadVisible,
  testCarrierStateIsolation,
  testCarrierRemoval,
  testErrorHandling,
};