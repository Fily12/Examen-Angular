import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService }      from '../../../services/auth.service';
import { WalletApiService } from '../../../services/wallet-api.service';
import { Transaction, TransactionFilters } from '../../../core/interfaces/models';
import { XofPipe }          from '../../../shared/pipes/xof.pipe';
import { HeaderComponent }  from '../../../layout/header/header.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, XofPipe, HeaderComponent, SidebarComponent],
  template: `
    <app-header />
    <div class="layout">
      <app-sidebar />
      <main class="main">
        <h2>Mes transactions</h2>
        <div class="card filters">
          <form [formGroup]="filterForm" (ngSubmit)="load()">
            <select formControlName="type">
              <option value="">Tous les types</option>
              <option value="DEPOSIT">Dépôt</option>
              <option value="WITHDRAW">Retrait</option>
              <option value="TRANSFER">Transfert</option>
              <option value="BILL_PAYMENT">Paiement facture</option>
            </select>
            <input type="date" formControlName="startDate" />
            <input type="date" formControlName="endDate" />
            <button type="submit" class="btn-primary">Filtrer</button>
          </form>
        </div>
        <div class="card">
          @if (loading) { <div class="loader">Chargement…</div> }
          @else if (transactions.length === 0) { <p class="empty">Aucune transaction trouvée.</p> }
          @else {
            <table>
              <thead><tr><th>Date</th><th>Référence</th><th>Type</th><th>Montant</th><th>Statut</th><th>Description</th></tr></thead>
              <tbody>
                @for (tx of transactions; track tx.id) {
                  <tr>
                    <td>{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="ref">{{ tx.reference }}</td>
                    <td><span class="badge badge-{{ tx.type.toLowerCase() }}">{{ typeLabel(tx.type) }}</span></td>
                    <td [class.credit]="tx.type === 'DEPOSIT'" [class.debit]="tx.type !== 'DEPOSIT'">{{ tx.amount | xof }}</td>
                    <td><span class="status-badge status-{{ tx.status.toLowerCase() }}">{{ tx.status }}</span></td>
                    <td>{{ tx.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:calc(100vh - 60px); background:#F5F7FA; }
    .main { flex:1; padding:24px; }
    h2 { margin:0 0 24px; color:#2C3E50; font-size:22px; }
    .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:20px; margin-bottom:16px; }
    .filters form { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
    select, input[type=date] { padding:8px 12px; border:1px solid #dde1e7; border-radius:8px; font-size:14px; }
    .btn-primary { padding:8px 20px; background:#1A73E8; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th { text-align:left; padding:10px 12px; border-bottom:2px solid #f0f3f7; color:#888; font-size:12px; text-transform:uppercase; }
    td { padding:12px; border-bottom:1px solid #f5f7fa; color:#2C3E50; }
    .ref { font-family:monospace; font-size:11px; color:#aaa; }
    .credit { color:#2ECC71; font-weight:600; }
    .debit  { color:#E74C3C; font-weight:600; }
    .badge  { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
    .badge-deposit      { background:#d4efdf; color:#1a8a4a; }
    .badge-withdraw     { background:#fde8e8; color:#c0392b; }
    .badge-transfer     { background:#e8f0fe; color:#1A73E8; }
    .badge-bill_payment { background:#fef9e7; color:#d4ac0d; }
    .status-badge { padding:3px 8px; border-radius:20px; font-size:11px; font-weight:700; }
    .status-success { background:#d4efdf; color:#1a8a4a; }
    .status-failed  { background:#fde8e8; color:#c0392b; }
    .status-pending { background:#fef9e7; color:#d4ac0d; }
    .loader, .empty { text-align:center; padding:40px; color:#aaa; }
  `]
})
export class TransactionsComponent implements OnInit {
  private auth      = inject(AuthService);
  private walletApi = inject(WalletApiService);
  private fb        = inject(FormBuilder);

  transactions: Transaction[] = [];
  loading = false;

  filterForm = this.fb.group({ type: [''], startDate: [''], endDate: [''] });

  ngOnInit(): void { this.load(); }

  typeLabel(type: string): string {
    const labels: Record<string, string> = { DEPOSIT: 'Dépôt', WITHDRAW: 'Retrait', TRANSFER: 'Transfert', BILL_PAYMENT: 'Paiement facture' };
    return labels[type] ?? type;
  }

  load(): void {
    this.loading = true;
    const { type, startDate, endDate } = this.filterForm.value;
    const filters: TransactionFilters = {};
    if (type)      filters.type      = type;
    if (startDate) filters.startDate = startDate;
    if (endDate)   filters.endDate   = endDate;
    this.walletApi.getTransactions(this.auth.getPhone(), filters).subscribe({
      next:  (tx) => { this.transactions = tx; this.loading = false; },
      error: ()   => { this.loading = false; }
    });
  }
}
