import React, { useState } from "react";
import {
  ModalTemplate,
  ModalSubheader,
  ModalText,
  ModalField,
  ModalButtons,
  ModalSection,
} from "./ModalTemplate";
import { Input } from "./input";

/**
 * Example 1: Simple text-only modal
 */
export const SimpleTextModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <ModalTemplate
      open={open}
      onOpenChange={setOpen}
      title="Confirmation"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            console.log("Confirmed!");
            setOpen(false);
          }}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
        />
      }
    >
      <ModalText>
        Are you sure you want to proceed with this action? This cannot be undone.
      </ModalText>
    </ModalTemplate>
  );
};

/**
 * Example 2: Modal with single subheader and fields
 */
export const SingleSectionModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <ModalTemplate
      open={open}
      onOpenChange={setOpen}
      title="Add Property"
      size="md"
      footer={
        <ModalButtons
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            console.log("Saving property...");
            setOpen(false);
          }}
        />
      }
    >
      <ModalSubheader>Property Details</ModalSubheader>
      
      <ModalField label="Property Name" spacing="tight">
        <Input placeholder="Enter property name" />
      </ModalField>

      <ModalField label="Address" spacing="tight">
        <Input placeholder="Enter address" />
      </ModalField>

      <ModalField label="City">
        <Input placeholder="Enter city" />
      </ModalField>
    </ModalTemplate>
  );
};

/**
 * Example 3: Modal with multiple sections (matching Figma design)
 */
export const MultiSectionModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <ModalTemplate
      open={open}
      onOpenChange={setOpen}
      title="Edit Custom Fields"
      size="md"
      footer={
        <ModalButtons
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            console.log("Saving...");
            setOpen(false);
          }}
        />
      }
    >
      {/* First Section */}
      <ModalSubheader>Agreement</ModalSubheader>
      
      <ModalField label="Management Agreement" spacing="tight">
        <Input type="date" placeholder="m/d/yyyy" />
      </ModalField>

      <ModalField label="Inspection Frequency">
        <Input placeholder="Enter frequency" />
      </ModalField>

      {/* Second Section */}
      <ModalSection>
        <ModalSubheader>Vendor Agreement</ModalSubheader>
        
        <ModalField label="HVAC Start" spacing="tight">
          <Input type="date" placeholder="m/d/yyyy" />
        </ModalField>

        <ModalField label="HVAC End" spacing="tight">
          <Input type="date" placeholder="m/d/yyyy" />
        </ModalField>

        <ModalField label="Landscaping Start" spacing="tight">
          <Input type="date" placeholder="m/d/yyyy" />
        </ModalField>

        <ModalField label="Landscaping End" spacing="tight">
          <Input type="date" placeholder="m/d/yyyy" />
        </ModalField>

        <ModalField label="Pool Start" spacing="tight">
          <Input type="date" placeholder="m/d/yyyy" />
        </ModalField>

        <ModalField label="Pool End">
          <Input type="date" placeholder="m/d/yyyy" />
        </ModalField>
      </ModalSection>
    </ModalTemplate>
  );
};

/**
 * Example 4: Modal with text and fields combined
 */
export const MixedContentModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <ModalTemplate
      open={open}
      onOpenChange={setOpen}
      title="Inactivate Vendor"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            console.log("Vendor inactivated");
            setOpen(false);
          }}
          confirmLabel="Inactivate"
        />
      }
    >
      <ModalText>
        This will mark the vendor as inactive. You can reactivate them later if needed.
      </ModalText>

      <ModalSection>
        <ModalField label="Reason (optional)">
          <Input placeholder="Enter reason for inactivation" />
        </ModalField>
      </ModalSection>
    </ModalTemplate>
  );
};

/**
 * Example 5: Modal without footer (no buttons)
 */
export const NoFooterModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <ModalTemplate
      open={open}
      onOpenChange={setOpen}
      title="Information"
      size="sm"
    >
      <ModalText>
        This is an informational modal without action buttons. 
        Users can close it using the X button in the header.
      </ModalText>
    </ModalTemplate>
  );
};

/**
 * Example 6: Modal with custom footer (not using ModalButtons)
 */
export const CustomFooterModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <ModalTemplate
      open={open}
      onOpenChange={setOpen}
      title="Custom Actions"
      size="sm"
      footer={
        <>
          <button onClick={() => console.log("Custom action 1")}>Action 1</button>
          <button onClick={() => console.log("Custom action 2")}>Action 2</button>
          <button onClick={() => setOpen(false)}>Close</button>
        </>
      }
    >
      <ModalText>
        This modal has a custom footer with multiple action buttons.
      </ModalText>
    </ModalTemplate>
  );
};
