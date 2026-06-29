import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService }    from '../../../services/auth.service';
import { WalletApiService } from '../../../services/wallet-api.service';
import { ToastService }   from '../../../services/toast.service';

function phoneLoginValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value as string)?.trim();
  if (!v) return null;
  const local = /^7\d{8}$/.test(v);
  const intl  = /^\+2217\d{8}$/.test(v);
  return (local || intl) ? null : { invalidPhone: true };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>💳 BadWallet</h1>
        <p class="subtitle">Connectez-vous à votre espace</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>Numéro de téléphone</label>
            <input formControlName="phone" placeholder="+221770000001" />
            @if (form.get('phone')?.invalid && form.get('phone')?.touched) {
              <span class="error">Numéro invalide — ex: +221770000001</span>
            }
          </div>
          <div class="field">
            <label>Rôle</label>
            <div class="role-group">
              <label class="role-btn" [class.selected]="form.get('role')?.value === 'Client'">
                <input type="radio" formControlName="role" value="Client" /> 👤 Client
              </label>
              <label class="role-btn" [class.selected]="form.get('role')?.value === 'Agent'">
                <input type="radio" formControlName="role" value="Agent" /> 🏦 Agent
              </label>
            </div>
          </div>
          <div class="hint-box">
            <strong>Comptes disponibles après seed :</strong><br/>
            <code>+221770000001</code> &nbsp;<code>+221770000002</code> &nbsp;<code>+221770000003</code>
          </div>
          @if (loading) { <div class="loader-bar"></div> }
          <button type="submit" [disabled]="form.invalid || loading" class="btn-primary">
            {{ loading ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height:100vh; display:grid; place-items:center; background:#F5F7FA; }
    .login-card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:40px; width:400px; }
    h1 { margin:0 0 4px; font-size:28px; color:#1A73E8; text-align:center; }
    .subtitle { text-align:center; color:#666; margin-bottom:28px; font-size:14px; }
    .field { margin-bottom:20px; }
    label { display:block; font-size:13px; font-weight:600; color:#2C3E50; margin-bottom:6px; }
    input:not([type=radio]) { width:100%; padding:10px 12px; border:1px solid #dde1e7; border-radius:8px; font-size:15px; box-sizing:border-box; outline:none; transition:border .2s; }
    input:focus { border-color:#1A73E8; }
    .error { color:#E74C3C; font-size:12px; margin-top:4px; display:block; }
    .role-group { display:flex; gap:12px; }
    .role-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; border:2px solid #dde1e7; border-radius:8px; cursor:pointer; font-size:14px; transition:all .2s; }
    .role-btn.selected { border-color:#1A73E8; background:#e8f0fe; color:#1A73E8; font-weight:600; }
    .role-btn input { display:none; }
    .hint-box { background:#f5f7fa; border-radius:8px; padding:12px 14px; margin-bottom:20px; font-size:12px; color:#888; line-height:1.8; }
    .hint-box strong { color:#2C3E50; font-size:13px; }
    code { background:#e8f0fe; color:#1A73E8; padding:2px 8px; border-radius:4px; font-size:12px; }
    .loader-bar { height:3px; background:#1A73E8; border-radius:2px; margin-bottom:12px; animation:pulse 1s infinite; }
    @keyframes pulse { 0%,100% { opacity:.4; } 50% { opacity:1; } }
    .btn-primary { width:100%; padding:12px; background:#1A73E8; color:#fff; border:none; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; transition:background .2s; }
    .btn-primary:hover:not(:disabled) { background:#1557b0; }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
  `]
})
export class LoginComponent {
  private fb        = inject(FormBuilder);
  private auth      = inject(AuthService);
  private walletApi = inject(WalletApiService);
  private toast     = inject(ToastService);

  loading = false;

  form = this.fb.group({
    phone: ['', [Validators.required, phoneLoginValidator]],
    role:  ['Client', Validators.required]
  });

  submit(): void {
    if (this.form.invalid || this.loading) return;
    const phone = this.form.value.phone!.trim();
    const role  = this.form.value.role as 'Client' | 'Agent';

    if (role === 'Agent') {
      // Agent : pas de vérification wallet
      this.auth.login(phone, role);
      return;
    }

    // Client : vérifier que le wallet existe et récupérer le walletCode
    this.loading = true;
    this.walletApi.getWalletByPhone(phone).subscribe({
      next: (wallet) => {
        this.auth.login(phone, role, wallet.code);
        this.loading = false;
      },
      error: () => {
        this.toast.error('Aucun wallet trouvé pour ce numéro');
        this.loading = false;
      }
    });
  }
}
