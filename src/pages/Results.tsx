import { useState } from 'react';
import { useIntake } from '../store/useIntake';
import { calculateTotalCost, calculateFundingAvailable, calculateFundingGap, calculateNetWorth, formatINR, calculateEMI } from '../lib/calc';
import { assessLenders } from '../lib/assess';
import type { AssessmentResult } from '../lib/assess';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ScenarioComparison } from '../components/intake/ScenarioComparison';

function Badge({ status }: { status: AssessmentResult['status'] }) {
  if (status === 'meets') return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">Criteria met</span>;
  if (status === 'cannot_assess') return <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Cannot assess</span>;
  return <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">Criteria not met</span>;
}

function LenderCard({ result, gap, tenor, moratorium = 0, requiresCollateral = false }: { result: AssessmentResult, gap: number | null, tenor: number, moratorium?: number, requiresCollateral?: boolean }) {
  let emiText: React.ReactNode = <span className="text-xs text-slate-400 font-normal">Loan amount not calculable yet</span>;
  if (gap !== null) {
    if (result.rate_min !== undefined && result.rate_max !== undefined) {
      if (result.rate_min === result.rate_max) {
        const emi = calculateEMI(gap, result.rate_min, tenor, moratorium);
        emiText = emi ? `₹ ${formatINR(emi)} / mo` : 'N/A';
      } else {
        const minEmi = calculateEMI(gap, result.rate_min, tenor, moratorium);
        const maxEmi = calculateEMI(gap, result.rate_max, tenor, moratorium);
        emiText = minEmi && maxEmi ? `₹ ${formatINR(minEmi)} - ₹ ${formatINR(maxEmi)} / mo` : 'N/A';
      }
    } else {
      emiText = 'N/A';
    }
  }

  const rateText = result.rate_min !== undefined && result.rate_max !== undefined 
    ? (result.rate_min === result.rate_max ? `${result.rate_min.toFixed(2)}%` : `${result.rate_min.toFixed(2)}% - ${result.rate_max.toFixed(2)}%`)
    : 'N/A';

  const notAvailableReason = result.reasons.find(r => r.code === 'NOT_AVAILABLE');
  const displayReasons = notAvailableReason ? [notAvailableReason] : result.reasons;

  return (
    <div className="border border-slate-200 p-4 rounded-xl shadow-sm bg-white space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-lg">{result.lender}</h4>
          <p className="text-sm text-slate-500 capitalize">{result.product_type.replace('_', ' ')}</p>
        </div>
        <Badge status={result.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Interest Rate</div>
          <div className="font-medium">{rateText}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Est. EMI ({tenor} yrs) *</div>
          <div className="font-medium">{emiText}</div>
        </div>
      </div>

      {(displayReasons.length > 0 || requiresCollateral) && (
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes / Reasons</div>
          <ul className="text-sm space-y-1">
            {requiresCollateral && (
              <li className="text-slate-600 flex gap-2 items-start font-medium text-orange-600">
                <span className="mt-[2px]">•</span> <span>Requires collateral</span>
              </li>
            )}
            {displayReasons.map((r, i) => (
              <li key={i} className="text-slate-600 flex gap-2 items-start">
                <span className="text-slate-400 mt-[2px]">•</span> <span>{r.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.what_would_change.length > 0 && (
        <div className="bg-slate-50 p-3 rounded-lg mt-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">What would change this?</div>
          <ul className="text-sm space-y-1 text-slate-600">
            {result.what_would_change.map((w, i) => <li key={i}>- {w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Results({ onBack }: { onBack: () => void }) {
  const { student, study, funding, financialProfile, collateral, assumptions } = useIntake();
  const [showCollateral, setShowCollateral] = useState(false);
  
  const totalCostResult = calculateTotalCost(study);
  const fundingAvailable = calculateFundingAvailable(funding);
  const gapResult = calculateFundingGap(totalCostResult, fundingAvailable);
  const netWorth = calculateNetWorth(financialProfile);
  
  const moratoriumYears = assumptions.moratoriumEnabled ? (study.durationYears || 0) : 0;
  
  const totalCollateral = collateral.reduce((sum, c) => sum + (c.estimatedValue || 0), 0);
  
  // Assessment
  const assessmentResults = assessLenders(student, study, gapResult);
  
  const collateralResults = assessmentResults.filter(r => r.product_type === 'collateral');
  const nonCollateralResults = assessmentResults.filter(r => r.product_type === 'non_collateral');

  const isCollateralRelevant = totalCollateral > 0;
  const isNonCollateralRelevant = nonCollateralResults.some(r => r.status === 'meets' || r.status === 'cannot_assess');

  // Missing info logic
  const missingFields = new Set<string>();
  for (const r of assessmentResults) {
    for (const reason of r.reasons) {
      if (reason.code === 'CIBIL_UNKNOWN') missingFields.add('CIBIL_UNKNOWN');
      if (reason.code === 'GENDER_NOT_SPECIFIED_OR_OTHER') missingFields.add('GENDER_UNKNOWN');
      if (reason.code === 'RANK_UNKNOWN') missingFields.add('RANK_UNKNOWN');
    }
  }
  
  const missingLabels: string[] = [];
  if (missingFields.has('CIBIL_UNKNOWN')) missingLabels.push('CIBIL Score');
  if (missingFields.has('GENDER_UNKNOWN')) missingLabels.push('Gender');
  if (missingFields.has('RANK_UNKNOWN')) missingLabels.push('University Rank');
  if (totalCostResult === null) missingLabels.push('Study costs (tuition and course duration)');
  if (typeof totalCostResult === 'object' && totalCostResult?.error === 'EXCHANGE_RATE_REQUIRED') missingLabels.push('Exchange Rate');
  if (totalCollateral === 0) missingLabels.push('Collateral');

  const parsedGap = typeof gapResult === 'number' ? gapResult : null;
  const isNetWorthEmpty = financialProfile.assets?.length === 0 && financialProfile.liabilities?.length === 0;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold italic">Assessment <span className="text-[#F25C5C]">Results</span></h2>
          <Button variant="outline" onClick={onBack} className="rounded-full">Edit Profile</Button>
        </div>
        <p className="text-sm text-slate-500 mt-2">Based only on criteria in the supplied dataset (CIBIL, university rank, gender). Lenders may apply other checks.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#FEF7EF] border-none shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Cost</div>
          {totalCostResult === null ? <div className="text-lg font-bold text-slate-400">-</div>
           : typeof totalCostResult === 'object' ? <div className="text-xs text-orange-700 leading-tight">Exchange rate missing</div>
           : <div className="text-lg font-bold">₹ {formatINR(totalCostResult)}</div>}
        </Card>
        <Card className="p-4 bg-[#FEF7EF] border-none shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Funding Gap</div>
          {parsedGap === null ? <div className="text-lg font-bold text-slate-400">-</div>
           : <div className="text-lg font-bold text-[#D93838]">₹ {formatINR(parsedGap)}</div>}
        </Card>
        <Card className="p-4 bg-[#FEF7EF] border-none shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Net Worth</div>
          {(netWorth === null || isNetWorthEmpty) ? <div className="text-lg font-bold text-slate-400">Not entered</div>
           : <div className="text-lg font-bold">₹ {formatINR(netWorth)}</div>}
        </Card>
        <Card className="p-4 bg-slate-50 border-none shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assumptions</div>
          <div className="text-lg font-bold">{assumptions.tenorYears} Years</div>
          {assumptions.moratoriumEnabled && <div className="text-xs text-slate-500 font-medium leading-tight mt-1">Includes moratorium</div>}
        </Card>
      </div>

      {missingLabels.length > 0 && (
        <div data-testid="missing-info-panel" className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <h4 className="font-bold text-blue-900 mb-2">Missing Information</h4>
          <p className="text-sm text-blue-800 mb-2">Providing the following inputs would improve your assessment accuracy:</p>
          <ul className="flex flex-wrap gap-2">
            {missingLabels.map((lbl, i) => (
              <li key={i} className="bg-white text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-200 font-medium">
                {lbl}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-xl font-bold border-b pb-2">Route Relevance</h3>
        
        <div className={`p-6 rounded-2xl border ${isCollateralRelevant ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
            <div>
              <h4 className="font-bold text-lg">Collateral Route</h4>
              {isCollateralRelevant ? (
                <p className="text-sm text-slate-500">May be relevant based on your profile.</p>
              ) : (
                <p className="text-sm text-orange-600 font-medium">Collateral routes need a pledged asset. None entered; these show lender criteria only.</p>
              )}
              <p className="text-xs text-slate-600 mt-2">
                * EMI figures are estimates. They assume repayment starts immediately on the loan amount {assumptions.moratoriumEnabled ? 'but include' : 'and exclude'} interest during the study period (moratorium) and lender fees.
              </p>
            </div>
            
            {isCollateralRelevant && parsedGap !== null ? (
              <div className="text-right">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Collateral</div>
                <div className="font-bold text-lg text-green-700">₹ {formatINR(totalCollateral)}</div>
                <div className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-tight">
                  Indicative comparison only. The dataset does not specify collateral-value requirements.
                </div>
              </div>
            ) : null}

            {!isCollateralRelevant && (
              <Button variant="outline" size="sm" onClick={() => setShowCollateral(!showCollateral)} className="rounded-full bg-white">
                {showCollateral ? 'Hide collateral options' : 'Show collateral options anyway'}
              </Button>
            )}
          </div>
          
          {(isCollateralRelevant || showCollateral) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {collateralResults.map((r, i) => (
                <LenderCard key={i} result={r} gap={parsedGap} tenor={assumptions.tenorYears} moratorium={moratoriumYears} requiresCollateral={!isCollateralRelevant} />
              ))}
            </div>
          )}
        </div>

        <div className={`p-6 rounded-2xl border ${isNonCollateralRelevant ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="mb-4">
            <h4 className="font-bold text-lg">Non-Collateral Route</h4>
            <p className="text-sm text-slate-500">
              {isNonCollateralRelevant ? 'May be relevant based on your profile.' : 'Unlikely to be relevant (no products meet criteria).'}
            </p>
            <p className="text-xs text-slate-600 mt-2">
              * EMI figures are estimates. They assume repayment starts immediately on the loan amount {assumptions.moratoriumEnabled ? 'but include' : 'and exclude'} interest during the study period (moratorium) and lender fees.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonCollateralResults.map((r, i) => (
              <LenderCard key={i} result={r} gap={parsedGap} tenor={assumptions.tenorYears} moratorium={moratoriumYears} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-8 mt-8">
        <ScenarioComparison />
      </div>

      <div className="text-center text-xs text-slate-400 mt-12 pb-8 border-t pt-8">
        Decision-support only. Not a guarantee of loan approval or rejection. Based on a limited reference dataset.
      </div>
    </div>
  );
}
