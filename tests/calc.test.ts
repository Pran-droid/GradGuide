import { describe, it, expect } from 'vitest';
import {
  calculateTotalCost,
  calculateFundingAvailable,
  calculateFundingGap,
  calculateNetWorth,
  calculateEMI,
  calculateEMIRange,
  formatINR,
} from '../src/lib/calc';
import { Study, Funding, FinancialProfile } from '../src/lib/types';

describe('Calculations (Section 8 specs)', () => {
  it('Cost/gap calculation', () => {
    const study: Study = {
      durationYears: 2,
      totalTuition: 3000000,
      livingCostPerYear: 1000000,
      otherCosts: 0, // not specified, implicitly 0
    };
    const funding: Funding = {
      savings: 500000,
      scholarship: 300000,
      familyContribution: 700000,
      feesAlreadyPaid: 200000,
    };

    const totalCost = calculateTotalCost(study);
    expect(totalCost).toBe(5000000);

    const fundingAvailable = calculateFundingAvailable(funding);
    expect(fundingAvailable).toBe(1700000);

    const gap = calculateFundingGap(totalCost, fundingAvailable);
    expect(gap).toBe(3300000);
  });

  it('EMI calculation', () => {
    const P = 3300000;
    const rate = 9.00;
    const tenor = 10;
    const emi = calculateEMI(P, rate, tenor);
    // about 41,803 per month (within 1 rupee of 41,803.01)
    expect(emi).toBeGreaterThanOrEqual(41802);
    expect(emi).toBeLessThanOrEqual(41804);
  });

  it('Zero gap (funding >= cost)', () => {
    const gap = calculateFundingGap(5000000, 6000000);
    expect(gap).toBe(0);
  });

  it('Zero rate EMI', () => {
    const P = 1200000;
    const rate = 0;
    const tenor = 10;
    // 10 years = 120 months. 1200000 / 120 = 10000
    const emi = calculateEMI(P, rate, tenor);
    expect(emi).toBe(10000);
  });

  it('Net worth calculation', () => {
    const profile: FinancialProfile = {
      assets: [{ type: 'Property', value: 8000000 }],
      liabilities: [{ type: 'Home Loan', amount: 2000000 }],
    };
    const netWorth = calculateNetWorth(profile);
    expect(netWorth).toBe(6000000);
  });

  it('EMI Range calculation', () => {
    const P = 3300000;
    const range = calculateEMIRange(P, 9.25, 9.75, 10);
    // 9.25% EMI for 33L over 10yr is ~42,250
    // 9.75% EMI for 33L over 10yr is ~43,162
    expect(range.minEMI).toBeGreaterThan(42240);
    expect(range.minEMI).toBeLessThan(42260);
    expect(range.maxEMI).toBeGreaterThan(43150);
    expect(range.maxEMI).toBeLessThan(43170);
  });

  it('INR Formatting', () => {
    expect(formatINR(5000000)).toBe('50,00,000');
    expect(formatINR(3300000)).toBe('33,00,000');
    expect(formatINR(41803)).toBe('41,803');
    expect(formatINR(1000)).toBe('1,000');
  });

  it('Optional Moratorium Interest', () => {
    // If a student studies for 2 years and borrows 10,00,000 at 10%
    // Simple interest during moratorium: 10,00,000 * 10% * 2 = 2,00,000
    // Total principal for EMI = 12,00,000. Over 10 years at 10% -> ~15,858
    const P = 1000000;
    const rate = 10;
    const tenor = 10;
    const moratorium = 2;
    const emi = calculateEMI(P, rate, tenor, moratorium);
    expect(emi).toBeGreaterThan(15850);
    expect(emi).toBeLessThan(15865);
  });
});

describe('Edge cases and null safety', () => {
  it('returns null for tenor 0, loan 0, negative inputs, missing fields in EMI', () => {
    expect(calculateEMI(0, 9, 10)).toBeNull(); // loan 0
    expect(calculateEMI(3300000, 9, 0)).toBeNull(); // tenor 0
    expect(calculateEMI(3300000, undefined, 10)).toBeNull(); // rate undefined
    expect(calculateEMI(-500, 9, 10)).toBeNull(); // negative principal
    expect(calculateEMI(3300000, -9, 10)).toBeNull(); // negative rate
    expect(calculateEMI(3300000, 9, -10)).toBeNull(); // negative tenor
  });

  it('handles empty/undefined fields and exchangeRate 0 or missing in totalCost', () => {
    // Missing required fields
    expect(calculateTotalCost({})).toBeNull();
    expect(calculateTotalCost({ durationYears: 2 })).toBeNull();

    // Exchange rate missing or 0 -> ignored
    const studyNormal = { totalTuition: 1000, livingCostPerYear: 500, durationYears: 2 };
    expect(calculateTotalCost(studyNormal)).toBe(2000);
    
    const studyZeroEx = { ...studyNormal, exchangeRateToINR: 0 };
    expect(calculateTotalCost(studyZeroEx)).toBe(2000);
    
    // Negative inputs
    expect(calculateTotalCost({ totalTuition: -1000, livingCostPerYear: 500, durationYears: 2 })).toBeNull();
  });

  it('handles foreign currency logic (Fix 1)', () => {
    // USD with valid rate
    const studyUSD = { currency: 'USD', exchangeRateToINR: 83, totalTuition: 1000, durationYears: 1 };
    expect(calculateTotalCost(studyUSD)).toBe(83000);

    // USD with no rate
    expect(calculateTotalCost({ currency: 'USD', totalTuition: 1000, durationYears: 1 })).toEqual({ error: 'EXCHANGE_RATE_REQUIRED' });

    // USD with rate 0
    expect(calculateTotalCost({ currency: 'USD', exchangeRateToINR: 0, totalTuition: 1000, durationYears: 1 })).toEqual({ error: 'EXCHANGE_RATE_REQUIRED' });

    // INR with a stray rate
    const studyINR = { currency: 'INR', exchangeRateToINR: 83, totalTuition: 1000, durationYears: 1 };
    expect(calculateTotalCost(studyINR)).toBe(1000);
  });

  it('handles funding fields and optional study costs (Fix 2)', () => {
    // Gap with all funding blank equals total cost
    const cost = 100000;
    expect(calculateFundingGap(cost, calculateFundingAvailable({}))).toBe(100000);

    // Gap with only savings filled
    expect(calculateFundingGap(cost, calculateFundingAvailable({ savings: 20000 }))).toBe(80000);

    // Missing livingCostPerYear is treated as 0
    expect(calculateTotalCost({ totalTuition: 50000, durationYears: 2 })).toBe(50000);
  });

  it('handles empty/undefined in gap and net worth', () => {
    expect(calculateFundingGap(null, 100)).toBeNull();
    expect(calculateFundingGap(100, null)).toBeNull();
    expect(calculateFundingGap(-100, 100)).toBeNull();
    
    expect(calculateNetWorth({})).toBeNull();
    expect(calculateNetWorth({ assets: [] })).toBeNull(); // liabilities missing
  });

  it('handles empty inputs for formatting', () => {
    expect(formatINR(null)).toBe('');
    expect(formatINR(undefined)).toBe('');
  });
});
