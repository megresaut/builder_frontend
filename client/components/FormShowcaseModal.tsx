import React, { useState, useRef, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import PdfViewerModal from "@/components/PdfViewerModal";
import { usePdfViewer } from "@/hooks/usePdfViewer";
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
  AddressField,
  IdentitySelectField,
  FileUploadField,
  FieldRow,
  FieldRowItem,
  FormSection,
  type AddressValue,
  type IdentityOption,
} from "@/components/forms";
import { UploadedFile } from "@/components/ui/attachment-uploader";

interface FormShowcaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormShowcaseModal({
  open,
  onOpenChange,
}: FormShowcaseModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const pdfViewer = usePdfViewer();

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

  // Multi-select fields
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // Address field
  const [propertyAddress, setPropertyAddress] = useState<AddressValue>({
    street: "",
    city: "",
    state: "CT",
    zipCode: "",
  });

  // Identity select fields
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [primaryProperty, setPrimaryProperty] = useState("");

  // File uploads
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(true); // Phone is optional

  // Reset all state when modal closes
  useEffect(() => {
    if (!open) {
      // Text fields
      setVendorName("");
      setEmail("");
      setPhone("");

      // Select fields
      setStatus("");
      setCategory("");
      setPriority("");
      setDepartment("");

      // Number and currency
      setQuantity(0);
      setAmount(0);

      // Percent/Rate
      setTaxRate("");
      setMarkupPercent("");

      // Date fields
      setDueDate(null);
      setBillingDate("");

      // Time fields
      setAppointmentTime("");
      setMaintenanceTime("");

      // DateTime field
      setScheduledMaintenance("");

      // Textarea
      setNotes("");
      setIssueDescription("");

      // Combobox
      setSelectedVendor("");
      setSelectedProperty("");

      // Footer section fields
      setPaymentMethod("");
      setApprovalStatus("");

      // Multi-select fields
      setSelectedCategories([]);
      setSelectedDepartments([]);

      // Address field
      setPropertyAddress({
        street: "",
        city: "",
        state: "CT",
        zipCode: "",
      });

      // Identity select fields
      setSelectedVendors([]);
      setPrimaryProperty("");

      // File uploads
      setAttachments([]);

      // Validation states
      setErrors({});
      setIsEmailValid(false);
      setIsPhoneValid(true);
    }
  }, [open]);

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

      // Scroll to the first field with an error
      if (modalContentRef.current) {
        const firstErrorKey = Object.keys(newErrors)[0];
        const fieldId = firstErrorKey
          .replace(/([A-Z])/g, "-$1")
          .toLowerCase()
          .replace(/^-/, "");

        const errorElement = modalContentRef.current.querySelector(
          `#${fieldId}, [data-field-id="${fieldId}"]`,
        ) as HTMLElement | null;

        if (errorElement) {
          setTimeout(() => {
            errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 0);
        }
      }

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
      selectedCategories,
      selectedDepartments,
      propertyAddress,
      selectedVendors,
      primaryProperty,
      attachments,
    });

    // Close modal on success
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleViewFile = (file: UploadedFile) => {
    if (file.file) {
      const url = URL.createObjectURL(file.file);
      pdfViewer.openPdf(url, file.name);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Field Components Showcase"
      size="lg"
      onClose={handleClose}
      contentRef={modalContentRef}
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

        {/* MULTI-SELECT FIELDS SECTION */}
        <FormSection title="Multi-Select Fields" description="Select multiple options from dropdown">
          <FieldRow columns={2}>
            <FieldRowItem>
              <SelectField
                label="Categories"
                value={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="Select categories"
                options={[
                  { value: "hvac", label: "HVAC" },
                  { value: "plumbing", label: "Plumbing" },
                  { value: "electrical", label: "Electrical" },
                  { value: "roofing", label: "Roofing" },
                  { value: "landscaping", label: "Landscaping" },
                ]}
                multiple
              />
            </FieldRowItem>
            <FieldRowItem>
              <SelectFieldV2
                label="Departments"
                value={selectedDepartments}
                onChange={setSelectedDepartments}
                placeholder="Select departments"
                options={[
                  { value: "maintenance", label: "Maintenance" },
                  { value: "operations", label: "Operations" },
                  { value: "finance", label: "Finance" },
                  { value: "sales", label: "Sales" },
                  { value: "admin", label: "Administration" },
                ]}
                multiple
              />
            </FieldRowItem>
          </FieldRow>
        </FormSection>

        {/* ADDRESS FIELD SECTION */}
        <FormSection title="Address Information" description="Property location with normalized state and ZIP">
          <AddressField
            label="Property Address"
            value={propertyAddress}
            onChange={setPropertyAddress}
            description="Street, city, state, and ZIP code are required"
          />
        </FormSection>

        {/* IDENTITY SELECT SECTION */}
        <FormSection title="Entity Pickers" description="Select from vendors and properties with rich info">
          <IdentitySelectField
            label="Preferred Vendors"
            value={selectedVendors}
            onChange={setSelectedVendors}
            placeholder="Search for vendors..."
            multiple
            options={[
              {
                id: "v1",
                label: "Dolce Heating & Plumbing",
                subtitle: "heating@dolce.com",
                initials: "DH",
                avatarColor: "bg-blue-500",
                tags: ["HVAC", "Plumbing"],
              },
              {
                id: "v2",
                label: "ABC Electric Services",
                subtitle: "info@abcelectric.com",
                initials: "AE",
                avatarColor: "bg-purple-500",
                tags: ["Electrical"],
              },
              {
                id: "v3",
                label: "Premier Roofing Co",
                subtitle: "roofing@premier.com",
                initials: "PR",
                avatarColor: "bg-green-500",
                tags: ["Roofing", "Construction"],
              },
            ]}
            description="Select one or more vendors to prioritize"
          />

          <IdentitySelectField
            label="Primary Property"
            value={primaryProperty}
            onChange={setPrimaryProperty}
            placeholder="Search for property..."
            options={[
              {
                id: "p1",
                label: "Downtown Office - 123 Main St",
                subtitle: "New York, NY 10001",
                initials: "DO",
                badgeColor: "bg-blue-600",
                tags: ["Commercial", "Office"],
              },
              {
                id: "p2",
                label: "Warehouse - 456 Industrial Ave",
                subtitle: "New Jersey, NJ 07001",
                initials: "WH",
                badgeColor: "bg-gray-600",
                tags: ["Industrial", "Warehouse"],
              },
              {
                id: "p3",
                label: "Retail Store - 789 Shopping Center",
                subtitle: "Connecticut, CT 06001",
                initials: "RS",
                badgeColor: "bg-red-600",
                tags: ["Retail", "Commercial"],
              },
            ]}
            description="Choose the primary property for this record"
          />
        </FormSection>

        {/* FILE UPLOAD SECTION */}
        <FormSection title="Attachments" description="Upload supporting documents and files">
          <FileUploadField
            label="Document Upload"
            description="PDF, Word, Excel, and image files supported (max 10MB each)"
            files={attachments}
            onFilesAdded={(newFiles) => setAttachments([...attachments, ...newFiles])}
            onFileRemoved={(fileId) => setAttachments(attachments.filter((f) => f.id !== fileId))}
            onViewFile={handleViewFile}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            maxFiles={10}
            maxSize={10 * 1024 * 1024}
          />
        </FormSection>

        {/* PDF Viewer Modal */}
        <PdfViewerModal
          open={pdfViewer.isOpen}
          onOpenChange={pdfViewer.closePdf}
          url={pdfViewer.url}
          title={pdfViewer.title || "Document"}
        />

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
