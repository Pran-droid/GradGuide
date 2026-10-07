import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Results from '../src/pages/Results';
import { IntakeProvider } from '../src/store/IntakeContext';
import * as calcModule from '../src/lib/calc';

// Mock evaluate to return specific test values
vi.mock('../src/lib/assess', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/assess')>();
  return {
    ...actual,
    assessLenders: vi.fn().mockReturnValue([
      {
        lender: 'Test Lender 1',
        product_type: 'non_collateral',
        status: 'meets',
        rate_min: 8.5,
        rate_max: 8.5,
        reasons: [],
        what_would_change: []
      },
      {
        lender: 'Test Lender 2',
        product_type: 'non_collateral',
        status: 'cannot_assess',
        rate_min: 9.0,
        rate_max: 9.5,
        reasons: [
          { code: 'NO_CIBIL_CRITERION', message: 'no CIBIL criterion', field: 'cibilScore' },
          { code: 'CIBIL_UNKNOWN', message: 'CIBIL not provided', field: 'cibilScore' }
        ],
        what_would_change: []
      },
      {
        lender: 'Test Lender 3',
        product_type: 'non_collateral',
        status: 'does_not_meet',
        reasons: [
          { code: 'RANK_TOO_LOW', message: 'requires top 100 university', field: 'universityRank' }
        ],
        what_would_change: ['admission to a top-100 university']
      }
    ])
  };
});

describe('Results Component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all three badge states correctly', () => {
    render(
      <IntakeProvider>
        <Results onBack={() => {}} />
      </IntakeProvider>
    );

    expect(screen.getByText('Criteria met')).toBeInTheDocument();
    expect(screen.getByText('Cannot assess')).toBeInTheDocument();
    expect(screen.getByText('Criteria not met')).toBeInTheDocument();
  });

  it('renders missing information panel correctly (NO_CIBIL_CRITERION does not trigger it alone, but CIBIL_UNKNOWN does)', () => {
    render(
      <IntakeProvider>
        <Results onBack={() => {}} />
      </IntakeProvider>
    );

    expect(screen.getByTestId('missing-info-panel')).toBeInTheDocument();
    expect(screen.getByText('CIBIL Score')).toBeInTheDocument();
    expect(screen.queryByText('University Rank')).not.toBeInTheDocument(); // Since we didn't mock RANK_UNKNOWN
    expect(screen.getByText('Collateral')).toBeInTheDocument(); // By default collateral is empty
  });

  it('renders null-gap message properly inside the card', () => {
    render(
      <IntakeProvider>
        <Results onBack={() => {}} />
      </IntakeProvider>
    );

    expect(screen.getAllByText('Loan amount not calculable yet')[0]).toBeInTheDocument();
  });

  it('renders study costs missing message when total cost is null', () => {
    vi.spyOn(calcModule, 'calculateTotalCost').mockReturnValue(null);
    render(
      <IntakeProvider>
        <Results onBack={() => {}} />
      </IntakeProvider>
    );

    expect(screen.getByText('Study costs (tuition and course duration)')).toBeInTheDocument();
  });
});
