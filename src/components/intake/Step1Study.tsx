import { useIntake } from '../../store/IntakeContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Gender, CoApplicantType } from '../../lib/types';

export function Step1Study({ onNext }: { onNext: () => void }) {
  const { student, setStudent, study, setStudy, assumptions, setAssumptions } = useIntake();
  
  const showExchangeRate = study.currency && study.currency !== 'INR';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Student & Study Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={student.gender || ''} onValueChange={(v) => setStudent({ ...student, gender: v as Gender })}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="not specified">Not Specified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>CIBIL Score (Optional)</Label>
          <Input 
            type="number" 
            value={student.cibilScore || ''} 
            onChange={(e) => setStudent({ ...student, cibilScore: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="e.g. 750"
          />
        </div>

        <div className="space-y-2">
          <Label>Co-applicant Type</Label>
          <Select value={student.coApplicantType || ''} onValueChange={(v) => setStudent({ ...student, coApplicantType: v as CoApplicantType })}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="salaried">Salaried</SelectItem>
              <SelectItem value="self-employed">Self-employed</SelectItem>
              <SelectItem value="not specified">Not Specified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>University Rank (Optional)</Label>
          <Input 
            type="number" 
            value={study.universityRank || ''} 
            onChange={(e) => setStudy({ ...study, universityRank: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="e.g. 50"
          />
          <p className="text-xs text-slate-500">Used for lenders that only offer non-collateral loans for top-100 universities</p>
        </div>
      </div>

      <div className="border-t pt-6 mt-6 space-y-4">
        <h3 className="font-bold">Study Costs</h3>
        <p className="text-sm text-slate-500">Study costs are entered in the selected currency; funding is entered in INR.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={study.currency || 'INR'} onValueChange={(v) => setStudy({ ...study, currency: v })}>
              <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showExchangeRate && (
            <div className="space-y-2">
              <Label>Exchange Rate to INR</Label>
              <Input 
                type="number" 
                value={study.exchangeRateToINR || ''} 
                onChange={(e) => setStudy({ ...study, exchangeRateToINR: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="e.g. 83.5"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Total Tuition</Label>
            <Input 
              type="number" 
              value={study.totalTuition ?? ''} 
              onChange={(e) => setStudy({ ...study, totalTuition: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label>Duration (Years)</Label>
            <Input 
              type="number" 
              value={study.durationYears ?? ''} 
              onChange={(e) => setStudy({ ...study, durationYears: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label>Living Cost Per Year</Label>
            <Input 
              type="number" 
              value={study.livingCostPerYear ?? ''} 
              onChange={(e) => setStudy({ ...study, livingCostPerYear: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            {study.livingCostPerYear === undefined && <p className="text-xs text-orange-500">Living cost not entered, treated as ₹0</p>}
          </div>

          <div className="space-y-2">
            <Label>Other Costs (Optional)</Label>
            <Input 
              type="number" 
              value={study.otherCosts ?? ''} 
              onChange={(e) => setStudy({ ...study, otherCosts: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            {study.otherCosts === undefined && <p className="text-xs text-orange-500">Other costs not entered, treated as ₹0</p>}
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-6 space-y-4">
        <h3 className="font-bold">Assumptions</h3>
        <div className="space-y-2 max-w-xs">
          <Label>Tenor (Years)</Label>
          <Input 
            type="number" 
            value={assumptions.tenorYears} 
            onChange={(e) => setAssumptions({ ...assumptions, tenorYears: e.target.value ? parseInt(e.target.value) : 10 })}
          />
          <p className="text-xs text-slate-500">Assumption - not in dataset</p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} className="rounded-full bg-[#333333]">Next: Funding</Button>
      </div>
    </div>
  );
}
