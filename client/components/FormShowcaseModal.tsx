import React, { useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  TextField,
  TextAreaField,
  NumberField,
  CurrencyField,
  DateField,
  TimeField,
  DateTimeField,
  PercentField,
  SelectFieldV2,
  SelectField,
  ComboboxField,
  EmailField,
  PhoneNumberField,
  FieldRow,
  FieldRowItem,
  FormSection,
} from "@/components/forms";

interface FormShowcaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormShowcaseModal({
  open,
  onOpenChange,
}: FormShowcaseModalProps) {
  // Text fields
  const [vendorName, setVendorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Select fields
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [department, setDepartment] = useState("");

  // Number and currency
  const [quantity, setQuantity] = useState(0);
  const [amount, setAmount] = useState(0);

  // Percent/Rate
  const [taxRate, setTaxRate] = useState("");
  const [markupPercent, setMarkupPercent] = useState("");

  // Date fields
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [billingDate, setBillingDate] = useState("");

  // Time fields
  const [appointmentTime, setAppointmentTime] = useState("");
  const [maintenanceTime, setMaintenanceTime] = useState("");

  // DateTime field
  const [scheduledMaintenance, setScheduledMaintenance] = useState("");

  // Textarea
  const [notes, setNotes] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  // Combobox
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");

  // Footer section fields
  const [paymentMethod, setPaymentMethod] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(true); // Phone is optional

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!vendorName) newErrors.vendorName = "Vendor name is required";
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!isEmailValid) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!status) newErrors.status = "Status is required";
    if (!dueDate) newErrors.dueDate = "Due date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log({
      vendorName,
      email,
      phone,
      status,
      category,
      priority,
      department,
      quantity,
      amount,
      taxRate,
      markupPercent,
      dueDate,
      billingDate,
      appointmentTime,
      maintenanceTime,
      scheduledMaintenance,
      notes,
      issueDescription,
      selectedVendor,
      selectedProperty,
      paymentMethod,
      approvalStatus,
    });

    // Close modal on success
    onOpenChange(false);
  };

  const handleClose = () => {
    setErrors({});
    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Field Components Showcase"
      size="lg"
      onClose={handleClose}
      footer={
        <ModalButtons
          onCancel={handleClose}
          onConfirm={handleSubmit}
          cancelLabel="Close"
          confirmLabel="Submit"
        />
      }
    >
      <div className="space-y-6">
        {/* TEXT FIELDS SECTION */}
        <FormSection title="Text & Contact Fields" description="Basic text, email, and phone inputs">
          <FieldRow columns={2}>
            <FieldRowItem>
              <TextField
                label="Vendor Name"
                required
                placeholder="Enter vendor name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                error={errors.vendorName}
                description="The official name of the vendor"
              />
            </FieldRowItem>
            <FieldRowItem>
              <EmailField
                label="Email"
                required
                placeholder="vendor@example.com"
                value={email}
                onChange={setEmail}
                onValidationChange={setIsEmailValid}
                error={errors.email}
                description="Valid email format required"
              />
            </FieldRowItem>
          </FieldRow>

          <PhoneNumberField
            label="Phone"
            placeholder="+1 (123) 456-7890"
            value={phone}
            onChange={setPhone}
            onValidationChange={setIsPhoneValid}
            description="Optional. Accepts country codes or standard formats"
          />
        </FormSection>

        {/* SELECT & COMBOBOX SECTION */}
        <FormSection title="Selects & Dropdowns" description="Single select with keyboard navigation and searchable comboboxes">
          <FieldRow columns={2}>
            <FieldRowItem>
              <SelectFieldV2
                label="Status"
                required
                value={status}
                onChange={setStatus}
                error={errors.status}
                placeholder="Select a status"
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "pending", label: "Pending" },
                ]}
                description="Use arrows/Enter to select, type to search"
              />
            </FieldRowItem>
            <FieldRowItem>
              <SelectFieldV2
                label="Category"
                value={category}
                onChange={setCategory}
                placeholder="Select a category"
                options={[
                  { value: "hvac", label: "HVAC" },
                  { value: "plumbing", label: "Plumbing" },
                  { value: "electrical", label: "Electrical" },
                  { value: "roofing", label: "Roofing" },
                ]}
              />
            </FieldRowItem>
          </FieldRow>

          <FieldRow columns={2}>
            <FieldRowItem>
              <SelectField
                label="Priority"
                value={priority}
                onChange={setPriority}
                placeholder="Select a priority"
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
                description="SelectField with keyboard navigation"
              />
            </FieldRowItem>
            <FieldRowItem>
              <SelectFieldV2
                label="Department"
                value={department}
                onChange={setDepartment}
                placeholder="Select a department"
                options={[
                  { value: "maintenance", label: "Maintenance" },
                  { value: "operations", label: "Operations" },
                  { value: "finance", label: "Finance" },
                  { value: "sales", label: "Sales" },
                ]}
              />
            </FieldRowItem>
          </FieldRow>

          <ComboboxField
            label="Link to Vendor"
            value={selectedVendor}
            onChange={setSelectedVendor}
            placeholder="Search for a vendor..."
            searchPlaceholder="Type to search..."
            creatable
            onCreateNew={handleCreateVendor}
            options={[
              { value: "v1", label: "Dolce Heating & Plumbing" },
              { value: "v2", label: "ABC Electric Services" },
              { value: "v3", label: "Premier Roofing Co" },
              { value: "v4", label: "SmartHome HVAC" },
            ]}
            description="Search vendors or create new by typing and pressing Enter"
          />

          <ComboboxField
            label="Link to Property"
            value={selectedProperty}
            onChange={setSelectedProperty}
            placeholder="Search for a property..."
            searchPlaceholder="Type to search..."
            options={[
              { value: "p1", label: "Downtown Office - 123 Main St" },
              { value: "p2", label: "Warehouse - 456 Industrial Ave" },
              { value: "p3", label: "Retail Store - 789 Shopping Center" },
              { value: "p4", label: "Corporate Campus - 321 Executive Blvd" },
            ]}
            description="Search and select from existing properties"
          />
        </FormSection>

        {/* NUMERIC & PERCENT FIELDS SECTION */}
        <FormSection title="Numeric Fields" description="Number, currency, and percent inputs">
          <FieldRow columns={3}>
            <FieldRowItem>
              <NumberField
                label="Quantity"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="0"
                step="1"
                description="Number field with step increment"
              />
            </FieldRowItem>
            <FieldRowItem>
              <CurrencyField
                label="Amount"
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                description="Auto-formats on blur"
              />
            </FieldRowItem>
            <FieldRowItem>
              <PercentField
                label="Tax Rate"
                value={taxRate}
                onChange={setTaxRate}
                placeholder="5.25"
                min={0}
                max={100}
                step={0.01}
                description="Type 5 for 5%"
              />
            </FieldRowItem>
          </FieldRow>

          <FieldRow columns={2}>
            <FieldRowItem>
              <PercentField
                label="Markup %"
                value={markupPercent}
                onChange={setMarkupPercent}
                placeholder="25"
                min={-50}
                max={200}
                allowNegative
                description="Supports negative values"
              />
            </FieldRowItem>
          </FieldRow>
        </FormSection>

        {/* DATE & TIME FIELDS SECTION */}
        <FormSection title="Date & Time Fields" description="Date picker, time input, and combined datetime">
          <FieldRow columns={2}>
            <FieldRowItem>
              <DateField
                label="Due Date"
                required
                value={dueDate}
                onChange={setDueDate}
                error={errors.dueDate}
                returnFormat="Date"
                description="Returns JavaScript Date object"
              />
            </FieldRowItem>
            <FieldRowItem>
              <DateField
                label="Billing Date"
                value={billingDate}
                onChange={setBillingDate}
                returnFormat="ISO"
                description="Returns ISO string (YYYY-MM-DD)"
              />
            </FieldRowItem>
          </FieldRow>

          <FieldRow columns={2}>
            <FieldRowItem>
              <TimeField
                label="Appointment Time"
                value={appointmentTime}
                onChange={setAppointmentTime}
                placeholder="14:30"
                min="09:00"
                max="17:30"
                description="Operating hours: 9 AM - 5:30 PM"
              />
            </FieldRowItem>
            <FieldRowItem>
              <TimeField
                label="Maintenance Time"
                value={maintenanceTime}
                onChange={setMaintenanceTime}
                placeholder="HH:MM"
                description="Any time (24-hour format)"
              />
            </FieldRowItem>
          </FieldRow>

          <DateTimeField
            label="Scheduled Maintenance"
            value={scheduledMaintenance}
            onChange={setScheduledMaintenance}
            minDate="2024-01-01"
            maxDate="2024-12-31"
            minTime="08:00"
            maxTime="18:00"
            description="Stored as ISO 8601 (YYYY-MM-DDTHH:MM)"
          />
        </FormSection>

        {/* TEXTAREA SECTION WITH CHARACTER COUNT */}
        <FormSection title="Long-Form Text" description="Textarea with auto-grow and optional character count">
          <TextAreaField
            label="Notes"
            placeholder="Enter any additional notes or comments..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            autoGrow
            showCharCount
            maxLength={500}
            description="Auto-expands as you type. Character count shown."
          />

          <TextAreaField
            label="Issue Description"
            placeholder="Describe the issue in detail..."
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            autoGrow
            showCharCount
            maxLength={1000}
            description="Maximum 1000 characters. Count turns red at 90%."
          />

          <TextAreaField
            label="Internal Comments"
            placeholder="Only visible to staff..."
            value=""
            onChange={() => {}}
            autoGrow
            description="Textarea without character count"
          />
        </FormSection>

        {/* FOOTER SECTION - 2 COLUMN FIELDROW */}
        <FormSection title="Additional Options" description="Payment and approval settings">
          <FieldRow columns={2}>
            <FieldRowItem>
              <SelectFieldV2
                label="Payment Method"
                value={paymentMethod}
                onChange={setPaymentMethod}
                placeholder="Select payment method"
                options={[
                  { value: "check", label: "Check" },
                  { value: "ach", label: "ACH Transfer" },
                  { value: "credit_card", label: "Credit Card" },
                  { value: "wire", label: "Wire Transfer" },
                ]}
              />
            </FieldRowItem>
            <FieldRowItem>
              <SelectFieldV2
                label="Approval Status"
                value={approvalStatus}
                onChange={setApprovalStatus}
                placeholder="Select approval status"
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "on_hold", label: "On Hold" },
                ]}
              />
            </FieldRowItem>
          </FieldRow>
        </FormSection>
      </div>
    </ModalTemplate>
  );
}

FormShowcaseModal.displayName = "FormShowcaseModal";
