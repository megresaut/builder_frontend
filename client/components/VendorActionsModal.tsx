import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-template">
        <DialogTitle className="sr-only">Vendor Actions</DialogTitle>

        <div className="modal-template-header">
          <h2 className="modal-template-title">Actions</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="modal-template-close-btn"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-[#303030]"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-template-divider" />

        <div className="flex flex-col gap-4">
          {onEdit && (
            <button
              onClick={() => {
                onEdit();
                onOpenChange(false);
              }}
              className="text-[#1357D5] font-medium text-base hover:underline bg-none border-none cursor-pointer p-0 text-left"
            >
              Edit Vendor
            </button>
          )}

          {onInactivate && (
            <button
              onClick={() => {
                onInactivate();
                onOpenChange(false);
              }}
              className="text-[#1357D5] font-medium text-base hover:underline bg-none border-none cursor-pointer p-0 text-left"
            >
              Inactivate Vendor
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
              className="text-red-600 font-medium text-base hover:underline bg-none border-none cursor-pointer p-0 text-left"
            >
              Delete Vendor
            </button>
          )}
        </div>

        <div className="modal-template-footer">
          <button
            onClick={() => onOpenChange(false)}
            className="modal-template-cancel-btn"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
