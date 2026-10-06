import { Component } from '@angular/core';
import { EvaluacionComponent } from './features/evaluacion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EvaluacionComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
