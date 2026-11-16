import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { apiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { Book } from '../../core/models';
import { compareValues } from '../../core/sort';
import { ViewSwitchComponent } from '../../shared/view-switch.component';

type BookKey = 'title' | 'author' | 'publishedYear' | 'price' | 'availableCopies';

@Component({
  selector: 'app-books',
  imports: [
    CurrencyPipe, RouterLink, MatButtonModule, MatCardModule, MatCheckboxModule,
    MatFormFieldModule, MatInputModule, MatTableModule, ViewSwitchComponent,
  ],
  templateUrl: './books.component.html',
})
export class BooksComponent {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly columns = ['title', 'author', 'publishedYear', 'price', 'availableCopies', 'actions'];
  readonly books = signal<Book[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly view = signal<'table' | 'cards'>('table');
  readonly authorQuery = signal('');
  readonly titleQuery = signal('');
  readonly availableOnly = signal(false);
  readonly sortKey = signal<BookKey>('title');
  readonly sortDir = signal<1 | -1>(1);
  readonly visible = computed(() => {
    const title = this.titleQuery().trim().toLocaleLowerCase('ru');
    const rows = this.books().filter((book) => !title || book.title.toLocaleLowerCase('ru').includes(title));
    const key = this.sortKey();
    const dir = this.sortDir();
    return [...rows].sort((a, b) => compareValues(a[key], b[key]) * dir);
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.books({
      author: this.authorQuery().trim() || undefined,
      available: this.availableOnly() ? true : undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (rows) => {
        this.books.set(rows);
        this.loading.set(false);
        this.error.set('');
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(apiError(err, 'Не удалось загрузить книги.'));
      },
    });
  }

  toggle(key: BookKey) {
    if (this.sortKey() === key) this.sortDir.update((dir) => (dir === 1 ? -1 : 1));
    else {
      this.sortKey.set(key);
      this.sortDir.set(1);
    }
  }

  mark(key: BookKey) {
    return this.sortKey() === key ? (this.sortDir() === 1 ? '↑' : '↓') : '';
  }

  asText(event: Event) {
    return (event.target as HTMLInputElement).value;
  }

  remove(book: Book) {
    if (!confirm(`Удалить «${book.title}»?`)) return;
    this.api.deleteBook(book.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snack.open('Книга удалена.', 'Закрыть', { duration: 2500 });
        this.load();
      },
      error: (err: unknown) => this.snack.open(apiError(err, 'Не удалось удалить книгу.'), 'Закрыть', { duration: 4000 }),
    });
  }
}
