import { useState, useEffect } from 'react';
import { useIntake } from '../../store/useIntake';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Gender, CoApplicantType } from '../../lib/types';

export function Step1Study({ onNext }: { onNext: () => void }) {
  const { student, setStudent, study, setStudy, assumptions, setAssumptions } = useIntake();
  
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (study.currency && study.currency !== 'INR') {
      setIsFetchingRate(true);
      setFetchError(false);
      
      fetch(`https://open.er-api.com/v6/latest/${study.currency}`)
        .then(res => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then(data => {
          if (data && data.rates && data.rates.INR) {
            const rate = Math.round(data.rates.INR * 100) / 100;
            setStudy(prev => ({ ...prev, exchangeRateToINR: rate }));
          }
        })
        .catch(err => {
          console.error("Failed to fetch exchange rate", err);
          setFetchError(true);
        })
        .finally(() => setIsFetchingRate(false));
    } else if (study.currency === 'INR') {
      setStudy(prev => ({ ...prev, exchangeRateToINR: undefined }));
    }
  }, [study.currency, setStudy]);

  const showExchangeRate = study.currency && study.currency !== 'INR';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Student & Study Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="studentName">Name (Optional)</Label>
          <Input 
            id="studentName"
            value={student.name || ''} 
            onChange={(e) => setStudent({ ...student, name: e.target.value || undefined })}
            placeholder="e.g. Priya Sharma"
          />
        </div>

        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={student.gender || ''} onValueChange={(v) => setStudent({ ...student, gender: v as Gender })}>
            <SelectTrigger aria-label="Gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="not specified">Not Specified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cibilScore">CIBIL Score (Optional)</Label>
          <Input 
            id="cibilScore"
            type="number" 
            value={student.cibilScore || ''} 
            onChange={(e) => setStudent({ ...student, cibilScore: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="e.g. 750"
          />
        </div>

        <div className="space-y-2">
          <Label>Co-applicant Type</Label>
          <Select value={student.coApplicantType || ''} onValueChange={(v) => setStudent({ ...student, coApplicantType: v as CoApplicantType })}>
            <SelectTrigger aria-label="Co-applicant Type"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="salaried">Salaried</SelectItem>
              <SelectItem value="self-employed">Self-employed</SelectItem>
              <SelectItem value="not specified">Not Specified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-6 mt-6 space-y-4">
        <h3 className="font-bold">Study Programme</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country (Optional)</Label>
            <Input 
              id="country"
              value={study.country || ''} 
              onChange={(e) => setStudy({ ...study, country: e.target.value || undefined })}
              placeholder="e.g. United Kingdom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="university">University (Optional)</Label>
            <Input 
              id="university"
              value={study.university || ''} 
              onChange={(e) => setStudy({ ...study, university: e.target.value || undefined })}
              placeholder="e.g. University of Oxford"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course">Course (Optional)</Label>
            <Input 
              id="course"
              value={study.course || ''} 
              onChange={(e) => setStudy({ ...study, course: e.target.value || undefined })}
              placeholder="e.g. MSc Computer Science"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="universityRank">University Rank (Optional)</Label>
            <Input 
              id="universityRank"
              type="number" 
              value={study.universityRank || ''} 
              onChange={(e) => setStudy({ ...study, universityRank: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g. 50"
            />
            <p className="text-xs text-slate-500">Used for lenders that only offer non-collateral loans for top-100 universities</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-6 space-y-4">
        <h3 className="font-bold">Study Costs</h3>
        <p className="text-sm text-slate-500">Study costs are entered in the selected currency; funding is entered in INR.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={study.currency || 'INR'} onValueChange={(v) => setStudy({ ...study, currency: v })}>
              <SelectTrigger aria-label="Currency"><SelectValue placeholder="Select currency" /></SelectTrigger>
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
              <Label htmlFor="exchangeRate">Exchange Rate to INR</Label>
              <Input 
                id="exchangeRate"
                type="number" 
                value={study.exchangeRateToINR || ''} 
                onChange={(e) => setStudy({ ...study, exchangeRateToINR: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="e.g. 83.5"
                disabled={isFetchingRate}
              />
              {isFetchingRate && <p className="text-xs text-blue-500">Fetching live rate...</p>}
              {fetchError && <p className="text-xs text-orange-700">Failed to fetch rate. Please enter manually.</p>}
              {!isFetchingRate && !fetchError && study.exchangeRateToINR && (
                <p className="text-xs text-slate-500">Assumption - editable live rate</p>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="totalTuition">Total Tuition</Label>
            <Input 
              id="totalTuition"
              type="number" 
              value={study.totalTuition ?? ''} 
              onChange={(e) => setStudy({ ...study, totalTuition: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationYears">Duration (Years)</Label>
            <Input 
              id="durationYears"
              type="number" 
              value={study.durationYears ?? ''} 
              onChange={(e) => setStudy({ ...study, durationYears: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="livingCost">Living Cost Per Year</Label>
            <Input 
              id="livingCost"
              type="number" 
              value={study.livingCostPerYear ?? ''} 
              onChange={(e) => setStudy({ ...study, livingCostPerYear: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            {study.livingCostPerYear === undefined && <p className="text-xs text-orange-700">Living cost not entered, treated as ₹0</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherCosts">Other Costs (Optional)</Label>
            <Input 
              id="otherCosts"
              type="number" 
              value={study.otherCosts ?? ''} 
              onChange={(e) => setStudy({ ...study, otherCosts: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            {study.otherCosts === undefined && <p className="text-xs text-orange-700">Other costs not entered, treated as ₹0</p>}
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-6 space-y-4">
        <h3 className="font-bold">Assumptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenorYears">Tenor (Years)</Label>
            <Input 
              id="tenorYears"
              type="number" 
              value={assumptions.tenorYears} 
              onChange={(e) => setAssumptions({ ...assumptions, tenorYears: e.target.value ? parseInt(e.target.value) : 10 })}
            />
            <p className="text-xs text-slate-500">Assumption - not in dataset</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 pt-6">
              <input
                id="moratorium"
                type="checkbox"
                checked={assumptions.moratoriumEnabled || false}
                onChange={(e) => setAssumptions({ ...assumptions, moratoriumEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="moratorium" className="cursor-pointer">Include moratorium interest</Label>
            </div>
            <p className="text-xs text-slate-500">Illustrative assumption: simple interest accrues during the study period on the loan amount</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} className="rounded-full bg-[#333333]">Next: Funding</Button>
      </div>
    </div>
  );
}
