import React, { useState } from 'react';
import { 
  Search, Plus, Edit, UserPlus, Info, Check, X, CheckSquare, Square, Save, AlertCircle, ShoppingBag, Trash2
} from 'lucide-react';
import { DB } from '../db/storage';
import { Learner, Parent, Grade, ClassRoom, FeeItem } from '../types';

interface LearnerProps {
  currentUserRole: string;
}

export default function LearnerManagement({ currentUserRole }: LearnerProps) {
  const isViewOnly = currentUserRole === 'Teacher (view only)';

  // Database lists
  const [learners, setLearners] = useState<Learner[]>(() => DB.getLearners());
  const [parents, setParents] = useState<Parent[]>(() => DB.getParents());
  const [grades] = useState<Grade[]>(() => DB.getGrades());
  const [classes] = useState<ClassRoom[]>(() => DB.getClasses());
  const [feeItems] = useState<FeeItem[]>(() => DB.getFeeItems().filter(item => item.type === 'Optional'));

  // Search filter inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');

  // Selected learner for detail sheet / edits
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [editingLearnerId, setEditingLearnerId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states for Learner & Parent combination
  const [learnerName, setLearnerName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');
  const [notes, setNotes] = useState('');

  // Parent form states
  const [parentName, setParentName] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Mother');
  const [parentContact, setParentContact] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentAddress, setParentAddress] = useState('');
  const [parentAltContact, setParentAltContact] = useState('');

  // Subscribed Optional Fee Items (for a learner being created/edited)
  const [subscribedOptions, setSubscribedOptions] = useState<string[]>([]);

  // Validation feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshData = () => {
    setLearners(DB.getLearners());
    setParents(DB.getParents());
  };

  const handleDeleteLearner = (id: string) => {
    if (isViewOnly) return;
    const learner = learners.find(l => l.id === id);
    if (!learner) return;

    const remaining = learners.filter(l => l.id !== id);
    DB.saveLearners(remaining);
    DB.log('Delete Student Profile', `Permanently deleted record of: ${learner.name} (Admission #: ${learner.admissionNumber})`);
    setSuccess(`Student record for "${learner.name}" has been permanently deleted.`);
    setDeletingId(null);
    refreshData();
  };

  // Safe unique billing incremental numbering
  const getNextAdmissionNumber = () => {
    const sorted = [...learners].sort((a, b) => b.admissionNumber.localeCompare(a.admissionNumber));
    if (sorted.length > 0) {
      const lastNumStr = sorted[0].admissionNumber.split('-')[2];
      const parsed = parseInt(lastNumStr, 10);
      if (!isNaN(parsed)) {
        return `BK-2026-${String(parsed + 1).padStart(3, '0')}`;
      }
    }
    return `BK-2026-020`;
  };

  const handleOpenAdd = () => {
    setError('');
    setSuccess('');
    setLearnerName('');
    setAdmissionNumber(getNextAdmissionNumber());
    setGradeId(grades[0]?.id || '');
    setClassId(classes[0]?.id || '');
    setNotes('');
    setParentName('');
    setParentRelationship('Mother');
    setParentContact('');
    setParentEmail('');
    setParentAddress('');
    setParentAltContact('');
    setSubscribedOptions([]);
    setShowAddForm(true);
    setEditingLearnerId(null);
  };

  const handleOpenEdit = (learner: Learner) => {
    setError('');
    setSuccess('');
    const parent = parents.find(p => p.id === learner.parentId);
    const options = DB.getLearnerOptions();
    const lOptions = options[learner.id] || [];

    setLearnerName(learner.name);
    setAdmissionNumber(learner.admissionNumber);
    setGradeId(learner.gradeId);
    setClassId(learner.classId);
    setNotes(learner.notes || '');

    setParentName(parent?.name || '');
    setParentRelationship(parent?.relationship || 'Mother');
    setParentContact(parent?.contactNumber || '');
    setParentEmail(parent?.email || '');
    setParentAddress(parent?.address || '');
    setParentAltContact(parent?.alternativeContact || '');

    setSubscribedOptions(lOptions);
    setEditingLearnerId(learner.id);
    setShowAddForm(false);
  };

  const handleToggleSubscribedOption = (feeItemId: string) => {
    setSubscribedOptions(prev => {
      if (prev.includes(feeItemId)) {
        return prev.filter(id => id !== feeItemId);
      } else {
        return [...prev, feeItemId];
      }
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;
    setError('');
    setSuccess('');

    if (!learnerName || !admissionNumber || !parentName || !parentContact) {
      setError('Please provide Learner Name, Admission Number, Parent Name, and Parent Contact.');
      return;
    }

    const currentLearners = DB.getLearners();

    // If adding, ensure unique admission number
    if (editingLearnerId === null) {
      const exists = currentLearners.some(
        l => l.admissionNumber.toLowerCase() === admissionNumber.toLowerCase()
      );
      if (exists) {
        setError(`Admission Number "${admissionNumber}" is already assigned to another learner.`);
        return;
      }
    }

    try {
      let lParentId = '';

      if (editingLearnerId === null) {
        // 1. Create Parent record
        const parentList = DB.getParents();
        const newParent: Parent = {
          id: DB.generateId(),
          name: parentName,
          relationship: parentRelationship,
          contactNumber: parentContact,
          email: parentEmail,
          address: parentAddress,
          alternativeContact: parentAltContact,
          createdAt: new Date().toISOString()
        };
        parentList.push(newParent);
        DB.saveParents(parentList);
        lParentId = newParent.id;

        // 2. Create Learner
        const newLearner: Learner = {
          id: DB.generateId(),
          name: learnerName,
          admissionNumber,
          gradeId,
          classId,
          parentId: lParentId,
          dateOfAdmission: new Date().toISOString().split('T')[0],
          active: true,
          notes
        };
        currentLearners.push(newLearner);
        DB.saveLearners(currentLearners);

        // 3. Save subscribed optional fees
        const optionsMap = DB.getLearnerOptions();
        optionsMap[newLearner.id] = subscribedOptions;
        DB.saveLearnerOptions(optionsMap);

        DB.log('Add Learner', `Registered new learner: ${learnerName} with Admission #${admissionNumber}`);
        setSuccess(`Successfully registered "${learnerName}" with Admission No. "${admissionNumber}".`);
      } else {
        // 1. Edit existing Learner
        const updatedLearners = currentLearners.map(l => {
          if (l.id === editingLearnerId) {
            lParentId = l.parentId;
            return {
              ...l,
              name: learnerName,
              admissionNumber,
              gradeId,
              classId,
              notes
            };
          }
          return l;
        });
        DB.saveLearners(updatedLearners);

        // 2. Edit associated Parent
        const parentList = DB.getParents();
        const updatedParents = parentList.map(p => {
          if (p.id === lParentId) {
            return {
              ...p,
              name: parentName,
              relationship: parentRelationship,
              contactNumber: parentContact,
              email: parentEmail,
              address: parentAddress,
              alternativeContact: parentAltContact
            };
          }
          return p;
        });
        DB.saveParents(updatedParents);

        // 3. Edit subscribed optional fees
        const optionsMap = DB.getLearnerOptions();
        optionsMap[editingLearnerId] = subscribedOptions;
        DB.saveLearnerOptions(optionsMap);

        DB.log('Edit Learner', `Modified details of: ${learnerName} (#${admissionNumber})`);
        setSuccess(`Successfully update details for "${learnerName}".`);
        setEditingLearnerId(null);
      }

      refreshData();
      setShowAddForm(false);
    } catch (e: any) {
      setError(`An unexpected error occurred: ${e.message}`);
    }
  };

  // Searching filter matching name, admission, or grade
  const filteredLearners = learners.filter(l => {
    const parent = parents.find(p => p.id === l.parentId);
    const gr = grades.find(g => g.id === l.gradeId);

    const matchesQuery = 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (parent && parent.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (gr && gr.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGrade = selectedGradeFilter ? l.gradeId === selectedGradeFilter : true;

    return matchesQuery && matchesGrade;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Learners & Guardians Register</h2>
          <p className="text-xs text-slate-500">Record admissions, parent contacts, and special program subscriptions</p>
        </div>
        {!isViewOnly && (
          <button 
            onClick={handleOpenAdd}
            className="rounded-lg bg-brand-blue text-white font-semibold text-xs py-2 px-4 shadow hover:bg-brand-blue/90 flex items-center gap-1.5 transition active:scale-98"
          >
            <UserPlus className="h-4 w-4" />
            New Learner Admission
          </button>
        )}
      </div>

      {/* FILTER PANEL */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:bg-slate-900 dark:border-slate-800 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none"
            placeholder="Search student name, parent, admission number..."
          />
        </div>
        <div>
          <select
            value={selectedGradeFilter}
            onChange={(e) => setSelectedGradeFilter(e.target.value)}
            className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">-- All Grades --</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-250 p-3 text-xs text-emerald-800 flex items-center gap-2 dark:bg-emerald-950/20 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-250 p-3 text-xs text-red-800 flex items-center gap-2 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 text-brand-red" />
          <span>{error}</span>
        </div>
      )}

      {/* DUAL WORKSPACE: FORM VS TABLE */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* ADD/EDIT FORM DRAWER ON SCREEN (Toggled) */}
        {(showAddForm || editingLearnerId) && (
          <div className="lg:col-span-1 rounded-xl border border-slate-250 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 h-fit space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                {editingLearnerId ? 'Edit Student File' : 'Admit New student'}
              </h3>
              <button 
                onClick={() => { setShowAddForm(false); setEditingLearnerId(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* LEARNER PARAMS */}
              <div className="space-y-2.5">
                <span className="font-bold uppercase text-[10px] tracking-wider text-brand-blue block">1. Student Primary Details</span>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={learnerName}
                    onChange={(e) => setLearnerName(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-2.5 py-1.5 focus:outline-none"
                    placeholder="Lerato Ndlovu"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Admission Number</label>
                    <input
                      type="text"
                      required
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-2.5 py-1.5 focus:outline-none font-mono"
                      placeholder="BK-2026-001"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Grade Year</label>
                    <select
                      value={gradeId}
                      onChange={(e) => setGradeId(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-2.5 py-1.5 focus:outline-none"
                    >
                      {grades.map(g => (
                        <option key={g.id} value={g.id}>{g.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Class group assigning deactivated as per guidelines */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Special Education / Health Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-2.5 py-1.5 focus:outline-none"
                    placeholder="Allergies, special medications..."
                  />
                </div>
              </div>

              {/* PARENT DETAILS */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold uppercase text-[10px] tracking-wider text-brand-red block">2. Primary Guardian details</span>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Guardian Full Name</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-2.5 py-1.5 focus:outline-none"
                    placeholder="Sibongile Ndlovu"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Relationship</label>
                    <select
                      value={parentRelationship}
                      onChange={(e) => setParentRelationship(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Legal Guardian</option>
                      <option value="Grandmother">Grandmother/Grandfather</option>
                      <option value="Uncle/Aunt">Uncle/Aunt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Primary Mobile #</label>
                    <input
                      type="text"
                      required
                      value={parentContact}
                      onChange={(e) => setParentContact(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-2.5 py-1.5 focus:outline-none font-mono"
                      placeholder="+27 82 555 1234"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Email ID</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-2.5 py-1.5 focus:outline-none"
                      placeholder="parent@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Alt Contact (Optional)</label>
                    <input
                      type="text"
                      value={parentAltContact}
                      onChange={(e) => setParentAltContact(e.target.value)}
                      className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-2.5 py-1.5 focus:outline-none font-mono"
                      placeholder="Local second contact"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Residential Street Address</label>
                  <input
                    type="text"
                    value={parentAddress}
                    onChange={(e) => setParentAddress(e.target.value)}
                    className="block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 px-2.5 py-1.5 focus:outline-none"
                    placeholder="12 Main Rd, Westville, 3629"
                  />
                </div>
              </div>

              {/* DYNAMIC OPTIONAL SERVICES */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold uppercase text-[10px] tracking-wider text-brand-blue block">3. Billable Optional Subscriptions</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle optional extra services to immediately charge of this learners ledger.</p>
                <div className="space-y-1.5 pt-1.5">
                  {feeItems.map(item => {
                    const isSubscribed = subscribedOptions.includes(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleToggleSubscribedOption(item.id)}
                        className={`w-full flex items-center justify-between text-left p-2 rounded border border-slate-200 cursor-pointer transition ${isSubscribed ? 'bg-brand-blue/5 border-brand-blue/40 text-brand-blue' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          {isSubscribed ? (
                            <CheckSquare className="h-4 w-4 shrink-0 text-brand-blue" />
                          ) : (
                            <Square className="h-4 w-4 shrink-0 text-slate-300" />
                          )}
                          <div>
                            <p className="font-bold text-[11px] leading-tight text-slate-850">{item.name}</p>
                            <p className="text-[9px] text-slate-450 uppercase font-semibold">{item.period}</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-[11px]">R {item.amount}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setEditingLearnerId(null); }}
                  className="rounded px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-brand-blue text-white font-bold px-4 py-2 hover:bg-brand-blue/90 flex items-center gap-1.5 shadow"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Student File
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LIST TABLE SPANNING */}
        <div className={`${(showAddForm || editingLearnerId) ? 'lg:col-span-2' : 'lg:col-span-3'} rounded-xl border border-slate-200 bg-white shadow-xs dark:bg-slate-900 dark:border-slate-850 overflow-hidden`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white">Active Student Register ({filteredLearners.length})</h4>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Blooming Kids Registry</span>
          </div>

          <div className="overflow-x-auto">
            {filteredLearners.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No registered learners match your filter parameters.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4">Grade Year</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                    <th className="py-3 px-4 text-center">Arrears</th>
                    {!isViewOnly && <th className="py-3 px-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredLearners.map(l => {
                    const parent = parents.find(p => p.id === l.parentId);
                    const gr = grades.find(g => g.id === l.gradeId);
                    const cl = classes.find(c => c.id === l.classId);
                    const stmt = DB.getLearnerStatement(l.id);

                    return (
                      <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">{l.name}</p>
                          {l.notes && (
                            <p className="text-[10px] text-brand-red flex items-center gap-0.5 mt-0.5 font-semibold">
                              <Info className="h-3 w-3 inline" />
                              {l.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold">{l.admissionNumber}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-850 dark:text-slate-200">{gr?.name}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{parent?.name}</p>
                          <p className="text-[10px] text-slate-450 mt-0.5 font-mono">{parent?.contactNumber}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          {stmt ? (
                            stmt.outstandingBalance > 0 ? (
                              <span className="text-brand-red">R {stmt.outstandingBalance.toLocaleString()}</span>
                            ) : (
                              <span className="text-emerald-600">Settle (R0)</span>
                            )
                          ) : 'Calculate...'}
                        </td>
                        {!isViewOnly && (
                          <td className="py-3.5 px-4 text-center">
                            {deletingId === l.id ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-[10px] text-brand-red font-bold">Delete?</span>
                                <button
                                  onClick={() => handleDeleteLearner(l.id)}
                                  className="px-1.5 py-0.5 text-[10px] bg-brand-red text-white hover:bg-brand-red/90 rounded font-bold"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="px-1.5 py-0.5 text-[10px] bg-slate-250 dark:bg-slate-700 hover:bg-slate-300 rounded font-bold"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEdit(l)}
                                  className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1 px-2 hover:bg-brand-blue/10 hover:text-brand-blue transition font-bold"
                                >
                                  <Edit className="h-3 w-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingId(l.id)}
                                  className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-950/30 text-brand-red py-1 px-2 hover:bg-brand-red hover:text-white transition font-bold"
                                  title="Delete student profile"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
