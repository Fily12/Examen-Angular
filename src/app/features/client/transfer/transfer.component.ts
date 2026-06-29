import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService }    from '../../../services/auth.service';
import { BalanceStore }   from '../../../services/balance-store.service';
import { WalletApiService } from '../../../services/wallet-api.service';
import { ToastService }   from '../../../services/toast.service';
import { XofPipe }        from '../../../shared/pipes/xof.pipe';
import { HeaderComponent }  from '../../../layout/header/header.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import {
  phoneValidator,
  asyncPhoneExistsValidator,
  differentPhoneValidator
} from '../../../core/validators/phone.validators';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, XofPipe, HeaderComponent, SidebarComponent],
  template: `
    <app-header />
    <div class="layout">
      <app-sidebar />
      <main class="main">
        <h2>Effectuer un transfert</h2>
        <div class="card form-card">
          <div class="balance-info">
            Solde disponible : <strong>{{ balanceStore.balance() | xof }}</strong>
          </div>
          <form [formGroup]="transferForm" (ngSubmit)="submit()">
            <div class="field">
              <label>Numéro destinataire</label>
              <input formControlName="receiverPhone" placeholder="+2217XXXXXXXX ou 7XXXXXXXX" />
              <div class="field-hints">
                @if (receiver?.pending) { <span class="hint">Vérification…</span> }
                @if (receiver?.errors?.['invalidPhone'] && receiver?.touched) { <span class="error">Format invalide (7XXXXXXXX)</span> }
                @if (receiver?.errors?.['phoneNotFound'] && !receiver?.pending) { <span class="error">Ce numéro n'existe pas</span> }
                @if (transferForm.errors?.['samePhone']) { <span class="error">Le destinataire ne peut pas être vous-même</span> }
                @if (receiver?.valid && !receiver?.pending) { <span class="success-hint">✓ Numéro valide</span> }
              </div>
            </div>
            <div class="field">
              <label>Montant (XOF)</label>
              <input type="number" formControlName="amount" placeholder="0" min="1" />
              @if (amount?.errors?.['min'] && amount?.touched) { <span class="error">Montant minimum : 1 XOF</span> }
              @if (amount?.value) { <span class="hint">= {{ amount?.value | xof }}</span> }
            </div>
            <button type="submit" [disabled]="transferForm.invalid || transferForm.pending || submitting" class="btn-primary">
              {{ submitting ? 'Envoi en cours…' : 'Envoyer' }}
            </button>
          </form>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:calc(100vh - 60px); background:#F5F7FA; }
    .main { flex:1; padding:24px; }
    h2 { margin:0 0 24px; color:#2C3E50; font-size:22px; }
    .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:28px; max-width:480px; }
    .balance-info { background:#e8f0fe; border-radius:8px; padding:12px 16px; margin-bottom:24px; font-size:14px; color:#2C3E50; }
    .field { margin-bottom:20px; }
    label { display:block; font-size:13px; font-weight:600; color:#2C3E50; margin-bottom:6px; }
    input { width:100%; padding:10px 12px; border:1px solid #dde1e7; border-radius:8px; font-size:15px; box-sizing:border-box; outline:none; }
    input:focus { border-color:#1A73E8; }
    .error        { color:#E74C3C; font-size:12px; display:block; margin-top:4px; }
    .hint         { color:#888; font-size:12px; display:block; margin-top:4px; }
    .success-hint { color:#2ECC71; font-size:12px; display:block; margin-top:4px; }
    .btn-primary { width:100%; padding:12px; background:#1A73E8; color:#fff; border:none; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
  `]
})
export class TransferComponent implements OnInit {
  private fb        = inject(FormBuilder);
  private auth      = inject(AuthService);
  private walletApi = inject(WalletApiService);
  private toast     = inject(ToastService);
  balanceStore      = inject(BalanceStore);

  submitting = false;
  transferForm: any;

  get receiver() { return this.transferForm?.get('receiverPhone'); }
  get amount()   { return this.transferForm?.get('amount'); }

  ngOnInit(): void {
    const phone = this.auth.getPhone();
    this.balanceStore.refresh(phone);
    this.transferForm = this.fb.group(
      {
        receiverPhone: ['', [Validators.required, phoneValidator()], [asyncPhoneExistsValidator(this.walletApi)]],
        amount:        [null, [Validators.required, Validators.min(1)]]
      },
      { validators: differentPhoneValidator(phone) }
    );
  }

  submit(): void {
    if (this.transferForm.invalid || this.submitting) return;
    this.submitting = true;
    const { receiverPhone, amount } = this.transferForm.value;
    this.walletApi.transfer({ senderPhone: this.auth.getPhone(), receiverPhone, amount }).subscribe({
      next: () => {
        this.toast.success('Transfert effectué avec succès');
        this.transferForm.reset();
        this.balanceStore.refresh(this.auth.getPhone());
        this.submitting = false;
      },
      error: () => { this.submitting = false; }
    });
  }
}
