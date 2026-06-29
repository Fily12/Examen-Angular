import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService }  from '../../../services/auth.service';
import { BalanceStore } from '../../../services/balance-store.service';
import { WalletApiService } from '../../../services/wallet-api.service';
import { Transaction }  from '../../../core/interfaces/models';
import { XofPipe }      from '../../../shared/pipes/xof.pipe';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';
import { HeaderComponent } from '../../../layout/header/header.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, XofPipe, PhoneFormatPipe, HeaderComponent, SidebarComponent],
  template: `
    <app-header />
    <div class="layout">
      <app-sidebar />
      <main class="main">
        <h2>Tableau de bord</h2>
        <div class="cards">
          <div class="card balance-card">
            <span class="card-label">Solde disponible</span>
            @if (balanceStore.isLoading()) { <span class="card-value">…</span> }
            @else { <span class="card-value">{{ balanceStore.balance() | xof }}</span> }
            <span class="card-sub">{{ authService.getPhone() | phoneFormat }}</span>
          </div>
          <div class="card stat-card">
            <span class="card-label">Transactions totales</span>
            <span class="card-value">{{ transactions.length }}</span>
          </div>
          <div class="card stat-card">
            <span class="card-label">Total dépôts</span>
            <span class="card-value success">{{ totalDepots() | xof }}</span>
          </div>
          <div class="card stat-card">
            <span class="card-label">Total retraits</span>
            <span class="card-value danger">{{ totalRetraits() | xof }}</span>
          </div>
        </div>

        <div class="charts-row">
          <div class="card chart-card">
            <h3>Revenus (dépôts)</h3>
            <svg width="100%" height="120" viewBox="0 0 300 120">
              @for (bar of depotBars; track $index) {
                <rect [attr.x]="bar.x" [attr.y]="120 - bar.h" [attr.width]="bar.w" [attr.height]="bar.h" fill="#2ECC71" rx="3" />
              }
            </svg>
          </div>
          <div class="card chart-card">
            <h3>Dépenses (retraits)</h3>
            <svg width="100%" height="120" viewBox="0 0 300 120">
              @for (bar of retraitBars; track $index) {
                <rect [attr.x]="bar.x" [attr.y]="120 - bar.h" [attr.width]="bar.w" [attr.height]="bar.h" fill="#E74C3C" rx="3" />
              }
            </svg>
          </div>
        </div>

        <div class="shortcuts">
          <a routerLink="/transfer"      class="shortcut">💸 Faire un transfert</a>
          <a routerLink="/bills/current" class="shortcut">🧾 Payer une facture</a>
          <a routerLink="/transactions"  class="shortcut">📋 Voir transactions</a>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:calc(100vh - 60px); background:#F5F7FA; }
    .main { flex:1; padding:24px; }
    h2 { margin:0 0 24px; color:#2C3E50; font-size:22px; }
    .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:24px; }
    .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:20px; }
    .card-label { font-size:12px; color:#888; text-transform:uppercase; letter-spacing:.5px; display:block; }
    .card-value { font-size:24px; font-weight:700; color:#2C3E50; display:block; margin:8px 0 4px; }
    .card-value.success { color:#2ECC71; }
    .card-value.danger  { color:#E74C3C; }
    .card-sub { font-size:13px; color:#aaa; }
    .balance-card { background:linear-gradient(135deg,#1A73E8,#1557b0); }
    .balance-card .card-label, .balance-card .card-value, .balance-card .card-sub { color:#fff; }
    .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
    .chart-card h3 { margin:0 0 12px; font-size:14px; color:#2C3E50; }
    .shortcuts { display:flex; gap:12px; flex-wrap:wrap; }
    .shortcut { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:16px 24px; text-decoration:none; color:#1A73E8; font-weight:600; font-size:14px; transition:box-shadow .2s; }
    .shortcut:hover { box-shadow:0 4px 16px rgba(26,115,232,.2); }
  `]
})
export class DashboardComponent implements OnInit {
  authService  = inject(AuthService);
  balanceStore = inject(BalanceStore);
  private walletApi = inject(WalletApiService);

  transactions: Transaction[] = [];
  depotBars:   { x: number; h: number; w: number }[] = [];
  retraitBars: { x: number; h: number; w: number }[] = [];

  ngOnInit(): void {
    const phone = this.authService.getPhone();
    this.balanceStore.refresh(phone);
    this.walletApi.getTransactions(phone).subscribe({
      next: (tx) => { this.transactions = tx; this.buildCharts(tx); },
      error: () => {}
    });
  }

  totalDepots(): number   { return this.transactions.filter(t => t.type === 'DEPOSIT').reduce((s, t) => s + t.amount, 0); }
  totalRetraits(): number { return this.transactions.filter(t => t.type === 'WITHDRAW').reduce((s, t) => s + t.amount, 0); }

  private buildCharts(tx: Transaction[]): void {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const depot   = last7.map(d => tx.filter(t => t.type === 'DEPOSIT'      && t.createdAt?.startsWith(d)).reduce((s, t) => s + t.amount, 0));
    const retrait = last7.map(d => tx.filter(t => t.type === 'WITHDRAW'     && t.createdAt?.startsWith(d)).reduce((s, t) => s + t.amount, 0));
    const maxD = Math.max(...depot,   1);
    const maxR = Math.max(...retrait, 1);
    this.depotBars   = depot.map((v, i)   => ({ x: i * 42 + 6, h: Math.round((v / maxD) * 100) + 4, w: 34 }));
    this.retraitBars = retrait.map((v, i) => ({ x: i * 42 + 6, h: Math.round((v / maxR) * 100) + 4, w: 34 }));
  }
}
