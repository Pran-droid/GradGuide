import { useIntake } from '../../store/useIntake';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { CollateralItem } from '../../lib/types';

export function Step4Collateral({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const { collateral, setCollateral } = useIntake();

  const addCollateral = () => {
    setCollateral([...collateral, { type: '', estimatedValue: 0, propertyState: 'other', propertyType: 'other', propertyStatus: 'resale' }]);
  };

  const removeCollateral = (index: number) => {
    const newC = [...collateral];
    newC.splice(index, 1);
    setCollateral(newC);
  };

  const updateItem = (index: number, updates: Partial<CollateralItem>) => {
    const newC = [...collateral];
    newC[index] = { ...newC[index], ...updates };
    setCollateral(newC);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Collateral</h2>
      
      <div className="space-y-6">
        {collateral.map((item, i) => (
          <div key={i} className="border border-slate-200 p-4 rounded-lg space-y-4">
             <div className="flex justify-between items-center">
               <h4 className="font-bold">Item {i + 1}</h4>
               <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeCollateral(i)}>Remove</Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor={`col-type-${i}`}>Type / Description</Label>
                 <Input id={`col-type-${i}`} value={item.type} onChange={(e) => updateItem(i, { type: e.target.value })} />
               </div>
               <div className="space-y-2">
                 <Label htmlFor={`col-val-${i}`}>Estimated Value (INR)</Label>
                 <Input id={`col-val-${i}`} type="number" value={item.estimatedValue || ''} onChange={(e) => updateItem(i, { estimatedValue: parseFloat(e.target.value) || 0 })} />
               </div>
               <div className="space-y-2">
                 <Label>Property State</Label>
                 <Select value={item.propertyState} onValueChange={(v: any) => updateItem(i, { propertyState: v })}>
                   <SelectTrigger aria-label="Property State"><SelectValue/></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Delhi">Delhi</SelectItem>
                     <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                     <SelectItem value="other">Other</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Property Type</Label>
                 <Select value={item.propertyType} onValueChange={(v: any) => updateItem(i, { propertyType: v })}>
                   <SelectTrigger aria-label="Property Type"><SelectValue/></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="apartment">Apartment</SelectItem>
                     <SelectItem value="other">Other</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Property Status</Label>
                 <Select value={item.propertyStatus} onValueChange={(v: any) => updateItem(i, { propertyStatus: v })}>
                   <SelectTrigger aria-label="Property Status"><SelectValue/></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="new">New</SelectItem>
                     <SelectItem value="resale">Resale</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addCollateral}>+ Add Collateral Item</Button>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="rounded-full">Back</Button>
        <Button onClick={onNext} className="rounded-full bg-[#333333]">View Results</Button>
      </div>
    </div>
  );
}
