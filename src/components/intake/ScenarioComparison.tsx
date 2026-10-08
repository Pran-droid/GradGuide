import { useState } from 'react';
import { useIntake } from '../../store/useIntake';
import { calculateTotalCost, calculateFundingAvailable, calculateFundingGap, calculateEMI, formatINR } from '../../lib/calc';
import { assessLenders } from '../../lib/assess';
import { Button } from '../ui/button';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Scenario {
  id: string;
  name: string;
  university: string;
  universityRank?: number;
  totalTuition?: number;
  familyContribution?: number;
  scholarship?: number;
  collateralValue?: number;
  tenorYears?: number;
}

export function ScenarioComparison() {
  const intake = useIntake();
  const { study, funding, collateral, assumptions } = intake;
  
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const addScenario = () => {
    if (scenarios.length >= 3) return;
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name: `Scenario ${scenarios.length + 1}`,
      university: study.university || '',
      universityRank: study.universityRank,
      totalTuition: study.totalTuition,
      familyContribution: funding.familyContribution,
      scholarship: funding.scholarship,
      collateralValue: collateral.reduce((sum, c) => sum + (c.estimatedValue || 0), 0),
      tenorYears: assumptions.tenorYears
    };
    setScenarios([...scenarios, newScenario]);
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const updateScenario = (id: string, updates: Partial<Scenario>) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  if (scenarios.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center">
        <h3 className="text-xl font-bold mb-2">Scenario Comparison</h3>
        <p className="text-slate-500 mb-4 text-sm max-w-md mx-auto">Create up to 3 what-if scenarios to compare how changes to university rank, tuition, or contributions affect your loan options.</p>
        <Button onClick={addScenario} variant="outline" className="rounded-full">Add Scenario</Button>
      </div>
    );
  }

  const outcomes = scenarios.map(scenario => {
    const sStudy = { ...study, university: scenario.university, universityRank: scenario.universityRank, totalTuition: scenario.totalTuition };
    const sFunding = { ...funding, familyContribution: scenario.familyContribution, scholarship: scenario.scholarship };
    
    const totalCost = calculateTotalCost(sStudy);
    const fundingAvailable = calculateFundingAvailable(sFunding);
    const gap = calculateFundingGap(totalCost, fundingAvailable);
    
    const results = assessLenders(intake.student, sStudy, gap);
    
    const isCollateralRelevant = (scenario.collateralValue || 0) > 0;
    const isNonCollateralRelevant = results.some(r => r.product_type === 'non_collateral' && (r.status === 'meets' || r.status === 'cannot_assess'));
    
    const relevantRoutes = [];
    if (isCollateralRelevant) relevantRoutes.push('Collateral');
    if (isNonCollateralRelevant) relevantRoutes.push('Non-Collateral');
    
    const meetsLenders = results.filter(r => r.status === 'meets' && (r.product_type !== 'collateral' || isCollateralRelevant));
    const cannotAssessLenders = results.filter(r => r.status === 'cannot_assess' && (r.product_type !== 'collateral' || isCollateralRelevant));
    
    let lowestMinRateMeets = Infinity;
    let lowestMaxRateMeets = Infinity;
    meetsLenders.forEach(r => {
      if (r.rate_min !== undefined && r.rate_min < lowestMinRateMeets) {
        lowestMinRateMeets = r.rate_min;
        lowestMaxRateMeets = r.rate_max || r.rate_min;
      }
    });

    let lowestMinRateCannotAssess = Infinity;
    let lowestMaxRateCannotAssess = Infinity;
    cannotAssessLenders.forEach(r => {
      if (r.rate_min !== undefined && r.rate_min < lowestMinRateCannotAssess) {
        lowestMinRateCannotAssess = r.rate_min;
        lowestMaxRateCannotAssess = r.rate_max || r.rate_min;
      }
    });

    const tenor = scenario.tenorYears || 10;
    const isGapNull = typeof gap !== 'number';
    const parsedGap = isGapNull ? 0 : gap;

    // minEmi and maxEmi are based ONLY on "meets" products
    const minEmi = !isGapNull && parsedGap > 0 && lowestMinRateMeets !== Infinity ? calculateEMI(parsedGap, lowestMinRateMeets, tenor) : null;
    const maxEmi = !isGapNull && parsedGap > 0 && lowestMaxRateMeets !== Infinity ? calculateEMI(parsedGap, lowestMaxRateMeets, tenor) : null;

    return { 
      totalCost, 
      gap, 
      isGapNull,
      relevantRoutes, 
      lowestMinRateMeets: lowestMinRateMeets === Infinity ? null : lowestMinRateMeets, 
      lowestMaxRateMeets: lowestMaxRateMeets === Infinity ? null : lowestMaxRateMeets, 
      lowestMinRateCannotAssess: lowestMinRateCannotAssess === Infinity ? null : lowestMinRateCannotAssess,
      lowestMaxRateCannotAssess: lowestMaxRateCannotAssess === Infinity ? null : lowestMaxRateCannotAssess,
      minEmi, 
      maxEmi,
      tenor,
      counts: {
        meets: results.filter(r => r.status === 'meets').length,
        cannot_assess: results.filter(r => r.status === 'cannot_assess').length,
        does_not_meet: results.filter(r => r.status === 'does_not_meet').length
      }
    };
  });

  const getHighlightClass = (key: keyof Scenario | string) => {
    if (scenarios.length < 2) return "";
    
    // For inputs
    if (key in scenarios[0]) {
      const allVals = scenarios.map(s => s[key as keyof Scenario]);
      const uniqueVals = new Set(allVals);
      if (uniqueVals.size > 1) return "bg-amber-100 font-bold";
    }
    
    // For outcomes
    if (key === 'totalCost') {
      const uniqueVals = new Set(outcomes.map(o => o.totalCost));
      if (uniqueVals.size > 1) return "bg-amber-100 font-bold px-1 rounded";
    }
    if (key === 'gap') {
      const uniqueVals = new Set(outcomes.map(o => o.gap));
      if (uniqueVals.size > 1) return "bg-amber-100 font-bold px-1 rounded";
    }
    if (key === 'rateMeets') {
      const uniqueVals = new Set(outcomes.map(o => o.lowestMinRateMeets));
      if (uniqueVals.size > 1) return "bg-amber-100 font-bold px-1 rounded";
    }
    if (key === 'rateCannotAssess') {
      const uniqueVals = new Set(outcomes.map(o => o.lowestMinRateCannotAssess));
      if (uniqueVals.size > 1) return "bg-amber-100 font-bold px-1 rounded";
    }
    if (key === 'emi') {
      const uniqueVals = new Set(outcomes.map(o => o.minEmi));
      if (uniqueVals.size > 1) return "bg-amber-100 font-bold px-1 rounded";
    }
    
    return "";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold">Scenario Comparison</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            * EMI figures are estimates. They assume repayment starts immediately on the loan amount and exclude interest during the study period (moratorium) and lender fees.
          </p>
        </div>
        {scenarios.length < 3 && (
          <Button onClick={addScenario} variant="outline" size="sm" className="rounded-full mt-1">Add Scenario</Button>
        )}
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
        {scenarios.map((scenario, idx) => {
          const outcome = outcomes[idx];
          
          return (
            <div key={scenario.id} className="min-w-[280px] sm:min-w-[320px] flex-1 border border-slate-200 bg-white rounded-2xl overflow-hidden snap-center flex flex-col">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <input 
                  type="text" 
                  value={scenario.name} 
                  onChange={e => updateScenario(scenario.id, { name: e.target.value })}
                  className="bg-transparent font-bold focus:outline-none w-full"
                />
                <button onClick={() => removeScenario(scenario.id)} className="text-slate-400 hover:text-red-500 px-2">&times;</button>
              </div>
              
              <div className="p-4 space-y-4 flex-1">
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Inputs</div>
                  <div>
                    <label className="text-xs text-slate-500 block">University Name</label>
                    <input type="text" value={scenario.university} onChange={e => updateScenario(scenario.id, { university: e.target.value })} className={cn("w-full text-sm border-b border-slate-200 py-1 focus:outline-none focus:border-[#F25C5C]", getHighlightClass('university'))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block">Rank (e.g. 50)</label>
                    <input type="number" value={scenario.universityRank || ''} onChange={e => updateScenario(scenario.id, { universityRank: e.target.value ? parseInt(e.target.value) : undefined })} className={cn("w-full text-sm border-b border-slate-200 py-1 focus:outline-none focus:border-[#F25C5C]", getHighlightClass('universityRank'))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block">Total Tuition</label>
                    <input type="number" value={scenario.totalTuition || ''} onChange={e => updateScenario(scenario.id, { totalTuition: e.target.value ? parseInt(e.target.value) : undefined })} className={cn("w-full text-sm border-b border-slate-200 py-1 focus:outline-none focus:border-[#F25C5C]", getHighlightClass('totalTuition'))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block">Scholarship</label>
                    <input type="number" value={scenario.scholarship || ''} onChange={e => updateScenario(scenario.id, { scholarship: e.target.value ? parseInt(e.target.value) : undefined })} className={cn("w-full text-sm border-b border-slate-200 py-1 focus:outline-none focus:border-[#F25C5C]", getHighlightClass('scholarship'))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block">Family Contribution</label>
                    <input type="number" value={scenario.familyContribution || ''} onChange={e => updateScenario(scenario.id, { familyContribution: e.target.value ? parseInt(e.target.value) : undefined })} className={cn("w-full text-sm border-b border-slate-200 py-1 focus:outline-none focus:border-[#F25C5C]", getHighlightClass('familyContribution'))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block">Collateral Value</label>
                    <input type="number" value={scenario.collateralValue || ''} onChange={e => updateScenario(scenario.id, { collateralValue: e.target.value ? parseInt(e.target.value) : undefined })} className={cn("w-full text-sm border-b border-slate-200 py-1 focus:outline-none focus:border-[#F25C5C]", getHighlightClass('collateralValue'))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block">Tenor (Years)</label>
                    <input type="number" value={scenario.tenorYears || ''} onChange={e => updateScenario(scenario.id, { tenorYears: e.target.value ? parseInt(e.target.value) : undefined })} className={cn("w-full text-sm border-b border-slate-200 py-1 focus:outline-none focus:border-[#F25C5C]", getHighlightClass('tenorYears'))} />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Outcomes</div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Cost</span>
                    <span className={cn("font-bold", getHighlightClass('totalCost'))}>{typeof outcome.totalCost === 'number' ? `₹ ${formatINR(outcome.totalCost)}` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Funding Gap</span>
                    <span className={cn("font-bold text-[#D93838]", getHighlightClass('gap'))}>{typeof outcome.gap === 'number' ? `₹ ${formatINR(outcome.gap)}` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-slate-500">Relevant Routes</span>
                    <span className="font-medium text-right">{outcome.relevantRoutes.length > 0 ? outcome.relevantRoutes.join(', ') : 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Lowest Rate</span>
                    <span className={cn("font-bold text-green-700", getHighlightClass('rateMeets'))}>
                      {outcome.lowestMinRateMeets !== null 
                        ? (outcome.lowestMinRateMeets === outcome.lowestMaxRateMeets ? `${outcome.lowestMinRateMeets.toFixed(2)}%` : `${outcome.lowestMinRateMeets.toFixed(2)}% - ${outcome.lowestMaxRateMeets?.toFixed(2)}%`) 
                        : 'None met in dataset'}
                    </span>
                  </div>
                  {outcome.lowestMinRateCannotAssess !== null && (
                    <div className="flex justify-between items-start text-sm bg-amber-50 p-2 rounded">
                      <span className="text-slate-500 text-xs">Lowest rate among lenders we can't fully assess</span>
                      <span className={cn("font-bold text-amber-700 text-right", getHighlightClass('rateCannotAssess'))}>
                        {outcome.lowestMinRateCannotAssess === outcome.lowestMaxRateCannotAssess ? `${outcome.lowestMinRateCannotAssess.toFixed(2)}%` : `${outcome.lowestMinRateCannotAssess.toFixed(2)}% - ${outcome.lowestMaxRateCannotAssess?.toFixed(2)}%`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-slate-500">Est. EMI ({outcome.tenor} yrs) *</span>
                    <span className={cn("font-medium text-right", getHighlightClass('emi'))}>
                      {outcome.isGapNull 
                        ? 'not calculable yet'
                        : outcome.minEmi !== null 
                          ? (outcome.minEmi === outcome.maxEmi ? `₹ ${formatINR(outcome.minEmi)}/mo` : `₹ ${formatINR(outcome.minEmi)} - ${formatINR(outcome.maxEmi!)}/mo`)
                          : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-50">
                    <span>Lender Matches</span>
                    <span>{outcome.counts.meets} Meets / {outcome.counts.cannot_assess} Can't Assess / {outcome.counts.does_not_meet} Not Met</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
