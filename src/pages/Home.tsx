import { useState } from 'react';
import { IntakeProvider, useIntake } from '../store/IntakeContext';
import { Step1Study } from '../components/intake/Step1Study';
import { Step2Funding } from '../components/intake/Step2Funding';
import { Step3Financial } from '../components/intake/Step3Financial';
import { Step4Collateral } from '../components/intake/Step4Collateral';
import { calculateTotalCost, calculateFundingGap, calculateFundingAvailable, formatINR } from '../lib/calc';
import { Button } from '../components/ui/button';

function SummaryPanel() {
  const { study, funding } = useIntake();
  const totalCostResult = calculateTotalCost(study as any);
  const fundingAvailable = calculateFundingAvailable(funding as any);
  const gapResult = calculateFundingGap(totalCostResult, fundingAvailable);

  return (
    <div className="p-6 sticky top-6 bg-[#FEF7EF] border border-slate-200 rounded-2xl shadow-sm">
      <h3 className="font-bold text-lg mb-4">Summary</h3>
      
      <div className="space-y-4">
        <div>
          <div className="text-sm text-slate-500 mb-1 uppercase font-bold text-[#F25C5C] text-[11px] tracking-wider">Total Cost</div>
          {totalCostResult === null ? (
            <div className="text-xl font-bold text-slate-400">₹ -</div>
          ) : typeof totalCostResult === 'object' ? (
            <div className="text-sm text-orange-500 font-medium">Enter an exchange rate to calculate the funding gap</div>
          ) : (
            <div className="text-xl font-bold">₹ {formatINR(totalCostResult)}</div>
          )}
        </div>

        <div>
          <div className="text-sm text-slate-500 mb-1 uppercase font-bold text-[#F25C5C] text-[11px] tracking-wider">Funding Gap (Loan Req.)</div>
          {gapResult === null || typeof gapResult === 'object' ? (
             <div className="text-xl font-bold text-slate-400">₹ -</div>
          ) : (
            <div className="text-xl font-bold text-[#333333]">₹ {formatINR(gapResult)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function IntakeWizard() {
  const [step, setStep] = useState(1);
  const { loadSampleProfile } = useIntake();

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-extrabold italic">
            Get your <span className="text-[#F25C5C]">Estimate</span>
          </h1>
          <Button variant="outline" size="sm" onClick={loadSampleProfile} className="rounded-full">
            Load sample profile
          </Button>
        </div>
        
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-[#F25C5C]' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
          {step === 1 && <Step1Study onNext={() => setStep(2)} />}
          {step === 2 && <Step2Funding onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <Step3Financial onBack={() => setStep(2)} onNext={() => setStep(4)} />}
          {step === 4 && <Step4Collateral onBack={() => setStep(3)} onNext={() => setStep(5)} />}
          {step === 5 && (
            <div className="text-center py-10 space-y-4">
              <h2 className="text-2xl font-bold mb-4">Results (Placeholder)</h2>
              <p className="text-slate-500">The results page will be built in the next step.</p>
              <Button onClick={() => setStep(4)} variant="outline" className="rounded-full">Back to Editor</Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="hidden md:block">
        <SummaryPanel />
      </div>

      <div className="md:hidden">
        <SummaryPanel />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <IntakeProvider>
      <IntakeWizard />
    </IntakeProvider>
  );
}
