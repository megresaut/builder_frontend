export interface Tenant {
  id: number;
  unit_id: number;
  property_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  rent_amount_cents: number | null;
  security_deposit_cents: number | null;
  lease_type: "fixed" | "month_to_month" | null;
  move_in_date: string | null;
  move_out_date: string | null;
  status: "active" | "former" | "pending";
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  last_edited_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TenantDocument {
  id: number;
  tenant_id: number;
  document_type: string;
  document_label: string | null;
  document_object_key: string;
  document_mime: string;
  uploaded_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantRequest {
  unit_id: number;
  property_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  rent_amount_cents?: number;
  security_deposit_cents?: number;
  lease_type?: string;
  move_in_date?: string;
  move_out_date?: string;
  status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface TenantVehicle {
  id: number;
  tenant_id: number;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  license_plate: string;
  license_state: string | null;
  vin: string | null;
  registration_exp_date: string | null;
  registration_object_key: string | null;
  registration_mime: string | null;
  has_parking_permit: boolean;
  parking_spot: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleRequest {
  tenant_id: number;
  make: string;
  model: string;
  year?: number;
  color?: string;
  license_plate: string;
  license_state?: string;
  vin?: string;
  registration_exp_date?: string;
  registration_object_key?: string;
  registration_mime?: string;
  has_parking_permit?: boolean;
  parking_spot?: string;
}

export interface UpdateVehicleRequest {
  id: number;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  license_plate?: string;
  license_state?: string;
  vin?: string;
  registration_exp_date?: string;
  has_parking_permit?: boolean;
  parking_spot?: string;
}

export interface UpdateTenantRequest {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  rent_amount_cents?: number;
  security_deposit_cents?: number;
  lease_type?: string;
  move_in_date?: string;
  move_out_date?: string;
  status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}
