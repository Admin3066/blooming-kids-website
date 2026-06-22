export type UserRole = 'Administrator' | 'Principal' | 'Bursar/Cashier' | 'Teacher (view only)';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string; // Simulated secure hash
  active: boolean;
  createdAt: string;
  phoneNumber?: string;
}

export interface Parent {
  id: string;
  name: string;
  relationship: string;
  contactNumber: string;
  email: string;
  address: string;
  alternativeContact?: string;
  createdAt: string;
}

export interface Learner {
  id: string;
  name: string;
  admissionNumber: string;
  gradeId: string;
  classId: string;
  parentId: string;
  dateOfAdmission: string;
  active: boolean;
  notes?: string;
}

export interface Grade {
  id: string;
  name: string; // e.g., Grade R, Grade 1
  code: string; // e.g., GR-R, GR-1
}

export interface ClassRoom {
  id: string;
  gradeId: string;
  name: string; // e.g., Blue Butterflies, Red Ladybugs, Super Stars
}

export interface FeeItem {
  id: string;
  gradeId: string; // "all" for all grades, or specific gradeId
  name: string; // e.g., Tuition Fee, Stationery Fee, Uniform Fee, Transport, Exams
  amount: number;
  type: 'Required' | 'Optional'; 
  period: 'Annual' | 'Termly' | 'Monthly' | 'Once-off';
}

export interface DiscountExemption {
  id: string;
  learnerId: string;
  name: string; // e.g., Sibling Discount, Staff Exemption, Special Relief
  amount: number; // in Rands, or percentage (we'll use flat Rands for ease and accuracy)
  type: 'Discount' | 'Exemption';
}

export interface AdditionalCharge {
  id: string;
  learnerId: string;
  name: string; // e.g., Lost Library Book charge, Field Trip, Transport June
  amount: number;
  dateCharged: string;
}

export interface Payment {
  id: string;
  learnerId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'EFT' | 'Credit/Debit Card' | 'Direct Deposit';
  reference: string;
  receivedByUserId: string;
  receiptNumber: string;
  note?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  learnerId: string;
  dateGenerated: string;
  qrCodeValue: string; // For verification scan
  printedCount: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  action: string; // e.g., "Add Learner", "Record Payment"
  details: string;
  timestamp: string;
}

export interface SMSWhatsAppLog {
  id: string;
  learnerId: string;
  recipientName: string;
  recipientContact: string;
  channel: 'SMS' | 'WhatsApp';
  message: string;
  status: 'Sent' | 'Failed';
  timestamp: string;
}
