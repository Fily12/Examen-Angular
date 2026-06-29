import { Injectable, signal } from '@angular/core';
import { WalletApiService } from './wallet-api.service';

@Injectable({ providedIn: 'root' })
export class BalanceStore {
  readonly balance   = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  constructor(private walletApi: WalletApiService) {}

  refresh(phone: string): void {
    this.isLoading.set(true);
    this.walletApi.getBalance(phone).subscribe({
      next:  (b) => { this.balance.set(b); this.isLoading.set(false); },
      error: ()  => this.isLoading.set(false)
    });
  }
}
