import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Facture, PayFacturesDto } from '../core/interfaces/models';

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  // Chemin relatif → passe par le proxy Angular → pas de CORS
  private readonly BASE = '/api/factures';

  constructor(private http: HttpClient) {}

  getCurrentFactures(walletCode: string, unite?: string): Observable<Facture[]> {
    let params = new HttpParams();
    if (unite) params = params.set('unite', unite);
    return this.http.get<Facture[]>(`${this.BASE}/${walletCode}/current`, { params });
  }

  getFacturesByPeriode(walletCode: string, debut: string, fin: string): Observable<Facture[]> {
    const params = new HttpParams().set('debut', debut).set('fin', fin);
    return this.http.get<Facture[]>(`${this.BASE}/${walletCode}/periode`, { params });
  }

  payFactures(payload: PayFacturesDto): Observable<Facture[]> {
    return this.http.post<Facture[]>(`${this.BASE}/pay`, payload);
  }
}
