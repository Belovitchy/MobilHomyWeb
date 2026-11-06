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
