import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Wallet, Transaction, TransferDto, FacturePaymentDto,
  BalanceResponseDto, PagedResponse, CreateWalletDto, TransactionFilters
} from '../core/interfaces/models';

@Injectable({ providedIn: 'root' })
export class WalletApiService {
  // Chemin relatif → passe par le proxy Angular (proxy.conf.json) → pas de CORS
  private readonly BASE = '/api/wallets';

  constructor(private http: HttpClient) {}

  getWallets(page: number, size: number): Observable<PagedResponse<Wallet>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<Wallet>>(this.BASE, { params });
  }

  createWallet(data: CreateWalletDto): Observable<Wallet> {
    return this.http.post<Wallet>(this.BASE, data);
  }

  getWalletByPhone(phone: string): Observable<Wallet> {
    return this.http.get<Wallet>(`${this.BASE}/${phone}`);
  }

  getBalance(phone: string): Observable<number> {
    return this.http.get<BalanceResponseDto>(`${this.BASE}/${phone}/balance`).pipe(
      map(res => res.balance)
    );
  }

  deposit(walletId: number, payload: { amount: number; paymentMethod: string }): Observable<void> {
    return this.http.post<void>(`${this.BASE}/${walletId}/deposit`, payload);
  }

  withdraw(payload: { phoneNumber: string; amount: number }): Observable<void> {
    return this.http.post<void>(`${this.BASE}/withdraw`, payload);
  }

  transfer(payload: TransferDto): Observable<void> {
    return this.http.post<void>(`${this.BASE}/transfer`, payload);
  }

  getTransactions(phone: string, filters?: TransactionFilters): Observable<Transaction[]> {
    let params = new HttpParams();
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate)   params = params.set('endDate', filters.endDate);
    if (filters?.type)      params = params.set('type', filters.type);
    return this.http.get<Transaction[]>(`${this.BASE}/${phone}/transactions`, { params });
  }

  payFactures(payload: FacturePaymentDto): Observable<void> {
    return this.http.post<void>(`${this.BASE}/pay-factures`, payload);
  }

  seed(numWallets = 10, eventsPerWallet = 50): Observable<void> {
    const params = new HttpParams().set('numWallets', numWallets).set('eventsPerWallet', eventsPerWallet);
    return this.http.post<void>(`${this.BASE}/seed`, null, { params });
  }
}
