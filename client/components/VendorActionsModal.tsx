import { ModalTemplate } from "@/components/ui/ModalTemplate";

interface VendorActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onInactivate?: () => void;
  onDelete?: () => void;
}

export default function VendorActionsModal({
  open,
  onOpenChange,
  onEdit,
  onInactivate,
  onDelete,
}: VendorActionsModalProps) {
  const handleClose = () => onOpenChange(false);

  const footer = (
    <button onClick={handleClose} className="ra-modal-cancel-btn">
      Cancel
    </button>
  );

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Actions"
      size="xs"
      footer={footer}
    />
  );
}
