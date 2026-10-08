import { describe, it, expect } from 'vitest';
import { generateDocumentChecklist, checkTolerance } from '../src/lib/documents';

describe('Document Checklist Generation', () => {
  it('salaried co-applicant -> 2 years ITR + Form 16 + salary slips', () => {
    const checklist = generateDocumentChecklist({
      route: 'non_collateral',
      coApplicantType: 'salaried',
    });
    
    expect(checklist.some(item => item.id === 'itr_2y')).toBe(true);
    expect(checklist.some(item => item.id === 'form_16_2y')).toBe(true);
    expect(checklist.some(item => item.id === 'salary_slips_3m')).toBe(true);
    expect(checklist.some(item => item.id === 'itr_3y')).toBe(false);
  });

  it('self-employed co-applicant -> 3 years ITR + balance sheet and P&L', () => {
    const checklist = generateDocumentChecklist({
      route: 'non_collateral',
      coApplicantType: 'self-employed',
    });
    
    expect(checklist.some(item => item.id === 'itr_3y')).toBe(true);
    expect(checklist.some(item => item.id === 'balance_sheet_pl_3y')).toBe(true);
    expect(checklist.some(item => item.id === 'itr_2y')).toBe(false);
  });

  it('Delhi -> conveyance deed/DDA', () => {
    const checklist = generateDocumentChecklist({
      route: 'collateral',
      coApplicantType: 'salaried',
      collateral: [
        {
          type: 'property',
          estimatedValue: 100000,
          propertyState: 'Delhi',
          propertyType: 'apartment',
          propertyStatus: 'new',
        }
      ]
    });
    
    expect(checklist.some(item => item.id === 'delhi_conveyance_deed_dda_allotment')).toBe(true);
  });

  it('Maharashtra + new -> commencement certificate', () => {
    const checklist = generateDocumentChecklist({
      route: 'collateral',
      coApplicantType: 'salaried',
      collateral: [
        {
          type: 'property',
          estimatedValue: 100000,
          propertyState: 'Maharashtra',
          propertyType: 'other',
          propertyStatus: 'new',
        }
      ]
    });
    
    expect(checklist.some(item => item.id === 'mh_commencement_certificate')).toBe(true);
    expect(checklist.some(item => item.id === 'mh_share_certificate')).toBe(false);
  });

  it('Maharashtra + resale -> share certificate', () => {
    const checklist = generateDocumentChecklist({
      route: 'collateral',
      coApplicantType: 'salaried',
      collateral: [
        {
          type: 'property',
          estimatedValue: 100000,
          propertyState: 'Maharashtra',
          propertyType: 'apartment',
          propertyStatus: 'resale',
        }
      ]
    });
    
    expect(checklist.some(item => item.id === 'mh_share_certificate')).toBe(true);
    expect(checklist.some(item => item.id === 'mh_commencement_certificate')).toBe(false);
  });

  it('non-collateral -> no property documents', () => {
    const checklist = generateDocumentChecklist({
      route: 'non_collateral',
      coApplicantType: 'salaried',
    });
    
    expect(checklist.some(item => item.group === 'property' || item.group === 'property_state')).toBe(false);
  });

  it('apartment -> occupancy certificate', () => {
    const checklist = generateDocumentChecklist({
      route: 'collateral',
      coApplicantType: 'salaried',
      collateral: [
        {
          type: 'property',
          estimatedValue: 100000,
          propertyState: 'other',
          propertyType: 'apartment',
          propertyStatus: 'new',
        }
      ]
    });
    
    expect(checklist.some(item => item.id === 'occupancy_certificate')).toBe(true);
  });
});

describe('Consistency Tolerance Flags', () => {
  it('matching values => no flag', () => {
    expect(checkTolerance(100000, 100000)).toBe(false);
  });

  it('25% difference => flag (true)', () => {
    // Diff is 25000, which is 25% of 100000. 25 > 10
    expect(checkTolerance(100000, 75000, 10)).toBe(true);
  });

  it('blank form value => no flag', () => {
    expect(checkTolerance(null, 50000)).toBe(false);
    expect(checkTolerance(undefined, 50000)).toBe(false);
  });
});
