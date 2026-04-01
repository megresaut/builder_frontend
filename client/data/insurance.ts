import { fetchJSON } from "@/api/fetchJSON";

export async function createInsurancePolicy(req: {
  property_id: number;
  policy_type: string;
  policy_layer: string;
  carrier_name: string;
  policy_number: string;
  agent_name: string;
  agent_firm: string;
  agent_phone: string;
  agent_email: string;
  premium_cents: number | null;
  coverage_amount_cents: number | null;
  effective_date: string;
  expiration_date: string;
  avm_master_policy: boolean;
  policy_object_key: string;
  policy_mime: string;
  coi_object_key: string;
  coi_mime: string;
  notes: string;
}): Promise<{ id: number }> {
  return fetchJSON("/insurance/policies", { method: "POST", body: JSON.stringify(req) });
}

export async function createRentersInsurance(req: {
  unit_id: number;
  property_id: number;
  tenant_id: number | null;
  tenant_name: string;
  carrier_name: string;
  policy_number: string;
  effective_date: string;
  expiration_date: string;
  status: string;
  document_object_key: string;
  document_mime: string;
  coi_object_key: string;
  coi_mime: string;
  notes: string;
}): Promise<{ id: number }> {
  return fetchJSON("/insurance/renters", { method: "POST", body: JSON.stringify(req) });
}
