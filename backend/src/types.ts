// ─── Allocation Letter ────────────────────────────────────────────────────────

export interface BuyerDetails {
  name: string;
  phone: string;
  email?: string;
  address: string;
  photoBase64?: string; // data:image/...;base64,...
}

export interface PropertyDetails {
  description: string;    // e.g. "FIVE (5) BEDROOM FULL DETACHED DUPLEX"
  blockNo: string;        // e.g. "001"
  estate: string;         // e.g. "Khira's Villa"
  location: string;       // e.g. "Gudu, Abuja"
  plotNo?: string;        // e.g. "Plot No. 95"
  cadastralZone?: string; // e.g. "Cadastral Zone B14"
  district?: string;      // e.g. "Duste"
}

export interface FinancialDetails {
  offerPrice: number;
  discount: number;       // 0 if none
  vatPct: number;         // 0 | 5 | 7.5
  durationText: string;   // "Outright" | "12 months" | etc.
  deposit: number;        // initial deposit amount, 0 if none
}

export interface AllocationRequest {
  buyer: BuyerDetails;
  property: PropertyDetails;
  financials: FinancialDetails;
}

export interface AllocationResult {
  ref: string;
  filename: string;
  downloadUrl: string;
}

// ─── Payment Receipt ──────────────────────────────────────────────────────────

export interface PayerDetails {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface ReceiptRequest {
  payer: PayerDetails;
  purpose: string;
  amount: number;
  method: "Bank Transfer" | "Cheque" | "Cash" | "POS";
  date: string;          // ISO date string YYYY-MM-DD
  bankRef?: string;
  balance?: string;      // free text, e.g. "₦50,000,000"
  notes?: string;
}

export interface ReceiptResult {
  receiptNo: string;
  filename: string;
  downloadUrl: string;
}

// ─── Email ────────────────────────────────────────────────────────────────────

export interface SendAllocationEmailRequest {
  recipientEmail: string;
  recipientName: string;
  filename: string;
  ref: string;
}

export interface SendReceiptEmailRequest {
  recipientEmail: string;
  recipientName: string;
  filename: string;
  receiptNo: string;
}

// ─── Counter store ────────────────────────────────────────────────────────────

export interface CounterStore {
  receipt: number;
  allocation: number;
}
