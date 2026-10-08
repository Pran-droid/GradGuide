import rawLendersData from '../data/lenders.json';
import type { Student, Study, LendersData } from './types';

const lendersData = rawLendersData as unknown as LendersData;

export type AssessmentStatus = 'meets' | 'does_not_meet' | 'cannot_assess';

export type ReasonCode = 
  | 'NOT_AVAILABLE'
  | 'RANK_UNKNOWN'
  | 'RANK_TOO_LOW'
  | 'GENDER_NOT_SPECIFIED_OR_OTHER'
  | 'GENDER_MISMATCH'
  | 'NO_CIBIL_CRITERION'
  | 'CIBIL_UNKNOWN'
  | 'CIBIL_BELOW_MIN'
  | 'GAP_NOT_CALCULABLE'
  | 'RATE_OVERRIDE_NOTE'
  | 'UNSUPPORTED_CRITERION';

export interface Reason {
  code: ReasonCode;
  message: string;
  field?: string;
}

export interface AssessmentResult {
  lender: string;
  product_type: 'collateral' | 'non_collateral';
  status: AssessmentStatus;
  rate_min?: number;
  rate_max?: number;
  reasons: Reason[];
  what_would_change: string[];
  condition_gender?: string;
}

export function groupByLenderRoute(results: AssessmentResult[]): AssessmentResult[] {
  const grouped = new Map<string, AssessmentResult[]>();
  for (const r of results) {
    const key = `${r.lender}-${r.product_type}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const merged: AssessmentResult[] = [];
  
  for (const group of grouped.values()) {
    if (group.length === 1) {
      merged.push(group[0]);
    } else {
      const first = group[0];
      const ratesMin = group.map(g => g.rate_min).filter((r): r is number => r !== undefined);
      const ratesMax = group.map(g => g.rate_max).filter((r): r is number => r !== undefined);
      
      const minRate = ratesMin.length ? Math.min(...ratesMin) : undefined;
      const maxRate = ratesMax.length ? Math.max(...ratesMax) : undefined;
      
      const noteParts = group
        .filter(g => g.condition_gender && g.rate_min)
        .map(g => `${g.rate_min?.toFixed(2)}% (${g.condition_gender})`);
      
      // Filter out duplicate reasons (like GENDER_NOT_SPECIFIED_OR_OTHER)
      const uniqueReasonsMap = new Map<string, Reason>();
      for (const g of group) {
        for (const r of g.reasons) {
          uniqueReasonsMap.set(r.code, r);
        }
      }
      
      const mergedReasons = Array.from(uniqueReasonsMap.values());
      if (noteParts.length > 0) {
        mergedReasons.push({
          code: 'RATE_OVERRIDE_NOTE',
          message: `Rate depends on gender: ${noteParts.join(' / ')}`,
          field: 'gender'
        });
      }
      
      let mergedStatus: AssessmentStatus = 'meets';
      for (const g of group) {
        if (g.status === 'does_not_meet') mergedStatus = 'does_not_meet';
        else if (g.status === 'cannot_assess' && mergedStatus !== 'does_not_meet') mergedStatus = 'cannot_assess';
      }
      
      merged.push({
        ...first,
        status: mergedStatus,
        rate_min: minRate,
        rate_max: maxRate,
        reasons: mergedReasons,
      });
    }
  }
  return merged;
}

export function assessLenders(
  student: Partial<Student>,
  study: Partial<Study>,
  fundingGap: number | null | { error: string }
): AssessmentResult[] {
  const results: AssessmentResult[] = [];
  
  const cibil = student.cibilScore;
  const rank = study.universityRank;
  const gender = student.gender;
  
  const isGapNull = fundingGap === null || typeof fundingGap === 'object';
  
  for (const lender of lendersData.lenders) {
    for (const product of lender.products) {
      let productStatus: AssessmentStatus = 'meets';
      const reasons: Reason[] = [];
      const whatWouldChange: string[] = [];
      
      // 1. Available check
      if (product.available === false) {
        reasons.push({ code: 'NOT_AVAILABLE', message: product.note || 'Not possible' });
        productStatus = 'does_not_meet';
      }
      
      // 2. Conditions check
      let shouldOmit = false;
      if (product.conditions) {
        if ('university_rank_max' in product.conditions) {
          const maxRank = product.conditions.university_rank_max;
          if (maxRank !== undefined) {
            if (rank === undefined || isNaN(rank)) {
              reasons.push({ code: 'RANK_UNKNOWN', message: 'university rank not provided', field: 'universityRank' });
              if (productStatus !== 'does_not_meet') productStatus = 'cannot_assess';
            } else if (rank > maxRank) {
              reasons.push({ code: 'RANK_TOO_LOW', message: `requires top ${maxRank} university`, field: 'universityRank' });
              whatWouldChange.push(`admission to a top-${maxRank} university`);
              productStatus = 'does_not_meet';
            }
          }
        }
        
        if ('gender' in product.conditions) {
          const reqGender = product.conditions.gender;
          if (gender !== reqGender) {
            if (gender === undefined || gender === 'other' || gender === 'not specified') {
              reasons.push({ code: 'GENDER_NOT_SPECIFIED_OR_OTHER', message: 'gender not specified or other, dataset only defines male/female', field: 'gender' });
              if (productStatus !== 'does_not_meet') productStatus = 'cannot_assess';
            } else {
              shouldOmit = true;
            }
          }
        }
        
        // Unsupported criteria check
        for (const key of Object.keys(product.conditions)) {
          if (key !== 'university_rank_max' && key !== 'gender') {
            reasons.push({ code: 'UNSUPPORTED_CRITERION', message: `unsupported criterion: ${key}` });
            if (productStatus !== 'does_not_meet') productStatus = 'cannot_assess';
          }
        }
      }
      if (shouldOmit) continue;
      
      // 3. CIBIL check
      if (lender.min_cibil === null) {
        reasons.push({ code: 'NO_CIBIL_CRITERION', message: 'no CIBIL criterion in dataset', field: 'cibilScore' });
        if (productStatus !== 'does_not_meet') productStatus = 'cannot_assess';
      } else {
        if (cibil === undefined || isNaN(cibil)) {
          reasons.push({ code: 'CIBIL_UNKNOWN', message: 'CIBIL not provided', field: 'cibilScore' });
          if (productStatus !== 'does_not_meet') productStatus = 'cannot_assess';
        } else if (cibil < lender.min_cibil) {
          reasons.push({ code: 'CIBIL_BELOW_MIN', message: `requires min CIBIL ${lender.min_cibil}`, field: 'cibilScore' });
          whatWouldChange.push(`CIBIL ${lender.min_cibil - cibil} points higher`);
          productStatus = 'does_not_meet';
        }
      }
      
      // 4. Rate overrides
      let finalRateMin = product.rate_min;
      let finalRateMax = product.rate_max;
      
      if (product.rate_overrides) {
        for (const override of product.rate_overrides) {
          let match = true;
          if (override.when.gender) {
            if (override.when.gender !== gender) {
              match = false;
              if (gender === undefined || gender === 'not specified' || gender === 'other') {
                reasons.push({ 
                  code: 'RATE_OVERRIDE_NOTE', 
                  message: `${override.rate_min.toFixed(2)}% applies for ${override.when.gender} students`, 
                  field: 'gender' 
                });
              }
            }
          }
          if (match) {
            finalRateMin = override.rate_min;
            finalRateMax = override.rate_max;
            break; // apply first match
          }
        }
      }
      
      // Funding gap null message
      if (isGapNull) {
        reasons.push({ code: 'GAP_NOT_CALCULABLE', message: 'loan amount not calculable yet', field: 'fundingGap' });
      }

      results.push({
        lender: lender.name,
        product_type: product.type as 'collateral' | 'non_collateral',
        status: productStatus,
        rate_min: finalRateMin,
        rate_max: finalRateMax,
        reasons,
        what_would_change: whatWouldChange,
        condition_gender: product.conditions?.gender
      });
    }
  }
  
  const groupedResults = groupByLenderRoute(results);
  
  // Sort: meets first, then cannot_assess, then does_not_meet. Within group by lowest rate.
  const statusWeight: Record<AssessmentStatus, number> = { 'meets': 1, 'cannot_assess': 2, 'does_not_meet': 3 };
  groupedResults.sort((a, b) => {
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[a.status] - statusWeight[b.status];
    }
    const rateA = a.rate_min ?? 999;
    const rateB = b.rate_min ?? 999;
    return rateA - rateB;
  });
  
  return groupedResults;
}
