import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { apiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { Book, Loan, Reader } from '../../core/models';
import { compareValues } from '../../core/sort';
import { ViewSwitchComponent } from '../../shared/view-switch.component';

interface LoanRow extends Loan {
  bookTitle: string;
  readerName: string;
  fine: number;
}

type LoanKey = 'bookTitle' | 'readerName' | 'issuedOn' | 'dueOn' | 'fine';

@Component({
  selector: 'app-loans',
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatCheckboxModule, MatTableModule, ViewSwitchComponent],
  templateUrl: './loans.component.html',
})
export class LoansComponent {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly columns = ['bookTitle', 'readerName', 'issuedOn', 'dueOn', 'fine', 'actions'];
  readonly rows = signal<LoanRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly view = signal<'table' | 'cards'>('table');
  readonly activeOnly = signal(false);
  readonly sortKey = signal<LoanKey>('dueOn');
  readonly sortDir = signal<1 | -1>(1);
  readonly visible = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    return [...this.rows()].sort((a, b) => compareValues(a[key], b[key]) * dir);
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    forkJoin({
      loans: this.api.loans({ activeOnly: this.activeOnly() ? true : undefined }),
      books: this.api.books(),
      readers: this.api.readers(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ loans, books, readers }) => {
        this.rows.set(loans.map((loan) => this.toRow(loan, books, readers)));
        this.loading.set(false);
        this.error.set('');
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(apiError(err, 'Не удалось загрузить выдачи.'));
      },
    });
  }

  toggle(key: LoanKey) {
    if (this.sortKey() === key) this.sortDir.update((dir) => (dir === 1 ? -1 : 1));
    else {
      this.sortKey.set(key);
      this.sortDir.set(1);
    }
  }

  mark(key: LoanKey) {
    return this.sortKey() === key ? (this.sortDir() === 1 ? '↑' : '↓') : '';
  }

  giveBack(row: LoanRow) {
    this.api.returnLoan(row.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snack.open('Книга возвращена.', 'Закрыть', { duration: 2500 });
        this.load();
      },
      error: (err: unknown) => this.snack.open(apiError(err, 'Не удалось вернуть книгу.'), 'Закрыть', { duration: 4000 }),
    });
  }

  remove(row: LoanRow) {
    if (!confirm('Удалить выдачу? Открытая выдача будет закрыта.')) return;
    this.api.deleteLoan(row.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.load(),
      error: (err: unknown) => this.snack.open(apiError(err, 'Не удалось удалить выдачу.'), 'Закрыть', { duration: 4000 }),
    });
  }

  private toRow(loan: Loan, books: Book[], readers: Reader[]): LoanRow {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(loan.dueOn);
    const overdue = loan.returnedOn == null && today.getTime() > due.getTime();
    const days = overdue ? Math.round((today.getTime() - due.getTime()) / 86400000) : 0;
    return {
      ...loan,
      bookTitle: books.find((book) => book.id === loan.bookId)?.title ?? 'Книга удалена',
      readerName: readers.find((reader) => reader.id === loan.readerId)?.lastName ?? 'Читатель удалён',
      fine: days * loan.dailyFine,
    };
  }
}
