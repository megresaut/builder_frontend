# Keyboard Navigation Audit Report

**Date:** Generated from codebase analysis  
**Status:** Identifies core inconsistencies affecting keyboard UX and accessibility  
**Scope:** Form fields, popovers/dropdowns, modals, and interactive components

---

## Executive Summary

Your codebase uses **Radix UI primitives** (Dialog, Popover, Select, DropdownMenu) as the foundation, which provides excellent baseline accessibility. However, **custom popover-based components (SelectField, MultiSelectField, ComboboxField, IdentitySelectField, PopoverActionsDropdown) have a critical architectural inconsistency**:

### The Core Problem: Visual Highlight ≠ DOM Focus

When you press **Arrow Down** in a dropdown, the following happens:
1. ✅ Visual highlight moves (via `highlightedIndex` → `[data-highlighted]` CSS)
2. ❌ DOM focus does NOT move to the highlighted option
3. ❌ Screen readers don't announce the highlighted item
4. ❌ Users pressing Tab skip the highlighted item and move to the next focusable element

**This is why "arrows and enter sometimes work, sometimes don't"** — the visual behavior is there, but keyboard focus is not synchronized.

---

## Detailed Findings

### 1. Visual Highlight vs DOM Focus Mismatch (Critical)

**Problem:**
- `usePopoverTypeahead` updates `highlightedIndex` state when Arrow keys are pressed
- This triggers visual styling via `[data-highlighted="true"]` CSS classes
- However, **DOM focus remains unchanged** (often stays on the trigger button or body)

**Where this happens:**
- `SelectField.tsx` - Trigger + option buttons
- `MultiSelectField.tsx` - Options list
- `ComboboxField.tsx` (partially mitigated - search input is focused)
- `IdentitySelectField.tsx` - Options list
- `PopoverActionsDropdown.tsx` - Actions list

**Impact:**
- Screen reader users hear "button" for each option, not "selected listbox item"
- Keyboard-only users can't tell which item is "selected" by arrow navigation
- Tab navigation jumps unexpectedly because visual and DOM hierarchies don't match
- `aria-activedescendant` pattern not implemented

**Example code issue:**
```tsx
// SelectField.tsx - Options render as buttons but highlightedIndex doesn't move focus
const isHighlighted = highlightedIndex === index;
return (
  <button
    data-highlighted={isHighlighted ? "true" : "false"}
    // Missing: onKeyDown doesn't call focus() when highlighted
  >
    {option.label}
  </button>
);
```

**Why it happens:**
The design decision was to keep focus on the trigger or search input while using `highlightedIndex` for visual navigation. This works for simple interactions but breaks accessibility.

---

### 2. Inconsistent Escape Key Handling

**Problem:**
Different components handle Escape in conflicting ways:

| Component | Behavior | Issue |
|-----------|----------|-------|
| `SelectField` | Calls `setOpen(false)` explicitly | Good - but no propagation control |
| `DropdownMenuContent` | Calls `e.stopPropagation()` | Prevents closing parent dialogs |
| `ComboboxField` | Closes in `handleSearchKeyDown` | No propagation control |
| `MultiSelectField` | Relies on popover context + usePopoverAutoClose | Unclear when close happens |

**Impact:**
- In nested overlays (Dialog > Dropdown), Escape may close the dropdown but not the dialog
- Or the dialog closes immediately, closing the dropdown as side effect
- User expectation: "Escape should close the innermost overlay"
- Current behavior: Inconsistent

**Best practice:**
- Inner overlays should `e.stopPropagation()` to prevent bubbling
- Then call `setOpen(false)` or `onOpenChange(false)`
- Ensures only innermost overlay closes

---

### 3. Focus Restoration Not Always Explicit

**Problem:**
Components rely on Radix Popover's implicit focus restoration. However:

**In `SelectField.tsx`:**
```tsx
// After popover closes, focus return to trigger is assumed (Radix behavior)
// But if controlled component with external open state, this may fail
const handleOptionSelect = (optionValue: string) => {
  onChange?.(optionValue);
  setOpen(false);
  // Missing: triggerRef.current?.focus()
};
```

**In `ComboboxField.tsx`:**
```tsx
// Search input is focused on open (good)
useEffect(() => {
  if (open && searchInputRef.current) {
    searchInputRef.current.focus();
  }
}, [open]);
// But no explicit focus restore to trigger on close
```

**Impact:**
- Works most of the time (Radix handles it)
- Fragile in edge cases with controlled `open` prop
- Screen readers may lose track of focus position
- Violates the pattern: "closing overlay should restore focus to trigger"

---

### 4. Global Keyboard Capture and Event Interference

**Problem:**
`usePopoverTypeahead` attaches a global `window.addEventListener("keydown", ..., {capture: true})`.

**Safe guards in place:**
- Ignores keys when target is INPUT, TEXTAREA, or contentEditable ✅
- Ignores modifier keys (Ctrl, Meta, Alt, Shift) ✅
- Ignores Escape and Tab (lets them bubble) ✅

**Potential issue:**
- In deeply nested overlays or complex keyboard handlers, this capture listener could interfere
- If a custom input component doesn't have the `INPUT` tag name, typeahead may capture its keys
- Example: A custom `<div contentEditable>` that doesn't set the property correctly

**Mitigation:**
Generally safe, but should add tests for nested overlay scenarios.

---

### 5. Missing ARIA Attributes in Custom Popover Lists

**Problem:**
Custom components render options as buttons without ARIA semantics:

```tsx
// SelectField.tsx - Options rendered as plain buttons
<button
  key={option.value}
  data-selected={isSelected ? "true" : "false"}
  // Missing ARIA attributes:
  // - role="option"
  // - aria-selected="true/false"
  // - id for aria-activedescendant pattern
>
  {option.label}
</button>
```

**What should be there:**
For proper accessibility, either:
1. **Use aria-activedescendant pattern** (trigger has `aria-owns="listbox-id"`, options have `id`s, trigger updates `aria-activedescendant` when highlighted)
2. **Or move DOM focus** to the highlighted option (simpler approach)

**Impact:**
- Screen readers don't announce "listbox" / "option" semantics
- Users of assistive tech don't know this is a selectable list
- No ARIA feedback about which item is selected vs highlighted

---

### 6. Tab Navigation Behavior Inconsistency

**Problem:**
Arrow navigation updates `highlightedIndex`, but Tab moves focus through the natural tab order:

```
1. User presses ArrowDown → highlightedIndex changes (visual highlight moves)
2. User presses Tab → focus moves to next focusable element (often not the highlighted one)
3. User expects: "Tab moves through the list"
4. Actual: "Tab leaves the list and moves to the next button on the page"
```

**Where this breaks:**
- `SelectField` - Tab escapes the dropdown without selecting the highlighted item
- `MultiSelectField` - Same issue
- `ComboboxField` - Slightly better because search input is focused, so Tab is more predictable

**Standard behavior (from native HTML):**
- `<select>` with `<option>` elements: Arrow keys select, Tab/Enter confirm
- Radix Select: Same behavior (they move focus internally)

**Your component behavior:**
- Arrow keys highlight (visual only)
- Tab/Enter should select, but Tab is unpredictable

---

### 7. Components Using Radix Primitives (Good Baseline)

These components have built-in keyboard support and focus management:

✅ **Dialog (ModalTemplate)** - Radix Dialog  
✅ **DropdownMenu** - Radix DropdownMenu  
✅ **Select (native select wrapper)** - Radix Select  
✅ **Popover wrapper** - Radix Popover + custom keyboard layer  

**Issue:** Custom components built on top of Popover don't leverage all Radix benefits.

---

### 8. What's Working Well

✅ **Native text inputs** - TextField, TextAreaField work perfectly (full keyboard support)  
✅ **Modal focus trapping** - ModalTemplate + Radix Dialog handles this correctly  
✅ **Escape to close modals** - Works as expected  
✅ **ComboboxField search input** - Properly focused and keyboard accessible  
✅ **Click-outside to close** - usePopoverAutoClose works reliably  
✅ **Scroll locking while popovers open** - useGlobalActionsScrollLock prevents page jump  

---

## Root Cause Analysis

### Why does it sometimes work, sometimes not?

The inconsistency comes from a **disconnect between visual behavior and keyboard semantics**:

1. **Simple case (works):** User clicks dropdown, presses Enter on visible option → works because visible = highlighted
2. **Arrow case (confusing):** User clicks dropdown, presses ArrowDown 3 times, presses Enter → the arrow visual feedback is there, but Tab/Enter behavior is unpredictable
3. **Screen reader case (broken):** Same as arrow case, but screen reader doesn't announce highlights, so user has no idea what happens
4. **Tab case (broken):** User presses Tab expecting to navigate the list → Tab closes the list or jumps out, depending on where focus actually is

---

## Recommended Fixes (Priority Order)

### Priority 1: Sync Focus with Visual Highlight (High Impact)

**What to do:**
1. When `highlightedIndex` changes in popover-based selects, move **DOM focus** to that option
2. Maintain visual highlight (`data-highlighted`) simultaneously

**How to implement:**
```tsx
// In SelectField.tsx (example)
const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

// When highlightedIndex changes:
useEffect(() => {
  if (open && optionRefs.current[highlightedIndex]) {
    optionRefs.current[highlightedIndex]?.focus();
  }
}, [highlightedIndex, open]);

// Render options with refs:
<button
  ref={(el) => { optionRefs.current[index] = el; }}
  data-highlighted={highlightedIndex === index}
  onKeyDown={handleOptionKeyDown}
>
  {option.label}
</button>
```

**Files affected:**
- `SelectField.tsx`
- `SelectFieldCell.tsx`
- `MultiSelectField.tsx`
- `IdentitySelectField.tsx`
- `PopoverActionsDropdown.tsx`

**Timeline:** 1-2 hours

---

### Priority 2: Normalize Escape Handling (Medium Impact)

**Policy to implement:**
- Inner overlays (dropdowns, popovers): Call `e.stopPropagation()` + `setOpen(false)`
- Outer overlays (modals): Allow Escape to bubble naturally (Radix Dialog handles it)

**Files to update:**
- `SelectField.tsx` - Add `e.stopPropagation()`
- `DropdownMenuContent` - Keep `e.stopPropagation()` ✅ (already correct)
- `MultiSelectField.tsx` - Add explicit close handlers
- `ComboboxField.tsx` - Add `e.stopPropagation()`

**Timeline:** 30 minutes

---

### Priority 3: Add ARIA Attributes (High Impact for Accessibility)

**What to add:**

```tsx
// For popover option lists:
<div role="listbox" aria-label="Select options">
  {options.map((opt, index) => (
    <button
      id={`option-${opt.value}`}
      role="option"
      aria-selected={selectedValue === opt.value}
      data-highlighted={highlightedIndex === index}
    >
      {opt.label}
    </button>
  ))}
</div>

// For the trigger:
<button
  aria-haspopup="listbox"
  aria-expanded={open}
  aria-controls="options-listbox"
>
  {selectedLabel}
</button>
```

**Files affected:**
- `SelectField.tsx`
- `MultiSelectField.tsx`
- `IdentitySelectField.tsx`
- `PopoverActionsDropdown.tsx`

**Timeline:** 1-2 hours

---

### Priority 4: Explicit Focus Restoration (Low to Medium Impact)

**What to do:**
- When closing controlled popovers, explicitly focus the trigger

```tsx
const handleClose = () => {
  triggerRef.current?.focus(); // Explicit restore
  setOpen(false);
};
```

**Files affected:**
- `SelectField.tsx`
- `ComboboxField.tsx`
- `MultiSelectField.tsx`

**Timeline:** 30 minutes

---

### Priority 5: Create Keyboard Navigation Tests (Medium Impact)

**Test coverage needed:**
- Tab through dropdown options
- Arrow keys navigate and move focus
- Enter selects highlighted option
- Escape closes overlay and restores focus
- Nested overlays (Dialog > Dropdown) - Escape behavior correct

**Framework:** Vitest + @testing-library/user-event

**Timeline:** 2-3 hours

---

## Implementation Checklist

- [ ] **Priority 1**: Sync focus with highlightedIndex in SelectField
- [ ] **Priority 1**: Sync focus with highlightedIndex in MultiSelectField
- [ ] **Priority 1**: Sync focus with highlightedIndex in IdentitySelectField
- [ ] **Priority 1**: Sync focus with highlightedIndex in PopoverActionsDropdown
- [ ] **Priority 2**: Add `e.stopPropagation()` to SelectField.tsx handleOptionKeyDown
- [ ] **Priority 2**: Add `e.stopPropagation()` to MultiSelectField.tsx handlers
- [ ] **Priority 2**: Add `e.stopPropagation()` to ComboboxField.tsx handlers
- [ ] **Priority 3**: Add ARIA attributes to SelectField options
- [ ] **Priority 3**: Add ARIA attributes to MultiSelectField options
- [ ] **Priority 3**: Add ARIA attributes to IdentitySelectField options
- [ ] **Priority 3**: Add ARIA attributes to PopoverActionsDropdown
- [ ] **Priority 4**: Add explicit focus restoration to close handlers
- [ ] **Priority 5**: Write keyboard navigation tests

---

## Conclusion

Your codebase has a **solid Radix UI foundation**, but custom popover-based components have an architectural issue: **visual highlights aren't synchronized with DOM focus**. This creates confusion for keyboard and screen reader users.

**The good news:** Fixes are straightforward and localized to 4-5 custom components.

**Quick wins:**
1. Sync focus with highlightedIndex (1-2 hours, biggest impact)
2. Add `e.stopPropagation()` for Escape (30 minutes)
3. Add ARIA attributes (1-2 hours, huge accessibility boost)

After these fixes, keyboard navigation will be **fully consistent and accessible**.
