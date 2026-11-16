import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth.guard';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login/login.component';
import { BooksComponent } from './pages/books/books.component';
import { BookFormComponent } from './pages/book-form/book-form.component';
import { ReadersComponent } from './pages/readers/readers.component';
import { ReaderFormComponent } from './pages/reader-form/reader-form.component';
import { LoansComponent } from './pages/loans/loans.component';
import { LoanFormComponent } from './pages/loan-form/loan-form.component';
import { ReportsComponent } from './pages/reports/reports.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'books' },
      { path: 'login', component: LoginComponent },
      { path: 'books', component: BooksComponent },
      { path: 'books/new', component: BookFormComponent, canActivate: [adminGuard] },
      { path: 'books/:id/edit', component: BookFormComponent, canActivate: [adminGuard] },
      { path: 'readers', component: ReadersComponent },
      { path: 'readers/new', component: ReaderFormComponent, canActivate: [adminGuard] },
      { path: 'readers/:id/edit', component: ReaderFormComponent, canActivate: [adminGuard] },
      { path: 'loans', component: LoansComponent },
      { path: 'loans/new', component: LoanFormComponent, canActivate: [adminGuard] },
      { path: 'loans/:id/edit', component: LoanFormComponent, canActivate: [adminGuard] },
      { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
    ],
  },
  { path: '**', redirectTo: 'books' },
];
