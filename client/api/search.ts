import { fetchJSON } from "./fetchJSON";

export interface PropertySearchResult {
  id: number;
  name: string;
  address_line1: string;
  city: string;
  state: string;
}

export interface OwnerSearchResult {
  id: number;
  name: string;
  email: string;
  property_id: number;
  property_name: string;
}

export interface VendorSearchResult {
  id: number;
  name: string;
  category: string;
  primary_email: string;
  phone: string;
}

export interface GlobalSearchResponse {
  properties: PropertySearchResult[];
  owners: OwnerSearchResult[];
  vendors: VendorSearchResult[];
}

export async function globalSearch(query: string): Promise<GlobalSearchResponse> {
  return fetchJSON(`/search?q=${encodeURIComponent(query)}`);
}
