import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast  = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isWallet  = req.url.includes('localhost:8080') || req.url.includes('/api/wallets');
      const isPayment = req.url.includes('localhost:8081') || req.url.includes('/api/factures');

      // Erreur réseau (backend éteint)
      if (err.status === 0) {
        toast.error(isPayment
          ? 'Service paiement indisponible'
          : isWallet
            ? 'Service wallet indisponible'
            : 'Impossible de contacter le serveur');
        return throwError(() => err);
      }

      // Lire le message du backend si disponible
      const backendMessage: string = err.error?.message ?? err.error?.error ?? '';

      if (err.status === 401) {
        toast.error('Non autorisé');
        router.navigate(['/login']);
        return throwError(() => err);
      }

      if (err.status === 409) {
        // Différencier : fonds insuffisants vs doublon
        const msg = backendMessage.toLowerCase();
        if (msg.includes('insufficient') || msg.includes('balance') || msg.includes('solde')) {
          toast.error('Fonds insuffisants');
        } else if (msg.includes('already') || msg.includes('duplicate') || msg.includes('exists') || msg.includes('in use')) {
          toast.error(`Conflit : ${backendMessage}`);
        } else {
          toast.error(backendMessage || 'Conflit — ressource déjà existante');
        }
        return throwError(() => err);
      }

      const messages: Record<number, string> = {
        400: backendMessage || 'Requête invalide',
        403: 'Accès refusé',
        404: backendMessage || 'Ressource introuvable',
        500: 'Erreur serveur, réessayez plus tard'
      };

      toast.error(messages[err.status] ?? `Erreur ${err.status}`);
      return throwError(() => err);
    })
  );
};
