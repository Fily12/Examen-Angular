import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { WalletApiService } from '../../services/wallet-api.service';

// Accepte : 7XXXXXXXX (9 chiffres) OU +2217XXXXXXXX (format international)
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value as string)?.trim();
    if (!v) return null;
    const local = /^7\d{8}$/.test(v);
    const intl  = /^\+2217\d{8}$/.test(v);
    return (local || intl) ? null : { invalidPhone: true };
  };
}

export function asyncPhoneExistsValidator(api: WalletApiService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) return of(null);
    return timer(400).pipe(
      switchMap(() => api.getWalletByPhone(control.value).pipe(
        map(() => null),
        catchError(() => of({ phoneNotFound: true }))
      ))
    );
  };
}

export function differentPhoneValidator(sourcePhone: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const dest = group.get('receiverPhone')?.value;
    return dest === sourcePhone ? { samePhone: true } : null;
  };
}
