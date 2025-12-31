import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectField } from "../SelectField";
import { MultiSelectField } from "../MultiSelectField";
import { IdentitySelectField } from "../IdentitySelectField";
import React, { useState } from "react";

/**
 * Keyboard Navigation Test Suite
 *
 * Tests focus management and keyboard interactions for popover-based select fields.
 * Ensures that:
 * - Arrow keys move DOM focus to highlighted options
 * - Enter/Space selects highlighted option
 * - Escape closes dropdowns and restores focus to trigger
 * - Tab navigation works correctly
 * - Screen readers perceive correct ARIA roles
 */

describe("SelectField Keyboard Navigation", () => {
  const options = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry" },
  ];

  function SelectFieldWrapper() {
    const [value, setValue] = useState("");
    return (
      <SelectField
        label="Fruit"
        value={value}
        onChange={setValue}
        options={options}
        placeholder="Select a fruit"
      />
    );
  }

  it("should open dropdown on Enter key", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button", { name: /select a fruit/i });
    trigger.focus();

    await user.keyboard("{Enter}");

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
  });

  it("should open dropdown on Space key", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button", { name: /select a fruit/i });
    trigger.focus();

    await user.keyboard(" ");

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
  });

  it("should navigate options with ArrowDown key and move focus", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button", { name: /select a fruit/i });
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    // Press ArrowDown to move to first option
    await user.keyboard("{ArrowDown}");

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveFocus();

    // Press ArrowDown to move to second option
    await user.keyboard("{ArrowDown}");

    expect(options[1]).toHaveFocus();
  });

  it("should navigate options with ArrowUp key", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button", { name: /select a fruit/i });
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    // Navigate to second option
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");

    let options = screen.getAllByRole("option");
    expect(options[1]).toHaveFocus();

    // Press ArrowUp to move back
    await user.keyboard("{ArrowUp}");

    options = screen.getAllByRole("option");
    expect(options[0]).toHaveFocus();
  });

  it("should select option with Enter key", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button", { name: /select a fruit/i });
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    // Navigate to first option
    await user.keyboard("{ArrowDown}");

    // Select with Enter
    await user.keyboard("{Enter}");

    // Trigger should now show selected value
    expect(trigger).toHaveTextContent("Apple");
  });

  it("should close dropdown with Escape key", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button", { name: /select a fruit/i });
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    let listbox = screen.queryByRole("listbox");
    expect(listbox).toBeInTheDocument();

    // Close with Escape
    await user.keyboard("{Escape}");

    listbox = screen.queryByRole("listbox");
    expect(listbox).not.toBeInTheDocument();

    // Focus should return to trigger
    expect(trigger).toHaveFocus();
  });

  it("should have correct ARIA attributes", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button");

    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    // Open dropdown
    await user.keyboard("{Enter}");

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-label", "Fruit");

    const options = screen.getAllByRole("option");
    options.forEach((option, index) => {
      expect(option).toHaveAttribute("aria-selected");
    });
  });

  it("should prevent ArrowDown from going past last option", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button");
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    // Navigate to end
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

    const options = screen.getAllByRole("option");
    expect(options[2]).toHaveFocus();

    // Try to go further
    await user.keyboard("{ArrowDown}");

    // Should still be on last option
    expect(options[2]).toHaveFocus();
  });

  it("should prevent ArrowUp from going before first option", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button");
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    // First option should be highlighted
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveFocus();

    // Try to go up
    await user.keyboard("{ArrowUp}");

    // Should still be on first option
    expect(options[0]).toHaveFocus();
  });
});

describe("MultiSelectField Keyboard Navigation", () => {
  interface OptionWithInitials {
    id: string;
    label: string;
    initials?: string;
  }

  const options: OptionWithInitials[] = [
    { id: "alice", label: "Alice", initials: "A" },
    { id: "bob", label: "Bob", initials: "B" },
    { id: "charlie", label: "Charlie", initials: "C" },
  ];

  function MultiSelectFieldWrapper() {
    const [value, setValue] = useState<OptionWithInitials[]>([]);
    return (
      <MultiSelectField
        label="Team Members"
        value={value}
        onChange={setValue}
        options={options}
        placeholder="Select team members"
      />
    );
  }

  it("should open dropdown on Enter key", async () => {
    const user = userEvent.setup();
    render(<MultiSelectFieldWrapper />);

    const trigger = screen.getByRole("button", {
      name: /select team members/i,
    });
    trigger.focus();

    await user.keyboard("{Enter}");

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
  });

  it("should select multiple options", async () => {
    const user = userEvent.setup();
    render(<MultiSelectFieldWrapper />);

    const trigger = screen.getByRole("button");
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    // Select first option
    await user.keyboard("{ArrowDown}{Enter}");

    // Select second option
    await user.keyboard("{ArrowDown}{Enter}");

    // Check that both are selected
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("should have aria-multiselectable attribute", async () => {
    const user = userEvent.setup();
    render(<MultiSelectFieldWrapper />);

    const trigger = screen.getByRole("button");
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-multiselectable", "true");
  });

  it("should close with Escape key while keeping selections", async () => {
    const user = userEvent.setup();
    render(<MultiSelectFieldWrapper />);

    const trigger = screen.getByRole("button");
    trigger.focus();

    // Open and select
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}{Enter}");

    // Close with Escape
    await user.keyboard("{Escape}");

    // Selection should remain
    expect(screen.getByText("Alice")).toBeInTheDocument();

    // But listbox should be closed
    const listbox = screen.queryByRole("listbox");
    expect(listbox).not.toBeInTheDocument();
  });
});

describe("IdentitySelectField Keyboard Navigation", () => {
  interface IdentityOption {
    id: string;
    label: string;
    subtitle?: string;
    initials?: string;
    avatarColor?: string;
  }

  const options: IdentityOption[] = [
    {
      id: "vendor1",
      label: "Dolce Heating",
      subtitle: "heating@dolce.com",
      initials: "DH",
      avatarColor: "bg-blue-500",
    },
    {
      id: "vendor2",
      label: "Apex Plumbing",
      subtitle: "contact@apex.com",
      initials: "AP",
      avatarColor: "bg-green-500",
    },
  ];

  function IdentitySelectFieldWrapper() {
    const [value, setValue] = useState("");
    return (
      <IdentitySelectField
        label="Select Vendor"
        value={value}
        onChange={setValue}
        options={options}
        placeholder="Search vendors..."
      />
    );
  }

  it("should navigate with arrow keys and move focus", async () => {
    const user = userEvent.setup();
    render(<IdentitySelectFieldWrapper />);

    const trigger = screen.getByRole("button");
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    // Navigate to first option
    await user.keyboard("{ArrowDown}");

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveFocus();
  });

  it("should show correct ARIA attributes on options", async () => {
    const user = userEvent.setup();
    render(<IdentitySelectFieldWrapper />);

    const trigger = screen.getByRole("button");
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    const options = screen.getAllByRole("option");
    options.forEach((option) => {
      expect(option).toHaveAttribute("aria-selected");
    });
  });

  it("should close on Escape and restore focus to trigger", async () => {
    const user = userEvent.setup();
    render(<IdentitySelectFieldWrapper />);

    const trigger = screen.getByRole("button");
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    let listbox = screen.queryByRole("listbox");
    expect(listbox).toBeInTheDocument();

    // Close with Escape
    await user.keyboard("{Escape}");

    listbox = screen.queryByRole("listbox");
    expect(listbox).not.toBeInTheDocument();

    // Focus should return to trigger
    expect(trigger).toHaveFocus();
  });
});

describe("Nested Overlay Keyboard Navigation", () => {
  /**
   * Test that Escape key handling works correctly in nested overlays
   * Inner overlay (dropdown) closes first, then outer overlay (modal) can close
   */
  it("should close inner dropdown before outer overlay on Escape", async () => {
    const user = userEvent.setup();

    function NestedOverlay() {
      const [isDialogOpen, setIsDialogOpen] = useState(true);
      const [selectedValue, setSelectedValue] = useState("");

      const options = [
        { value: "opt1", label: "Option 1" },
        { value: "opt2", label: "Option 2" },
      ];

      return (
        <>
          {isDialogOpen && (
            <div role="dialog">
              <h1>Dialog</h1>
              <SelectField
                label="Choose"
                value={selectedValue}
                onChange={setSelectedValue}
                options={options}
              />
              <button onClick={() => setIsDialogOpen(false)}>Close</button>
            </div>
          )}
        </>
      );
    }

    render(<NestedOverlay />);

    const trigger = screen.getByRole("button", { name: /choose/i });
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    let listbox = screen.queryByRole("listbox");
    expect(listbox).toBeInTheDocument();

    // First Escape should close dropdown
    await user.keyboard("{Escape}");

    listbox = screen.queryByRole("listbox");
    expect(listbox).not.toBeInTheDocument();

    // Dialog should still be open
    let dialog = screen.queryByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });
});

describe("Focus Restoration", () => {
  const options = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
  ];

  function SelectFieldWrapper() {
    const [value, setValue] = useState("");
    return (
      <SelectField
        label="Fruit"
        value={value}
        onChange={setValue}
        options={options}
      />
    );
  }

  it("should restore focus to trigger after selection", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button");
    trigger.focus();

    // Open and select
    await user.keyboard("{Enter}{ArrowDown}{Enter}");

    // Focus should return to trigger
    expect(trigger).toHaveFocus();
  });

  it("should restore focus to trigger after Escape", async () => {
    const user = userEvent.setup();
    render(<SelectFieldWrapper />);

    const trigger = screen.getByRole("button");
    trigger.focus();

    // Open dropdown
    await user.keyboard("{Enter}");

    // Close with Escape
    await user.keyboard("{Escape}");

    // Focus should return to trigger
    expect(trigger).toHaveFocus();
  });
});
