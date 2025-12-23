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

### DatePicker
**Location:** `code/client/components/ui/date-picker.tsx`

Refactored to use `Dropdown` primitive:
- Calendar input uses `Dropdown.Trigger` (type="text")
- Calendar panel uses `Dropdown.Content`
- Automatically flips above when approaching modal bottom
- Live updates when container resizes

### ComboboxField
**Location:** `code/client/components/forms/ComboboxField.tsx`

Refactored to use `Dropdown` primitive:
- Trigger uses `Dropdown.Trigger` button
- Search menu uses `Dropdown.Content`
- Syncs dropdown width to trigger width
- Supports live repositioning

### SelectField
**Location:** `code/client/components/forms/SelectField.tsx`

Uses Radix UI's `Select` which already includes:
- Built-in collision detection
- Automatic side flipping
- Portal rendering
- No changes needed - works out of the box

## Architecture Benefits

1. **Single Source of Truth** - All floating element logic in one hook
2. **Consistency** - All dropdowns behave identically
3. **Maintainability** - Changes to collision detection apply everywhere
4. **Live Updates** - Dropdowns reposition in real-time as container changes
5. **Modal Support** - Z-index management keeps dropdowns visible in modals
6. **A11y** - All accessibility attributes automatically managed
7. **Reusability** - Hook can be used for tooltips, popovers, etc.

## Collision Detection Algorithm

The system checks space availability before placing the dropdown:

```
if (spaceBelow >= contentHeight + 20) {
  position = "bottom" (below trigger)
} else if (spaceAbove >= contentHeight + 20) {
  position = "top" (above trigger)
} else {
  position = "bottom" (default, might clip - constrained by viewport max-height)
}
```

The 20px buffer ensures visual separation from viewport edge.

## Event Monitoring

Real-time repositioning listens to:
- `ResizeObserver` - Content or trigger size changes
- Scroll events on all parent containers
- Window resize events
- Detects scroll parents up to 5 levels up

## Extending for New Dropdowns

To create a new dropdown type (e.g., custom Autocomplete):

```tsx
import { Dropdown } from "@/components/ui/dropdown";

export function AutocompleteField({ options, ...props }) {
  const [open, setOpen] = useState(false);
  
  return (
    <Dropdown 
      open={open} 
      onOpenChange={setOpen}
      minSpaceBelow={300}
      syncTriggerWidth
    >
      <Dropdown.Trigger>
        {/* Your input or button */}
      </Dropdown.Trigger>
      <Dropdown.Content>
        {/* Your menu options */}
      </Dropdown.Content>
    </Dropdown>
  );
}
```

The floating layer handles all positioning and collision detection automatically.
