export type TypeNotification = 'VIREMENT_RECU' | 'VIREMENT_ENVOYE' | 'PRET_VALIDE' | 'PRET_REJETE' | 'PRET_EN_RETARD' | string;

export interface NotificationClient {
  id: number;
  type: TypeNotification;
  titre: string;
  message: string;
  lue: boolean;
  dateCreation: string;
}

export interface NombreNonLues {
  nombre: number;
}