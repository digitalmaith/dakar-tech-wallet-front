export interface InscriptionRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
}

export interface ConnexionRequest {
  email: string;
  motDePasse: string;
}

export type Role = 'CLIENT' | 'ADMIN';

export interface AuthResponse {
  token: string;
  utilisateurId: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  emailVerifie: boolean;
}

export interface Utilisateur {
  utilisateurId: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  emailVerifie: boolean;
}

export interface MotDePasseOublieRequest {
  email: string;
}

export interface ReinitialiserMotDePasseRequest {
  token: string;
  nouveauMotDePasse: string;
}

export interface MessageResponse {
  message: string;
}

export interface RenvoyerVerificationRequest {
  email: string;
}