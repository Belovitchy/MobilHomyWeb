/** Lien utile du propriétaire (extranet Booking, déclaration Siblu, calendrier iCal…). */
export interface OwnerLink {
  id: number;
  name: string;
  url: string;
}

export interface OwnerLinkInput {
  name: string;
  url: string;
}
