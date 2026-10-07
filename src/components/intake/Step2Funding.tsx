import { useIntake } from '../../store/IntakeContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function Step2Funding({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const { funding, setFunding } = useIntake();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Funding</h2>
      <p className="text-sm text-slate-500">Funding is entered in INR. <span className="font-medium text-orange-500">Warning: Avoid counting the same money twice (e.g. savings also included in family contribution).</span></p>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Savings</Label>
          <Input 
            type="number" 
            value={funding.savings ?? ''} 
            onChange={(e) => setFunding({ ...funding, savings: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label>Scholarship</Label>
          <Input 
            type="number" 
            value={funding.scholarship ?? ''} 
            onChange={(e) => setFunding({ ...funding, scholarship: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label>Family Contribution</Label>
          <Input 
            type="number" 
            value={funding.familyContribution ?? ''} 
            onChange={(e) => setFunding({ ...funding, familyContribution: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label>Fees Already Paid</Label>
          <Input 
            type="number" 
            value={funding.feesAlreadyPaid ?? ''} 
            onChange={(e) => setFunding({ ...funding, feesAlreadyPaid: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="rounded-full">Back</Button>
        <Button onClick={onNext} className="rounded-full bg-[#333333]">Next: Financial Profile</Button>
      </div>
    </div>
  );
}
