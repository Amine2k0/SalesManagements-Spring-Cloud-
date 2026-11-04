import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './api'
import type { Client, ClientInput, Produit, ProduitInput, Vente, VenteInput } from './types'

export const keys = {
  produits: ['produits'] as const,
  clients: ['clients'] as const,
  ventes: ['ventes'] as const,
  ventesForClient: (id: number) => ['ventes', 'client', id] as const,
}

export function useProduits() {
  return useQuery({
    queryKey: keys.produits,
    queryFn: () => request<Produit[]>('products', '/api/produits'),
  })
}

export function useClients() {
  return useQuery({
    queryKey: keys.clients,
    queryFn: () => request<Client[]>('customers', '/api/clients'),
  })
}

export function useVentes() {
  return useQuery({
    queryKey: keys.ventes,
    queryFn: () => request<Vente[]>('sales', '/api/ventes'),
  })
}

export function useVentesForClient(id: number | null) {
  return useQuery({
    queryKey: keys.ventesForClient(id ?? -1),
    queryFn: () => request<Vente[]>('sales', `/api/ventes/client/${id}`),
    enabled: id !== null,
  })
}

export function useSaveProduit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: ProduitInput }) =>
      id === undefined
        ? request<Produit>('products', '/api/produits/add', { method: 'POST', body: input })
        : request<Produit>('products', `/api/produits/${id}`, { method: 'PUT', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.produits })
      queryClient.invalidateQueries({ queryKey: keys.ventes })
    },
  })
}

export function useDeleteProduit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => request<void>('products', `/api/produits/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.produits }),
  })
}

export function useSaveClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: ClientInput }) => {
      const body: ClientInput = { ...input, tel: input.tel.trim() }
      if (!body.password) delete body.password
      return id === undefined
        ? request<Client>('customers', '/api/clients/add', { method: 'POST', body })
        : request<Client>('customers', `/api/clients/${id}`, { method: 'PUT', body })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.clients })
      queryClient.invalidateQueries({ queryKey: keys.ventes })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => request<void>('customers', `/api/clients/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.clients }),
  })
}

export function useRecordVente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: VenteInput) => request<Vente>('sales', '/api/ventes/add', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.ventes }),
  })
}
