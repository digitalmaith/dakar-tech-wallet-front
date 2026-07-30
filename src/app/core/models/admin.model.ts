import { Role } from './auth.model';

export type StatutPret = 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'EN_COURS' | 'EN_RETARD' | 'SOLDE';
export type StatutCompte = 'ACTIF' | 'SUSPENDU';
export type NiveauScore = 'EXCELLENT' | 'BON' | 'A_RISQUE' | 'MAUVAIS_PAYEUR' | string;

export interface EvolutionMensuelle {
  mois: string;
  nombreTransactions: number;
  volumeTransactions: number;
  nombreNouveauxPrets: number;
  montantPrete: number;
}

export interface DashboardAdmin {
  nombreUtilisateursActifs: number;
  nombreUtilisateursSuspendus: number;
  volumeFinancierTotal: number;
  montantTotalPrete: number;
  montantTotalRembourse: number;
  repartitionPretsParStatut: Record<StatutPret, number>;
  repartitionScores: Record<string, number>;
  evolutionMensuelle: EvolutionMensuelle[];
}

export interface UtilisateurAdmin {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  statutCompte: StatutCompte;
  solde: number;
  score: NiveauScore;
}

export interface Pret {
  id: number;
  clientId: number;
  montant: number;
  motif: string;
  dureeMois: number;
  statut: StatutPret;
  dateDemande: string;
  capitalRestant: number;
  mensualite: number | null;
}

export interface DemandePretEnAttente {
  pret: Pret;
  niveauScore: NiveauScore;
  valeurScore: number;
}