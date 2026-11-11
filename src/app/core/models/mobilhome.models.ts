export interface MobilHome {
  id: number;
  name: string;
  description: string;
  location: string;
  capacity: number;
  address: string;
  postalCode: string;
  price: number;
  images: string[]; // chemins relatifs ex: "/images/ocene-1.jpg"
  reservations?: { startDate: string; endDate: string }[]; // VALIDATED uniquement
}

export interface OwnerMobilHome {
  id: number;
  title: string;
  description: string | null;
  /** Nom du camping (ex : « La Réserve ») */
  location: string | null;
  address: string;
  postal_code: string;
  department: string;
  capacity: number;
  price: number;
  ical_link: string | null;
  manager_id: number | null;
  manager_name: string | null;
  images: string[];
}

export interface OwnerMobilHomeInput {
  title: string;
  description: string | null;
  location: string;
  manager_id: number | null;
  address: string;
  postal_code: string;
  department: string;
  capacity: number;
  price: number;
  images: string[];
}
