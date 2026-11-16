import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  ActiveLoanReport,
  Book,
  BookUsageReport,
  BookWrite,
  Loan,
  OverdueLoanReport,
  Reader,
  ReaderActivityReport,
  ReaderWrite,
} from './models';
import { API_URL } from './api-url';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly root = API_URL;

  books(filter?: { author?: string; available?: boolean }) {
    return this.http.get<Book[]>(`${this.root}/api/books`, { params: this.query(filter) });
  }

  book(id: number) {
    return this.http.get<Book>(`${this.root}/api/books/${id}`);
  }

  createBook(body: BookWrite) {
    return this.http.post<Book>(`${this.root}/api/books`, body);
  }

  updateBook(id: number, body: BookWrite) {
    return this.http.put<Book>(`${this.root}/api/books/${id}`, body);
  }

  discountBook(id: number, percent: number) {
    return this.http.post<Book>(`${this.root}/api/books/${id}/discount`, { percent });
  }

  deleteBook(id: number) {
    return this.http.delete<void>(`${this.root}/api/books/${id}`);
  }

  readers(filter?: { lastName?: string }) {
    return this.http.get<Reader[]>(`${this.root}/api/readers`, { params: this.query(filter) });
  }

  reader(id: number) {
    return this.http.get<Reader>(`${this.root}/api/readers/${id}`);
  }

  createReader(body: ReaderWrite) {
    return this.http.post<Reader>(`${this.root}/api/readers`, body);
  }

  updateReader(id: number, body: ReaderWrite) {
    return this.http.put<Reader>(`${this.root}/api/readers/${id}`, body);
  }

  blockReader(id: number) {
    return this.http.post<Reader>(`${this.root}/api/readers/${id}/block`, {});
  }

  unblockReader(id: number) {
    return this.http.post<Reader>(`${this.root}/api/readers/${id}/unblock`, {});
  }

  deleteReader(id: number) {
    return this.http.delete<void>(`${this.root}/api/readers/${id}`);
  }

  loans(filter?: { activeOnly?: boolean }) {
    return this.http.get<Loan[]>(`${this.root}/api/loans`, { params: this.query(filter) });
  }

  loan(id: number) {
    return this.http.get<Loan>(`${this.root}/api/loans/${id}`);
  }

  createLoan(body: { bookId: number; readerId: number; days: number }) {
    return this.http.post<Loan>(`${this.root}/api/loans`, body);
  }

  extendLoan(id: number, dueOn: string) {
    return this.http.put<Loan>(`${this.root}/api/loans/${id}`, { dueOn });
  }

  returnLoan(id: number) {
    return this.http.post<Loan>(`${this.root}/api/loans/${id}/return`, {});
  }

  deleteLoan(id: number) {
    return this.http.delete<void>(`${this.root}/api/loans/${id}`);
  }

  activeLoans() {
    return this.http.get<ActiveLoanReport[]>(`${this.root}/api/reports/active-loans`);
  }

  overdue() {
    return this.http.get<OverdueLoanReport[]>(`${this.root}/api/reports/overdue`);
  }

  readerReport() {
    return this.http.get<ReaderActivityReport[]>(`${this.root}/api/reports/readers`);
  }

  bookReport() {
    return this.http.get<BookUsageReport[]>(`${this.root}/api/reports/books`);
  }

  private query(source?: object): HttpParams {
    let params = new HttpParams();
    if (!source) return params;
    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
