import { 
  User, Learner, Parent, Grade, ClassRoom, FeeItem, 
  DiscountExemption, AdditionalCharge, Payment, Receipt, AuditLog, SMSWhatsAppLog 
} from '../types';

// Storage keys
const KEYS = {
  USERS: 'bk_users',
  LEARNERS: 'bk_learners',
  PARENTS: 'bk_parents',
  GRADES: 'bk_grades',
  CLASSES: 'bk_classes',
  FEE_ITEMS: 'bk_fee_items',
  DISCOUNTS: 'bk_discounts',
  ADDITIONAL_CHARGES: 'bk_charges',
  PAYMENTS: 'bk_payments',
  RECEIPTS: 'bk_receipts',
  AUDIT_LOGS: 'bk_audit_logs',
  REMINDER_LOGS: 'bk_reminder_logs',
  CURRENT_USER: 'bk_current_user',
  LEARNER_OPTIONS: 'bk_learner_options', 
  TOKEN: 'bk_token',
  SETTINGS: 'bk_settings',
};

// Help generate IDs
export const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

// Core standard Grades
const defaultGrades: Grade[] = [
  { id: 'gBabies', name: 'Babies (1-2 years)', code: 'GR-BABIES' },
  { id: 'gRRRR', name: 'Grade RRRR', code: 'GR-RRRR' },
  { id: 'gRRR', name: 'Grade RRR', code: 'GR-RRR' },
  { id: 'gRR', name: 'Grade RR', code: 'GR-RR' },
  { id: 'gR', name: 'Grade R', code: 'GR-R' },
];

// Core Classrooms
const defaultClasses: ClassRoom[] = [
  { id: 'c1', gradeId: 'gRRR', name: 'Yellow Butterflies' },
  { id: 'c2', gradeId: 'gRR', name: 'Blue Birds' },
  { id: 'c3', gradeId: 'gR', name: 'Red Ladybugs' },
  { id: 'c4', gradeId: 'gR', name: 'Silver Stars' },
  { id: 'c5', gradeId: 'gRRRR', name: 'Little Busy Bees' },
  { id: 'c6', gradeId: 'gBabies', name: 'Cuddly Lambs' },
];

const defaultUsers: User[] = [
  { id: 'u1', username: 'admin', name: 'Sibusiso Khumalo', email: 'admin@bloomingkids721@gmail.com', role: 'Administrator', passwordHash: 'admin123', active: true, createdAt: '2026-01-01T08:00:00Z', phoneNumber: '+27821111111' },
  { id: 'u2', username: 'principal', name: 'Emelda T. Luthuli', email: 'principal@bloomingkids721@gmail.com', role: 'Principal', passwordHash: 'principal123', active: true, createdAt: '2026-01-02T08:00:00Z', phoneNumber: '+27823456789' },
  { id: 'u3', username: 'bursar', name: 'Sarah Botha', email: 'bursar@bloomingkids721@gmail.com', role: 'Bursar/Cashier', passwordHash: 'bursar123', active: true, createdAt: '2026-01-03T08:00:00Z', phoneNumber: '+27822222222' },
  { id: 'u4', username: 'teacher', name: 'Zanele Mthembu', email: 'teacher@bloomingkids721@gmail.com', role: 'Teacher (view only)', passwordHash: 'teacher123', active: true, createdAt: '2026-01-04T08:00:00Z', phoneNumber: '+27823333333' },
  { id: 'u5', username: '0827462182', name: 'Ms E.T Luthuli', email: 'luthuli@bloomingkids721@gmail.com', role: 'Principal', passwordHash: 'MayTwelve', active: true, createdAt: '2026-06-22T03:34:31Z', phoneNumber: '+27739990099' },
  { id: 'u6', username: '0739990099', name: 'Mr M.S Shange (Admin)', email: 'shange@bloomingkids721@gmail.com', role: 'Administrator', passwordHash: 'six1double7zero', active: true, createdAt: '2026-06-22T03:34:31Z', phoneNumber: '0739990099' }
];

const defaultFeeItems: FeeItem[] = [
  { id: 'f1', gradeId: 'gR', name: 'Grade R Tuition (12 months @ R400/pm)', amount: 4800, type: 'Required', period: 'Annual' },
  { id: 'f2', gradeId: 'gR', name: 'Graduation Day Package', amount: 850, type: 'Required', period: 'Once-off' },
  { id: 'f3', gradeId: 'gRR', name: 'Grade RR Tuition (12 months @ R400/pm)', amount: 4800, type: 'Required', period: 'Annual' },
  { id: 'f4', gradeId: 'gRRR', name: 'Grade RRR Tuition (12 months @ R500/pm)', amount: 6000, type: 'Required', period: 'Annual' },
  { id: 'f4a', gradeId: 'gRRRR', name: 'Grade RRRR Tuition (12 months @ R500/pm)', amount: 6000, type: 'Required', period: 'Annual' },
  { id: 'f4b', gradeId: 'gBabies', name: 'Babies (1-2 years) Tuition (12 months @ R500/pm)', amount: 6000, type: 'Required', period: 'Annual' },
  { id: 'f5', gradeId: 'all', name: 'Stationery & Educational Supplies Pack', amount: 1250, type: 'Required', period: 'Annual' },
  { id: 'f6', gradeId: 'all', name: 'Monthly Transport Service', amount: 750, type: 'Optional', period: 'Monthly' },
  { id: 'f7', gradeId: 'all', name: 'Blooming Kids Branded Back Pack & Tracksuit', amount: 950, type: 'Optional', period: 'Once-off' },
  { id: 'f8', gradeId: 'all', name: 'School Outing & Excursion Fund', amount: 450, type: 'Optional', period: 'Annual' }
];

const defaultParents: Parent[] = [
  { id: 'p1', name: 'Sibongile Ndlovu', relationship: 'Mother', contactNumber: '+27 82 567 1122', email: 'sibongile@gmail.com', address: '14 Blue Gum Ave, Westville, Durban', alternativeContact: '', createdAt: '2026-01-05T09:00:00Z' },
  { id: 'p2', name: 'Devan Pillay', relationship: 'Father', contactNumber: '+27 73 981 4455', email: 'devan.pillay@hvacsa.co.za', address: '128 Chealsea Ridge, New Germany, Pinetown', alternativeContact: '', createdAt: '2026-01-06T10:30:00Z' },
  { id: 'p3', name: 'Gavin Smith', relationship: 'Father', contactNumber: '+27 83 234 9876', email: 'gsmith@randwater.co.za', address: '55 Pine Street, Gillitts', alternativeContact: '', createdAt: '2026-01-07T11:15:00Z' },
  { id: 'p4', name: 'Nishaat Patel', relationship: 'Mother', contactNumber: '+27 61 786 1122', email: 'npatel@outlook.com', address: '8 Sherwood Gdns, Sherwood, Durban', alternativeContact: '', createdAt: '2026-01-08T09:45:00Z' }
];

const defaultLearners: Learner[] = [
  { id: 'l1', name: 'Lerato Ndlovu', admissionNumber: 'BK-2026-003', gradeId: 'gR', classId: 'c3', parentId: 'p1', dateOfAdmission: '2026-01-05', active: true, notes: 'Requires early afternoon pickup.' },
  { id: 'l2', name: 'Kavshir Pillay', admissionNumber: 'BK-2025-084', gradeId: 'gRR', classId: 'c2', parentId: 'p2', dateOfAdmission: '2025-01-10', active: true, notes: 'Allergenic to nuts.' },
  { id: 'l3', name: 'Liam Smith', admissionNumber: 'BK-2026-015', gradeId: 'gRRR', classId: 'c1', parentId: 'p3', dateOfAdmission: '2026-01-07', active: true, notes: '' },
  { id: 'l4', name: 'Yusuf Patel', admissionNumber: 'BK-2026-001', gradeId: 'gR', classId: 'c3', parentId: 'p4', dateOfAdmission: '2026-01-08', active: true, notes: '' }
];

const defaultLearnerOptions: Record<string, string[]> = {
  'l1': ['f7', 'f8'],
  'l2': ['f6'],
  'l4': ['f8']
};

const defaultDiscounts: DiscountExemption[] = [
  { id: 'd1', learnerId: 'l4', name: 'Sibling Assistance Exemption', amount: 2500, type: 'Exemption' },
  { id: 'd2', learnerId: 'A2TQ1IQ', name: 'Monthly Installment Adjustment Exemption', amount: 2450, type: 'Exemption' }
];

const defaultCharges: AdditionalCharge[] = [
  { id: 'ch1', learnerId: 'l1', name: 'Damaged Reader Replacement Fee', amount: 350, dateCharged: '2026-03-12' },
  { id: 'ch2', learnerId: 'l2', name: 'Additional Uniform Shirt', amount: 220, dateCharged: '2026-02-18' }
];

const defaultPayments: Payment[] = [
  { id: 'pay1', learnerId: 'l1', amount: 5000, paymentDate: '2026-01-15T09:30:00Z', paymentMethod: 'EFT', reference: 'LERATONDLOVUFEE1', receivedByUserId: 'u3', receiptNumber: 'REC-2026-0001', note: '' },
  { id: 'pay2', learnerId: 'l1', amount: 8000, paymentDate: '2026-03-01T14:15:00Z', paymentMethod: 'Cash', reference: 'HAND_DELIVERED', receivedByUserId: 'u3', receiptNumber: 'REC-2026-0002', note: '' },
  { id: 'pay3', learnerId: 'l2', amount: 10000, paymentDate: '2026-02-10T11:00:00Z', paymentMethod: 'Credit/Debit Card', reference: 'CARD_7721', receivedByUserId: 'u3', receiptNumber: 'REC-2026-0003', note: '' },
  { id: 'pay4', learnerId: 'l3', amount: 20750, paymentDate: '2026-01-08T10:00:00Z', paymentMethod: 'EFT', reference: 'LIAM_SMITH_FULL', receivedByUserId: 'u1', receiptNumber: 'REC-2026-0004', note: '' },
  { id: 'pay5', learnerId: 'l4', amount: 6000, paymentDate: '2026-02-20T12:30:00Z', paymentMethod: 'Direct Deposit', reference: 'DEP_YUSUF_FEE', receivedByUserId: 'u3', receiptNumber: 'REC-2026-0005', note: '' },
];

const defaultReceipts: Receipt[] = [
  { id: 'rec1', receiptNumber: 'REC-2026-0001', paymentId: 'pay1', learnerId: 'l1', dateGenerated: '2026-01-15T09:30:00Z', qrCodeValue: 'VERIFY:BK-REC-2026-0001:R5000', printedCount: 1 },
  { id: 'rec2', receiptNumber: 'REC-2026-0002', paymentId: 'pay2', learnerId: 'l1', dateGenerated: '2026-03-01T14:15:00Z', qrCodeValue: 'VERIFY:BK-REC-2026-0002:R8000', printedCount: 1 },
  { id: 'rec3', receiptNumber: 'REC-2026-0003', paymentId: 'pay3', learnerId: 'l2', dateGenerated: '2026-02-10T11:00:00Z', qrCodeValue: 'VERIFY:BK-REC-2026-0003:R10000', printedCount: 2 },
  { id: 'rec4', receiptNumber: 'REC-2026-0004', paymentId: 'pay4', learnerId: 'l3', dateGenerated: '2026-01-08T10:00:00Z', qrCodeValue: 'VERIFY:BK-REC-2026-0004:R20750', printedCount: 1 },
  { id: 'rec5', receiptNumber: 'REC-2026-0005', paymentId: 'pay5', learnerId: 'l4', dateGenerated: '2026-02-20T12:30:00Z', qrCodeValue: 'VERIFY:BK-REC-2026-0005:R6000', printedCount: 0 }
];

const defaultAuditLogs: AuditLog[] = [
  { id: 'au1', userId: 'u1', username: 'admin', role: 'Administrator', action: 'System Initialized', details: 'Database pre-seeded with sample learners and fee templates.', timestamp: '2026-06-21T08:00:00Z' },
  { id: 'au2', userId: 'u3', username: 'bursar', role: 'Bursar/Cashier', action: 'Record Payment', details: 'Recorded payment of R 8,000.00 for Lerato Ndlovu', timestamp: '2026-03-01T14:15:00Z' }
];

export const defaultSettings = {
  bank_name: 'First National Bank (FNB)',
  account_holder: 'Blooming Kids ECD',
  account_number: '62677098016',
  branch_code: '250 655',
  account_type: 'Current Account'
};

const load = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    return defaultValue;
  }
};

const save = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ==========================================
// DB API BRIDGE CLASS
// ==========================================
export class DB {
  static generateId(): string {
    return generateId();
  }

  static getToken(): string | null {
    return localStorage.getItem(KEYS.TOKEN);
  }

  static setToken(token: string | null) {
    if (token) {
      localStorage.setItem(KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(KEYS.TOKEN);
    }
  }

  static getHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // Fetch lists (Sync)
  static getUsers(): User[] { return load(KEYS.USERS, defaultUsers); }
  static getLearners(): Learner[] { return load(KEYS.LEARNERS, defaultLearners); }
  static getParents(): Parent[] { return load(KEYS.PARENTS, defaultParents); }
  static getGrades(): Grade[] { return load(KEYS.GRADES, defaultGrades); }
  static getClasses(): ClassRoom[] { return load(KEYS.CLASSES, defaultClasses); }
  static getFeeItems(): FeeItem[] {
    const items = load(KEYS.FEE_ITEMS, defaultFeeItems);
    let changed = false;
    const updated = items.map(item => {
      if (item.id === 'f1' && (item.amount !== 4800 || !item.name.includes('@ R400/pm'))) {
        changed = true;
        return { ...item, name: 'Grade R Tuition (12 months @ R400/pm)', amount: 4800 };
      }
      if (item.id === 'f3' && (item.amount !== 4800 || !item.name.includes('@ R400/pm'))) {
        changed = true;
        return { ...item, name: 'Grade RR Tuition (12 months @ R400/pm)', amount: 4800 };
      }
      if (item.id === 'f4' && (item.amount !== 6000 || !item.name.includes('@ R500/pm'))) {
        changed = true;
        return { ...item, name: 'Grade RRR Tuition (12 months @ R500/pm)', amount: 6000 };
      }
      if (item.id === 'f4a' && (item.amount !== 6000 || !item.name.includes('@ R500/pm'))) {
        changed = true;
        return { ...item, name: 'Grade RRRR Tuition (12 months @ R500/pm)', amount: 6000 };
      }
      if (item.id === 'f4b' && (item.amount !== 6000 || !item.name.includes('@ R500/pm'))) {
        changed = true;
        return { ...item, name: 'Babies (1-2 years) Tuition (12 months @ R500/pm)', amount: 6000 };
      }
      return item;
    });
    if (changed) {
      save(KEYS.FEE_ITEMS, updated);
      if (this.getToken()) {
        const headers = this.getHeaders();
        updated.slice(0, 6).forEach(u => {
          fetch(`/api/fee-items/${u.id}`, { method: 'PUT', headers, body: JSON.stringify(u) }).catch(console.error);
        });
      }
    }
    return updated;
  }
  static getDiscounts(): DiscountExemption[] { return load(KEYS.DISCOUNTS, defaultDiscounts); }
  static getAdditionalCharges(): AdditionalCharge[] { return load(KEYS.ADDITIONAL_CHARGES, defaultCharges); }
  static getPayments(): Payment[] { return load(KEYS.PAYMENTS, defaultPayments); }
  static getReceipts(): Receipt[] { return load(KEYS.RECEIPTS, defaultReceipts); }
  static getAuditLogs(): AuditLog[] { return load(KEYS.AUDIT_LOGS, defaultAuditLogs); }
  static getReminderLogs(): SMSWhatsAppLog[] { return load(KEYS.REMINDER_LOGS, []); }
  static getLearnerOptions(): Record<string, string[]> { return load(KEYS.LEARNER_OPTIONS, defaultLearnerOptions); }
  static getSettings(): Record<string, string> { return load(KEYS.SETTINGS, defaultSettings); }

  static async saveSettings(data: Record<string, string>, syncWithServer = true): Promise<boolean> {
    save(KEYS.SETTINGS, data);
    if (syncWithServer && this.getToken()) {
      try {
        const headers = this.getHeaders();
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        });
        return res.ok;
      } catch (err) {
        console.error('Failed to sync settings with server:', err);
        return false;
      }
    }
    return true;
  }

  // Save lists (Synchronous in UI state + Fire-and-forget sync to MySQL backup REST APIs)
  static saveUsers(data: User[], syncWithServer = true) { 
    const old = this.getUsers();
    save(KEYS.USERS, data); 

    if (syncWithServer && this.getToken()) {
      const headers = this.getHeaders();
      data.forEach(async (u) => {
        const matching = old.find(o => o.id === u.id);
        if (!matching) {
          fetch('/api/users', { method: 'POST', headers, body: JSON.stringify({ ...u, password: 'admin123' }) }).catch(console.error);
        } else if (JSON.stringify(matching) !== JSON.stringify(u)) {
          fetch(`/api/users/${u.id}`, { method: 'PUT', headers, body: JSON.stringify(u) }).catch(console.error);
        }
      });
    }
  }

  static saveLearners(data: Learner[], syncWithServer = true) { 
    const old = this.getLearners();
    save(KEYS.LEARNERS, data); 

    if (syncWithServer && this.getToken()) {
      const headers = this.getHeaders();
      data.forEach(async (l) => {
        const matching = old.find(o => o.id === l.id);
        if (!matching) {
          fetch('/api/learners', { method: 'POST', headers, body: JSON.stringify(l) }).catch(console.error);
        } else if (JSON.stringify(matching) !== JSON.stringify(l)) {
          fetch(`/api/learners/${l.id}`, { method: 'PUT', headers, body: JSON.stringify(l) }).catch(console.error);
        }
      });
      old.forEach(async (o) => {
        if (!data.some(l => l.id === o.id)) {
          fetch(`/api/learners/${o.id}`, { method: 'DELETE', headers }).catch(console.error);
        }
      });
    }
  }

  static saveParents(data: Parent[], syncWithServer = true) { 
    const old = this.getParents();
    save(KEYS.PARENTS, data); 

    if (syncWithServer && this.getToken()) {
      const headers = this.getHeaders();
      data.forEach(async (p) => {
        const matching = old.find(o => o.id === p.id);
        if (!matching) {
          fetch('/api/parents', { method: 'POST', headers, body: JSON.stringify(p) }).catch(console.error);
        } else if (JSON.stringify(matching) !== JSON.stringify(p)) {
          fetch(`/api/parents/${p.id}`, { method: 'PUT', headers, body: JSON.stringify(p) }).catch(console.error);
        }
      });
    }
  }

  static saveGrades(data: Grade[], syncWithServer = true) { 
    save(KEYS.GRADES, data); 
  }

  static saveClasses(data: ClassRoom[], syncWithServer = true) { 
    save(KEYS.CLASSES, data); 
  }

  static saveFeeItems(data: FeeItem[], syncWithServer = true) { 
    const old = this.getFeeItems();
    save(KEYS.FEE_ITEMS, data); 

    if (syncWithServer && this.getToken()) {
      const headers = this.getHeaders();
      // Sync added or updated items
      data.forEach(async (f) => {
        const matching = old.find(o => o.id === f.id);
        if (!matching) {
          fetch('/api/fee-items', { method: 'POST', headers, body: JSON.stringify(f) }).catch(console.error);
        } else if (JSON.stringify(matching) !== JSON.stringify(f)) {
          fetch(`/api/fee-items/${f.id}`, { method: 'PUT', headers, body: JSON.stringify(f) }).catch(console.error);
        }
      });
      // Handle deletions
      old.forEach(async (o) => {
        if (!data.some(f => f.id === o.id)) {
          fetch(`/api/fee-items/${o.id}`, { method: 'DELETE', headers }).catch(console.error);
        }
      });
    }
  }

  static saveDiscounts(data: DiscountExemption[], syncWithServer = true) { 
    const old = this.getDiscounts();
    save(KEYS.DISCOUNTS, data); 

    if (syncWithServer && this.getToken()) {
      const headers = this.getHeaders();
      data.forEach(async (d) => {
        if (!old.some(o => o.id === d.id)) {
          fetch('/api/discounts', { method: 'POST', headers, body: JSON.stringify(d) }).catch(console.error);
        }
      });
      old.forEach(async (o) => {
        if (!data.some(d => d.id === o.id)) {
          fetch(`/api/discounts/${o.id}`, { method: 'DELETE', headers }).catch(console.error);
        }
      });
    }
  }

  static saveAdditionalCharges(data: AdditionalCharge[], syncWithServer = true) { 
    const old = this.getAdditionalCharges();
    save(KEYS.ADDITIONAL_CHARGES, data); 

    if (syncWithServer && this.getToken()) {
      const headers = this.getHeaders();
      data.forEach(async (c) => {
        if (!old.some(o => o.id === c.id)) {
          fetch('/api/additional-charges', { method: 'POST', headers, body: JSON.stringify(c) }).catch(console.error);
        }
      });
      old.forEach(async (o) => {
        if (!data.some(c => c.id === o.id)) {
          fetch(`/api/additional-charges/${o.id}`, { method: 'DELETE', headers }).catch(console.error);
        }
      });
    }
  }

  static savePayments(data: Payment[], syncWithServer = true) { 
    const old = this.getPayments();
    save(KEYS.PAYMENTS, data); 

    if (syncWithServer && this.getToken()) {
      const headers = this.getHeaders();
      data.forEach(async (p) => {
        const matching = old.find(o => o.id === p.id);
        if (!matching) {
          fetch('/api/payments', { method: 'POST', headers, body: JSON.stringify(p) }).catch(console.error);
        } else if (JSON.stringify(matching) !== JSON.stringify(p)) {
          fetch(`/api/payments/${p.id}`, { method: 'PUT', headers, body: JSON.stringify(p) }).catch(console.error);
        }
      });
      old.forEach(async (o) => {
        if (!data.some(p => p.id === o.id)) {
          fetch(`/api/payments/${o.id}`, { method: 'DELETE', headers }).catch(console.error);
        }
      });
    }
  }

  static saveReceipts(data: Receipt[], syncWithServer = true) { 
    const old = this.getReceipts();
    save(KEYS.RECEIPTS, data); 

    if (syncWithServer && this.getToken()) {
      // Receipt counts updated (e.g. reprint slips)
      const headers = this.getHeaders();
      data.forEach(async (r) => {
        const matching = old.find(o => o.id === r.id);
        if (matching && matching.printedCount !== r.printedCount) {
          fetch(`/api/receipts/${r.id}/print`, { method: 'POST', headers }).catch(console.error);
        }
      });
    }
  }

  static saveAuditLogs(data: AuditLog[], syncWithServer = true) { 
    const old = this.getAuditLogs();
    save(KEYS.AUDIT_LOGS, data); 

    if (syncWithServer && this.getToken()) {
      const headers = this.getHeaders();
      data.forEach(async (au) => {
        if (!old.some(o => o.id === au.id)) {
          fetch('/api/audit-logs', { method: 'POST', headers, body: JSON.stringify(au) }).catch(console.error);
        }
      });
    }
  }

  static saveReminderLogs(data: SMSWhatsAppLog[], syncWithServer = true) { 
    const old = this.getReminderLogs();
    save(KEYS.REMINDER_LOGS, data); 

    if (syncWithServer && this.getToken()) {
      const headers = this.getHeaders();
      data.forEach(async (rem) => {
        if (!old.some(o => o.id === rem.id)) {
          fetch('/api/reminder-logs', { method: 'POST', headers, body: JSON.stringify(rem) }).catch(console.error);
        }
      });
    }
  }

  static saveLearnerOptions(data: Record<string, string[]>, syncWithServer = true) { 
    const old = this.getLearnerOptions();
    save(KEYS.LEARNER_OPTIONS, data); 

    if (syncWithServer && this.getToken()) {
      const headers = this.getHeaders();
      Object.keys(data).forEach(async (learnerId) => {
        const oldOpts = old[learnerId] || [];
        const newOpts = data[learnerId] || [];
        if (JSON.stringify(oldOpts.sort()) !== JSON.stringify(newOpts.sort())) {
          fetch(`/api/learners/${learnerId}/options`, { 
            method: 'PUT', 
            headers, 
            body: JSON.stringify({ optionIds: newOpts }) 
          }).catch(console.error);
        }
      });
    }
  }

  // Active Session helper
  static getCurrentUser(): User | null {
    const userJson = localStorage.getItem(KEYS.CURRENT_USER);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }

  static setCurrentUser(user: User | null, token: string | null = null) {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      if (token) this.setToken(token);
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
      this.setToken(null);
    }
  }

  // Log action
  static log(action: string, details: string) {
    const currentUser = this.getCurrentUser();
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: generateId(),
      userId: currentUser?.id || 'system',
      username: currentUser?.username || 'system',
      role: currentUser?.role || 'Administrator',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.saveAuditLogs(logs);
  }

  // Pull latest master datasets from AWS RDS SQL Server and update the local caches
  static async syncWithServer() {
    const token = this.getToken();
    if (!token) return false;

    const headers = this.getHeaders();
    const safeJsonFetch = async (url: string) => {
      try {
        const res = await fetch(url, { headers });
        if (!res.ok) {
          console.warn(`[Sync Warning] Endpoint ${url} returned status ${res.status}`);
          return null;
        }
        const contentType = res.headers.get('Content-Type') || '';
        if (!contentType.includes('application/json')) {
          console.warn(`[Sync Warning] Endpoint ${url} returned non-JSON content-type: ${contentType}`);
          return null;
        }
        return await res.json();
      } catch (err) {
        console.error(`[Sync Error] Failed to fetch/parse ${url}:`, err);
        return null;
      }
    };

    try {
      const [
        usersRes, learnersRes, parentsRes, gradesRes, classroomsRes, 
        feeItemsRes, discountsRes, chargesRes, paymentsRes, receiptsRes, 
        auditLogsRes, reminderLogsRes, optionsRes, settingsRes
      ] = await Promise.all([
        safeJsonFetch('/api/users'),
        safeJsonFetch('/api/learners'),
        safeJsonFetch('/api/parents'),
        safeJsonFetch('/api/grades'),
        safeJsonFetch('/api/classrooms'),
        safeJsonFetch('/api/fee-items'),
        safeJsonFetch('/api/discounts'),
        safeJsonFetch('/api/additional-charges'),
        safeJsonFetch('/api/payments'),
        safeJsonFetch('/api/receipts'),
        safeJsonFetch('/api/audit-logs'),
        safeJsonFetch('/api/reminder-logs'),
        safeJsonFetch('/api/subscribed-options'),
        safeJsonFetch('/api/settings')
      ]);

      if (Array.isArray(usersRes)) this.saveUsers(usersRes, false);
      if (Array.isArray(learnersRes)) this.saveLearners(learnersRes, false);
      if (Array.isArray(parentsRes)) this.saveParents(parentsRes, false);
      if (Array.isArray(gradesRes)) this.saveGrades(gradesRes, false);
      if (Array.isArray(classroomsRes)) this.saveClasses(classroomsRes, false);
      if (Array.isArray(feeItemsRes)) this.saveFeeItems(feeItemsRes, false);
      if (Array.isArray(discountsRes)) this.saveDiscounts(discountsRes, false);
      if (Array.isArray(chargesRes)) this.saveAdditionalCharges(chargesRes, false);
      if (Array.isArray(paymentsRes)) this.savePayments(paymentsRes, false);
      if (Array.isArray(receiptsRes)) this.saveReceipts(receiptsRes, false);
      if (Array.isArray(auditLogsRes)) this.saveAuditLogs(auditLogsRes, false);
      if (Array.isArray(reminderLogsRes)) this.saveReminderLogs(reminderLogsRes, false);
      if (optionsRes && typeof optionsRes === 'object') this.saveLearnerOptions(optionsRes, false);
      if (settingsRes && typeof settingsRes === 'object' && Object.keys(settingsRes).length > 0) {
        this.saveSettings(settingsRes, false);
      }
      
      console.log('[System INFO] All frontend caches are completely sync-hydrated from AWS RDS MySQL.');
      return true;
    } catch (err) {
      console.error('[Sync ERROR] Cannot pull states from PostgreSQL/MySQL server:', err);
      return false;
    }
  }

  // RESTful authenticated login interface
  static async login(username: string, passwordHash: string): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwordHash })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Identity rejection.');
      }
      const data = await res.json();
      if (data.token && data.user) {
        this.setCurrentUser(data.user, data.token);
        // Fire background full-database pull immediately
        this.syncWithServer();
        return data.user;
      }
      return null;
    } catch (err) {
      console.error('[Auth Error]', err);
      throw err;
    }
  }

  // Send OTP RESTful interface
  static async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; otp?: string }> {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to dispatch verification OTP code.');
      }
      return await res.json();
    } catch (err: any) {
      console.warn('Backend send-otp unreachable, trying offline simulation...', err);
      const normPhone = phoneNumber.replace(/[\s\-\+]/g, '');
      const user = this.getUsers().find(
        u => u.phoneNumber && u.phoneNumber.replace(/[\s\-\+]/g, '') === normPhone
      );
      if (!user) {
        throw new Error('No registered staff member matches that phone number.');
      }
      const simulatedOtp = '112233';
      (window as any)._simulatedOtp = { [normPhone]: simulatedOtp };
      return {
        success: true,
        message: `[Simulated SMS] Verification OTP sent successfully to ${user.name}'s phone number. Use passcode: ${simulatedOtp}`,
        otp: simulatedOtp
      };
    }
  }

  // Verify OTP RESTful interface
  static async verifyOtp(phoneNumber: string, otp: string): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Incorrect code verification.');
      }
      const data = await res.json();
      if (data.token && data.user) {
        this.setCurrentUser(data.user, data.token);
        this.syncWithServer();
        return data.user;
      }
      return null;
    } catch (err: any) {
      console.warn('Backend verify-otp unreachable, trying offline simulation...', err);
      const normPhone = phoneNumber.replace(/[\s\-\+]/g, '');
      const localSim = (window as any)._simulatedOtp || {};
      if (localSim[normPhone] && localSim[normPhone] === otp) {
        const user = this.getUsers().find(
          u => u.phoneNumber && u.phoneNumber.replace(/[\s\-\+]/g, '') === normPhone
        );
        if (user) {
          this.setCurrentUser(user, 'offline-token-mock');
          this.log('Staff Authenticated via OTP', `${user.name} authenticated via simulated OTP bypass.`);
          return user;
        }
      }
      throw new Error('Invalid OTP verification code. Please check your passcode and try again.');
    }
  }

  // Calculate detailed financial ledger for a single student (cached synchronous query)
  static getLearnerStatement(learnerId: string) {
    const learners = this.getLearners();
    const learner = learners.find(l => l.id === learnerId);
    if (!learner) return null;

    const parent = this.getParents().find(p => p.id === learner.parentId);
    const grade = this.getGrades().find(g => g.id === learner.gradeId);
    const classRoom = this.getClasses().find(c => c.id === learner.classId);

    const gradeItems = this.getFeeItems().filter(
      item => (item.gradeId === learner.gradeId || item.gradeId === 'all') &&
              item.name !== 'Stationery & Educational Supplies Pack'
    );

    const options = this.getLearnerOptions();
    const subscribedItemIds = options[learnerId] || [];

    const statementCharges: { desc: string, amount: number, date: string, type: string }[] = [];
    
    gradeItems.forEach(item => {
      if (item.type === 'Required') {
        statementCharges.push({ desc: item.name, amount: item.amount, date: learner.dateOfAdmission, type: 'Required Fee' });
      } else if (item.type === 'Optional' && subscribedItemIds.includes(item.id)) {
        statementCharges.push({ desc: `${item.name} Subscription`, amount: item.amount, date: learner.dateOfAdmission, type: 'Optional Fee' });
      }
    });

    const extraCharges = this.getAdditionalCharges().filter(c => c.learnerId === learnerId);
    extraCharges.forEach(charge => {
      statementCharges.push({ desc: charge.name, amount: charge.amount, date: charge.dateCharged, type: 'Additional Charge' });
    });

    statementCharges.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const discountItems = this.getDiscounts().filter(d => d.learnerId === learnerId && d.name !== 'Monthly Installment Adjustment Exemption');
    const totalDiscounts = discountItems.reduce((acc, curr) => acc + curr.amount, 0);

    const paymentsRow = this.getPayments().filter(p => p.learnerId === learnerId);
    const totalPaid = paymentsRow.reduce((acc, curr) => acc + curr.amount, 0);

    const totalCharged = statementCharges.reduce((acc, curr) => acc + curr.amount, 0);

    const totalDue = totalCharged - totalDiscounts;
    const outstandingBalance = totalDue - totalPaid;

    interface LedgerRow {
      date: string;
      description: string;
      charge?: number;
      payment?: number;
      balance: number;
    }

    const ledger: LedgerRow[] = [];
    let currentBalance = 0;

    const transactions: { date: string; description: string; type: 'charge' | 'deduction' | 'payment'; amount: number; isDeduction?: boolean }[] = [];

    statementCharges.forEach(c => {
      transactions.push({ date: c.date, description: c.desc, type: 'charge', amount: c.amount });
    });

    discountItems.forEach(d => {
      transactions.push({ date: learner.dateOfAdmission, description: `${d.name} (${d.type})`, type: 'deduction', amount: d.amount, isDeduction: true });
    });

    paymentsRow.forEach(p => {
      transactions.push({ date: p.paymentDate.split('T')[0], description: `Fee Payment - Rec #${p.receiptNumber} (${p.paymentMethod})`, type: 'payment', amount: p.amount });
    });

    transactions.sort((a, b) => {
      const cmpDate = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (cmpDate !== 0) return cmpDate;
      const order = { charge: 1, deduction: 2, payment: 3 };
      return order[a.type] - order[b.type];
    });

    transactions.forEach(t => {
      if (t.type === 'charge') {
        currentBalance += t.amount;
        ledger.push({ date: t.date, description: t.description, charge: t.amount, balance: currentBalance });
      } else if (t.type === 'deduction') {
        currentBalance -= t.amount;
        ledger.push({ date: t.date, description: t.description, charge: -t.amount, balance: currentBalance });
      } else {
        currentBalance -= t.amount;
        ledger.push({ date: t.date, description: t.description, payment: t.amount, balance: currentBalance });
      }
    });

    return {
      learner,
      parent,
      grade,
      classRoom,
      totalCharged,
      totalDiscounts,
      totalDue,
      totalPaid,
      outstandingBalance,
      discounts: discountItems,
      extraCharges,
      ledger,
      subscribedItemIds
    };
  }

  // Global Financial Statistics (cached synchronous calculation)
  static getGlobalStats() {
    const learners = this.getLearners();
    const payments = this.getPayments();
    
    const totalLearners = learners.length;

    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const endOfToday = new Date();
    endOfToday.setHours(23,59,59,999);

    const collectedToday = payments
      .filter(p => {
        const payDate = new Date(p.paymentDate);
        return payDate >= startOfToday && payDate <= endOfToday;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    let totalOutstanding = 0;
    let totalPaidOverall = 0;
    let totalExpectedOverall = 0;

    learners.forEach(l => {
      const stmt = this.getLearnerStatement(l.id);
      if (stmt) {
        totalOutstanding += stmt.outstandingBalance;
        totalPaidOverall += stmt.totalPaid;
        totalExpectedOverall += stmt.totalDue;
      }
    });

    return {
      totalLearners,
      collectedToday,
      totalOutstanding,
      totalPaidOverall,
      totalExpectedOverall,
      recentPayments: [...payments].sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).slice(0, 10)
    };
  }

  // Export full snapshot backup
  static backupDatabase(): string {
    const fullBackup = {
      users: this.getUsers(),
      learners: this.getLearners(),
      parents: this.getParents(),
      grades: this.getGrades(),
      classes: this.getClasses(),
      feeItems: this.getFeeItems(),
      discounts: this.getDiscounts(),
      charges: this.getAdditionalCharges(),
      payments: this.getPayments(),
      receipts: this.getReceipts(),
      auditLogs: this.getAuditLogs(),
      reminderLogs: this.getReminderLogs(),
      learnerOptions: this.getLearnerOptions()
    };
    return JSON.stringify(fullBackup, null, 2);
  }

  // Restore database
  static restoreDatabase(backupJson: string): boolean {
    try {
      const data = JSON.parse(backupJson);
      if (data.users) this.saveUsers(data.users);
      if (data.learners) this.saveLearners(data.learners);
      if (data.parents) this.saveParents(data.parents);
      if (data.grades) this.saveGrades(data.grades);
      if (data.classes) this.saveClasses(data.classes);
      if (data.feeItems) this.saveFeeItems(data.feeItems);
      if (data.discounts) this.saveDiscounts(data.discounts);
      if (data.charges) this.saveAdditionalCharges(data.charges);
      if (data.payments) this.savePayments(data.payments);
      if (data.receipts) this.saveReceipts(data.receipts);
      if (data.auditLogs) this.saveAuditLogs(data.auditLogs);
      if (data.reminderLogs) this.saveReminderLogs(data.reminderLogs);
      if (data.learnerOptions) this.saveLearnerOptions(data.learnerOptions);
      this.log('Database Restored', 'The persistent relational datastore was restored from a local backup file.');
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // Reset database state
  static resetDatabase() {
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.LEARNERS);
    localStorage.removeItem(KEYS.PARENTS);
    localStorage.removeItem(KEYS.GRADES);
    localStorage.removeItem(KEYS.CLASSES);
    localStorage.removeItem(KEYS.FEE_ITEMS);
    localStorage.removeItem(KEYS.DISCOUNTS);
    localStorage.removeItem(KEYS.ADDITIONAL_CHARGES);
    localStorage.removeItem(KEYS.PAYMENTS);
    localStorage.removeItem(KEYS.RECEIPTS);
    localStorage.removeItem(KEYS.AUDIT_LOGS);
    localStorage.removeItem(KEYS.REMINDER_LOGS);
    localStorage.removeItem(KEYS.LEARNER_OPTIONS);
    
    this.getUsers();
    this.getLearners();
    this.getParents();
    this.getGrades();
    this.getClasses();
    this.getFeeItems();
    this.getDiscounts();
    this.getAdditionalCharges();
    this.getPayments();
    this.getReceipts();
    this.log('Database Initialized', 'Database was reset to default seed configurations.');
  }
}
