import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { apiError } from '../../core/api-error';
import { ActiveLoanReport, BookUsageReport, OverdueLoanReport, ReaderActivityReport } from '../../core/models';
import { compareValues } from '../../core/sort';
import { ViewSwitchComponent } from '../../shared/view-switch.component';

@Component({
  selector: 'app-reports',
  imports: [DatePipe, CurrencyPipe, MatCardModule, MatFormFieldModule, MatInputModule, MatTableModule, ViewSwitchComponent],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly view = signal<'table' | 'cards'>('table');
  readonly query = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly sortKey = signal('name');
  readonly sortDir = signal<1 | -1>(1);
  readonly active = signal<ActiveLoanReport[]>([]);
  readonly overdue = signal<OverdueLoanReport[]>([]);
  readonly readers = signal<ReaderActivityReport[]>([]);
  readonly books = signal<BookUsageReport[]>([]);
  readonly activeColumns = ['bookTitle', 'readerName', 'issuedOn', 'dueOn'];
  readonly overdueColumns = ['bookTitle', 'readerName', 'dueOn', 'daysOverdue', 'fine'];
  readonly readerColumns = ['readerName', 'loanCount', 'activeLoanCount', 'fine', 'isBlocked'];
  readonly bookColumns = ['title', 'author', 'availableCopies', 'loanCount', 'hasActiveLoan'];

  readonly activeView = computed(() => this.sort(this.match(this.active(), ['bookTitle', 'author', 'readerName'])));
  readonly overdueView = computed(() => this.sort(this.match(this.overdue(), ['bookTitle', 'readerName'])));
  readonly readerView = computed(() => this.sort(this.match(this.readers(), ['readerName'])));
  readonly bookView = computed(() => this.sort(this.match(this.books(), ['title', 'author'])));

  constructor() {
    forkJoin({
      active: this.api.activeLoans(),
      overdue: this.api.overdue(),
      readers: this.api.readerReport(),
      books: this.api.bookReport(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.active.set(data.active);
        this.overdue.set(data.overdue);
        this.readers.set(data.readers);
        this.books.set(data.books);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(apiError(err, 'Отчёты доступны только после входа.'));
      },
    });
  }

  toggle(key: string) {
    if (this.sortKey() === key) this.sortDir.update((dir) => (dir === 1 ? -1 : 1));
    else {
      this.sortKey.set(key);
      this.sortDir.set(1);
    }
  }

  mark(key: string) {
    return this.sortKey() === key ? (this.sortDir() === 1 ? '↑' : '↓') : '';
  }

  asText(event: Event) {
    return (event.target as HTMLInputElement).value;
  }

  private match<T extends object>(rows: T[], keys: (keyof T)[]) {
    const query = this.query().trim().toLocaleLowerCase('ru');
    if (!query) return rows;
    return rows.filter((row) => keys.some((key) => String(row[key] ?? '').toLocaleLowerCase('ru').includes(query)));
  }

  private sort<T extends object>(rows: T[]) {
    const key = this.sortKey() as keyof T;
    const dir = this.sortDir();
    return [...rows].sort((a, b) => compareValues(a[key], b[key]) * dir);
  }
}
