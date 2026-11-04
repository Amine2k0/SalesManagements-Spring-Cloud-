/** Opens the Sales page with a fresh slip, optionally pre-filled. */
export function slipLink(params: { client?: number; product?: number } = {}): string {
  const search = new URLSearchParams({ new: '1' })
  if (params.client) search.set('client', String(params.client))
  if (params.product) search.set('product', String(params.product))
  return `/sales?${search.toString()}`
}
