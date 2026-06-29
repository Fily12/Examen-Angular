import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly PHONE_KEY       = 'bw_phone';
  private readonly ROLE_KEY        = 'bw_role';
  private readonly WALLET_CODE_KEY = 'bw_wallet_code';

  constructor(private router: Router) {}

  login(phone: string, role: 'Client' | 'Agent', walletCode?: string): void {
    localStorage.setItem(this.PHONE_KEY, phone);
    localStorage.setItem(this.ROLE_KEY, role);
    if (walletCode) localStorage.setItem(this.WALLET_CODE_KEY, walletCode);
    role === 'Agent' ? this.router.navigate(['/admin/wallets']) : this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem(this.PHONE_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.WALLET_CODE_KEY);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean   { return !!localStorage.getItem(this.PHONE_KEY); }
  getPhone(): string      { return localStorage.getItem(this.PHONE_KEY) ?? ''; }
  getWalletCode(): string { return localStorage.getItem(this.WALLET_CODE_KEY) ?? ''; }
  getRole(): 'Client' | 'Agent' | null {
    return (localStorage.getItem(this.ROLE_KEY) as 'Client' | 'Agent') ?? null;
  }
}
