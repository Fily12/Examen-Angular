import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="sidebar">
      @if (auth.getRole() === 'Client') {
        <a routerLink="/dashboard"     routerLinkActive="active">🏠 Tableau de bord</a>
        <a routerLink="/transactions"  routerLinkActive="active">📋 Transactions</a>
        <a routerLink="/transfer"      routerLinkActive="active">💸 Transfert</a>
        <a routerLink="/bills/current" routerLinkActive="active">🧾 Factures</a>
        <a routerLink="/bills/history" routerLinkActive="active">📜 Historique factures</a>
      }
      @if (auth.getRole() === 'Agent') {
        <a routerLink="/admin/wallets" routerLinkActive="active">👛 Gestion wallets</a>
      }
    </nav>
  `,
  styles: [`
    .sidebar { width:220px; min-height:calc(100vh - 60px); background:#fff; border-right:1px solid #e8ecf0; padding:16px 0; display:flex; flex-direction:column; }
    a { display:block; padding:12px 24px; color:#2C3E50; text-decoration:none; font-size:14px; border-radius:0 24px 24px 0; margin:2px 12px 2px 0; transition:background .2s; }
    a:hover, a.active { background:#e8f0fe; color:#1A73E8; font-weight:600; }
  `]
})
export class SidebarComponent {
  auth = inject(AuthService);
}
