# Contributing to the Design System

This guide explains how to add new components, styles, and forms while maintaining consistency with the existing design system.

**Start here**: Read `DESIGN_SYSTEM.md` first to understand what exists and the decision framework.

---

## Table of Contents

1. [Adding a New UI Component](#adding-a-new-ui-component)
2. [Adding a Global CSS Class](#adding-a-global-css-class)
3. [Adding a Form Modal](#adding-a-form-modal)
4. [File Naming & Structure](#file-naming--structure)
5. [Code Patterns](#code-patterns)
6. [Testing Your Changes](#testing-your-changes)

---

## Adding a New UI Component

**When**: You need a reusable interactive component (with state, handlers, or complex behavior).

**Where**: `code/client/components/ui/[component-name].tsx`

### Step 1: Check If It Already Exists

Search `DESIGN_SYSTEM.md` [Component Inventory](#component-inventory-section) to see if a similar component exists.

- ✅ If exists and matches your needs → Import and use it
- ❌ If exists but needs different variants → Add variant to existing component (see Step 2b)
- 🆕 If doesn't exist → Create new component

### Step 2: Create the Component

#### 2a: Simple Component (No Variants)

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * MyComponent - Brief description
 * 
 * A reusable component for [what it does].
 * 
 * @example
 * <MyComponent prop="value">Content</MyComponent>
 */
export const MyComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("base-classes", className)}
    {...props}
  />
));

MyComponent.displayName = "MyComponent";
```

#### 2b: Component With Variants (Recommended)

Use `class-variance-authority` (cva) for variants:

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * MyComponent - Brief description
 * 
 * Variants:
 * - variant: "default" | "secondary" | "outline"
 * - size: "sm" | "md" | "lg"
 * 
 * @example
 * <MyComponent variant="secondary" size="sm">Click me</MyComponent>
 */
const myComponentVariants = cva(
  // Base classes (always applied)
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-primary text-primary hover:bg-primary/10",
      },
      size: {
        sm: "px-3 py-1 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {
  asChild?: boolean; // If using Slot for polymorphic rendering
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"; // Requires: import { Slot } from "@radix-ui/react-slot";
    return (
      <Comp
        ref={ref}
        className={cn(myComponentVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

MyComponent.displayName = "MyComponent";

export { myComponentVariants };
```

#### 2c: Component Wrapping Radix Primitive

If wrapping a Radix UI primitive:

```typescript
import * as React from "react";
import * as MyPrimitive from "@radix-ui/react-my-component";
import { cn } from "@/lib/utils";

export const MyComponent = React.forwardRef<
  React.ElementRef<typeof MyPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MyPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MyPrimitive.Root
    ref={ref}
    className={cn("custom-classes", className)}
    {...props}
  />
));

MyComponent.displayName = MyPrimitive.Root.displayName;
```

### Step 3: Export and Document

In the component file:

```typescript
// At the end of the file
export { MyComponent, myComponentVariants };
export type MyComponentProps;
```

### Step 4: Update DESIGN_SYSTEM.md

Add your new component to the [Component Inventory](#component-inventory) section:

```markdown
#### MyComponent
- **File**: `components/ui/my-component.tsx`
- **Export**: `MyComponent`, `myComponentVariants`
- **Variants**: `default`, `secondary`, `outline` (variant), `sm`, `md`, `lg` (size)
- **Props**: Standard div attributes + variant/size
- **Key Features**: Brief description
- **Used In**: Example pages where it's used
- **Example**:
  ```tsx
  <MyComponent variant="secondary" size="sm">
    Content
  </MyComponent>
  ```
```

### Best Practices

✅ **Do This**:
- Use `React.forwardRef` if accepting ref
- Use `cn()` utility for class merging
- Use `cva` for variants (consistency)
- Set `displayName` (helps with debugging)
- Support `asChild` prop if appropriate
- Add JSDoc comments with `@example`

❌ **Don't Do This**:
- Hard-code class names (use cn())
- Use `!important` in component styles
- Create a new component if an existing one is close enough
- Skip forwardRef if component accepts ref prop

---

## Adding a Global CSS Class

**When**: A reusable style pattern used 3+ times across different pages/components.

**Where**: `code/client/global.css` in the `@layer components` section

### Step 1: Verify It's Really Needed

Search existing components:
- Do any existing `ra-*` classes match?
- Could this be solved with Tailwind utilities?
- Is it used 3+ times (not just 1-2 places)?

### Step 2: Add the Class

In `code/client/global.css` in the `@layer components` section:

```css
@layer components {
  .ra-my-pattern {
    @apply rounded-lg border border-gray-200 bg-white p-4;
  }

  .ra-my-pattern--active {
    @apply border-primary bg-primary/5;
  }

  .ra-my-pattern--error {
    @apply border-red-500 bg-red-50;
  }
}
```

### Step 3: Document in DESIGN_SYSTEM.md

Add to the [Global Styles (ra-* classes)](#global-styles-ra-classes) section:

```markdown
### My Pattern
```css
.ra-my-pattern              /* Default state */
.ra-my-pattern--active      /* Active state */
.ra-my-pattern--error       /* Error state */
```
- **Used By**: Component A, Component B, Component C
- **Includes**: Border, background, padding, rounded corners
- **Example**:
  ```html
  <div class="ra-my-pattern">Content</div>
  <div class="ra-my-pattern--active">Active</div>
  ```
```

### Naming Convention

Follow the pattern: `.ra-[category]-[element]--[state]`

Examples:
- `.ra-floating-panel` (category: floating, element: panel)
- `.ra-table-row` (category: table, element: row)
- `.ra-date-picker-day--selected` (category: date-picker, element: day, state: selected)

### Best Practices

✅ **Do This**:
- Use `@apply` with Tailwind utilities
- Use `@layer components` (no unlayered CSS)
- Create state variants with `--state` suffix
- Keep classes semantic and descriptive

❌ **Don't Do This**:
- Use `!important`
- Use unlayered CSS (everything in @layer)
- Create vague names like `.ra-special` or `.ra-wrapper`
- Duplicate existing styles

---

## Adding a Form Modal

**When**: Building a modal/dialog with form fields and validation.

**Where**: `code/client/components/[ComponentName].tsx` or `code/client/components/forms/[ComponentName].tsx`

### Pattern Overview

All form modals must follow this structure:
1. Use `ModalTemplate` for consistent modal structure
2. Use `react-hook-form` for validation
3. Wrap fields with `<Form>` component
4. Use `<FormField>` + `<FormItem>` for each field
5. Choose appropriate modal size (sm, md, lg, xl)

**ModalTemplate** provides:
- Automatic header with title + close button
- Divider separator
- Content area with proper spacing
- Footer for action buttons

**Size Guide**:
- `size="xs"`: Extra small (compact modals, actions, quick confirmations - 360px)
- `size="sm"`: Small forms (add vendor, basic modals - 442px)
- `size="md"`: Medium dialogs (standard forms - 600px)
- `size="lg"`: Large dialogs (complex multi-field forms - 800px)
- `size="xl"`: Extra large (full-width forms, complex layouts - 1000px)

### Step 1: Create the Component File

File: `code/client/components/CreateMyResourceModal.tsx`

### Step 2: Implement the Form

```typescript
import { useForm } from "react-hook-form";
import { ModalTemplate } from "@/components/ui/ModalTemplate";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CreateMyResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: MyResourceData) => void;
}

interface MyResourceData {
  name: string;
  category: string;
  email: string;
}

export function CreateMyResourceModal({
  open,
  onOpenChange,
  onSave,
}: CreateMyResourceModalProps) {
  const form = useForm<MyResourceData>({
    defaultValues: {
      name: "",
      category: "",
      email: "",
    },
  });

  const onSubmit = (data: MyResourceData) => {
    onSave(data);
    onOpenChange(false);
    form.reset();
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
      >
        Cancel
      </Button>
      <Button type="submit" form="resource-form">Create</Button>
    </>
  );

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Create Resource"
      size="md"
      footer={footer}
    >
      <Form {...form}>
        <form id="resource-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Field 1: Name */}
          <FormField
            control={form.control}
            name="name"
            rules={{
              required: "Name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            }}
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

          {/* Field 2: Category (Select) */}
          <FormField
            control={form.control}
            name="category"
            rules={{ required: "Category is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cat1">Category 1</SelectItem>
                      <SelectItem value="cat2">Category 2</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Field 3: Email */}
          <FormField
            control={form.control}
            name="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email format",
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
        </form>
      </Form>
    </ModalTemplate>
  );
}
```

### Step 3: Use in Parent Component

```typescript
import { useState } from "react";
import { CreateMyResourceModal } from "@/components/CreateMyResourceModal";

export function MyPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = (data) => {
    // Process the data
    console.log("Saved:", data);
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Create Resource
      </button>

      <CreateMyResourceModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
      />
    </div>
  );
}
```

### Step 4: Document in DESIGN_SYSTEM.md

Add to the relevant section noting:
- File path
- Props interface
- When it's used
- Key fields

### Form Patterns Reference

- **Text Input**: Use `<Input>` component
- **Password**: Use `<Input type="password">`
- **Dropdown/Select**: Use `<Select>` component (already styled)
- **Checkbox**: Use `<Checkbox>` component
- **Textarea**: Use `<Textarea>` component
- **Date**: Use `<DatePicker>` component
- **Validation Rules**: Pass to FormField `rules` prop

### Best Practices

✅ **Do This**:
- Use TypeScript interfaces for form data
- Define validation rules in FormField
- Use `form.reset()` after successful submit
- Show loading state on submit button
- Provide helpful error messages
- Use `<FormMessage />` for auto error display

❌ **Don't Do This**:
- Use useState for form validation
- Create custom error display
- Skip validation
- Leave fields unlabeled
- Hardcode field order (use consistent top-to-bottom)

---

## File Naming & Structure

### UI Components
- **Filename**: `kebab-case.tsx` (e.g., `my-button.tsx`, `date-picker.tsx`)
- **Export Name**: `PascalCase` (e.g., `MyButton`, `DatePicker`)
- **Variants**: Export `myButtonVariants`, `datePickerVariants`
- **Location**: `components/ui/`

### Page Components & Modals
- **Filename**: `PascalCase.tsx` (e.g., `CreateMyResourceModal.tsx`)
- **Export Name**: `PascalCase` (e.g., `CreateMyResourceModal`)
- **Location**: `components/` or `components/forms/` for forms

### Styles (CSS)
- **Global Classes**: In `code/client/global.css`
- **Naming**: `.ra-[category]-[element]--[state]`
- **Layer**: All in `@layer components`

---

## Code Patterns

### Pattern 1: Forward Ref
Every component that might need a ref should use `React.forwardRef`:

```typescript
export const MyComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("classes", className)} {...props} />
));

MyComponent.displayName = "MyComponent";
```

### Pattern 2: Class Merging with cn()
Always use `cn()` to merge classes safely:

```typescript
<div className={cn("base-classes", isActive && "active-classes", className)} />
```

### Pattern 3: Variants with CVA
Use `class-variance-authority` for variants:

```typescript
const variants = cva("base", {
  variants: {
    variant: {
      default: "style1",
      secondary: "style2",
    },
  },
  defaultVariants: { variant: "default" },
});
```

### Pattern 4: Form Field
Every form field should follow this:

```typescript
<FormField
  control={form.control}
  name="fieldName"
  rules={{ required: "Required" }}
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label *</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Pattern 5: Dialog/Modal
Every modal should follow this:

```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      {/* Buttons */}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Testing Your Changes

### Before Committing

1. ✅ Component renders without errors
2. ✅ All variants work as expected
3. ✅ Responsive on mobile/tablet
4. ✅ Keyboard navigation works (if interactive)
5. ✅ No console errors or warnings
6. ✅ Updated DESIGN_SYSTEM.md with new component/class info

### Checklist for New Components

- [ ] File created in correct location (`components/ui/` for UI)
- [ ] Component uses `React.forwardRef`
- [ ] Component has `displayName` set
- [ ] Component uses `cn()` for classes
- [ ] Component uses `cva` for variants (if applicable)
- [ ] JSDoc comments with `@example`
- [ ] Exported from file
- [ ] Added to DESIGN_SYSTEM.md Component Inventory
- [ ] Tested in the app

### Checklist for New Global Classes

- [ ] Added to `code/client/global.css` in `@layer components`
- [ ] Follows naming convention `.ra-[category]-[element]--[state]`
- [ ] Uses `@apply` with Tailwind utilities
- [ ] No `!important` used
- [ ] Added to DESIGN_SYSTEM.md Global Styles section
- [ ] Used in at least 3 places (validated requirement)

### Checklist for New Forms

- [ ] Uses `react-hook-form` + Form components
- [ ] All fields wrapped with `<FormItem>` + `<FormLabel>` + `<FormControl>` + `<FormMessage>`
- [ ] Validation rules in FormField `render` function
- [ ] TypeScript interface for form data
- [ ] Error messages are helpful
- [ ] Form resets after submit
- [ ] Wrapped in Dialog if it's a modal
- [ ] Added to DESIGN_SYSTEM.md with location and pattern

---

## Questions?

- Check `DESIGN_SYSTEM.md` first
- Look at similar existing components in `components/ui/`
- Reference working examples in `components/` directory

**Update both files** (code + DESIGN_SYSTEM.md) before considering your change complete.
