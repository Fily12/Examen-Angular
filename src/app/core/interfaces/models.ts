export interface Wallet {
  id: number;
  code: string;
  phoneNumber: string;
  email: string;
  currency: string;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: number;
  reference: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'BILL_PAYMENT';
  amount: number;
  fees: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  description: string;
  createdAt: string;
}

export interface Facture {
  id: number;
  reference: string;
  walletCode: string;
  serviceName: string;
  amount: number;
  status: 'UNPAID' | 'PAID';
  dueDate: string;
  createdAt: string;
}

export interface TransferDto {
  senderPhone: string;
  receiverPhone: string;
  amount: number;
}

export interface FacturePaymentDto {
  phoneNumber: string;
  serviceName: string;
  factureReferences: string[];
}

export interface PayFacturesDto {
  walletCode: string;
  factureReferences: string[];
}

export interface BalanceResponseDto {
  phoneNumber: string;
  balance: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;       // Spring Data standard
  pageNumber?: number;  // variante backend BadWallet
  pageSize?: number;
  last?: boolean;
}

export interface CreateWalletDto {
  code: string;
  phoneNumber: string;
  email: string;
  initialBalance: number;
  currency: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
}
