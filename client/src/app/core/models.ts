export interface Session {
  token: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  expiresAt: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  publishedYear: number;
  price: number;
  totalCopies: number;
  availableCopies: number;
}

export interface Reader {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  registeredOn: string;
  isBlocked: boolean;
}

export interface Loan {
  id: number;
  bookId: number;
  readerId: number;
  issuedOn: string;
  dueOn: string;
  returnedOn: string | null;
  dailyFine: number;
}

export interface ActiveLoanReport {
  loanId: number;
  bookTitle: string;
  author: string;
  readerName: string;
  issuedOn: string;
  dueOn: string;
}

export interface OverdueLoanReport {
  loanId: number;
  bookTitle: string;
  readerName: string;
  dueOn: string;
  daysOverdue: number;
  fine: number;
}

export interface ReaderActivityReport {
  readerId: number;
  readerName: string;
  isBlocked: boolean;
  loanCount: number;
  activeLoanCount: number;
  fine: number;
}

export interface BookUsageReport {
  bookId: number;
  title: string;
  author: string;
  availableCopies: number;
  totalCopies: number;
  loanCount: number;
  hasActiveLoan: boolean;
}

export interface BookWrite {
  title: string;
  author: string;
  publishedYear: number;
  price: number;
  totalCopies: number;
}

export interface ReaderWrite {
  firstName: string;
  lastName: string;
  email: string;
}
