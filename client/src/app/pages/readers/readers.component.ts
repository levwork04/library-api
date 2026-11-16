import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { apiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { Reader } from '../../core/models';
import { compareValues } from '../../core/sort';
import { ViewSwitchComponent } from '../../shared/view-switch.component';

type ReaderKey = 'lastName' | 'email' | 'registeredOn' | 'isBlocked';

@Component({
  selector: 'app-readers',
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatTableModule, ViewSwitchComponent],
  templateUrl: './readers.component.html',
})
export class ReadersComponent {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly columns = ['lastName', 'email', 'registeredOn', 'isBlocked', 'actions'];
  readonly readers = signal<Reader[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly view = signal<'table' | 'cards'>('table');
  readonly lastName = signal('');
  readonly sortKey = signal<ReaderKey>('lastName');
  readonly sortDir = signal<1 | -1>(1);
  readonly visible = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    return [...this.readers()].sort((a, b) => compareValues(a[key], b[key]) * dir);
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.readers({ lastName: this.lastName().trim() || undefined }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (rows) => {
        this.readers.set(rows);
        this.loading.set(false);
        this.error.set('');
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(apiError(err, 'Не удалось загрузить читателей.'));
      },
    });
  }

  toggle(key: ReaderKey) {
    if (this.sortKey() === key) this.sortDir.update((dir) => (dir === 1 ? -1 : 1));
    else {
      this.sortKey.set(key);
      this.sortDir.set(1);
    }
  }

  mark(key: ReaderKey) {
    return this.sortKey() === key ? (this.sortDir() === 1 ? '↑' : '↓') : '';
  }

  asText(event: Event) {
    return (event.target as HTMLInputElement).value;
  }

  setBlocked(reader: Reader, blocked: boolean) {
    const request = blocked ? this.api.blockReader(reader.id) : this.api.unblockReader(reader.id);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.load(),
      error: (err: unknown) => this.snack.open(apiError(err, 'Не удалось изменить блокировку.'), 'Закрыть', { duration: 4000 }),
    });
  }

  remove(reader: Reader) {
    if (!confirm(`Удалить читателя ${reader.lastName} ${reader.firstName}?`)) return;
    this.api.deleteReader(reader.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.load(),
      error: (err: unknown) => this.snack.open(apiError(err, 'Не удалось удалить читателя.'), 'Закрыть', { duration: 4000 }),
    });
  }
}
