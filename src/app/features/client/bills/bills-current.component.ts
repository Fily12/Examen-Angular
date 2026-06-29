import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService }     from '../../../services/auth.service';
import { BillingApiService } from '../../../services/billing-api.service';
import { WalletApiService }  from '../../../services/wallet-api.service';
import { BalanceStore }    from '../../../services/balance-store.service';
import { ToastService }    from '../../../services/toast.service';
import { Facture }         from '../../../core/interfaces/models';
import { XofPipe }         from '../../../shared/pipes/xof.pipe';
import { HeaderComponent }  from '../../../layout/header/header.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';

const SERVICES = ['WOYAFAL', 'ISM', "SEN'EAU", 'SONATEL'];

@Component({
  selector: 'app-bills-current',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, XofPipe, HeaderComponent, SidebarComponent],
  template: `
    <app-header />
    <div class="layout">
      <app-sidebar />
      <main class="main">
        <h2>Factures du mois en cours</h2>
        <div class="card filter-card">
          <div class="provider-tabs">
            <button class="tab" [class.active]="!selectedService" (click)="filterByService(null)">Tous</button>
            @for (s of services; track s) {
              <button class="tab" [class.active]="selectedService === s" (click)="filterByService(s)">{{ s }}</button>
            }
          </div>
        </div>
        @if (loading) { <div class="loader">Chargement…</div> }
        @else if (factures.length === 0) { <div class="card"><p class="empty">Aucune facture impayée.</p></div> }
        @else {
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" (change)="toggleAll($event)" /></th>
                  <th>Service</th><th>Référence</th><th>Montant</th><th>Échéance</th><th>Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (f of factures; track f.id) {
                  <tr [class.selected]="isSelected(f.reference)">
                    <td><input type="checkbox" [checked]="isSelected(f.reference)" (change)="toggle(f)" /></td>
                    <td><span class="provider-badge">{{ f.serviceName }}</span></td>
                    <td class="ref">{{ f.reference }}</td>
                    <td>{{ f.amount | xof }}</td>
                    <td>{{ f.dueDate | date:'dd/MM/yyyy' }}</td>
                    <td><span class="status-badge status-{{ f.status.toLowerCase() }}">{{ f.status === 'UNPAID' ? 'Non payée' : 'Payée' }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
            <div class="pay-bar">
              <span class="total-label">Sélection : <strong>{{ selectedTotal() | xof }}</strong> ({{ selected.size }} facture(s))</span>
              <button class="btn-pay" [disabled]="selected.size === 0 || paying" (click)="pay()">
                {{ paying ? 'Paiement…' : 'Payer la sélection' }}
              </button>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:calc(100vh - 60px); background:#F5F7FA; }
    .main { flex:1; padding:24px; }
    h2 { margin:0 0 24px; color:#2C3E50; font-size:22px; }
    .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:20px; margin-bottom:16px; }
    .provider-tabs { display:flex; gap:8px; flex-wrap:wrap; }
    .tab { padding:8px 16px; border:1px solid #dde1e7; border-radius:20px; background:#fff; cursor:pointer; font-size:13px; transition:all .2s; }
    .tab.active { background:#1A73E8; color:#fff; border-color:#1A73E8; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th { text-align:left; padding:10px 12px; border-bottom:2px solid #f0f3f7; color:#888; font-size:12px; text-transform:uppercase; }
    td { padding:12px; border-bottom:1px solid #f5f7fa; color:#2C3E50; }
    tr.selected td { background:#f0f7ff; }
    .ref { font-family:monospace; font-size:11px; color:#aaa; }
    .provider-badge { background:#e8f0fe; color:#1A73E8; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700; }
    .status-badge { padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700; }
    .status-unpaid { background:#fde8e8; color:#c0392b; }
    .status-paid   { background:#d4efdf; color:#1a8a4a; }
    .pay-bar { display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid #f0f3f7; margin-top:8px; }
    .total-label { font-size:14px; color:#2C3E50; }
    .btn-pay { padding:10px 24px; background:#2ECC71; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:14px; }
    .btn-pay:disabled { opacity:.5; cursor:not-allowed; }
    .loader, .empty { text-align:center; padding:40px; color:#aaa; }
  `]
})
export class BillsCurrentComponent implements OnInit {
  private auth         = inject(AuthService);
  private billing      = inject(BillingApiService);
  private balanceStore = inject(BalanceStore);
  private toast        = inject(ToastService);

  factures: Facture[] = [];
  selected = new Set<string>();
  services = SERVICES;
  selectedService: string | null = null;
  loading = false;
  paying  = false;

  ngOnInit(): void { this.load(); }

  filterByService(s: string | null): void {
    this.selectedService = s;
    this.selected.clear();
    this.load();
  }

  load(): void {
    this.loading = true;
    const walletCode = this.auth.getWalletCode() || this.auth.getPhone();
    this.billing.getCurrentFactures(walletCode, this.selectedService ?? undefined).subscribe({
      next:  (f) => { this.factures = f.filter(x => x.status === 'UNPAID'); this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  isSelected(ref: string): boolean { return this.selected.has(ref); }
  toggle(f: Facture): void { this.selected.has(f.reference) ? this.selected.delete(f.reference) : this.selected.add(f.reference); }
  toggleAll(e: Event): void {
    (e.target as HTMLInputElement).checked
      ? this.factures.forEach(f => this.selected.add(f.reference))
      : this.selected.clear();
  }

  selectedTotal(): number {
    return this.factures.filter(f => this.selected.has(f.reference)).reduce((s, f) => s + f.amount, 0);
  }

  pay(): void {
    if (this.selected.size === 0) return;
    this.paying = true;
    const walletCode = this.auth.getWalletCode() || this.auth.getPhone();
    this.billing.payFactures({ walletCode, factureReferences: Array.from(this.selected) }).subscribe({
      next: () => {
        this.toast.success(`${this.selected.size} facture(s) payée(s) avec succès`);
        this.selected.clear();
        this.balanceStore.refresh(this.auth.getPhone());
        this.load();
        this.paying = false;
      },
      error: () => { this.paying = false; }
    });
  }
}
