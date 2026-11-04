// Shapes returned by the gateway. Field names stay as the Spring entities define them.

export interface Produit {
  id: number
  nom: string
  marque: string
  prix: number
  qteStock: number
}

export interface Client {
  id: number
  nom: string
  prenom: string
  tel: string | null
  email: string
}

export interface Vente {
  id: number
  client: Client
  produit: Produit
  /** ISO date (yyyy-MM-dd); the sales service stores the day only. */
  date: string
  quantite: number
}

export type ProduitInput = Omit<Produit, 'id'>

export interface ClientInput {
  nom: string
  prenom: string
  tel: string
  email: string
  /** Required when creating; on update an empty value keeps the current one. */
  password?: string
}

export interface VenteInput {
  client: { id: number }
  produit: { id: number }
  quantite: number
  date?: string
}

/** The four areas, each answered by its own service behind the gateway. */
export type Area = 'auth' | 'products' | 'customers' | 'sales'
