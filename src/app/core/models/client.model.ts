export type TypeTransaction = 'VIREMENT_ENVOYE' | 'VIREMENT_RECU' | 'PRET_CREDITE' | 'REMBOURSEMENT' | string;

export interface Solde {
  numeroCompte: string;
  solde: number;
}

export interface Transaction {
  id: number;
  type: TypeTransaction;
  montant: number;
  soldeApres: number;
  description: string;
  dateTransaction: string;
}

export interface VirementRequest {
  numeroCompteBeneficiaire: string;
  montant: number;
  description: string;
}

export interface Beneficiaire {
  numeroCompte: string;
  nomComplet: string;
}

export interface DemandePretRequest {
  montant: number;
  motif: string;
  dureeMois: number;
}