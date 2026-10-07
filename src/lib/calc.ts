import type { Study, Funding, FinancialProfile } from './types';

type CalcResult = number | null | { error: 'EXCHANGE_RATE_REQUIRED' };

export function calculateTotalCost(study: Partial<Study>): CalcResult {
  if (
    study.totalTuition === undefined || isNaN(study.totalTuition) || study.totalTuition < 0 ||
    study.durationYears === undefined || isNaN(study.durationYears) || study.durationYears < 0
  ) {
    return null;
  }
  
  const living = (study.livingCostPerYear !== undefined && !isNaN(study.livingCostPerYear) && study.livingCostPerYear >= 0) ? study.livingCostPerYear : 0;
  const other = (study.otherCosts !== undefined && !isNaN(study.otherCosts) && study.otherCosts >= 0) ? study.otherCosts : 0;
  let cost = study.totalTuition + (living * study.durationYears) + other;
  
  const curr = study.currency || 'INR';
  if (curr !== 'INR') {
    if (!study.exchangeRateToINR || isNaN(study.exchangeRateToINR) || study.exchangeRateToINR <= 0) {
      return { error: 'EXCHANGE_RATE_REQUIRED' };
    }
    cost = cost * study.exchangeRateToINR;
  }
  
  return cost;
}

export function calculateFundingAvailable(funding: Partial<Funding>): number | null {
  const savings = funding.savings || 0;
  const scholarship = funding.scholarship || 0;
  const feesPaid = funding.feesAlreadyPaid || 0;
  const family = funding.familyContribution || 0;
  
  if (savings < 0 || scholarship < 0 || feesPaid < 0 || family < 0) return null;
  return savings + scholarship + feesPaid + family;
}

export function calculateFundingGap(totalCost: CalcResult, fundingAvailable: number | null): CalcResult {
  if (totalCost === null || fundingAvailable === null) return null;
  if (typeof totalCost === 'object') return totalCost; // pass through the error object
  if (totalCost < 0 || fundingAvailable < 0) return null;
  return Math.max(0, totalCost - fundingAvailable);
}

export function calculateNetWorth(profile: Partial<FinancialProfile>): number | null {
  if (!profile.assets || !profile.liabilities) return null;
  const totalAssets = profile.assets.reduce((sum, a) => sum + (a.value > 0 ? a.value : 0), 0);
  const totalLiabs = profile.liabilities.reduce((sum, l) => sum + (l.amount > 0 ? l.amount : 0), 0);
  return totalAssets - totalLiabs;
}

export function calculateEMI(
  principal: number | undefined,
  annualRate: number | undefined,
  tenorYears: number | undefined,
  moratoriumYears: number = 0
): number | null {
  if (principal === undefined || isNaN(principal) || principal <= 0) return null;
  if (annualRate === undefined || isNaN(annualRate) || annualRate < 0) return null;
  if (tenorYears === undefined || isNaN(tenorYears) || tenorYears <= 0) return null;
  if (moratoriumYears < 0) return null;

  // Add simple interest to principal if moratorium applies
  let pEffective = principal;
  if (moratoriumYears > 0) {
    pEffective += principal * (annualRate / 100) * moratoriumYears;
  }

  const n = tenorYears * 12; // total months
  if (annualRate === 0) {
    return pEffective / n;
  }

  const r = annualRate / 12 / 100; // monthly rate
  const onePlusRPowN = Math.pow(1 + r, n);
  
  const emi = (pEffective * r * onePlusRPowN) / (onePlusRPowN - 1);
  if (!isFinite(emi)) return null;
  return emi;
}

export function calculateEMIRange(
  principal: number | undefined,
  rateMin: number | undefined,
  rateMax: number | undefined,
  tenorYears: number | undefined,
  moratoriumYears: number = 0
): { minEMI: number; maxEMI: number } | null {
  const minEMI = calculateEMI(principal, rateMin, tenorYears, moratoriumYears);
  const maxEMI = calculateEMI(principal, rateMax, tenorYears, moratoriumYears);
  
  if (minEMI === null || maxEMI === null) return null;
  return { minEMI, maxEMI };
}

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '';
  // Round to nearest integer for display to avoid ugly decimals in large sums
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('en-IN').format(rounded);
}
