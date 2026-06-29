import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { WalletApiService } from '../../../services/wallet-api.service';
import { ToastService }     from '../../../services/toast.service';
import { Wallet, PagedResponse } from '../../../core/interfaces/models';
import { XofPipe }          from '../../../shared/pipes/xof.pipe';
import { HeaderComponent }  from '../../../layout/header/header.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { phoneValidator }   from '../../../core/validators/phone.validators';

@Component({
  selector: 'app-wallets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, XofPipe, HeaderComponent, SidebarComponent],
  template: `
    <app-header />
    <div class="layout">
      <app-sidebar />
      <main class="main">
        <div class="top-bar">
          <h2>Gestion des wallets</h2>
          <div class="top-actions">
            <button class="btn-seed" (click)="seed()">🌱 Seed données</button>
            <button class="btn-primary" (click)="showModal = true">+ Nouveau wallet</button>
          </div>
        </div>

        <div class="card search-card">
          <input [(ngModel)]="searchPhone" [ngModelOptions]="{standalone:true}" placeholder="Rechercher par numéro (ex: +2217700000XX)…" (keyup.enter)="searchWallet()" />
          <button class="btn-search" (click)="searchWallet()">Rechercher</button>
          @if (searchPhone && foundWallet) {
            <div class="found-wallet">
              <span class="fw-code">{{ foundWallet.code }}</span>
              <span>{{ foundWallet.phoneNumber }}</span>
              <span>{{ foundWallet.balance | xof }}</span>
              <button class="btn-action" (click)="selectForAction(foundWallet)">Opération</button>
            </div>
          }
        </div>

        @if (loading) { <div class="loader">Chargement…</div> }
        @else {
          <div class="card">
            <table>
              <thead><tr><th>Code</th><th>Téléphone</th><th>Email</th><th>Solde</th><th>Devise</th><th>Créé le</th><th>Actions</th></tr></thead>
              <tbody>
                @for (w of wallets; track w.id) {
                  <tr>
                    <td class="code">{{ w.code }}</td>
                    <td>{{ w.phoneNumber }}</td>
                    <td>{{ w.email }}</td>
                    <td>{{ w.balance | xof }}</td>
                    <td>{{ w.currency }}</td>
                    <td>{{ w.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td><button class="btn-action" (click)="selectForAction(w)">Opération</button></td>
                  </tr>
                }
              </tbody>
            </table>
            <div class="pagination">
              <button [disabled]="page === 0" (click)="prevPage()">◀ Précédent</button>
              <span>Page {{ page + 1 }} / {{ totalPages }}</span>
              <button [disabled]="page >= totalPages - 1" (click)="nextPage()">Suivant ▶</button>
            </div>
          </div>
        }

        @if (selectedWallet) {
          <div class="card op-card">
            <h3>Opérations — {{ selectedWallet.code }} ({{ selectedWallet.phoneNumber }})</h3>
            <div class="op-forms">
              <form [formGroup]="depositForm" (ngSubmit)="deposit()">
                <h4>Dépôt</h4>
                <input type="number" formControlName="amount" placeholder="Montant" min="1" />
                <button type="submit" [disabled]="depositForm.invalid" class="btn-success">Déposer</button>
              </form>
              <form [formGroup]="withdrawForm" (ngSubmit)="withdraw()">
                <h4>Retrait</h4>
                <input type="number" formControlName="amount" placeholder="Montant" min="1" />
                <button type="submit" [disabled]="withdrawForm.invalid" class="btn-danger">Retirer</button>
              </form>
            </div>
          </div>
        }

        @if (showModal) {
          <div class="modal-overlay" (click)="showModal = false">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3>Créer un wallet</h3>
              <form [formGroup]="createForm" (ngSubmit)="createWallet()">
                <div class="field">
                  <label>Code wallet (ex: WLT-0000099)</label>
                  <input formControlName="code" placeholder="WLT-XXXXXXX" />
                </div>
                <div class="field">
                  <label>Numéro de téléphone</label>
                  <input formControlName="phoneNumber" placeholder="+2217XXXXXXXX" />
                  @if (createForm.get('phoneNumber')?.invalid && createForm.get('phoneNumber')?.touched) {
                    <span class="error">Format invalide</span>
                  }
                </div>
                <div class="field">
                  <label>Email</label>
                  <input formControlName="email" placeholder="user@example.com" type="email" />
                </div>
                <div class="field">
                  <label>Solde initial (XOF)</label>
                  <input type="number" formControlName="initialBalance" placeholder="0" />
                </div>
                <div class="field">
                  <label>Devise</label>
                  <input formControlName="currency" placeholder="XOF" />
                </div>
                <div class="modal-actions">
                  <button type="button" class="btn-cancel" (click)="showModal = false">Annuler</button>
                  <button type="submit" [disabled]="createForm.invalid" class="btn-primary">Créer</button>
                </div>
              </form>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:calc(100vh - 60px); background:#F5F7FA; }
    .main { flex:1; padding:24px; }
    .top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
    .top-actions { display:flex; gap:10px; }
    h2 { margin:0; color:#2C3E50; font-size:22px; }
    .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:20px; margin-bottom:16px; }
    .search-card { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
    .search-card input { flex:1; padding:10px 12px; border:1px solid #dde1e7; border-radius:8px; font-size:14px; min-width:200px; }
    .btn-search  { padding:10px 20px; background:#1A73E8; color:#fff; border:none; border-radius:8px; cursor:pointer; }
    .btn-seed    { padding:8px 16px; background:#f39c12; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:13px; }
    .found-wallet { display:flex; gap:16px; align-items:center; padding:10px 16px; background:#e8f0fe; border-radius:8px; font-size:14px; flex-wrap:wrap; }
    .fw-code { font-weight:700; color:#1A73E8; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th { text-align:left; padding:10px 12px; border-bottom:2px solid #f0f3f7; color:#888; font-size:12px; text-transform:uppercase; }
    td { padding:12px; border-bottom:1px solid #f5f7fa; color:#2C3E50; }
    .code { font-family:monospace; font-weight:700; color:#1A73E8; }
    .btn-action  { padding:5px 14px; background:#e8f0fe; color:#1A73E8; border:1px solid #c3d8fc; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; }
    .pagination  { display:flex; align-items:center; justify-content:center; gap:16px; padding-top:16px; border-top:1px solid #f0f3f7; margin-top:8px; }
    .pagination button { padding:7px 16px; border:1px solid #dde1e7; border-radius:6px; cursor:pointer; background:#fff; }
    .pagination button:disabled { opacity:.4; cursor:not-allowed; }
    .op-card h3  { margin:0 0 16px; font-size:16px; color:#2C3E50; }
    .op-forms    { display:flex; gap:24px; flex-wrap:wrap; }
    .op-forms form { display:flex; flex-direction:column; gap:8px; }
    .op-forms h4 { margin:0; font-size:14px; color:#2C3E50; }
    .op-forms input { padding:8px 12px; border:1px solid #dde1e7; border-radius:8px; font-size:14px; width:180px; }
    .btn-primary { padding:8px 20px; background:#1A73E8; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
    .btn-success { padding:8px 20px; background:#2ECC71; color:#fff; border:none; border-radius:8px; cursor:pointer; }
    .btn-danger  { padding:8px 20px; background:#E74C3C; color:#fff; border:none; border-radius:8px; cursor:pointer; }
    .btn-primary:disabled, .btn-success:disabled, .btn-danger:disabled { opacity:.5; cursor:not-allowed; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); display:grid; place-items:center; z-index:1000; }
    .modal { background:#fff; border-radius:12px; padding:28px; width:420px; box-shadow:0 8px 32px rgba(0,0,0,.2); }
    .modal h3 { margin:0 0 20px; color:#2C3E50; }
    .field { margin-bottom:16px; }
    label { display:block; font-size:13px; font-weight:600; color:#2C3E50; margin-bottom:6px; }
    .field input { width:100%; padding:10px 12px; border:1px solid #dde1e7; border-radius:8px; font-size:14px; box-sizing:border-box; }
    .error { color:#E74C3C; font-size:12px; display:block; margin-top:4px; }
    .modal-actions { display:flex; gap:12px; justify-content:flex-end; margin-top:20px; }
    .btn-cancel { padding:8px 20px; background:#fff; border:1px solid #dde1e7; border-radius:8px; cursor:pointer; }
    .loader { text-align:center; padding:40px; color:#aaa; }
  `]
})
export class WalletsComponent implements OnInit {
  private walletApi = inject(WalletApiService);
  private toast     = inject(ToastService);
  private fb        = inject(FormBuilder);

  wallets: Wallet[] = [];
  loading    = false;
  showModal  = false;
  page       = 0;
  totalPages = 1;
  searchPhone  = '';
  foundWallet: Wallet | null = null;
  selectedWallet: Wallet | null = null;

  depositForm  = this.fb.group({ amount: [null, [Validators.required, Validators.min(1)]] });
  withdrawForm = this.fb.group({ amount: [null, [Validators.required, Validators.min(1)]] });
  createForm   = this.fb.group({
    code:           ['', Validators.required],
    phoneNumber:    ['', Validators.required],
    email:          ['', [Validators.required, Validators.email]],
    initialBalance: [0, [Validators.required, Validators.min(0)]],
    currency:       ['XOF', Validators.required]
  });

  ngOnInit(): void { this.loadWallets(); }

  loadWallets(): void {
    this.loading = true;
    this.walletApi.getWallets(this.page, 10).subscribe({
      next: (res: PagedResponse<Wallet>) => {
        this.wallets    = res.content;
        this.totalPages = res.totalPages ?? 1;
        this.loading    = false;
      },
      error: () => { this.loading = false; }
    });
  }

  seed(): void {
    this.walletApi.seed(10, 50).subscribe({
      next: () => { this.toast.success('Seed lancé — 10 wallets en cours de création'); setTimeout(() => this.loadWallets(), 3000); },
      error: () => {}
    });
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.loadWallets(); } }
  nextPage(): void { if (this.page < this.totalPages - 1) { this.page++; this.loadWallets(); } }

  searchWallet(): void {
    if (!this.searchPhone) return;
    this.walletApi.getWalletByPhone(this.searchPhone).subscribe({
      next:  (w) => { this.foundWallet = w; },
      error: ()  => { this.foundWallet = null; this.toast.error('Wallet non trouvé'); }
    });
  }

  selectForAction(w: Wallet): void {
    this.selectedWallet = w;
    this.depositForm.reset();
    this.withdrawForm.reset();
  }

  deposit(): void {
    if (!this.selectedWallet) return;
    const { amount } = this.depositForm.value;
    this.walletApi.deposit(this.selectedWallet.id, { amount: amount! }).subscribe({
      next: () => { this.toast.success('Dépôt effectué'); this.depositForm.reset(); this.loadWallets(); },
      error: () => {}
    });
  }

  withdraw(): void {
    if (!this.selectedWallet) return;
    const { amount } = this.withdrawForm.value;
    this.walletApi.withdraw({ phoneNumber: this.selectedWallet.phoneNumber, amount: amount! }).subscribe({
      next: () => { this.toast.success('Retrait effectué'); this.withdrawForm.reset(); this.loadWallets(); },
      error: () => {}
    });
  }

  createWallet(): void {
    if (this.createForm.invalid) return;
    const v = this.createForm.value;
    this.walletApi.createWallet({
      code: v.code!, phoneNumber: v.phoneNumber!, email: v.email!,
      initialBalance: v.initialBalance ?? 0, currency: v.currency!
    }).subscribe({
      next: () => {
        this.toast.success('Wallet créé avec succès');
        this.createForm.reset({ initialBalance: 0, currency: 'XOF' });
        this.showModal = false;
        this.loadWallets();
      },
      error: () => {}
    });
  }
}
