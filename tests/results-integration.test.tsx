import React, { useEffect } from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../src/pages/Results';
import { IntakeProvider } from '../src/store/IntakeProvider';
import { useIntake } from '../src/store/useIntake';

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

  it('scenarios: changing rank to <= 100 changes non-collateral products and lowest rate', async () => {
    function ScenarioTestWrapper() {
      const { setStudent, setStudy, setFunding, setFinancialProfile, setCollateral, setAssumptions } = useIntake();
      
      useEffect(() => {
        // Start with a profile that has rank 150, so BOB and SBI fail on rank.
        setStudent({ gender: 'female', cibilScore: 750, coApplicantType: 'salaried' });
        setStudy({ 
          universityRank: 150,
          durationYears: 2, 
          totalTuition: 3000000, 
          livingCostPerYear: 1000000,
          currency: 'INR'
        });
        setFunding({ familyContribution: 1000000, scholarship: 0, savings: 0, feesAlreadyPaid: 0 });
        setFinancialProfile({ assets: [], liabilities: [] });
        setCollateral([]);
        setAssumptions({ tenorYears: 10 });
      }, [setStudent, setStudy, setFunding, setFinancialProfile, setCollateral, setAssumptions]);

      return <Results onBack={() => {}} />;
    }

    render(
      <IntakeProvider>
        <ScenarioTestWrapper />
      </IntakeProvider>
    );

    // Wait for the scenario button
    const addBtn = await screen.findByRole('button', { name: 'Add Scenario' });
    fireEvent.click(addBtn);

    const scenarioCard = screen.getByDisplayValue('Scenario 1').closest('.snap-center') as HTMLElement;

    // Initial state: rank is empty. BOB non collateral is "Cannot assess" (rank unknown) or "Criteria not met"
    // So lowest rate shouldn't be the BOB/SBI non-collateral one. Let's see what the initial lowest rate is.
    
    // Check initial text
    const lowestRateContainer = within(scenarioCard).getByText('Lowest Rate').parentElement!;
    const initialRateText = lowestRateContainer.querySelector('span.font-bold')?.textContent;
    expect(initialRateText).toBe('None met in dataset'); 
    
    // Check cannot assess rate
    const cannotAssessContainer = within(scenarioCard).getByText("Lowest rate among lenders we can't fully assess").parentElement!;
    const cannotAssessRateText = cannotAssessContainer.querySelector('span.font-bold')?.textContent;
    expect(cannotAssessRateText).toBe('10.25%');

    // Change rank to 50
    const spinButtons = within(scenarioCard).getAllByRole('spinbutton');
    fireEvent.change(spinButtons[0], { target: { value: '50' } }); // Rank is first spinbutton (index 0)

    // Now rank is 50. BOB non-collateral needs rank <= 100 and CIBIL >= 700. SBI needs rank <= 100 and CIBIL >= 750.
    // SBI rate is 9.40%. BOB rate is 8.45%.
    // The lowest rate should update to 8.45%
    const updatedRateText = lowestRateContainer.querySelector('span.font-bold')?.textContent;
    expect(updatedRateText).toBe('8.45%');
    
    // Change tenor to 15 years (index 5)
    const initialEmi = within(scenarioCard).getByText(/Est\. EMI/).parentElement!.querySelector('span.font-medium')?.textContent;
    fireEvent.change(spinButtons[5], { target: { value: '15' } });
    const updatedEmi = within(scenarioCard).getByText(/Est\. EMI/).parentElement!.querySelector('span.font-medium')?.textContent;
    expect(initialEmi).not.toBe(updatedEmi);
    
    // Funding gap should be unchanged
    const gapContainer = within(scenarioCard).getByText('Funding Gap').parentElement!;
    const gapText = gapContainer.querySelector('span.font-bold')?.textContent;
    expect(gapText).toBe('₹ 40,00,000');
    
    // Make gap null (by removing total tuition)
    fireEvent.change(spinButtons[1], { target: { value: '' } }); // Total Tuition is index 1
    
    // Need to make total cost completely null by clearing all costs. Wait, the base test wrapper has 1000000 livingCostPerYear, which we can't edit in scenario!
    // Ah, Scenario comparison doesn't let us edit livingCostPerYear. So we can't make the gap completely null this way if there's living cost.
    // Wait, totalCost is null if we are missing `durationYears` or `livingCostPerYear` or `totalTuition`.
    // Wait, `calc.ts` calculates total cost if `totalTuition` is provided?
    // Let's just check that editing a scenario doesn't change the main store.
    const mainGapCards = screen.getAllByText('Funding Gap');
    const mainGapCard = mainGapCards[0].parentElement!;
    const mainGapText = mainGapCard.querySelector('.text-lg.font-bold')?.textContent;
    expect(mainGapText).toBe('₹ 40,00,000'); // Remains 40,00,000 even though we cleared Tuition in scenario
  });
  
  it('scenarios: null gap shows not calculable yet', async () => {
    function NullGapTestWrapper() {
      const { setStudent, setStudy, setFunding, setFinancialProfile, setCollateral, setAssumptions } = useIntake();
      
      useEffect(() => {
        // Missing duration to force totalCost and gap to be null
        setStudent({ gender: 'female', cibilScore: 750, coApplicantType: 'salaried' });
        setStudy({ 
          totalTuition: 3000000, 
          currency: 'INR'
        });
        setFunding({ familyContribution: 1000000, scholarship: 0, savings: 0, feesAlreadyPaid: 0 });
        setFinancialProfile({ assets: [], liabilities: [] });
        setCollateral([]);
        setAssumptions({ tenorYears: 10 });
      }, [setStudent, setStudy, setFunding, setFinancialProfile, setCollateral, setAssumptions]);

      return <Results onBack={() => {}} />;
    }

    render(
      <IntakeProvider>
        <NullGapTestWrapper />
      </IntakeProvider>
    );

    const addBtn = await screen.findByRole('button', { name: 'Add Scenario' });
    fireEvent.click(addBtn);
    
    const scenarioCard = screen.getByDisplayValue('Scenario 1').closest('.snap-center') as HTMLElement;
    
    const emiContainer = within(scenarioCard).getByText(/Est\. EMI/).parentElement!;
    const emiText = emiContainer.querySelector('span.font-medium')?.textContent;
    expect(emiText).toBe('not calculable yet');
  });
});
