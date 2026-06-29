import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService }     from '../../../services/auth.service';
import { BillingApiService } from '../../../services/billing-api.service';
import { Facture }         from '../../../core/interfaces/models';
import { XofPipe }         from '../../../shared/pipes/xof.pipe';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';
import { HeaderComponent }  from '../../../layout/header/header.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-bills-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, XofPipe, PhoneFormatPipe, HeaderComponent, SidebarComponent],
  template: `
    <app-header />
    <div class="layout">
      <app-sidebar />
      <main class="main">
        <h2>Historique des factures</h2>
        <div class="card sub">Compte : {{ auth.getPhone() | phoneFormat }}</div>

        <div class="card filter-card">
          <form [formGroup]="periodeForm" (ngSubmit)="loadByPeriode()">
            <label>Du</label>
            <input type="date" formControlName="debut" />
            <label>Au</label>
            <input type="date" formControlName="fin" />
            <button type="submit" class="btn-primary">Filtrer</button>
            <button type="button" class="btn-secondary" (click)="loadCurrentMonth()">Mois en cours</button>
          </form>
        </div>

        @if (loading) { <div class="loader">Chargement…</div> }
        @else if (factures.length === 0) { <div class="card"><p class="empty">Aucune facture trouvée.</p></div> }
        @else {
          <div class="card">
            <table>
              <thead><tr><th>Service</th><th>Référence</th><th>Montant</th><th>Échéance</th><th>Statut</th></tr></thead>
              <tbody>
                @for (f of factures; track f.id) {
                  <tr>
                    <td><span class="provider-badge">{{ f.serviceName }}</span></td>
                    <td class="ref">{{ f.reference }}</td>
                    <td>{{ f.amount | xof }}</td>
                    <td>{{ f.dueDate | date:'dd/MM/yyyy' }}</td>
                    <td><span class="status-badge status-{{ f.status.toLowerCase() }}">{{ f.status === 'PAID' ? '✓ Payée' : 'Non payée' }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
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
    .sub { font-size:13px; color:#888; }
    .filter-card form { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
    label { font-size:13px; font-weight:600; color:#2C3E50; }
    input[type=date] { padding:8px 12px; border:1px solid #dde1e7; border-radius:8px; font-size:14px; }
    .btn-primary  { padding:8px 20px; background:#1A73E8; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
    .btn-secondary { padding:8px 20px; background:#fff; border:1px solid #dde1e7; border-radius:8px; cursor:pointer; font-size:14px; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th { text-align:left; padding:10px 12px; border-bottom:2px solid #f0f3f7; color:#888; font-size:12px; text-transform:uppercase; }
    td { padding:12px; border-bottom:1px solid #f5f7fa; color:#2C3E50; }
    .ref { font-family:monospace; font-size:11px; color:#aaa; }
    .provider-badge { background:#e8f0fe; color:#1A73E8; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700; }
    .status-badge { padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700; }
    .status-paid   { background:#d4efdf; color:#1a8a4a; }
    .status-unpaid { background:#fde8e8; color:#c0392b; }
    .loader, .empty { text-align:center; padding:40px; color:#aaa; }
  `]
})
export class BillsHistoryComponent implements OnInit {
  auth    = inject(AuthService);
  billing = inject(BillingApiService);
  private fb = inject(FormBuilder);

  factures: Facture[] = [];
  loading = false;

  periodeForm = this.fb.group({
    debut: [this.firstDayOfMonth()],
    fin:   [new Date().toISOString().slice(0, 10)]
  });

  ngOnInit(): void { this.loadCurrentMonth(); }

  loadCurrentMonth(): void {
    this.periodeForm.patchValue({ debut: this.firstDayOfMonth(), fin: new Date().toISOString().slice(0, 10) });
    this.loadByPeriode();
  }

  loadByPeriode(): void {
    const { debut, fin } = this.periodeForm.value;
    if (!debut || !fin) return;
    this.loading = true;
    const walletCode = this.auth.getWalletCode() || this.auth.getPhone();
    this.billing.getFacturesByPeriode(walletCode, debut, fin).subscribe({
      next:  (f) => { this.factures = f; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  private firstDayOfMonth(): string {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  }
}
