/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import EmailChipsInput from "../EmailChipsInput";

// Wraps the controlled component the way both invoice-email modals use it:
// parent owns the comma-separated string, EmailChipsInput only renders it.
function Controlled({
  initial = "",
  onEnterWithNoDraft,
}: {
  initial?: string;
  onEnterWithNoDraft?: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <EmailChipsInput
      value={value}
      onChange={setValue}
      onEnterWithNoDraft={onEnterWithNoDraft}
      placeholder="client@example.com"
    />
  );
}

// Placeholder only renders when there are no chips yet (matches Gmail), so
// the draft input has to be found by role rather than by placeholder text.
function getDraftInput(): HTMLInputElement {
  return screen.getByRole("textbox") as HTMLInputElement;
}

describe("EmailChipsInput", () => {
  it("turns typed text into a chip on Enter and clears the draft", () => {
    render(<Controlled />);
    const input = getDraftInput();
    fireEvent.change(input, { target: { value: "leslie@example.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("leslie@example.com")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("also commits a chip on comma", () => {
    render(<Controlled />);
    const input = getDraftInput();
    fireEvent.change(input, { target: { value: "curt@example.com" } });
    fireEvent.keyDown(input, { key: "," });
    expect(screen.getByText("curt@example.com")).toBeInTheDocument();
  });

  it("starts pre-populated from an existing comma-separated value (autofill)", () => {
    render(<Controlled initial="a@example.com, b@example.com" />);
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
    expect(screen.getByText("b@example.com")).toBeInTheDocument();
  });

  it("removes the last chip on Backspace when the draft is empty", () => {
    render(<Controlled initial="a@example.com, b@example.com" />);
    const input = getDraftInput();
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(screen.queryByText("b@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
  });

  it("removes a specific chip via its remove button", () => {
    render(<Controlled initial="a@example.com, b@example.com" />);
    fireEvent.click(screen.getByLabelText("Remove a@example.com"));
    expect(screen.queryByText("a@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("b@example.com")).toBeInTheDocument();
  });

  it("splits a pasted comma-separated list into multiple chips", () => {
    render(<Controlled />);
    const input = getDraftInput();
    const clipboardData = { getData: () => "a@example.com, b@example.com" };
    fireEvent.paste(input, { clipboardData });
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
    expect(screen.getByText("b@example.com")).toBeInTheDocument();
  });

  it("fires onEnterWithNoDraft when Enter is pressed with nothing typed", () => {
    const onEnter = vi.fn();
    render(<Controlled initial="a@example.com" onEnterWithNoDraft={onEnter} />);
    const input = getDraftInput();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("commits an in-progress draft on blur instead of dropping it", () => {
    render(<Controlled />);
    const input = getDraftInput();
    fireEvent.change(input, { target: { value: "trailing@example.com" } });
    fireEvent.blur(input);
    expect(screen.getByText("trailing@example.com")).toBeInTheDocument();
  });
});
