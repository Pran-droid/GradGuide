import { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Student, Study, Funding, FinancialProfile, CollateralItem } from '../lib/types';
import { IntakeContext } from './useIntake';
import type { Assumptions, Uploads } from './useIntake';

export function IntakeProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Partial<Student>>({});
  const [study, setStudy] = useState<Partial<Study>>({ currency: 'INR' });
  const [funding, setFunding] = useState<Partial<Funding>>({});
  const [financialProfile, setFinancialProfile] = useState<Partial<FinancialProfile>>({ assets: [], liabilities: [] });
  const [collateral, setCollateral] = useState<CollateralItem[]>([]);
  const [uploads, setUploads] = useState<Uploads>({});
  const [assumptions, setAssumptions] = useState<Assumptions>({ tenorYears: 10 });

  const loadSampleProfile = useCallback(() => {
    setStudent({ gender: 'female', cibilScore: 710, coApplicantType: 'not specified' });
    setStudy({ 
      durationYears: 2, 
      totalTuition: 3000000, 
      livingCostPerYear: 1000000,
      universityRank: 50,
      currency: 'INR'
    });
    setFunding({
      savings: 500000,
      scholarship: 300000,
      familyContribution: 700000,
      feesAlreadyPaid: 200000
    });
    setFinancialProfile({ assets: [], liabilities: [] });
    setCollateral([]);
    setUploads({});
    setAssumptions({ tenorYears: 10 });
  }, []);

  const value = useMemo(() => ({
    student, study, funding, financialProfile, collateral, uploads, assumptions,
    setStudent, setStudy, setFunding, setFinancialProfile, setCollateral, setUploads, setAssumptions,
    loadSampleProfile
  }), [student, study, funding, financialProfile, collateral, uploads, assumptions, loadSampleProfile]);

  return (
    <IntakeContext.Provider value={value}>
      {children}
    </IntakeContext.Provider>
  );
}
