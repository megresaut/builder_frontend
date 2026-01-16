import type { Task } from "./tasks";

/**
 * API response shape for GET /maintenance/tasks
 * This mirrors the real backend API structure
 */
export interface ApiTask {
  id: number;
  property_id: number;
  name: string;
  description?: string;
  status: string;
  priority: string;
  property_name: string;
  property_address: string;
  category?: string;
  due_date: string; // ISO timestamp
  date_requested: string; // ISO timestamp
  last_updated: string; // ISO timestamp
  requested_by: number;
  assignees: Array<{
    id: number;
    name: string;
    email: string;
    title?: string;
    phone?: string;
    initials?: string;
  }>;
  collaborators: Array<{
    id: number;
    name: string;
    email: string;
    title?: string;
    phone?: string;
    initials?: string;
  }>;
  is_visible_to_client: boolean;
  is_editable_by_client: boolean;
  tags: string[];
  closed_by: number | null;
  closed_at: string | null;
  reopened_at: string | null;
  parent_task_id: number | null;
  is_template: boolean;
  unit_id: number | null;
  unit_name: string | null;
}

/**
 * Mock API function that simulates GET /maintenance/tasks
 * Returns data shaped exactly like the real API would
 * Can be easily replaced with a real fetch call
 */
export async function mockFetchTasks(): Promise<ApiTask[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 0));

  const mockApiData: ApiTask[] = [
    {
      id: 1,
      property_id: 1,
      name: "Edgerton - Quote",
      description: "Get quote for door repair",
      status: "Completed",
      priority: "Normal",
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr",
      category: "Maintenance",
      due_date: "2025-10-02",
      date_requested: "2025-09-20",
      last_updated: "2025-10-02",
      requested_by: 1,
      assignees: [
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@company.com",
          phone: "(555) 123-4567",
          title: "Maintenance Manager",
          initials: "JD",
        },
      ],
      collaborators: [
        {
          id: 2,
          name: "Jane Smith",
          email: "jane.smith@company.com",
          phone: "(555) 234-5678",
          title: "Property Manager",
          initials: "JMS",
        },
      ],
      is_visible_to_client: true,
      is_editable_by_client: false,
      tags: ["urgent", "quote"],
      closed_by: 1,
      closed_at: "2025-10-02",
      reopened_at: null,
      parent_task_id: null,
      is_template: false,
      unit_id: 1,
      unit_name: "Unit 1A",
    },
    {
      id: 2,
      property_id: 1,
      name: "Doors Need To Be Repaired",
      description: "Repair doors in unit 2B",
      status: "In Progress",
      priority: "Low",
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr",
      category: "Repairs",
      due_date: "2025-09-25",
      date_requested: "2025-09-18",
      last_updated: "2025-09-25",
      requested_by: 2,
      assignees: [
        {
          id: 2,
          name: "Jane Smith",
          email: "jane.smith@company.com",
          phone: "(555) 234-5678",
          title: "Property Manager",
          initials: "JMS",
        },
      ],
      collaborators: [
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike.johnson@company.com",
          phone: "(555) 345-6789",
          title: "Repair Technician",
          initials: "MJ",
        },
      ],
      is_visible_to_client: true,
      is_editable_by_client: true,
      tags: ["repairs"],
      closed_by: null,
      closed_at: null,
      reopened_at: null,
      parent_task_id: null,
      is_template: false,
      unit_id: 2,
      unit_name: "Unit 2B",
    },
    {
      id: 3,
      property_id: 1,
      name: "Doors Need To Be Repaired",
      description: "Repair doors in unit 3C",
      status: "Completed",
      priority: "Normal",
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr",
      category: "Repairs",
      due_date: "2025-09-12",
      date_requested: "2025-09-05",
      last_updated: "2025-09-12",
      requested_by: 1,
      assignees: [
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@company.com",
          phone: "(555) 123-4567",
          title: "Maintenance Manager",
          initials: "JD",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane.smith@company.com",
          phone: "(555) 234-5678",
          title: "Property Manager",
          initials: "JMS",
        },
      ],
      collaborators: [
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike.johnson@company.com",
          phone: "(555) 345-6789",
          title: "Repair Technician",
          initials: "MJ",
        },
      ],
      is_visible_to_client: false,
      is_editable_by_client: false,
      tags: [],
      closed_by: 1,
      closed_at: "2025-09-12",
      reopened_at: null,
      parent_task_id: null,
      is_template: false,
      unit_id: 3,
      unit_name: "Unit 3C",
    },
    {
      id: 4,
      property_id: 1,
      name: "Doors Need To Be Repaired",
      description: "Repair doors in unit 1D",
      status: "Completed",
      priority: "High",
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr",
      category: "Repairs",
      due_date: "2025-09-06",
      date_requested: "2025-08-30",
      last_updated: "2025-09-06",
      requested_by: 3,
      assignees: [
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike.johnson@company.com",
          phone: "(555) 345-6789",
          title: "Repair Technician",
          initials: "MJ",
        },
      ],
      collaborators: [
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@company.com",
          phone: "(555) 123-4567",
          title: "Maintenance Manager",
          initials: "JD",
        },
      ],
      is_visible_to_client: true,
      is_editable_by_client: false,
      tags: ["urgent"],
      closed_by: 3,
      closed_at: "2025-09-06",
      reopened_at: null,
      parent_task_id: null,
      is_template: false,
      unit_id: 4,
      unit_name: "Unit 1D",
    },
    {
      id: 5,
      property_id: 1,
      name: "Doors Need To Be Repaired",
      description: "Repair doors in unit 2E",
      status: "Completed",
      priority: "Normal",
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr",
      category: "Repairs",
      due_date: "2025-09-05",
      date_requested: "2025-08-29",
      last_updated: "2025-09-05",
      requested_by: 2,
      assignees: [
        {
          id: 2,
          name: "Jane Smith",
          email: "jane.smith@company.com",
          phone: "(555) 234-5678",
          title: "Property Manager",
          initials: "JMS",
        },
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike.johnson@company.com",
          phone: "(555) 345-6789",
          title: "Repair Technician",
          initials: "MJ",
        },
      ],
      collaborators: [],
      is_visible_to_client: false,
      is_editable_by_client: false,
      tags: [],
      closed_by: 2,
      closed_at: "2025-09-05",
      reopened_at: null,
      parent_task_id: null,
      is_template: false,
      unit_id: 5,
      unit_name: "Unit 2E",
    },
    {
      id: 6,
      property_id: 1,
      name: "Doors Need To Be Repaired",
      description: "Repair doors in unit 3F",
      status: "Completed",
      priority: "Normal",
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr",
      category: "Repairs",
      due_date: "2025-09-04",
      date_requested: "2025-08-28",
      last_updated: "2025-09-04",
      requested_by: 1,
      assignees: [
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@company.com",
          phone: "(555) 123-4567",
          title: "Maintenance Manager",
          initials: "JD",
        },
      ],
      collaborators: [
        {
          id: 2,
          name: "Jane Smith",
          email: "jane.smith@company.com",
          phone: "(555) 234-5678",
          title: "Property Manager",
          initials: "JMS",
        },
      ],
      is_visible_to_client: true,
      is_editable_by_client: false,
      tags: [],
      closed_by: 1,
      closed_at: "2025-09-04",
      reopened_at: null,
      parent_task_id: null,
      is_template: false,
      unit_id: 6,
      unit_name: "Unit 3F",
    },
    {
      id: 7,
      property_id: 1,
      name: "Doors Need To Be Repaired",
      description: "Repair doors in unit 1G",
      status: "Completed",
      priority: "Normal",
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr",
      category: "Repairs",
      due_date: "2025-09-03",
      date_requested: "2025-08-27",
      last_updated: "2025-09-03",
      requested_by: 3,
      assignees: [
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike.johnson@company.com",
          phone: "(555) 345-6789",
          title: "Repair Technician",
          initials: "MJ",
        },
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@company.com",
          phone: "(555) 123-4567",
          title: "Maintenance Manager",
          initials: "JD",
        },
      ],
      collaborators: [],
      is_visible_to_client: false,
      is_editable_by_client: false,
      tags: [],
      closed_by: 3,
      closed_at: "2025-09-03",
      reopened_at: null,
      parent_task_id: null,
      is_template: false,
      unit_id: 7,
      unit_name: "Unit 1G",
    },
    {
      id: 8,
      property_id: 1,
      name: "Doors Need To Be Repaired",
      description: "Repair doors in unit 2H",
      status: "Completed",
      priority: "Normal",
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr",
      category: "Repairs",
      due_date: "2025-09-02",
      date_requested: "2025-08-26",
      last_updated: "2025-09-02",
      requested_by: 2,
      assignees: [
        {
          id: 2,
          name: "Jane Smith",
          email: "jane.smith@company.com",
          phone: "(555) 234-5678",
          title: "Property Manager",
          initials: "JMS",
        },
      ],
      collaborators: [
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike.johnson@company.com",
          phone: "(555) 345-6789",
          title: "Repair Technician",
          initials: "MJ",
        },
      ],
      is_visible_to_client: true,
      is_editable_by_client: true,
      tags: [],
      closed_by: 2,
      closed_at: "2025-09-02",
      reopened_at: null,
      parent_task_id: null,
      is_template: false,
      unit_id: 8,
      unit_name: "Unit 2H",
    },
    {
      id: 9,
      property_id: 1,
      name: "Doors Need To Be Repaired",
      description: "Repair doors in unit 3I",
      status: "Completed",
      priority: "Normal",
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr",
      category: "Repairs",
      due_date: "2025-09-01",
      date_requested: "2025-08-25",
      last_updated: "2025-09-01",
      requested_by: 1,
      assignees: [
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@company.com",
          phone: "(555) 123-4567",
          title: "Maintenance Manager",
          initials: "JD",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane.smith@company.com",
          phone: "(555) 234-5678",
          title: "Property Manager",
          initials: "JMS",
        },
      ],
      collaborators: [
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike.johnson@company.com",
          phone: "(555) 345-6789",
          title: "Repair Technician",
          initials: "MJ",
        },
      ],
      is_visible_to_client: false,
      is_editable_by_client: false,
      tags: [],
      closed_by: 1,
      closed_at: "2025-09-01",
      reopened_at: null,
      parent_task_id: null,
      is_template: false,
      unit_id: 9,
      unit_name: "Unit 3I",
    },
    {
      id: 10,
      property_id: 1,
      name: "Doors Need To Be Repaired",
      description: "Repair doors in unit 1J",
      status: "Completed",
      priority: "Normal",
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr",
      category: "Repairs",
      due_date: "2025-09-01",
      date_requested: "2025-08-25",
      last_updated: "2025-09-01",
      requested_by: 3,
      assignees: [
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike.johnson@company.com",
          phone: "(555) 345-6789",
          title: "Repair Technician",
          initials: "MJ",
        },
      ],
      collaborators: [
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@company.com",
          phone: "(555) 123-4567",
          title: "Maintenance Manager",
          initials: "JD",
        },
      ],
      is_visible_to_client: true,
      is_editable_by_client: false,
      tags: [],
      closed_by: 3,
      closed_at: "2025-09-01",
      reopened_at: null,
      parent_task_id: null,
      is_template: false,
      unit_id: 10,
      unit_name: "Unit 1J",
    },
  ];

  return mockApiData;
}

/**
 * Transform API response to UI Task format
 * Maps API field names to UI field names
 */
export function transformApiTaskToUiTask(apiTask: ApiTask): Task {
  // Ensure all assignees and collaborators have initials
  const ensureInitials = (person: any) => ({
    ...person,
    initials:
      person.initials ||
      person.name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase() ||
      "?",
  });

  const assignees = apiTask.assignees.map(ensureInitials);
  const collaborators = apiTask.collaborators.map(ensureInitials);

  // Calculate age from last_updated date
  const getAge = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 Day";
    return `${diffDays} Days`;
  };

  return {
    id: apiTask.id,
    title: apiTask.name,
    property: apiTask.property_name,
    unit: apiTask.unit_name || undefined,
    status: apiTask.status,
    priority: apiTask.priority,
    due: apiTask.due_date,
    updated: apiTask.last_updated,
    age: getAge(apiTask.last_updated),
    assignees,
    collaborators: collaborators.length > 0 ? collaborators : undefined,
  };
}
