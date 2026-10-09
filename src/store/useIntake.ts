import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Student, Study, Funding, FinancialProfile, CollateralItem } from '../lib/types';

export interface Assumptions {
  tenorYears: number;
  moratoriumEnabled?: boolean;
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
  setStudent: Dispatch<SetStateAction<Partial<Student>>>;
  setStudy: Dispatch<SetStateAction<Partial<Study>>>;
  setFunding: Dispatch<SetStateAction<Partial<Funding>>>;
  setFinancialProfile: Dispatch<SetStateAction<Partial<FinancialProfile>>>;
  setCollateral: Dispatch<SetStateAction<CollateralItem[]>>;
  setUploads: Dispatch<SetStateAction<Uploads>>;
  setAssumptions: Dispatch<SetStateAction<Assumptions>>;
  loadSampleProfile: () => void;
}

export const IntakeContext = createContext<IntakeState | undefined>(undefined);

export function useIntake() {
  const context = useContext(IntakeContext);
  if (!context) throw new Error('useIntake must be used within IntakeProvider');
  return context;
}
