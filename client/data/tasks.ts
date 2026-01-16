export interface Assignee {
  id: number;
  name: string;
  initials: string;
  email?: string;
  phone?: string;
  title?: string;
}

export interface Task {
  id: number;
  status: string;
  title: string;
  description?: string;
  property: string;
  property_id?: number;
  property_name?: string;
  property_address?: string;
  unit?: string;
  unit_id?: number;
  category?: string;
  due: string;
  updated: string;
  age: string;
  priority: string;
  requested_by?: number;
  assignees: Assignee[];
  collaborators?: Assignee[];
  attachments?: Array<{
    id: number;
    file_name: string;
    storage_path: string;
    file_type: string;
    file_size: number;
  }>;
}

export const MOCK_TASKS: Task[] = [
  {
    id: 1,
    status: "Completed",
    title: "Edgerton - Quote",
    property: "22 Indian Chase Dr",
    unit: "Unit 1A",
    due: "Oct 2, 2025",
    updated: "Oct 2, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      {
        id: 1,
        name: "John Doe",
        initials: "JD",
        email: "john.doe@company.com",
        phone: "(555) 123-4567",
        title: "Maintenance Manager",
      },
    ],
    collaborators: [
      {
        id: 2,
        name: "Jane Smith",
        initials: "JMS",
        email: "jane.smith@company.com",
        phone: "(555) 234-5678",
        title: "Property Manager",
      },
    ],
  },
  {
    id: 2,
    status: "In Progress",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 2B",
    due: "Sep 25, 2025",
    updated: "Sep 25, 2025",
    age: "6 Days",
    priority: "Low",
    assignees: [
      {
        id: 2,
        name: "Jane Smith",
        initials: "JMS",
        email: "jane.smith@company.com",
        phone: "(555) 234-5678",
        title: "Property Manager",
      },
    ],
    collaborators: [
      {
        id: 3,
        name: "Mike Johnson",
        initials: "MJ",
        email: "mike.johnson@company.com",
        phone: "(555) 345-6789",
        title: "Repair Technician",
      },
    ],
  },
  {
    id: 3,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 3C",
    due: "Sep 12, 2025",
    updated: "Sep 12, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      {
        id: 1,
        name: "John Doe",
        initials: "JD",
        email: "john.doe@company.com",
        phone: "(555) 123-4567",
        title: "Maintenance Manager",
      },
      {
        id: 2,
        name: "Jane Smith",
        initials: "JMS",
        email: "jane.smith@company.com",
        phone: "(555) 234-5678",
        title: "Property Manager",
      },
    ],
    collaborators: [
      {
        id: 3,
        name: "Mike Johnson",
        initials: "MJ",
        email: "mike.johnson@company.com",
        phone: "(555) 345-6789",
        title: "Repair Technician",
      },
    ],
  },
  {
    id: 4,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 1D",
    due: "Sep 6, 2025",
    updated: "Sep 6, 2025",
    age: "6 Days",
    priority: "High",
    assignees: [
      {
        id: 3,
        name: "Mike Johnson",
        initials: "MJ",
        email: "mike.johnson@company.com",
        phone: "(555) 345-6789",
        title: "Repair Technician",
      },
    ],
    collaborators: [
      {
        id: 1,
        name: "John Doe",
        initials: "JD",
        email: "john.doe@company.com",
        phone: "(555) 123-4567",
        title: "Maintenance Manager",
      },
    ],
  },
  {
    id: 5,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 2E",
    due: "Sep 5, 2025",
    updated: "Sep 5, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      {
        id: 2,
        name: "Jane Smith",
        initials: "JMS",
        email: "jane.smith@company.com",
        phone: "(555) 234-5678",
        title: "Property Manager",
      },
      {
        id: 3,
        name: "Mike Johnson",
        initials: "MJ",
        email: "mike.johnson@company.com",
        phone: "(555) 345-6789",
        title: "Repair Technician",
      },
    ],
  },
  {
    id: 6,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 3F",
    due: "Sep 4, 2025",
    updated: "Sep 4, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      {
        id: 1,
        name: "John Doe",
        initials: "JD",
        email: "john.doe@company.com",
        phone: "(555) 123-4567",
        title: "Maintenance Manager",
      },
    ],
    collaborators: [
      {
        id: 2,
        name: "Jane Smith",
        initials: "JMS",
        email: "jane.smith@company.com",
        phone: "(555) 234-5678",
        title: "Property Manager",
      },
    ],
  },
  {
    id: 7,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 1G",
    due: "Sep 3, 2025",
    updated: "Sep 3, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      {
        id: 3,
        name: "Mike Johnson",
        initials: "MJ",
        email: "mike.johnson@company.com",
        phone: "(555) 345-6789",
        title: "Repair Technician",
      },
      {
        id: 1,
        name: "John Doe",
        initials: "JD",
        email: "john.doe@company.com",
        phone: "(555) 123-4567",
        title: "Maintenance Manager",
      },
    ],
  },
  {
    id: 8,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 2H",
    due: "Sep 2, 2025",
    updated: "Sep 2, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      {
        id: 2,
        name: "Jane Smith",
        initials: "JMS",
        email: "jane.smith@company.com",
        phone: "(555) 234-5678",
        title: "Property Manager",
      },
    ],
    collaborators: [
      {
        id: 3,
        name: "Mike Johnson",
        initials: "MJ",
        email: "mike.johnson@company.com",
        phone: "(555) 345-6789",
        title: "Repair Technician",
      },
    ],
  },
  {
    id: 9,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 3I",
    due: "Sep 1, 2025",
    updated: "Sep 1, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      {
        id: 1,
        name: "John Doe",
        initials: "JD",
        email: "john.doe@company.com",
        phone: "(555) 123-4567",
        title: "Maintenance Manager",
      },
      {
        id: 2,
        name: "Jane Smith",
        initials: "JMS",
        email: "jane.smith@company.com",
        phone: "(555) 234-5678",
        title: "Property Manager",
      },
    ],
    collaborators: [
      {
        id: 3,
        name: "Mike Johnson",
        initials: "MJ",
        email: "mike.johnson@company.com",
        phone: "(555) 345-6789",
        title: "Repair Technician",
      },
    ],
  },
  {
    id: 10,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 1J",
    due: "Sep 1, 2025",
    updated: "Sep 1, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      {
        id: 3,
        name: "Mike Johnson",
        initials: "MJ",
        email: "mike.johnson@company.com",
        phone: "(555) 345-6789",
        title: "Repair Technician",
      },
    ],
    collaborators: [
      {
        id: 1,
        name: "John Doe",
        initials: "JD",
        email: "john.doe@company.com",
        phone: "(555) 123-4567",
        title: "Maintenance Manager",
      },
    ],
  },
];
