import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, take } from 'rxjs';
import { WalletService } from '../services/wallet.service';

// Validation asynchrone exigée par le cahier des charges : vérifie que
// le numéro de compte existe réellement côté serveur avant de permettre
// la validation du virement.
export function beneficiaireExisteValidator(walletService: WalletService): AsyncValidatorFn {
  return (control: AbstractControl) => {
    const value = (control.value ?? '').trim();
    if (!value) return of(null);

    return of(value).pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(numero =>
        walletService.getBeneficiaire(numero).pipe(
          map(() => null as ValidationErrors | null),
          catchError(() => of({ beneficiaireIntrouvable: true } as ValidationErrors))
        )
      ),
      take(1)
    );
  };
}