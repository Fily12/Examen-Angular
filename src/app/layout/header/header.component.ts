import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService }    from '../../services/auth.service';
import { BalanceStore }   from '../../services/balance-store.service';
import { XofPipe }         from '../../shared/pipes/xof.pipe';
import { PhoneFormatPipe } from '../../shared/pipes/phone-format.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, XofPipe, PhoneFormatPipe],
  template: `
    <header class="header">
      <span class="logo">💳 BadWallet</span>
      <div class="header-center">
        @if (authService.getRole() === 'Client') {
          <span class="balance">
            @if (balanceStore.isLoading()) { <span>…</span> }
            @else { {{ balanceStore.balance() | xof }} }
          </span>
        }
      </div>
      <div class="header-right">
        <div class="badges">
          <span class="badge" [class.ok]="walletOk" [class.ko]="!walletOk" title="Wallet API (8080)">W</span>
          <span class="badge" [class.ok]="paymentOk" [class.ko]="!paymentOk" title="Payment API (8081)">P</span>
        </div>
        <span class="phone">{{ authService.getPhone() | phoneFormat }}</span>
        <button class="btn-logout" (click)="authService.logout()">Déconnexion</button>
      </div>
    </header>
  `,
  styles: [`
    .header { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:60px; background:#1A73E8; color:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.12); }
    .logo { font-weight:700; font-size:18px; }
    .balance { font-size:20px; font-weight:700; }
    .header-right { display:flex; align-items:center; gap:16px; }
    .phone { font-size:13px; opacity:.9; }
    .btn-logout { background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.4); color:#fff; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:13px; }
    .btn-logout:hover { background:rgba(255,255,255,.3); }
    .badges { display:flex; gap:6px; }
    .badge { width:22px; height:22px; border-radius:50%; display:grid; place-items:center; font-size:10px; font-weight:700; color:#fff; }
    .badge.ok { background:#2ECC71; }
    .badge.ko { background:#E74C3C; }
  `]
})
export class HeaderComponent implements OnInit {
  authService  = inject(AuthService);
  balanceStore = inject(BalanceStore);
  private http = inject(HttpClient);

  walletOk  = false;
  paymentOk = false;

  ngOnInit(): void {
    // Passe par le proxy Angular → pas de CORS
    this.http.get('/api/wallets?page=0&size=1').subscribe({
      next:  () => this.walletOk  = true,
      error: () => this.walletOk  = false
    });
    this.http.get(`/api/factures/${this.authService.getPhone()}/current`).subscribe({
      next:  () => this.paymentOk = true,
      error: () => this.paymentOk = false
    });
  }
}
