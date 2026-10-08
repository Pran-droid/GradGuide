import React, { useState, useCallback, useMemo } from 'react';
import { useIntake } from '../../store/useIntake';
import type { DocumentItem } from '../../lib/documents';
import { generateDocumentChecklist, getSupplementaryDocuments, globalDocumentRules, checkTolerance } from '../../lib/documents';
import { assessLenders } from '../../lib/assess';
import { calculateFundingGap, calculateTotalCost, calculateFundingAvailable, calculateNetWorth, formatINR } from '../../lib/calc';
import { Button } from '../ui/button';

function FileUploadItem({ 
  item, 
  fileData, 
  onUpload, 
  onRemove,
  requireAmount = false,
  amountLabel = "Amount"
}: { 
  item: DocumentItem, 
  fileData?: { file: File, declaredAmount?: number },
  onUpload: (id: string, file: File, amount?: number) => void,
  onRemove: (id: string) => void,
  requireAmount?: boolean,
  amountLabel?: string
}) {
  const [dragActive, setDragActive] = useState(false);
  const [amountInput, setAmountInput] = useState<string>('');
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleFileSelection = useCallback((file: File) => {
    let amount: number | undefined = undefined;
    if (requireAmount) {
      amount = parseFloat(amountInput);
      if (isNaN(amount)) amount = undefined;
    }
    onUpload(item.id, file, amount);
  }, [requireAmount, amountInput, onUpload, item.id]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, [handleFileSelection]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  }, [handleFileSelection]);

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white mb-2 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex-1">
        <h5 className="font-semibold text-sm">{item.label}</h5>
        {item.note && <p className="text-xs text-slate-500">{item.note}</p>}
        {item.group === 'supplementary' && (
          <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] uppercase font-bold rounded-full tracking-wider">
            Not in dataset
          </span>
        )}
      </div>
      
      {fileData ? (
        <div className="flex items-center gap-3 bg-green-50 px-3 py-2 rounded-md border border-green-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="text-sm">
            <div className="font-medium text-green-900 truncate max-w-[150px]" title={fileData.file.name}>{fileData.file.name}</div>
            <div className="text-xs text-green-700">{(fileData.file.size / 1024).toFixed(1)} KB</div>
            {fileData.declaredAmount !== undefined && (
              <div className="text-xs font-bold text-green-800 mt-0.5">Value: ₹ {formatINR(fileData.declaredAmount)}</div>
            )}
          </div>
          <button onClick={() => onRemove(item.id)} className="ml-2 text-slate-400 hover:text-red-500 transition-colors p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <div className="flex-shrink-0 flex flex-col gap-2 w-full md:w-auto">
          {requireAmount && (
            <input 
              type="number"
              placeholder={`${amountLabel} (INR)`}
              value={amountInput}
              onChange={e => setAmountInput(e.target.value)}
              className="text-sm px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#F25C5C]"
            />
          )}
          <label 
            className={`flex items-center justify-center border-2 border-dashed rounded-md px-4 py-2 cursor-pointer transition-colors text-sm
              ${dragActive ? 'border-[#F25C5C] bg-[#FEF7EF]' : 'border-slate-300 hover:bg-slate-50'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <span className="text-slate-500 font-medium">Drag & Drop or <span className="text-[#D93838]">Browse</span></span>
            <input type="file" className="hidden" onChange={handleChange} />
          </label>
        </div>
      )}
    </div>
  );
}

export function Step5Documents({ onBack, onNext }: { onBack: () => void, onNext: () => void }) {
  const { student, study, funding, financialProfile, collateral, uploads, setUploads } = useIntake();
  const [activeTab, setActiveTab] = useState<'collateral' | 'non_collateral'>('non_collateral');
  const [tolerancePerc, setTolerancePerc] = useState(10);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const totalCostResult = calculateTotalCost(study);
  const fundingAvailable = calculateFundingAvailable(funding);
  const gapResult = calculateFundingGap(totalCostResult, fundingAvailable);
  const netWorth = calculateNetWorth(financialProfile);
  
  const assessmentResults = assessLenders(student, study, gapResult);
  
  const isCollateralRelevant = collateral.reduce((sum, c) => sum + (c.estimatedValue || 0), 0) > 0;
  const isNonCollateralRelevant = assessmentResults.filter(r => r.product_type === 'non_collateral').some(r => r.status === 'meets' || r.status === 'cannot_assess');

  // Generate checklists for the active route
  const currentChecklist = useMemo(() => {
    return generateDocumentChecklist({
      route: activeTab,
      coApplicantType: student.coApplicantType || 'not specified',
      collateral: collateral
    });
  }, [activeTab, student.coApplicantType, collateral]);

  const supplementary = useMemo(() => getSupplementaryDocuments(), []);

  const handleUpload = (id: string, file: File, amount?: number) => {
    setErrorMsg(null);
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(`Invalid file type for ${file.name}. Only PDF, JPG, and PNG are allowed.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`File ${file.name} exceeds the 10 MB size limit.`);
      return;
    }
    setUploads({ ...uploads, [id]: { file, declaredAmount: amount } });
  };
  const handleRemove = (id: string) => {
    const newUploads = { ...uploads };
    delete newUploads[id];
    setUploads(newUploads);
  };

  // Grouping
  const groups = Array.from(new Set(currentChecklist.map(i => i.group)));
  
  const isNetWorthEmpty = !financialProfile.assets?.length && !financialProfile.liabilities?.length;
  const formNetWorth = isNetWorthEmpty ? null : netWorth;
  const netWorthMismatch = checkTolerance(formNetWorth, uploads['ca_net_worth_certificate']?.declaredAmount, tolerancePerc);
  
  const formCoAppIncome = financialProfile.coApplicantIncome !== undefined ? financialProfile.coApplicantIncome : null;
  const itrAmount = uploads['itr_2y']?.declaredAmount ?? uploads['itr_3y']?.declaredAmount;
  const incomeMismatchReal = checkTolerance(formCoAppIncome, itrAmount, tolerancePerc);

  const calculateReadiness = (items: DocumentItem[]) => {
    if (items.length === 0) return 100;
    const uploadedCount = items.filter(i => uploads[i.id]).length;
    return Math.round((uploadedCount / items.length) * 100);
  };

  const overallReadiness = calculateReadiness(currentChecklist);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-bold italic">Document <span className="text-[#F25C5C]">Checklist</span></h2>
        <p className="text-sm text-slate-500 mt-1">Upload files to verify readiness (kept in browser memory only).</p>
      </div>

      <div className="bg-[#FEF7EF] border border-[#F25C5C]/20 text-orange-800 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
        <svg className="w-5 h-5 text-[#D93838]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        {globalDocumentRules[0]}
      </div>

      {isCollateralRelevant && isNonCollateralRelevant && (
        <div className="flex border-b border-slate-200">
          <button 
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'non_collateral' ? 'border-[#F25C5C] text-[#D93838]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('non_collateral')}
          >
            Non-Collateral Route
          </button>
          <button 
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'collateral' ? 'border-[#F25C5C] text-[#D93838]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('collateral')}
          >
            Collateral Route
          </button>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Overall Readiness</div>
          <div className="text-3xl font-extrabold text-[#333333]">{overallReadiness}%</div>
        </div>
        <div className="w-2/3 max-w-sm h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${overallReadiness}%` }} />
        </div>
      </div>

      {(netWorthMismatch || incomeMismatchReal) && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Consistency Flags (Tolerance: {tolerancePerc}%)
          </h4>
          <ul className="text-sm text-amber-800 space-y-1">
            {netWorthMismatch && <li><span className="font-bold">Net Worth mismatch:</span> Form shows ₹{formatINR(formNetWorth || 0)} vs CA Certificate shows ₹{formatINR(uploads['ca_net_worth_certificate']?.declaredAmount || 0)}. Please verify.</li>}
            {incomeMismatchReal && <li><span className="font-bold">Income mismatch:</span> Co-applicant form income is ₹{formatINR(formCoAppIncome || 0)} vs ITR shows ₹{formatINR(itrAmount || 0)}. Please verify.</li>}
          </ul>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
            <label>Adjust Tolerance:</label>
            <input type="range" min="0" max="50" step="5" value={tolerancePerc} onChange={e => setTolerancePerc(Number(e.target.value))} className="w-24" />
            <span>{tolerancePerc}%</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        {groups.map(group => {
          const items = currentChecklist.filter(i => i.group === group);
          const readiness = calculateReadiness(items);
          return (
            <div key={group} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-lg capitalize">{group.replace(/_/g, ' ')}</h4>
                <div className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">{readiness}% Complete</div>
              </div>
              <div>
                {items.map(item => (
                  <FileUploadItem 
                    key={item.id} 
                    item={item} 
                    fileData={uploads[item.id]} 
                    onUpload={handleUpload} 
                    onRemove={handleRemove} 
                    requireAmount={item.id === 'itr_2y' || item.id === 'itr_3y'}
                    amountLabel="Declared Income"
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="font-bold text-lg">Supplementary Documents</h4>
              <p className="text-xs text-slate-500">Not required by dataset, but accepted for checks.</p>
            </div>
          </div>
          <div>
            {supplementary.map(item => (
              <FileUploadItem 
                key={item.id} 
                item={item} 
                fileData={uploads[item.id]} 
                onUpload={handleUpload} 
                onRemove={handleRemove} 
                requireAmount={item.id === 'ca_net_worth_certificate'}
                amountLabel="Certified Net Worth"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <div className="flex gap-4">
          <Button variant="outline" onClick={onNext} className="rounded-full">
            Continue without documents
          </Button>
          <Button onClick={onNext} className="bg-[#333333] text-white hover:bg-black rounded-full px-8">
            View Results
          </Button>
        </div>
      </div>
    </div>
  );
}
