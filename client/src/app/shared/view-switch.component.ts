import { Component, model } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-view-switch',
  imports: [MatButtonToggleModule],
  template: `
    <mat-button-toggle-group [value]="view()" (change)="view.set($event.value)" aria-label="Вид списка">
      <mat-button-toggle value="table">Таблица</mat-button-toggle>
      <mat-button-toggle value="cards">Карточки</mat-button-toggle>
    </mat-button-toggle-group>
  `,
})
export class ViewSwitchComponent {
  readonly view = model<'table' | 'cards'>('table');
}
