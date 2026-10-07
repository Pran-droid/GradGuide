import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Student, Study, Funding, FinancialProfile, CollateralItem } from '../lib/types';

export interface Assumptions {
  tenorYears: number;
}

export interface IntakeState {
  student: Partial<Student>;
  study: Partial<Study>;
  funding: Partial<Funding>;
  financialProfile: Partial<FinancialProfile>;
  collateral: CollateralItem[];
  assumptions: Assumptions;
  setStudent: (s: Partial<Student>) => void;
  setStudy: (s: Partial<Study>) => void;
  setFunding: (f: Partial<Funding>) => void;
  setFinancialProfile: (fp: Partial<FinancialProfile>) => void;
  setCollateral: (c: CollateralItem[]) => void;
  setAssumptions: (a: Assumptions) => void;
  loadSampleProfile: () => void;
}

const IntakeContext = createContext<IntakeState | undefined>(undefined);

export function IntakeProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Partial<Student>>({});
  const [study, setStudy] = useState<Partial<Study>>({ currency: 'INR' });
  const [funding, setFunding] = useState<Partial<Funding>>({});
  const [financialProfile, setFinancialProfile] = useState<Partial<FinancialProfile>>({ assets: [], liabilities: [] });
  const [collateral, setCollateral] = useState<CollateralItem[]>([]);
  const [assumptions, setAssumptions] = useState<Assumptions>({ tenorYears: 10 });

  const loadSampleProfile = () => {
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
    setAssumptions({ tenorYears: 10 });
  };

  return (
    <IntakeContext.Provider value={{
      student, study, funding, financialProfile, collateral, assumptions,
      setStudent, setStudy, setFunding, setFinancialProfile, setCollateral, setAssumptions,
      loadSampleProfile
    }}>
      {children}
    </IntakeContext.Provider>
  );
}

export function useIntake() {
  const context = useContext(IntakeContext);
  if (!context) throw new Error('useIntake must be used within IntakeProvider');
  return context;
}
