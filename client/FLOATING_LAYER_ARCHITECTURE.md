# Floating Layer Architecture

A unified system for managing floating/dropdown elements across the application.

## Components

### 1. `useFloatingLayer` Hook
**Location:** `code/client/hooks/useFloatingLayer.ts`

Manages all the repetitive floating element logic:
- **Placement detection** - Automatically decides if element goes below or above trigger
- **Collision detection** - Monitors viewport space and flips placement when needed
- **Scroll parent monitoring** - Finds and monitors all scrollable parent elements
- **Real-time updates** - Uses ResizeObserver and scroll listeners to reposition dynamically
- **Width syncing** - Optional: match floating element width to trigger element
- **Z-index management** - Handles stacking context for modals

**Usage:**
```tsx
const floatingLayer = useFloatingLayer({
  open: isOpen,
  initialPlacement: "bottom",
  minSpaceBelow: 300,
  offset: 8,
  triggerWidth: true, // sync content width to trigger
});

// Returns:
// - triggerRef: attach to trigger element
// - contentRef: attach to floating content
// - placement: "top" | "bottom" (current)
// - align: "start" | "center" | "end" (current)
// - widthValue: width to apply to content (if triggerWidth=true)
// - getPositionStyle(): Returns positioning style object
```

### 2. `Dropdown` Primitive
**Location:** `code/client/components/ui/dropdown.tsx`

Shared UI wrapper that every dropdown type uses:

**Features:**
- State management (open/close)
- A11y wiring (aria-expanded, aria-controls, role=menu)
- Click-outside detection
- Escape key handling
- Floating layer integration

**Subcomponents:**
- `Dropdown.Trigger` - The button/input that opens the dropdown
  - Works with both button and input elements
  - Automatically sets aria-expanded, aria-controls
  - Handles focus/click to open
  
- `Dropdown.Content` - The floating menu container
  - Automatically positioned based on collision detection
  - Handles click-outside and escape key
  - Sets proper ARIA attributes (role=menu, aria-labelledby)

**Usage:**
```tsx
<Dropdown open={open} onOpenChange={setOpen} syncTriggerWidth>
  <Dropdown.Trigger>Open Menu</Dropdown.Trigger>
  <Dropdown.Content>
    {/* Menu content */}
  </Dropdown.Content>
</Dropdown>
```

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
