export type Gender = 'male' | 'female' | 'other' | 'not specified';
export type CoApplicantType = 'salaried' | 'self-employed' | 'not specified';

export interface Student {
  name?: string;
  gender: Gender;
  cibilScore?: number;
  coApplicantType: CoApplicantType;
}

export interface Study {
  country?: string;
  university?: string;
  course?: string;
  universityRank?: number;
  durationYears: number;
  totalTuition: number;
  livingCostPerYear?: number;
  otherCosts?: number;
  currency?: string; // default "INR"
  exchangeRateToINR?: number; // if costs are in another currency
}

export interface Funding {
  savings: number;
  scholarship: number;
  feesAlreadyPaid: number;
  familyContribution: number;
}

export interface Asset {
  type: string;
  value: number;
}

export interface Liability {
  type: string;
  amount: number;
}

export interface FinancialProfile {
  studentIncome?: number;
  coApplicantIncome?: number;
  assets: Asset[];
  liabilities: Liability[];
}

export interface CollateralItem {
  type: string;
  estimatedValue: number;
  propertyState: 'Delhi' | 'Maharashtra' | 'other';
  propertyType: 'apartment' | 'other';
  propertyStatus: 'new' | 'resale';
}
