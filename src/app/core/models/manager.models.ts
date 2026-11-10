export interface ManagerInfo {
  id: number;
  firstname: string;
  name: string;
  phone: string;
  email: string;
}

export interface ManagerInput {
  firstname: string;
  name: string;
  email: string;
  phone: string;
  /** Uniquement à la création — retire ce champ si ton back génère lui-même le mot de passe. */
  password?: string;
}
