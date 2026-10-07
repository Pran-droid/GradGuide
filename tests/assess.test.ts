import { describe, it, expect } from 'vitest';
import { assessLenders } from '../src/lib/assess';
import { Student, Study } from '../src/lib/types';

describe('Lender Assessment (Section 5 specs)', () => {
  it('BOI collateral female 8.60% vs default 9.00%', () => {
    const studentF: Partial<Student> = { gender: 'female', cibilScore: 750 };
    const resF = assessLenders(studentF, {}, 100000);
    const boiF = resF.find(r => r.lender === 'BOI' && r.product_type === 'collateral');
    expect(boiF?.rate_min).toBe(8.60);

    const studentM: Partial<Student> = { gender: 'male', cibilScore: 750 };
    const resM = assessLenders(studentM, {}, 100000);
    const boiM = resM.find(r => r.lender === 'BOI' && r.product_type === 'collateral');
    expect(boiM?.rate_min).toBe(9.00);
  });

  it('BOB collateral male 8.95 / female 8.75 / other => cannot_assess (and merged)', () => {
    // Male
    const resM = assessLenders({ gender: 'male', cibilScore: 750 }, {}, 100000);
    const bobColM = resM.filter(r => r.lender === 'BOB' && r.product_type === 'collateral');
    expect(bobColM.length).toBe(1);
    expect(bobColM[0].rate_min).toBe(8.95);

    // Female
    const resF = assessLenders({ gender: 'female', cibilScore: 750 }, {}, 100000);
    const bobColF = resF.filter(r => r.lender === 'BOB' && r.product_type === 'collateral');
    expect(bobColF.length).toBe(1);
    expect(bobColF[0].rate_min).toBe(8.75);

    // Other/Missing
    const resO = assessLenders({ gender: 'other', cibilScore: 750 }, {}, 100000);
    const bobColO = resO.filter(r => r.lender === 'BOB' && r.product_type === 'collateral');
    expect(bobColO.length).toBe(1);
    expect(bobColO[0].status).toBe('cannot_assess');
    expect(bobColO[0].rate_min).toBe(8.75);
    expect(bobColO[0].rate_max).toBe(8.95);
    expect(bobColO[0].reasons.some(r => r.message.includes('Rate depends on gender'))).toBe(true);

    // Other/Missing with low CIBIL
    const resLow = assessLenders({ gender: 'other', cibilScore: 650 }, {}, 100000);
    const bobColLow = resLow.filter(r => r.lender === 'BOB' && r.product_type === 'collateral');
    expect(bobColLow.length).toBe(1);
    expect(bobColLow[0].status).toBe('does_not_meet');
    expect(bobColLow[0].reasons).toContainEqual(expect.objectContaining({ code: 'CIBIL_BELOW_MIN' }));
    expect(bobColLow[0].reasons.some(r => r.message.includes('Rate depends on gender'))).toBe(true);
  });

  it('top-100 conditions (rank 150 => does_not_meet, missing rank => cannot_assess)', () => {
    const res150 = assessLenders({ gender: 'male', cibilScore: 750 }, { universityRank: 150 }, 100000);
    const bobNon150 = res150.find(r => r.lender === 'BOB' && r.product_type === 'non_collateral');
    expect(bobNon150?.status).toBe('does_not_meet');

    const resMissing = assessLenders({ gender: 'male', cibilScore: 750 }, {}, 100000);
    const bobNonMissing = resMissing.find(r => r.lender === 'BOB' && r.product_type === 'non_collateral');
    expect(bobNonMissing?.status).toBe('cannot_assess');
    expect(bobNonMissing?.reasons).toContainEqual(expect.objectContaining({ code: 'RANK_UNKNOWN' }));
  });

  it('BOI non-collateral not available', () => {
    const res = assessLenders({ gender: 'male', cibilScore: 750 }, {}, 100000);
    const boiNon = res.find(r => r.lender === 'BOI' && r.product_type === 'non_collateral');
    expect(boiNon?.status).toBe('does_not_meet');
    expect(boiNon?.reasons).toContainEqual(expect.objectContaining({ code: 'NOT_AVAILABLE' }));
  });

  it('CIBIL 710 => BOB meets, SBI does_not_meet', () => {
    // Note: bob non-collateral requires top 100 rank, so we provide rank 50
    const res = assessLenders({ gender: 'male', cibilScore: 710 }, { universityRank: 50 }, 100000);
    
    const bobNon = res.find(r => r.lender === 'BOB' && r.product_type === 'non_collateral');
    expect(bobNon?.status).toBe('meets');

    const sbiNon = res.find(r => r.lender === 'SBI' && r.product_type === 'non_collateral');
    expect(sbiNon?.status).toBe('does_not_meet');
    expect(sbiNon?.reasons).toContainEqual(expect.objectContaining({ code: 'CIBIL_BELOW_MIN' }));
  });

  it('Credila and Auxilo => cannot_assess (no CIBIL criterion in dataset)', () => {
    const res = assessLenders({ gender: 'male', cibilScore: 800 }, { universityRank: 50 }, 100000);
    const credila = res.find(r => r.lender === 'Credila' && r.product_type === 'non_collateral');
    const auxilo = res.find(r => r.lender === 'Auxilo' && r.product_type === 'non_collateral');
    
    expect(credila?.status).toBe('cannot_assess');
    expect(credila?.reasons).toContainEqual(expect.objectContaining({ code: 'NO_CIBIL_CRITERION' }));
    
    expect(auxilo?.status).toBe('cannot_assess');
    expect(auxilo?.reasons).toContainEqual(expect.objectContaining({ code: 'NO_CIBIL_CRITERION' }));
  });

  it('CIBIL exactly equal to the minimum (700 for BOB) => meets; 699 => does_not_meet', () => {
    // 700
    const res700 = assessLenders({ gender: 'male', cibilScore: 700 }, { universityRank: 50 }, 100000);
    const bob700 = res700.find(r => r.lender === 'BOB' && r.product_type === 'non_collateral');
    expect(bob700?.status).toBe('meets');
    
    // 699
    const res699 = assessLenders({ gender: 'male', cibilScore: 699 }, { universityRank: 50 }, 100000);
    const bob699 = res699.find(r => r.lender === 'BOB' && r.product_type === 'non_collateral');
    expect(bob699?.status).toBe('does_not_meet');
  });

  it('CIBIL missing => cannot_assess for lenders that have a minimum', () => {
    const res = assessLenders({ gender: 'male' }, { universityRank: 50 }, 100000); // no CIBIL
    const bobNon = res.find(r => r.lender === 'BOB' && r.product_type === 'non_collateral');
    expect(bobNon?.status).toBe('cannot_assess');
    expect(bobNon?.reasons).toContainEqual(expect.objectContaining({ code: 'CIBIL_UNKNOWN' }));
  });

  it('BOI collateral with gender unspecified => keeps 9.00% but adds note', () => {
    const res = assessLenders({ cibilScore: 750 }, {}, 100000); // gender unspecified
    const boiCol = res.find(r => r.lender === 'BOI' && r.product_type === 'collateral');
    expect(boiCol?.rate_min).toBe(9.00);
    expect(boiCol?.reasons).toContainEqual(expect.objectContaining({ 
      code: 'RATE_OVERRIDE_NOTE', 
      message: '8.60% applies for female students' 
    }));
  });

  it('Credila collateral returns the 9.25-9.75 range', () => {
    const res = assessLenders({ gender: 'male', cibilScore: 750 }, {}, 100000);
    const credilaCol = res.find(r => r.lender === 'Credila' && r.product_type === 'collateral');
    expect(credilaCol?.rate_min).toBe(9.25);
    expect(credilaCol?.rate_max).toBe(9.75);
  });

  it('overall status rules', () => {
    // any does_not_meet -> does_not_meet
    // e.g., missing rank + CIBIL below min -> does_not_meet
    const res = assessLenders({ gender: 'male', cibilScore: 600 }, {}, 100000);
    const bobNon = res.find(r => r.lender === 'BOB' && r.product_type === 'non_collateral');
    // rank missing -> cannot_assess, CIBIL < 700 -> does_not_meet
    // Overall should be does_not_meet
    expect(bobNon?.status).toBe('does_not_meet');
  });

  it('what_would_change messages', () => {
    const res = assessLenders({ gender: 'male', cibilScore: 710 }, { universityRank: 150 }, 100000);
    const sbiNon = res.find(r => r.lender === 'SBI' && r.product_type === 'non_collateral');
    expect(sbiNon?.what_would_change).toContain('CIBIL 40 points higher');
    expect(sbiNon?.what_would_change).toContain('admission to a top-100 university');
  });

  it('evaluates gracefully when funding gap is null', () => {
    const res = assessLenders({ gender: 'male', cibilScore: 750 }, { universityRank: 50 }, null);
    expect(res.length).toBeGreaterThan(0);
    
    const bobNon = res.find(r => r.lender === 'BOB' && r.product_type === 'non_collateral');
    // Status is 'meets' for conditions, but note says GAP_NOT_CALCULABLE
    expect(bobNon?.reasons).toContainEqual(expect.objectContaining({ code: 'GAP_NOT_CALCULABLE' }));
    expect(bobNon?.status).toBe('meets');
  });

  it('Boundary tests for rank and CIBIL', () => {
    // BOB non-collateral rank 100 => meets, rank 101 => does_not_meet
    const resRank100 = assessLenders({ gender: 'male', cibilScore: 750 }, { universityRank: 100 }, 100000);
    expect(resRank100.find(r => r.lender === 'BOB' && r.product_type === 'non_collateral')?.status).toBe('meets');
    
    const resRank101 = assessLenders({ gender: 'male', cibilScore: 750 }, { universityRank: 101 }, 100000);
    expect(resRank101.find(r => r.lender === 'BOB' && r.product_type === 'non_collateral')?.status).toBe('does_not_meet');

    // SBI CIBIL 750 => meets, 749 => does_not_meet
    const resCibil750 = assessLenders({ gender: 'male', cibilScore: 750 }, {}, 100000);
    expect(resCibil750.find(r => r.lender === 'SBI' && r.product_type === 'collateral')?.status).toBe('meets');
    
    const resCibil749 = assessLenders({ gender: 'male', cibilScore: 749 }, {}, 100000);
    expect(resCibil749.find(r => r.lender === 'SBI' && r.product_type === 'collateral')?.status).toBe('does_not_meet');
  });
});
