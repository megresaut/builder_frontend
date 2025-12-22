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
    >
      <div className="flex flex-col gap-4 text-[#303030] text-sm font-medium">
        <button className="ra-modal-cancel-btn" onClick={onEdit}>
          Edit Vendor
        </button>
        <button className="ra-modal-cancel-btn" onClick={onInactivate}>
          Inactivate Vendor
        </button>
        <button className="ra-modal-cancel-btn" onClick={onDelete}>
          Delete Vendor
        </button>
      </div>
    </ModalTemplate>
  );
}
