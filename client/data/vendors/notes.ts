export interface Note {
  id: number;
  text: string;
  date: string;
  author: string;
}

export const MOCK_VENDOR_NOTES: Note[] = [
  {
    id: 1,
    text: "Southern Conn Gas #05-00011476-6574",
    date: "6/17/2024 10:32 AM",
    author: "Johan Gonazlez",
  },
  {
    id: 2,
    text: "Eversource #51124508037",
    date: "6/17/2024 10:31 AM",
    author: "Johan Gonazlez",
  },
  {
    id: 3,
    text: "Ashley Bae (Daughter): (626) 340-7616",
    date: "6/12/2024 2:31 PM",
    author: "Carteg Hughes",
  },
  {
    id: 4,
    text: "Called Optimum and got the address moved from connors lane to 1544 wazee street denver, co. 80202",
    date: "8/4/2021 10:47 AM",
    author: "Heather Seabrook",
  },
  {
    id: 5,
    text: "Optimum\nAcct#07808-628921-02\n203-293-4709\nPin: 2258",
    date: "3/16/2020 1:59 PM",
    author: "Mario Sciarretta",
  },
];
