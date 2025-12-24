/**
 * FORM TEMPLATE EXAMPLE
 * 
 * This is a reference template showing how to build forms in this app.
 * 
 * Copy this structure for any new form modal or form page.
 * 
 * Key patterns:
 * 1. Use react-hook-form useForm hook
 * 2. Wrap with <Form> component
 * 3. Use <FormField> for each field with validation rules
 * 4. Use <FormItem>, <FormLabel>, <FormControl>, <FormMessage> for structure
 * 5. Validation messages auto-display via <FormMessage />
 * 
 * DO NOT:
 * - Use useState for form validation
 * - Create custom error display
 * - Skip FormMessage (errors auto-display)
 * - Mix controlled/uncontrolled inputs
 */

import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

/**
 * Type definition for form data
 * Update this interface when adding/removing fields
 */
interface FormTemplateData {
  name: string;
  email: string;
  category: string;
  description: string;
  isActive: boolean;
  priority: string;
}

/**
 * Modal Props
 */
interface FormTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: FormTemplateData) => Promise<void> | void;
  initialData?: Partial<FormTemplateData>; // For edit mode
}

/**
 * FORM MODAL COMPONENT
 * 
 * This component can be used as:
 * 1. A creation modal (empty form)
 * 2. An edit modal (pre-populated form)
 * 3. A standalone form page
 */
export function FormTemplateModal({
  open,
  onOpenChange,
  onSave,
  initialData,
}: FormTemplateModalProps) {
  // Initialize form with default values
  const form = useForm<FormTemplateData>({
    defaultValues: initialData || {
      name: "",
      email: "",
      category: "",
      description: "",
      isActive: false,
      priority: "normal",
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormTemplateData) => {
    try {
      // Call the save function (handle API call in parent)
      await onSave(data);

      // Close modal and reset form
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
      // Error handling can be added here if needed
    }
  };

  // Handle modal close
  const handleCancel = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Item" : "Create New Item"}
          </DialogTitle>
        </DialogHeader>

        {/* Form wrapper - provides react-hook-form context */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* ==================== FIELD 1: TEXT INPUT ==================== */}
            <FormField
              control={form.control}
              name="name"
              // Validation rules
              rules={{
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
                maxLength: {
                  value: 100,
                  message: "Name cannot exceed 100 characters",
                },
              }}
              // Render the field UI
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter name"
                      {...field} // Spreads value, onChange, onBlur
                    />
                  </FormControl>
                  {/* Optional description text */}
                  <FormDescription>
                    Enter a descriptive name for this item
                  </FormDescription>
                  {/* Error message auto-displays if validation fails */}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ==================== FIELD 2: EMAIL INPUT ==================== */}
            <FormField
              control={form.control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ==================== FIELD 3: SELECT DROPDOWN ==================== */}
            <FormField
              control={form.control}
              name="category"
              rules={{
                required: "Category is required",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ==================== FIELD 4: TEXTAREA ==================== */}
            <FormField
              control={form.control}
              name="description"
              rules={{
                required: "Description is required",
                minLength: {
                  value: 10,
                  message: "Description must be at least 10 characters",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about this item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ==================== FIELD 5: CHECKBOX ==================== */}
            <FormField
              control={form.control}
              name="isActive"
              // Checkbox doesn't need required rule (boolean is always set)
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="mb-0">Mark as active</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ==================== FIELD 6: SELECT WITH PRIORITY ==================== */}
            <FormField
              control={form.control}
              name="priority"
              rules={{
                required: "Priority is required",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ==================== FOOTER BUTTONS ==================== */}
            <DialogFooter className="flex gap-2 justify-end pt-4">
              {/* Cancel Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ==================== USAGE EXAMPLE ====================
 * 
 * In parent component:
 * 
 * import { FormTemplateModal } from "@/components/forms/FormTemplate.example";
 * 
 * export function MyPage() {
 *   const [isOpen, setIsOpen] = useState(false);
 * 
 *   const handleSave = async (data: FormTemplateData) => {
 *     // API call here
 *     const response = await fetch("/api/items", {
 *       method: "POST",
 *       body: JSON.stringify(data),
 *     });
 *     if (!response.ok) throw new Error("Save failed");
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={() => setIsOpen(true)}>Create Item</button>
 *       <FormTemplateModal
 *         open={isOpen}
 *         onOpenChange={setIsOpen}
 *         onSave={handleSave}
 *       />
 *     </div>
 *   );
 * }
 * 
 * ==================== KEY PATTERNS ====================
 * 
 * 1. DATA INTERFACE
 *    - Define type for form data
 *    - Make all fields required (use initialData to prefill)
 * 
 * 2. VALIDATION RULES
 *    - Put in FormField rules prop
 *    - required, minLength, maxLength, pattern are common
 *    - Custom validation: validate: (value) => condition || "error"
 * 
 * 3. FORM SUBMISSION
 *    - Use form.handleSubmit(onSubmit)
 *    - onSubmit receives cleaned data (validated & typed)
 *    - Handle errors in onSubmit or parent
 * 
 * 4. ERROR DISPLAY
 *    - Always include <FormMessage /> in FormItem
 *    - Errors auto-display without extra code
 *    - Don't create manual error handling
 * 
 * 5. FORM RESET
 *    - Call form.reset() after successful submit
 *    - Pass partial data to reset certain fields
 *    - Reset on modal close via handleCancel
 * 
 * 6. LOADING STATE
 *    - Use form.formState.isSubmitting
 *    - Disable submit button while submitting
 *    - Show "Saving..." text on button
 * 
 * ==================== CUSTOMIZATION ====================
 * 
 * For edit mode:
 *   <FormTemplateModal
 *     initialData={existingItem}
 *     onSave={handleUpdate}
 *   />
 * 
 * For standalone page (not modal):
 *   - Replace Dialog wrapper with div className="space-y-6"
 *   - Replace DialogHeader with regular header
 *   - Style footer as needed
 * 
 * For additional fields:
 *   - Add to FormTemplateData interface
 *   - Add FormField in form
 *   - Add validation rules
 *   - FormMessage auto-displays errors
 * 
 * ==================== COMMON VALIDATION RULES ====================
 * 
 * Text fields:
 *   rules={{ required: "Required", minLength: { value: 2, message: "Min 2" } }}
 * 
 * Email:
 *   rules={{ required: "Required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid" } }}
 * 
 * Numbers:
 *   rules={{ required: "Required", pattern: { value: /^\d+$/, message: "Numbers only" } }}
 * 
 * Dropdowns:
 *   rules={{ required: "Required" }}
 * 
 * Checkboxes:
 *   rules={{ validate: (val) => val || "Must be checked" }} // if required to be true
 * 
 * Custom validation:
 *   rules={{ validate: (value) => value !== "reserved" || "This value is reserved" }}
 */
