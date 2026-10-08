import { createContext, useContext } from 'react';
import type { Student, Study, Funding, FinancialProfile, CollateralItem } from '../lib/types';

export interface Assumptions {
  tenorYears: number;
}

export interface UploadedFile {
  file: File;
  declaredAmount?: number;
}
export type Uploads = Record<string, UploadedFile>;

export interface IntakeState {
  student: Partial<Student>;
  study: Partial<Study>;
  funding: Partial<Funding>;
  financialProfile: Partial<FinancialProfile>;
  collateral: CollateralItem[];
  uploads: Uploads;
  assumptions: Assumptions;
  setStudent: (s: Partial<Student>) => void;
  setStudy: (s: Partial<Study>) => void;
  setFunding: (f: Partial<Funding>) => void;
  setFinancialProfile: (fp: Partial<FinancialProfile>) => void;
  setCollateral: (c: CollateralItem[]) => void;
  setUploads: (u: Uploads) => void;
  setAssumptions: (a: Assumptions) => void;
  loadSampleProfile: () => void;
}

export const IntakeContext = createContext<IntakeState | undefined>(undefined);

export function useIntake() {
  const context = useContext(IntakeContext);
  if (!context) throw new Error('useIntake must be used within IntakeProvider');
  return context;
}
