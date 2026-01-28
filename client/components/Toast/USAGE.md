# Toast Notification System - Usage Guide

The Toast notification system provides a simple way to display temporary notifications to users with auto-dismiss and manual close capabilities.

## Basic Setup

The `ToastProvider` is already integrated in `App.tsx`, so you can use the `useToastNotification` hook anywhere in your app.

## Usage Examples

### Simple Success Message
```tsx
import { useToastNotification } from '@/hooks/useToastNotification';

function MyComponent() {
  const toast = useToastNotification();

  const handleSubmit = () => {
    toast.showSuccess('Success!');
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

### With Detailed Message
```tsx
const toast = useToastNotification();

toast.showError('Failed to save', {
  message: 'Please check your connection and try again',
});
```

### Custom Duration
```tsx
// Show for 5 seconds instead of default 3 seconds
toast.showInfo('Processing...', {
  duration: 5000,
});
```

## Available Methods

All methods accept a `title` (string) and optional `options` object:

### `toast.showSuccess(title, options?)`
- **Type**: Success (green)
- **Icon**: Checkmark circle
- **Example**: `toast.showSuccess('Profile saved')`

### `toast.showError(title, options?)`
- **Type**: Error (red)
- **Icon**: Error circle
- **Example**: `toast.showError('Something went wrong')`

### `toast.showWarning(title, options?)`
- **Type**: Warning (amber/yellow)
- **Icon**: Warning triangle
- **Example**: `toast.showWarning('This action cannot be undone')`

### `toast.showInfo(title, options?)`
- **Type**: Info (blue)
- **Icon**: Info circle
- **Example**: `toast.showInfo('Loading data...')`

## Options

```typescript
interface ToastOptions {
  message?: string;      // Optional detailed message
  duration?: number;     // Auto-dismiss time in ms (default: 3000)
}
```

## Features

- **Auto-dismiss**: Notifications automatically disappear after 3 seconds (configurable)
- **Manual close**: Users can click the X button to dismiss immediately
- **Progress indicator**: Visual progress bar shows remaining time before auto-dismiss
- **Multiple toasts**: Multiple notifications can be displayed and will stack vertically
- **Accessibility**: Proper ARIA labels for screen readers
- **Animations**: Smooth slide-in and fade-out animations

## Examples in Context

### Form Submission
```tsx
const toast = useToastNotification();

const handleFormSubmit = async (data) => {
  try {
    const response = await api.post('/submit', data);
    toast.showSuccess('Form submitted successfully', {
      message: `ID: ${response.id}`,
    });
  } catch (error) {
    toast.showError('Failed to submit form', {
      message: error.message,
    });
  }
};
```

### Task Completion
```tsx
const toast = useToastNotification();

const handleTaskComplete = () => {
  updateTask({ status: 'complete' });
  toast.showSuccess('Task marked as complete');
};
```

### Validation Feedback
```tsx
const toast = useToastNotification();

if (form.errors.length > 0) {
  toast.showWarning('Form has errors', {
    message: `${form.errors.length} field(s) need attention`,
  });
}
```

## Styling

The toast system uses TailwindCSS and CSS variables. Colors are:

- **Success**: Emerald (#059669)
- **Error**: Red (#ef4444)
- **Warning**: Amber (#f59e0b)
- **Info**: Blue (#2463eb)

All toasts display in the top-right corner of the screen with a 12px padding gap.

## Component Hierarchy

```
ToastProvider (manages global state)
  └─ ToastDisplay (renders notification container)
      └─ Toast (individual notification)
```

## Accessing Context Directly (Advanced)

If you need direct access to the toast context (not recommended for typical use):

```tsx
import { useToastContext } from '@/components/Toast';

function AdvancedComponent() {
  const { toasts, addToast, removeToast } = useToastContext();

  // Direct toast manipulation
  const toastId = addToast({
    type: 'info',
    title: 'Custom toast',
    message: 'Using context directly',
    duration: 3000,
  });

  // Remove specific toast
  const removeSpecificToast = () => removeToast(toastId);

  return <button onClick={removeSpecificToast}>Remove Toast</button>;
}
```
