import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('switchyard-ui');

  constructor(private router: Router) {}

  get showNavbar(): boolean {
    const authRoutes = ['/login', '/signup'];
    return !authRoutes.includes(this.router.url);
  }
}
