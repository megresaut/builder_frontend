export interface Assignee {
  id: number;
  name: string;
  initials: string;
}

export interface Task {
  id: number;
  status: string;
  title: string;
  property: string;
  unit?: string;
  due: string;
  updated: string;
  age: string;
  priority: string;
  assignees: Assignee[];
  collaborators?: Assignee[];
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
    assignees: [{ id: 1, name: "John Doe", initials: "JD" }],
    collaborators: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
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
    assignees: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
    collaborators: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
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
      { id: 1, name: "John Doe", initials: "JD" },
      { id: 2, name: "Jane Smith", initials: "JMS" },
    ],
    collaborators: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
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
    assignees: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
    collaborators: [{ id: 1, name: "John Doe", initials: "JD" }],
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
      { id: 2, name: "Jane Smith", initials: "JMS" },
      { id: 3, name: "Mike Johnson", initials: "MJ" },
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
    assignees: [{ id: 1, name: "John Doe", initials: "JD" }],
    collaborators: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
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
      { id: 3, name: "Mike Johnson", initials: "MJ" },
      { id: 1, name: "John Doe", initials: "JD" },
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
    assignees: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
    collaborators: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
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
      { id: 1, name: "John Doe", initials: "JD" },
      { id: 2, name: "Jane Smith", initials: "JMS" },
    ],
    collaborators: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
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
    assignees: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
    collaborators: [{ id: 1, name: "John Doe", initials: "JD" }],
  },
];
