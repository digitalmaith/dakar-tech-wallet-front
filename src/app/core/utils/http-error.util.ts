import { HttpErrorResponse } from '@angular/common/http';

// Le backend renvoie systématiquement { message, status, timestamp } sur
// les erreurs métier (403, 400, 404...). On extrait ce message réel au
// lieu d'afficher un texte générique — avec un fallback uniquement pour
// les erreurs réseau/serveur qui n'ont pas ce format (500 non gérée, CORS,
// timeout, etc.).
export function extractErrorMessage(err: unknown, fallback = 'Une erreur est survenue. Réessayez.'): string {
  if (err instanceof HttpErrorResponse) {
    const backendMessage = err.error?.message;
    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage;
    }
  }
  return fallback;
}

// Le backend renvoie un 403 avec ce message précis quand l'email n'est
// pas vérifié — on le distingue des autres 403 (accès refusé, rôle
// insuffisant) pour savoir quand proposer la bannière de vérification
// plutôt qu'un message d'erreur générique.
export function isEmailNonVerifieError(err: unknown): boolean {
  if (err instanceof HttpErrorResponse) {
    return err.status === 403 && typeof err.error?.message === 'string' && err.error.message.toLowerCase().includes('email');
  }
  return false;
}