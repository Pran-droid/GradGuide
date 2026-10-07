import React, { useEffect } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../src/pages/Results';
import { IntakeProvider, useIntake } from '../src/store/IntakeContext';

function TestWrapper() {
  const { loadSampleProfile, student } = useIntake();
  
  useEffect(() => {
    loadSampleProfile();
  }, [loadSampleProfile]);

  // Wait until the sample profile is fully loaded before rendering Results
  if (student.cibilScore !== 710) return null;

  return <Results onBack={() => {}} />;
}

describe('Results Component Integration', () => {
  it('runs assessLenders with the sample profile and renders expected outcomes', async () => {
    render(
      <IntakeProvider>
        <TestWrapper />
      </IntakeProvider>
    );

    // Wait for the panel to appear
    const missingPanel = await screen.findByTestId('missing-info-panel');
    
    // a) Missing Information panel does not contain "CIBIL Score"
    expect(within(missingPanel).queryByText('CIBIL Score')).not.toBeInTheDocument();
    
    // Helper to find a specific lender card
    const getCard = (lender: string, route: string) => {
      const headings = screen.getAllByRole('heading', { level: 4, name: lender });
      const heading = headings.find(h => h.nextElementSibling?.textContent?.toLowerCase() === route.toLowerCase());
      if (!heading) throw new Error(`Card not found: ${lender} ${route}`);
      return heading.closest('.border.border-slate-200') as HTMLElement;
    };

    // b) BOB non-collateral shows "Criteria met"
    const bobCard = getCard('BOB', 'non collateral');
    expect(within(bobCard).getByText('Criteria met')).toBeInTheDocument();

    // c) SBI shows "Criteria not met"
    const sbiCard = getCard('SBI', 'non collateral');
    expect(within(sbiCard).getByText('Criteria not met')).toBeInTheDocument();

    // d) Credila and Auxilo show "Cannot assess"
    const credilaCard = getCard('Credila', 'non collateral');
    expect(within(credilaCard).getByText('Cannot assess')).toBeInTheDocument();

    const auxiloCard = getCard('Auxilo', 'non collateral');
    expect(within(auxiloCard).getByText('Cannot assess')).toBeInTheDocument();
  });
});
