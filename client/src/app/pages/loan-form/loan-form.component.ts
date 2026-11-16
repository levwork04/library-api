import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { apiError } from '../../core/api-error';
import { Book, Reader } from '../../core/models';

@Component({
  selector: 'app-loan-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './loan-form.component.html',
})
export class LoanFormComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly editing = Number.isInteger(this.id) && this.id > 0;
  readonly books = signal<Book[]>([]);
  readonly readers = signal<Reader[]>([]);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    bookId: [0, [Validators.required, Validators.min(1)]],
    readerId: [0, [Validators.required, Validators.min(1)]],
    days: [14, [Validators.required, Validators.min(1), Validators.max(60)]],
    dueOn: ['', this.editing ? [Validators.required] : []],
  });

  constructor() {
    if (this.editing) {
      this.api.loan(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (loan) => this.form.controls.dueOn.setValue(loan.dueOn.slice(0, 10)),
        error: (err: unknown) => this.error.set(apiError(err, 'Выдача не найдена.')),
      });
      return;
    }
    forkJoin({ books: this.api.books(), readers: this.api.readers() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ books, readers }) => {
        this.books.set(books);
        this.readers.set(readers);
      },
      error: (err: unknown) => this.error.set(apiError(err, 'Не удалось загрузить списки.')),
    });
  }

  save() {
    if (this.editing) {
      if (this.form.controls.dueOn.invalid) {
        this.form.controls.dueOn.markAsTouched();
        return;
      }
      this.api.extendLoan(this.id, this.form.controls.dueOn.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.snack.open('Срок продлён.', 'Закрыть', { duration: 2500 });
          void this.router.navigate(['/loans']);
        },
        error: (err: unknown) => this.error.set(apiError(err, 'Не удалось продлить выдачу.')),
      });
      return;
    }
    if (this.form.controls.bookId.invalid || this.form.controls.readerId.invalid || this.form.controls.days.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.api.createLoan({
      bookId: Number(value.bookId),
      readerId: Number(value.readerId),
      days: Number(value.days),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snack.open('Книга выдана.', 'Закрыть', { duration: 2500 });
        void this.router.navigate(['/loans']);
      },
      error: (err: unknown) => this.error.set(apiError(err, 'Не удалось выдать книгу.')),
    });
  }
}
