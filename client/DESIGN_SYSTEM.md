# Design System Reference

This document is the **single source of truth** for how to build UI in this application. It covers component patterns, global styles, and decision frameworks to prevent recreating components and ensure consistency.

---

## Table of Contents

1. [Component Inventory](#component-inventory)
2. [Global Styles (ra-* classes)](#global-styles-ra-classes)
3. [Decision Framework](#decision-framework)
4. [Form Pattern](#form-pattern)
5. [Tailwind Token Reference](#tailwind-token-reference)
6. [Common Patterns](#common-patterns)
7. [Examples](#examples)

---

## Component Inventory

All UI components live in `code/client/components/ui/` and follow consistent patterns (cva variants, forwardRef, cn() utility, displayName).

### Core Components

#### Button
- **File**: `components/ui/button.tsx`
- **Export**: `Button`, `buttonVariants`
- **Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **Sizes**: `default`, `sm`, `lg`, `icon`
- **Props**: `variant`, `size`, `asChild` (polymorphic), standard button props
- **Key Features**: Supports `asChild` for rendering as different element, icon sizing via [&_svg]:size-4
- **Used In**: StickyBottomBar, Bills page, modals, almost everywhere
- **Example**:
  ```tsx
  <Button variant="destructive" size="sm">Delete</Button>
  <Button asChild><a href="/path">Link as Button</a></Button>
  ```

#### Input
- **File**: `components/ui/input.tsx`
- **Export**: `Input`
- **Variants**: None (single style)
- **Key Styling**: border-input, bg-background, focus ring-ring, placeholder styling
- **Props**: Standard input attributes
- **Used In**: Forms, search fields, text entry
- **Example**:
  ```tsx
  <Input placeholder="Enter value" type="text" />
  ```

#### Textarea
- **File**: `components/ui/textarea.tsx`
- **Export**: `Textarea`
- **Key Styling**: Similar to Input, adapted for multi-line
- **Props**: Standard textarea attributes
- **Used In**: Notes, comments, long-form input
- **Example**:
  ```tsx
  <Textarea placeholder="Notes..." rows={4} />
  ```

#### Label
- **File**: `components/ui/label.tsx`
- **Export**: `Label`, `labelVariants`
- **Variants**: Simple styling with peer-disabled support
- **Props**: htmlFor association, className
- **Used In**: Form labels, field labels
- **Example**:
  ```tsx
  <Label htmlFor="email">Email Address</Label>
  <Input id="email" />
  ```

#### Form Components (Form Pattern)
- **File**: `components/ui/form.tsx`
- **Exports**: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`
- **Pattern**: react-hook-form integration with context-based validation
- **Key Features**: Auto-generates IDs, handles aria attributes, error state
- **Used In**: Every form with validation
- **Example**: See [Form Pattern](#form-pattern) section below

#### Dialog
- **File**: `components/ui/dialog.tsx`
- **Exports**: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`
- **Based On**: Radix Dialog primitive
- **Key Features**: Modal overlay, Portal rendering, proper focus management
- **Used In**: Modals, confirmations
- **Example**:
  ```tsx
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Title</DialogTitle>
      </DialogHeader>
      {/* content */}
    </DialogContent>
  </Dialog>
  ```

#### Modal
- **File**: `components/ui/Modal.tsx`
- **Export**: `Modal`
- **Size Variants**: `sm` (442px), `md` (600px), `lg` (800px), `xl` (1000px)
- **Props**: `size` (default: "sm"), `hideCloseButton`, plus standard DialogContent props
- **Key Features**: Pre-styled wrapper around DialogContent with semantic size variants
- **Styling**: Uses `.ra-modal` and `.ra-modal--{size}` classes from global.css
- **Used In**: Forms, confirmations, any sized modal dialog
- **Replaces**: Direct DialogContent usage with ad-hoc max-width classes
- **Example**:
  ```tsx
  <Dialog open={open} onOpenChange={setOpen}>
    <Modal size="md">
      <DialogTitle>My Modal</DialogTitle>
      {/* content */}
    </Modal>
  </Dialog>
  ```

#### Popover
- **File**: `components/ui/popover.tsx`
- **Exports**: `Popover`, `PopoverTrigger`, `PopoverContent`
- **Based On**: Radix Popover primitive
- **Key Features**: Floating panel with positional awareness
- **Used In**: Dropdowns, tooltips, floating menus
- **Example**:
  ```tsx
  <Popover>
    <PopoverTrigger>Open</PopoverTrigger>
    <PopoverContent>Floating content</PopoverContent>
  </Popover>
  ```

#### DatePicker
- **File**: `components/ui/date-picker.tsx`
- **Export**: `DatePicker`
- **Key Features**: 
  - Inline calendar (not portal-based)
  - Respects parent overflow boundaries
  - Uses `.ra-floating-panel` styles
  - ESC key support
- **Props**: `value`, `onChange`, `disabled`, `error`
- **Used In**: RecordBill page, date selection
- **Reference**: See `components/ui/date-picker.example.tsx` for working example
- **Example**:
  ```tsx
  <DatePicker value={date} onChange={setDate} />
  ```

#### Select
- **File**: `components/ui/select.tsx`
- **Exports**: `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectLabel`
- **Based On**: Radix Select primitive
- **Key Features**: Uses `.ra-floating-panel` for dropdown styling
- **Used In**: Vendor selection, dropdown lists
- **Example**:
  ```tsx
  <Select value={selected} onValueChange={setSelected}>
    <SelectTrigger>
      <SelectValue placeholder="Choose..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option1">Option 1</SelectItem>
    </SelectContent>
  </Select>
  ```

#### DropdownMenu
- **File**: `components/ui/dropdown-menu.tsx`
- **Exports**: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`
- **Based On**: Radix DropdownMenu primitive
- **Key Features**: Uses `.ra-floating-panel` for styling
- **Used In**: Action menus, context menus
- **Example**:
  ```tsx
  <DropdownMenu>
    <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Edit</DropdownMenuItem>
      <DropdownMenuItem>Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  ```

#### Checkbox
- **File**: `components/ui/checkbox.tsx`
- **Exports**: `Checkbox`
- **Based On**: Radix Checkbox primitive
- **Used In**: Multi-select, boolean fields
- **Example**:
  ```tsx
  <Checkbox checked={checked} onCheckedChange={setChecked} />
  ```

#### Switch
- **File**: `components/ui/switch.tsx`
- **Exports**: `Switch`
- **Based On**: Radix Switch primitive
- **Used In**: Toggle options
- **Example**:
  ```tsx
  <Switch checked={on} onCheckedChange={setOn} />
  ```

#### Table
- **File**: `components/ui/table.tsx`
- **Exports**: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`
- **Global Styles**: Uses `.ra-table-*` classes from CSS
- **Used In**: Data display, lists
- **Example**:
  ```tsx
  <Table>
    <TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader>
    <TableBody><TableRow><TableCell>Data</TableCell></TableRow></TableBody>
  </Table>
  ```

#### AlertDialog
- **File**: `components/ui/alert-dialog.tsx`
- **Exports**: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`
- **Based On**: Radix AlertDialog primitive
- **Used In**: Destructive confirmations
- **Example**:
  ```tsx
  <AlertDialog>
    <AlertDialogContent>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogContent>
  </AlertDialog>
  ```

#### Toast / Notifications
- **File**: `components/ui/toast.tsx`, `components/ui/sonner.tsx`
- **Usage**: Via sonner library
- **Example**:
  ```tsx
  import { toast } from "sonner";
  toast.success("Saved!");
  toast.error("Error occurred");
  ```

#### Other Components
Additional components available: `accordion.tsx`, `tabs.tsx`, `sheet.tsx`, `drawer.tsx`, `card.tsx`, `badge.tsx`, `avatar.tsx`, `slider.tsx`, `pagination.tsx`, `calendar.tsx`, `collapsible.tsx`, `command.tsx`, `context-menu.tsx`, `hover-card.tsx`, `input-otp.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `progress.tsx`, `radio-group.tsx`, `resizable.tsx`, `scroll-area.tsx`, `separator.tsx`, `skeleton.tsx`, `toggle.tsx`, `tooltip.tsx`, etc.

---

## Global Styles (ra-* classes)

Global component classes in `@layer components` (in `code/client/global.css`). These are **reusable CSS patterns** used across multiple components. Use when a style pattern repeats 3+ times.

### Floating Panels
```css
.ra-floating-panel
```
- **Used By**: DatePicker, Select dropdowns, DropdownMenu, Popover contents
- **Includes**: White background, subtle border, elevation shadow, border-radius, max-height with scroll
- **Example**: Applied to dropdown panels for consistent floating UI appearance

### Table Styles
```css
.ra-table                    /* Main table wrapper */
.ra-table-header-cell        /* Header cells */
.ra-table-row                /* Table rows */
.ra-table-cell               /* Data cells */
.ra-table-pagination         /* Pagination container */
.ra-table-pagination-label   /* Pagination text */
.ra-table-pagination-controls
.ra-table-page-size-button
.ra-table-page-size-option
.ra-table-prev-button
.ra-table-next-button
.ra-table-pagination-page
```
- **Used By**: Table component, data displays
- **Includes**: Border styling, hover states, pagination controls
- **Example**:
  ```html
  <table class="ra-table">
    <thead><tr><th class="ra-table-header-cell">Header</th></tr></thead>
    <tbody><tr class="ra-table-row"><td class="ra-table-cell">Data</td></tr></tbody>
  </table>
  ```

### Date Picker Styles
```css
.ra-date-picker-input        /* Input field */
.ra-date-picker-input--error /* Error state */
.ra-date-picker-icon         /* Calendar icon */
.ra-date-picker-calendar     /* Calendar panel */
.ra-date-picker-header       /* Month/year controls */
.ra-date-picker-nav-btn      /* Prev/Next buttons */
.ra-date-picker-month-label  /* Month label */
.ra-date-picker-weekdays     /* Day-of-week row */
.ra-date-picker-weekday      /* Individual weekday */
.ra-date-picker-days         /* Days grid */
.ra-date-picker-day          /* Individual day */
.ra-date-picker-day--selected /* Selected day state */
.ra-date-picker-day--empty   /* Empty day state */
```
- **Used By**: DatePicker component
- **Includes**: Input styling, calendar layout, selected day highlighting

### Dropdown Styles
```css
.ra-dropdown              /* Dropdown wrapper */
.ra-dropdown-trigger      /* Trigger button/element */
.ra-dropdown-panel        /* Dropdown panel (uses .ra-floating-panel) */
.ra-actions-dropdown      /* Actions menu dropdown */
.ra-action-item           /* Individual action item */
```
- **Used By**: Custom dropdowns, action menus
- **Includes**: Panel positioning, item styling

### Filter/Column Styles
```css
.ra-column-filter-modal   /* Filter modal wrapper */
.ra-column-filter-item    /* Filter item row */
.ra-column-filter-icon    /* Icon in filter item */
```
- **Used By**: Column filter modals
- **Includes**: Layout, hover states

### Modal Styles
```css
.small-modal               /* Small modal container */
.small-modal-header-wrapper
.small-modal-header
.small-modal-close-btn
.small-modal-divider
.small-modal-footer
.small-modal-cancel-btn
.small-modal-save-btn
```
- **Used By**: AddVendorModal, CreateWorkOrderModal, etc.
- **Includes**: Modal layout, button styles, typography

### Button Styles
```css
.grey-button  /* Standard grey button (secondary style) */
```
- **Used By**: Cancel buttons, secondary actions
- **Includes**: Subtle background, hover effect

---

## Decision Framework

### When to Use What?

```
START: Need to build something?
│
├─ Is it JUST styling (no behavior)?
│  └─ Use Tailwind utilities (preferred)
│     Example: p-4, rounded-lg, text-sm, border-gray-200
│
├─ Is this style pattern used 3+ times in the app?
│  └─ Add a global @layer components class (ra-*)
│     Example: .ra-floating-panel, .ra-table-cell
│     → Update code/client/global.css
│
├─ Is it an interactive component (state, handlers)?
│  └─ Create in components/ui/
│     → Use cva for variants
│     → Use forwardRef if accepting ref
│     → Use cn() for class merging
│     → Set displayName
│     Example: Button, Input, Select
│
└─ Is it combining multiple components into a feature?
   └─ Create in components/ (not ui/)
      Example: AddVendorModal, CreateWorkOrderModal
      → Import and compose ui components
      → Wrap with react-hook-form if it's a form
```

### Decision Tree Examples

**Example 1: Building a new form field**
- Question: Is it a text input with validation?
- Answer: Use react-hook-form + FormItem + Input component
- Don't: Create custom input or validation

**Example 2: Need special button styling**
- Question: Is this button style used elsewhere?
- If NO: Use Button component + className override with cn()
- If YES (3+ times): Add new button variant to buttonVariants in button.tsx

**Example 3: Building a new dropdown**
- Question: Is it just styling or interactive behavior?
- Answer: Use Select or DropdownMenu component (already wrapped with .ra-floating-panel)
- Don't: Create custom dropdown

**Example 4: Need to add section header styling**
- Question: Is this header style repeated?
- If NO: Use Tailwind utilities (font-semibold text-2xl)
- If YES (3+ times): Add global class like `.ra-section-header` to global.css

---

## Form Pattern

**All forms MUST use react-hook-form.** This ensures consistent behavior, error handling, and accessibility across the app.

### Form Components

Located in `code/client/components/ui/form.tsx`:
- `Form` - Wrapper (actually FormProvider from react-hook-form)
- `FormField` - Controller component for field
- `FormItem` - Container with auto-generated ID
- `FormLabel` - Label with error state support
- `FormControl` - Wraps the actual input
- `FormDescription` - Helper text
- `FormMessage` - Error message display

### How to Use

```tsx
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MyForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Field 1: Name */}
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Field 2: Email */}
        <FormField
          control={form.control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+$/,
              message: "Invalid email",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}
```

### Key Points

✅ **Do This**:
- Wrap form with `<Form {...form}>`
- Use `<FormField>` for each field with react-hook-form
- Use `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>` structure
- Validation rules in FormField `render` function
- Error messages auto-display via `<FormMessage />`

❌ **Don't Do This**:
- Custom state (useState) for form validation
- Manual error message display (FormMessage handles it)
- Building labels + inputs without FormItem wrapper
- Creating custom input components when Input exists

### References

- **Working Example**: `code/client/components/forms/FormTemplate.example.tsx` (reference template)
- **Real Example**: `code/client/components/AddVendorModal.tsx` (if using react-hook-form)

---

## Tailwind Token Reference

Tokens are defined in `code/client/global.css` (CSS variables) and exposed via `code/tailwind.config.ts` (Tailwind color names).

### Color Tokens

**Semantic Colors** (from tailwind.config.ts):
- `bg-primary` / `text-primary` / `text-primary-foreground`
- `bg-secondary` / `text-secondary` / `text-secondary-foreground`
- `bg-destructive` / `text-destructive` / `text-destructive-foreground`
- `bg-muted` / `text-muted` / `text-muted-foreground`
- `bg-accent` / `text-accent` / `text-accent-foreground`
- `bg-popover` / `text-popover` / `text-popover-foreground`
- `bg-card` / `text-card` / `text-card-foreground`

**Task-Specific Colors** (from tailwind.config.ts):
```javascript
task: {
  text: {
    primary: '#303030',      // Main text
    secondary: '#525252',    // Secondary text
    tertiary: '#717179',     // Muted labels
    muted: '#A3A3A3',        // Placeholders
  },
  status: {
    completed: '#63BC8D',
    inprogress: '#4E9CC3',
  },
  priority: {
    normal: '#2463EB',
    low: '#059669',
    high: '#D97706',
  },
  border: {
    light: '#E5E5E5',
    DEFAULT: '#DADADA',
  },
  button: {
    primary: '#002D5A',
  },
  avatar: '#BC423E',
}
```

### Border & Spacing

- Border radius: `rounded-lg`, `rounded-md`, `rounded-sm` (uses `--radius` variable)
- Spacing: Standard Tailwind scale (p-1, p-2, p-4, gap-2, gap-4, etc.)

### Typography

- Font: Geist, system fonts (defined globally)
- Sizes: Standard Tailwind (text-xs, text-sm, text-base, text-lg, text-2xl)

---

## Common Patterns

### Pattern 1: Form with validation
```tsx
// Use: react-hook-form + Form components
// See: Form Pattern section above
```

### Pattern 2: Dropdown/Select
```tsx
// Option A: Radix Select (already styled with ra-floating-panel)
<Select value={val} onValueChange={setVal}>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opt1">Option 1</SelectItem>
  </SelectContent>
</Select>

// Option B: Radix DropdownMenu
<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Action</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Pattern 3: Modal Dialog
```tsx
// Use: Dialog + Modal components with size variants
<Dialog open={open} onOpenChange={setOpen}>
  <Modal size="md">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Form or content */}
  </Modal>
</Dialog>
```

**Size Reference**:
- `size="sm"`: max-width 442px (small forms, add vendor, create task)
- `size="md"`: max-width 600px (medium dialogs)
- `size="lg"`: max-width 800px (large dialogs)
- `size="xl"`: max-width 1000px (full-width forms, complex layouts)

### Pattern 4: Data Table
```tsx
// Use: Table component + ra-table-* CSS classes
<Table>
  <TableHeader>
    <TableRow>
      <TableHead class="ra-table-header-cell">Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow class="ra-table-row">
      <TableCell class="ra-table-cell">Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Pattern 5: Date Selection
```tsx
// Use: DatePicker component
<DatePicker value={date} onChange={setDate} />

// Or use calendar in a dialog/popover
<Popover>
  <PopoverTrigger>Select Date</PopoverTrigger>
  <PopoverContent>
    {/* Calendar rendering */}
  </PopoverContent>
</Popover>
```

---

## Examples

### Example 1: Creating a New Modal Form

**Question**: I need to add a modal for creating a new resource with validation.

**Solution**:
1. Create file: `components/CreateMyResourceModal.tsx`
2. Import: `useForm`, Form components, Input, Button
3. Build with react-hook-form + Form wrapper
4. Use Dialog to wrap

```tsx
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateMyResourceModal({ open, onOpenChange, onSave }) {
  const form = useForm({
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = (data) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Resource</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Example 2: Choosing Between Utilities and Global Classes

**Question**: I'm building a section header that appears in 3 pages. Should I use Tailwind or create a global class?

**Solution**: 
- Since it appears 3+ times → Create a global class
- Add to `global.css`:
  ```css
  @layer components {
    .ra-section-header {
      @apply font-semibold text-2xl text-primary mb-4;
    }
  }
  ```
- Use in pages: `<h2 className="ra-section-header">Section</h2>`

### Example 3: Building a Custom Dropdown

**Question**: I need a custom dropdown with special styling.

**Solution**: 
- Use `Select` or `DropdownMenu` (already have `.ra-floating-panel` styling)
- If you need custom items, extend `SelectItem` or `DropdownMenuItem` styling
- Don't create a custom dropdown from scratch

```tsx
<Select value={vendor} onValueChange={setVendor}>
  <SelectTrigger className={errorClass}>
    <SelectValue placeholder="Select vendor..." />
  </SelectTrigger>
  <SelectContent>
    {vendors.map((v) => (
      <SelectItem key={v.id} value={v.id}>
        {v.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

## Quick Reference

| Need | Use | Location |
|------|-----|----------|
| **Text input** | `Input` component | components/ui/input.tsx |
| **Select dropdown** | `Select` component | components/ui/select.tsx |
| **Modal dialog** | `Dialog` component | components/ui/dialog.tsx |
| **Form validation** | `Form` + `FormField` | components/ui/form.tsx |
| **Button** | `Button` component | components/ui/button.tsx |
| **Date picker** | `DatePicker` component | components/ui/date-picker.tsx |
| **Table** | `Table` component | components/ui/table.tsx |
| **Menu dropdown** | `DropdownMenu` component | components/ui/dropdown-menu.tsx |
| **Reusable CSS pattern** | Add `ra-*` class | code/client/global.css |
| **One-off styling** | Tailwind utilities | inline className |

---

## When in Doubt

- ✅ Check this document
- ✅ Look at similar existing components
- ✅ Reference example files
- ❌ Don't create new patterns without checking if they exist first

For more info on adding new components, see `CONTRIBUTING.md`.
