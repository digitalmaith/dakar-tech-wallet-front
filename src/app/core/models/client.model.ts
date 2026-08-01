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

export type StatutPret = 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'EN_COURS' | 'EN_RETARD' | 'SOLDE';
export type StatutEcheance = 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD';

export interface Echeance {
  id: number;
  numero: number;
  dateEcheance: string;
  montant: number;
  statut: StatutEcheance;
  datePaiement: string | null;
}

export interface PretClient {
  id: number;
  montant: number;
  motif: string;
  dureeMois: number;
  statut: StatutPret;
  dateDemande: string;
  dateTraitement: string | null;
  capitalRestant: number;
  mensualite: number | null;
  echeances: Echeance[];
}

export type TypeRemboursement = 'MENSUALITE' | 'TOTAL';

export interface RemboursementRequest {
  type: TypeRemboursement;
}