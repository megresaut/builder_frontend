/**
 * FTO Submission Types and Mock API
 *
 * This module defines the canonical data structures for FTO submissions
 * and provides a mock API layer that can be easily replaced with real fetch calls.
 */

export interface HourLine {
    hour_index: number;
    date_of_work: string;
    hours_decimal: number;
    note?: string;
    emergency: boolean;
    no_charge: boolean;
    task_id?: number;
    property_id?: number;
  }
  
  export interface FtoSubmission {
    ID: number;
    FTOID: number;
    TaskID?: number;
    FieldTeamMemberID: number;
    DateOfWork: string;
    HoursDecimal: number;
    Description?: string;
    HoursJSON: HourLine[];
    MaterialsJSON: string; // base64-encoded JSON
    HasAttachments: boolean;
    Status: "submitted" | "pending_review" | "approved" | "rejected";
    ApprovedBy?: number;
    ApprovedAt?: string;
    CreatedAt: string;
    UpdatedAt: string;
  }
  
  export interface ExpenseLine {
    id?: string;
    date_of_work: string;
    vendor_name: string;
    note?: string;
    is_avm_expense: boolean;
    amount_cents: number;
  }
  
  /**
   * Mock API: Fetch submissions by FTO ID
   *
   * This function simulates the real endpoint:
   * GET /maintenance/submissions/by-fto?fto_id={number}
   *
   * Replace this with:
   * const response = await fetch(`/maintenance/submissions/by-fto?fto_id=${ftoId}`);
   * const data = await response.json();
   * return data;
   */
  export async function mockFetchSubmissionsByFto(
    ftoId: number
  ): Promise<FtoSubmission[]> {
    // Simulate async network request
    await new Promise((resolve) => setTimeout(resolve, 100));
  
    // Mock data - at least 1 submission with 1+ hour lines and 1+ expenses
    const mockExpenses: ExpenseLine[] = [
      {
        id: "1",
        date_of_work: "2025-01-20",
        vendor_name: "Elite HVAC",
        note: "HVAC maintenance supplies",
        is_avm_expense: false,
        amount_cents: 15000, // $150.00
      },
      {
        id: "2",
        date_of_work: "2025-01-20",
        vendor_name: "Home Depot",
        note: "Replacement parts",
        is_avm_expense: true,
        amount_cents: 8500, // $85.00
      },
    ];
  
    const mockExpensesEncoded = btoa(JSON.stringify(mockExpenses));
  
    return [
      {
        ID: 1,
        FTOID: ftoId,
        TaskID: 101,
        FieldTeamMemberID: 1,
        DateOfWork: "2025-01-20",
        HoursDecimal: 8.5,
        Description: "HVAC system inspection and maintenance",
        HoursJSON: [
          {
            hour_index: 0,
            date_of_work: "2025-01-20",
            hours_decimal: 3.5,
            note: "System inspection",
            emergency: false,
            no_charge: false,
            task_id: 101,
            property_id: 1,
          },
          {
            hour_index: 1,
            date_of_work: "2025-01-20",
            hours_decimal: 2.0,
            note: "Filter replacement",
            emergency: false,
            no_charge: false,
            task_id: 101,
            property_id: 1,
          },
          {
            hour_index: 2,
            date_of_work: "2025-01-20",
            hours_decimal: 3.0,
            note: "Calibration and testing",
            emergency: true,
            no_charge: false,
            task_id: 101,
            property_id: 1,
          },
        ],
        MaterialsJSON: mockExpensesEncoded,
        HasAttachments: false,
        Status: "submitted",
        CreatedAt: "2025-01-20T10:00:00Z",
        UpdatedAt: "2025-01-20T10:00:00Z",
      },
    ];
  }
  