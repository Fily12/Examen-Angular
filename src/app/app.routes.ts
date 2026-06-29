import { Routes } from '@angular/router';
import { clientGuard } from './core/guards/client.guard';
import { agentGuard }  from './core/guards/agent.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'dashboard',    canActivate: [clientGuard], loadComponent: () => import('./features/client/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'transactions', canActivate: [clientGuard], loadComponent: () => import('./features/client/transactions/transactions.component').then(m => m.TransactionsComponent) },
  { path: 'transfer',     canActivate: [clientGuard], loadComponent: () => import('./features/client/transfer/transfer.component').then(m => m.TransferComponent) },
  {
    path: 'bills', canActivate: [clientGuard],
    children: [
      { path: 'current', loadComponent: () => import('./features/client/bills/bills-current.component').then(m => m.BillsCurrentComponent) },
      { path: 'history', loadComponent: () => import('./features/client/bills/bills-history.component').then(m => m.BillsHistoryComponent) },
      { path: '', redirectTo: 'current', pathMatch: 'full' }
    ]
  },
  { path: 'admin/wallets', canActivate: [agentGuard], loadComponent: () => import('./features/agent/wallets/wallets.component').then(m => m.WalletsComponent) },
  { path: '**', redirectTo: 'login' }
];
