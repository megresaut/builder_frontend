import React, { useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  TextField,
  TextAreaField,
  NumberField,
  CurrencyField,
  DateField,
  SelectFieldV2,
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

  // Date field
  const [dueDate, setDueDate] = useState<Date | null>(null);

  // Textarea
  const [notes, setNotes] = useState("");

  // Combobox
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");

  // Footer section fields
  const [paymentMethod, setPaymentMethod] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(true); // Phone is optional

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!vendorName) newErrors.vendorName = "Vendor name is required";
    if (!email) newErrors.email = "Email is required";
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
      dueDate,
      notes,
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
        <FormSection title="Text Fields" description="Basic text input examples">
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
                error={errors.email}
              />
            </FieldRowItem>
          </FieldRow>

          <PhoneNumberField
            label="Phone"
            placeholder="(123) 456-7890"
            value={phone}
            onChange={setPhone}
            description="Optional contact number"
          />
        </FormSection>

        {/* SELECT & COMBOBOX SECTION */}
        <FormSection title="Selects & Dropdowns" description="Single and searchable selects">
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
              <SelectFieldV2
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
            options={[
              { value: "v1", label: "Dolce Heating & Plumbing" },
              { value: "v2", label: "ABC Electric Services" },
              { value: "v3", label: "Premier Roofing Co" },
              { value: "v4", label: "SmartHome HVAC" },
            ]}
            description="Search and select from existing vendors"
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

        {/* NUMERIC FIELDS SECTION */}
        <FormSection title="Numeric Fields" description="Number and currency inputs">
          <FieldRow columns={2}>
            <FieldRowItem>
              <NumberField
                label="Quantity"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="0"
                step="1"
              />
            </FieldRowItem>
            <FieldRowItem>
              <CurrencyField
                label="Amount"
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                description="Currency field with automatic formatting"
              />
            </FieldRowItem>
          </FieldRow>
        </FormSection>

        {/* DATE FIELD SECTION */}
        <FormSection title="Date & Time" description="Date picker component">
          <DateField
            label="Due Date"
            required
            value={dueDate}
            onChange={setDueDate}
            error={errors.dueDate}
            description="Select when this task should be completed"
          />
        </FormSection>

        {/* TEXTAREA SECTION */}
        <FormSection title="Long-Form Text" description="Textarea with auto-grow">
          <TextAreaField
            label="Notes"
            placeholder="Enter any additional notes or comments..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            autoGrow
            description="This textarea automatically expands as you type"
          />
        </FormSection>

        {/* FOOTER SECTION - 2 COLUMN FIELDROW */}
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
      </div>
    </ModalTemplate>
  );
}

FormShowcaseModal.displayName = "FormShowcaseModal";
