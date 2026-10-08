import lendersData from '../data/lenders.json';
import type { CollateralItem, CoApplicantType } from './types';

export interface DocumentItem {
  id: string;
  label: string;
  group: string;
  applies_to?: string[];
  routes?: string[];
  co_applicant_type?: string;
  accepted_options?: string[];
  note?: string;
  condition?: Record<string, string>;
}

export interface DocumentChecklistParams {
  route: 'collateral' | 'non_collateral';
  coApplicantType: CoApplicantType;
  collateral?: CollateralItem[];
}

export function generateDocumentChecklist(params: DocumentChecklistParams): DocumentItem[] {
  const allDocs = lendersData.documents.items as DocumentItem[];

  return allDocs.filter(doc => {
    // Check route
    if (doc.routes && !doc.routes.includes(params.route)) {
      return false;
    }

    // Check co-applicant type
    if (doc.co_applicant_type) {
      const normalizedParamType = params.coApplicantType === 'self-employed' ? 'self_employed' : params.coApplicantType;
      if (doc.co_applicant_type !== normalizedParamType) {
        return false;
      }
    }

    // Check condition (mostly for property)
    if (doc.condition) {
      if (!params.collateral || params.collateral.length === 0) {
        return false;
      }
      
      // Document is included if AT LEAST ONE collateral item matches ALL condition criteria (excluding 'text')
      const matchesAnyCollateral = params.collateral.some(colItem => {
        return Object.entries(doc.condition!).every(([key, value]) => {
          if (key === 'text') return true; // 'text' is just a note for humans
          if (key === 'property_state' && colItem.propertyState !== value) return false;
          if (key === 'property_type' && colItem.propertyType !== value) return false;
          if (key === 'property_status' && colItem.propertyStatus !== value) return false;
          return true;
        });
      });

      if (!matchesAnyCollateral) {
        return false;
      }
    }

    return true;
  });
}

export function getSupplementaryDocuments(): DocumentItem[] {
  return lendersData.supplementary_documents.items.map(item => ({
    ...item,
    group: 'supplementary'
  })) as DocumentItem[];
}

export const globalDocumentRules = lendersData.documents.global_rules;

export function checkTolerance(formValue: number | null | undefined, documentValue: number | undefined, tolerancePerc: number = 10): boolean {
  if (formValue === null || formValue === undefined || documentValue === undefined) {
    return false; // Blank form value => no flag
  }
  const diff = Math.abs(formValue - documentValue);
  const percDiff = (diff / Math.max(formValue, 1)) * 100;
  return percDiff > tolerancePerc;
}

