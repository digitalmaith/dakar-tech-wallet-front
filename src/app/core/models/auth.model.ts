export interface InscriptionRequest {
  nom: string;
  prenom: string;
  email: string;
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
}

export interface Utilisateur {
  utilisateurId: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
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