# Floating Layer Architecture

A unified system for managing floating/dropdown elements (popovers, dropdowns, tooltips) across the application using Radix UI primitives enhanced with custom logic.

## Components

### 1. `Popover` Primitive (Primary for Form Fields)
**Location:** `code/client/components/ui/popover.tsx`

Enhanced Radix Popover wrapper for form field dropdowns (SelectField, ComboboxField, IdentitySelectField, etc.).

**Key Features:**
- **Context-based Trigger Tracking** - Uses React Context to reliably track the trigger element (replaces generic querySelector)
- **ResizeObserver Width Syncing** - Real-time trigger width synchronization using ResizeObserver
- **Intelligent Collision Detection** - Auto-flips above trigger when space below is limited
- **Smart Boundary Detection** - Automatically closes/hides if can't fit in viewport (via `hideWhenDetached={true}`)
- **Internal Scrolling** - Content automatically scrolls when it exceeds max-height (280px by default)
- **Modal Support** - Optional `containerRef` prop to render inside modal containers instead of document.body
- **Portal Rendering** - Floats content above page content with proper z-index

**Default Behavior:**
- Placement: `bottom` (with auto-flip via `avoidCollisions={true}`)
- Max-height: `280px` with internal scrolling
- Collision padding: `32px` (triggers flip earlier)
- Sticky: `never` (won't stick to edges)
- Sync trigger width: `true` (default)

**Props:**
```tsx
interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>; // For modal popovers
}

interface PopoverContentProps {
  syncTriggerWidth?: boolean;        // Match trigger width (default: true)
  className?: string;
  align?: "start" | "center" | "end"; // Horizontal alignment (default: start)
  sideOffset?: number;               // Distance from trigger (default: 8)
  style?: React.CSSProperties;
  // ... other Radix Popover.Content props
}
```

**Usage:**
```tsx
// Form field (SelectField, ComboboxField)
<Popover>
  <PopoverTrigger>Select Option</PopoverTrigger>
  <PopoverContent syncTriggerWidth={true}>
    {/* Dropdown content - auto-flips if space is limited */}
  </PopoverContent>
</Popover>

// Modal dropdown (with containerRef to prevent bleeding)
<Popover containerRef={modalRef}>
  <PopoverTrigger>Select</PopoverTrigger>
  <PopoverContent>Content</PopoverContent>
</Popover>

// Custom width (no syncing to trigger)
<Popover>
  <PopoverTrigger>Menu</PopoverTrigger>
  <PopoverContent syncTriggerWidth={false} style={{ width: "200px" }}>
    Fixed-width content
  </PopoverContent>
</Popover>
```

**Architecture Details:**
```tsx
// PopoverContext provides trigger ref to Content component
const PopoverContext = createContext<{ triggerRef, containerRef }>();

// PopoverTrigger captures the trigger element
const PopoverTrigger = forwardRef((props, ref) => {
  const { triggerRef } = usePopoverContext();
  // Assigns trigger element to context for PopoverContent to measure
  return <PopoverPrimitive.Trigger ref={setRefs} {...props} />;
});

// PopoverContent uses trigger ref for width syncing and collision detection
const PopoverContent = forwardRef((props, ref) => {
  const { triggerRef, containerRef } = usePopoverContext();

  // ResizeObserver watches trigger width changes
  const resizeObserver = new ResizeObserver(() => {
    setTriggerWidth(trigger.offsetWidth);
  });

  // Portal optionally renders inside containerRef or document.body
  return (
    <PopoverPrimitive.Portal container={containerRef?.current}>
      <PopoverPrimitive.Content
        ref={setRefs}
        avoidCollisions={true}      // Auto-flip above if needed
        collisionPadding={32}        // Buffer before flip
        hideWhenDetached={true}      // Auto-close if clipped
        sticky="never"               // Don't stick to edges
        style={{
          width: triggerWidth,       // Sync to trigger
          maxHeight: "280px",        // Scrollable content
          ...style
        }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
```

### 2. `useFloatingLayer` Hook (Legacy)
**Location:** `code/client/hooks/useFloatingLayer.ts`

**Status**: Still available but now primarily used by `Dropdown` primitive for specialized cases (DatePicker).

Manages floating element positioning logic:
- Placement detection (top/bottom)
- Collision detection with viewport
- Scroll parent monitoring
- ResizeObserver integration
- Width syncing optional

**Note**: For new form field dropdowns, use `Popover` primitive directly instead of `useFloatingLayer`.

### 3. `Dropdown` Primitive (Specialized)
**Location:** `code/client/components/ui/dropdown.tsx`

**Status**: Used primarily for DatePicker calendar and other specialized cases requiring custom positioning logic.

Shared UI wrapper with built-in floating layer integration:

**Features:**
- State management (open/close)
- A11y wiring (aria-expanded, aria-controls, role=menu)
- Click-outside detection
- Escape key handling
- useFloatingLayer integration for positioning

**Subcomponents:**
- `Dropdown.Trigger` - Button/input that opens dropdown
- `Dropdown.Content` - Floating container with automatic positioning

**Usage:**
```tsx
<Dropdown
  open={open}
  onOpenChange={setOpen}
  initialPlacement="bottom"
  syncTriggerWidth={false}  // DatePicker uses fixed width
  minSpaceBelow={340}
>
  <Dropdown.Trigger type="text">Calendar</Dropdown.Trigger>
  <Dropdown.Content>
    {/* Calendar grid */}
  </Dropdown.Content>
</Dropdown>
```

**When to use Dropdown vs Popover:**
- **Popover**: Form field dropdowns (SelectField, ComboboxField) - better integration with FieldShell
- **Dropdown**: DatePicker, custom cases needing useFloatingLayer - legacy but functional

## Field Components Using Primitives

### SelectField ⭐ (Popover)
**Location:** `code/client/components/forms/SelectField.tsx`

Uses **Popover** primitive for modern, reliable floating behavior:
- Trigger renders as styled button with selected value/pills
- Content uses PopoverContent with trigger-width syncing
- Keyboard navigation: Arrow keys, Enter to select, Escape to close
- Typeahead search via single-key filtering
- Multi-select support with removable pills
- Auto-flips above trigger when space is limited

**Example:**
```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger id={fieldId} className={triggerStyles}>
    {/* Selected value or "Select option" */}
  </PopoverTrigger>
  <PopoverContent syncTriggerWidth={true}>
    {/* Options list with keyboard support */}
  </PopoverContent>
</Popover>
```

### ComboboxField ⭐ (Popover)
**Location:** `code/client/components/forms/ComboboxField.tsx`

Uses **Popover** primitive with search input:
- Trigger renders as button with selected label
- Content wraps search input + filtered options list
- ResizeObserver tracks trigger width for sync
- Keyboard navigation through options
- Escape closes dropdown and clears search
- Auto-repositioning on scroll/resize

### IdentitySelectField ⭐ (Popover)
**Location:** `code/client/components/forms/IdentitySelectField.tsx`

Uses **Popover** primitive with rich option rendering:
- Supports single and multi-select modes
- Options display avatars, subtitles, tags
- Trigger-width syncing via PopoverContent
- Multi-select shows selected items as pills with remove buttons
- Search filtering across label and subtitle text

### DatePicker (Dropdown)
**Location:** `code/client/components/ui/date-picker.tsx`

Uses **Dropdown** primitive (legacy but functional):
- Calendar input uses `Dropdown.Trigger` (type="text")
- Calendar panel uses `Dropdown.Content`
- Explicitly sets `syncTriggerWidth={false}` to maintain calendar dimensions
- Flips above when approaching modal bottom
- Note: Could be migrated to Popover in future for consistency

### AddressField (Popover)
**Location:** `code/client/components/forms/AddressField.tsx`

State dropdown within address fields uses **Popover** primitive:
- Nested popover for state/province selection
- Tracks trigger (state button) width
- Fixed-height options list with scrolling

## Architecture Benefits

### Popover-Based Approach (Modern)
1. **Context-Based Tracking** - Reliable trigger element reference via React Context (no generic selectors)
2. **ResizeObserver Integration** - Real-time width syncing as trigger changes
3. **Radix UI Foundation** - Built on battle-tested Radix UI Popover primitive
4. **Smart Auto-Flip** - Automatically positions above trigger when space below is limited
5. **Modal Safety** - `containerRef` prop prevents "bleeding" onto other pages
6. **Consistent Form UX** - All form field dropdowns (SelectField, ComboboxField) behave identically
7. **Accessible** - Radix UI handles ARIA attributes, focus management

### Legacy Approach (Dropdown + useFloatingLayer)
- Still functional for specialized cases (DatePicker)
- Useful for dropdowns needing custom positioning logic
- Can be migrated to Popover as needed

## Collision Detection (Popover)

Radix UI's built-in collision detection with custom configuration:

```
Configuration:
  avoidCollisions={true}    // Enable collision detection
  collisionPadding={32}     // Flip when 32px from edge
  sticky="never"            // Don't stick to boundaries
  hideWhenDetached={true}   // Auto-close if clipped

Behavior:
  1. Popover tries to position below trigger (side="bottom")
  2. Measures space available
  3. If < 280px (maxHeight) available below:
     → Flips above trigger (side="top")
  4. If can't fit in either direction:
     → Closes automatically (hideWhenDetached)
```

## Event Monitoring (Popover)

ResizeObserver monitors:
- Trigger element width changes (for syncTriggerWidth)
- Reposition on scroll (handled by Radix)
- Window resize (handled by Radix)

**No manual scroll listeners needed** - Radix handles viewport monitoring.

## Modal Integration

### Default Behavior (Body Portal)
```tsx
<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent>
    {/* Renders to document.body via Portal */}
  </PopoverContent>
</Popover>
```

**Issue**: May bleed onto adjacent pages if not careful

### Modal-Safe Behavior (Container Portal)
```tsx
const modalRef = useRef<HTMLDivElement>(null);

<div ref={modalRef} className="modal-dialog">
  <Popover containerRef={modalRef}>
    <PopoverTrigger>Open</PopoverTrigger>
    <PopoverContent>
      {/* Renders inside modalRef container */}
      {/* Clipped by modal boundaries, never bleeds */}
    </PopoverContent>
  </Popover>
</div>
```

**Benefits**:
- Popover stays within modal bounds
- Auto-closes if clipped by modal edges
- No z-index conflicts with other pages

## Creating New Dropdown Fields

### Using Popover (Recommended)

```tsx
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FieldShell } from "./FieldShell";

export function CustomSelectField({ label, options, value, onChange, ...props }) {
  const [open, setOpen] = useState(false);

  return (
    <FieldShell label={label} {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>{value || "Select..."}</PopoverTrigger>
        <PopoverContent syncTriggerWidth={true}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => onChange(opt.value)}>
              {opt.label}
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}
```

**Why Popover?**
- ✅ Works with FieldShell for consistent styling
- ✅ Auto-flip and collision detection out-of-box
- ✅ Modal-safe with `containerRef`
- ✅ Simpler than Dropdown for form fields

### Using Dropdown (Legacy)

```tsx
import { Dropdown } from "@/components/ui/dropdown";

export function CustomField({ options, value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown open={open} onOpenChange={setOpen} syncTriggerWidth>
      <Dropdown.Trigger>{value || "Select..."}</Dropdown.Trigger>
      <Dropdown.Content>
        {options.map(opt => (...))}
      </Dropdown.Content>
    </Dropdown>
  );
}
```

**When to use Dropdown:**
- ❌ Not recommended for new form fields
- ✅ DatePicker (calendar positioning is specialized)
- ✅ Custom cases requiring useFloatingLayer behavior
