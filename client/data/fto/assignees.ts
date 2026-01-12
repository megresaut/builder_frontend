import { MultiSelectOption } from "@/components/forms";

export interface AssigneeOption extends MultiSelectOption {
  email?: string;
  phone?: string;
  title?: string;
}

export const AVAILABLE_ASSIGNEES: AssigneeOption[] = [
  { id: "1", label: "David Harris", initials: "DH", email: "david.harris@company.com", phone: "(555) 111-2222", title: "Field Technician" },
  { id: "2", label: "Sarah Johnson", initials: "SJ", email: "sarah.johnson@company.com", phone: "(555) 222-3333", title: "Supervisor" },
  { id: "3", label: "Michael Chen", initials: "MC", email: "michael.chen@company.com", phone: "(555) 333-4444", title: "Lead Technician" },
  { id: "4", label: "Emily Rodriguez", initials: "ER", email: "emily.rodriguez@company.com", phone: "(555) 444-5555", title: "Field Technician" },
  { id: "5", label: "James Wilson", initials: "JW", email: "james.wilson@company.com", phone: "(555) 555-6666", title: "Equipment Manager" },
];
