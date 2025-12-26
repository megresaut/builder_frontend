interface Vendor {
  id: number;
  name: string;
  category: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  servicesProvided?: string;
}

export const MOCK_VENDOR_DETAIL: Vendor[] = [
  {
    id: 1,
    name: "Dolce Heating & Plumbing",
    category: "Uncategorized",
    email: "staff@avappraisalmgmt.com",
    phone: undefined,
    address: undefined,
    website: undefined,
    servicesProvided: undefined,
  },
];
