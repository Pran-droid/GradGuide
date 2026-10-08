import { useIntake } from '../../store/useIntake';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { calculateNetWorth, formatINR } from '../../lib/calc';

export function Step3Financial({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const { financialProfile, setFinancialProfile } = useIntake();

  const netWorth = calculateNetWorth(financialProfile as any);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Financial Profile</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="studentIncome">Student Annual Income (INR)</Label>
          <Input 
            id="studentIncome"
            type="number" 
            value={financialProfile.studentIncome ?? ''} 
            onChange={(e) => setFinancialProfile({ ...financialProfile, studentIncome: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coApplicantIncome">Co-Applicant Annual Income (INR)</Label>
          <Input 
            id="coApplicantIncome"
            type="number" 
            value={financialProfile.coApplicantIncome ?? ''} 
            onChange={(e) => setFinancialProfile({ ...financialProfile, coApplicantIncome: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-bold mb-4">Assets</h3>
        <div className="space-y-2">
          {financialProfile.assets?.map((a, i) => (
             <div key={i} className="flex gap-2 items-center">
               <Input value={a.type} placeholder="Type" aria-label="Asset Type" onChange={(e) => {
                 const newAssets = [...(financialProfile.assets || [])];
                 newAssets[i] = { ...a, type: e.target.value };
                 setFinancialProfile({ ...financialProfile, assets: newAssets });
               }} />
               <Input type="number" value={a.value === 0 ? '' : a.value} placeholder="Value" aria-label="Asset Value" onChange={(e) => {
                 const newAssets = [...(financialProfile.assets || [])];
                 newAssets[i] = { ...a, value: parseFloat(e.target.value) || 0 };
                 setFinancialProfile({ ...financialProfile, assets: newAssets });
               }} />
               <Button variant="ghost" className="text-red-500" onClick={() => {
                 const newAssets = [...(financialProfile.assets || [])];
                 newAssets.splice(i, 1);
                 setFinancialProfile({ ...financialProfile, assets: newAssets });
               }}>Remove</Button>
             </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => {
            const newAssets = [...(financialProfile.assets || []), { type: '', value: 0 }];
            setFinancialProfile({ ...financialProfile, assets: newAssets });
          }}>+ Add Asset</Button>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-bold mb-4">Liabilities</h3>
        <div className="space-y-2">
          {financialProfile.liabilities?.map((l, i) => (
             <div key={i} className="flex gap-2 items-center">
               <Input value={l.type} placeholder="Type" aria-label="Liability Type" onChange={(e) => {
                 const newLiabilities = [...(financialProfile.liabilities || [])];
                 newLiabilities[i] = { ...l, type: e.target.value };
                 setFinancialProfile({ ...financialProfile, liabilities: newLiabilities });
               }} />
               <Input type="number" value={l.amount === 0 ? '' : l.amount} placeholder="Amount" aria-label="Liability Amount" onChange={(e) => {
                 const newLiabilities = [...(financialProfile.liabilities || [])];
                 newLiabilities[i] = { ...l, amount: parseFloat(e.target.value) || 0 };
                 setFinancialProfile({ ...financialProfile, liabilities: newLiabilities });
               }} />
               <Button variant="ghost" className="text-red-500" onClick={() => {
                 const newLiabilities = [...(financialProfile.liabilities || [])];
                 newLiabilities.splice(i, 1);
                 setFinancialProfile({ ...financialProfile, liabilities: newLiabilities });
               }}>Remove</Button>
             </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => {
            const newLiabilities = [...(financialProfile.liabilities || []), { type: '', amount: 0 }];
            setFinancialProfile({ ...financialProfile, liabilities: newLiabilities });
          }}>+ Add Liability</Button>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">Live Net Worth</span>
          <span className="text-lg font-bold text-primary">
            {netWorth === null ? '₹ -' : `₹ ${formatINR(netWorth)}`}
          </span>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="rounded-full">Back</Button>
        <Button onClick={onNext} className="rounded-full bg-[#333333]">Next: Collateral</Button>
      </div>
    </div>
  );
}
