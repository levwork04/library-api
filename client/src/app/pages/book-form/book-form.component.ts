import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { apiError } from '../../core/api-error';
import { Book } from '../../core/models';

@Component({
  selector: 'app-book-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './book-form.component.html',
})
export class BookFormComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly yearMax = new Date().getFullYear() + 1;
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly editing = Number.isInteger(this.id) && this.id > 0;
  readonly error = signal('');
  readonly book = signal<Book | null>(null);
  readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    author: ['', [Validators.required, Validators.minLength(2)]],
    publishedYear: [2000, [Validators.required, Validators.min(1400), Validators.max(this.yearMax)]],
    price: [0, [Validators.required, Validators.min(0)]],
    totalCopies: [1, [Validators.required, Validators.min(1)]],
    percent: [10, [Validators.min(1), Validators.max(99)]],
  });

  constructor() {
    if (!this.editing) return;
    this.api.book(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (book) => {
        this.book.set(book);
        this.form.patchValue(book);
        const onLoan = book.totalCopies - book.availableCopies;
        this.form.controls.totalCopies.setValidators([Validators.required, Validators.min(Math.max(1, onLoan))]);
        this.form.controls.totalCopies.updateValueAndValidity();
      },
      error: (err: unknown) => this.error.set(apiError(err, 'Книга не найдена.')),
    });
  }

  save() {
    if (this.form.controls.title.invalid || this.form.controls.author.invalid || this.form.controls.publishedYear.invalid || this.form.controls.price.invalid || this.form.controls.totalCopies.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const body = {
      title: value.title,
      author: value.author,
      publishedYear: Number(value.publishedYear),
      price: Number(value.price),
      totalCopies: Number(value.totalCopies),
    };
    const request = this.editing ? this.api.updateBook(this.id, body) : this.api.createBook(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snack.open(this.editing ? 'Книга сохранена.' : 'Книга добавлена.', 'Закрыть', { duration: 2500 });
        void this.router.navigate(['/books']);
      },
      error: (err: unknown) => this.error.set(apiError(err, 'Не удалось сохранить книгу.')),
    });
  }

  discount() {
    if (this.form.controls.percent.invalid) {
      this.form.controls.percent.markAsTouched();
      return;
    }
    this.api.discountBook(this.id, Number(this.form.controls.percent.value)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (book) => {
        this.book.set(book);
        this.form.controls.price.setValue(book.price);
        this.snack.open('Скидка применена.', 'Закрыть', { duration: 2500 });
      },
      error: (err: unknown) => this.error.set(apiError(err, 'Не удалось применить скидку.')),
    });
  }
}
