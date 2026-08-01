export interface QrCodeResponse {
  payload: string;
}

export interface QrValidationRequest {
  payload: string;
}

export type TypeQr = 'STATIQUE' | 'DYNAMIQUE' | string;

export interface QrValidationResponse {
  type: TypeQr;
  numeroCompte: string;
  nomComplet: string;
  montant: number | null;
  description: string | null;
}