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

@Component({
  selector: 'app-reader-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './reader-form.component.html',
})
export class ReaderFormComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly editing = Number.isInteger(this.id) && this.id > 0;
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    if (!this.editing) return;
    this.api.reader(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (reader) => this.form.patchValue(reader),
      error: (err: unknown) => this.error.set(apiError(err, 'Читатель не найден.')),
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const body = this.form.getRawValue();
    const request = this.editing ? this.api.updateReader(this.id, body) : this.api.createReader(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snack.open(this.editing ? 'Читатель сохранён.' : 'Читатель добавлен.', 'Закрыть', { duration: 2500 });
        void this.router.navigate(['/readers']);
      },
      error: (err: unknown) => this.error.set(apiError(err, 'Не удалось сохранить читателя.')),
    });
  }
}
