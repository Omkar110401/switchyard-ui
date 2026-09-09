import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { WorkflowListComponent } from './components/workflow-list/workflow-list.component';
import { WorkflowDetailComponent } from './components/workflow-detail/workflow-detail.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { AuthGuardService } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'workflows',
    component: WorkflowListComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'workflows/:id',
    component: WorkflowDetailComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
    canActivate: [AuthGuardService],
  },
  { path: '**', redirectTo: '/dashboard' },
];
