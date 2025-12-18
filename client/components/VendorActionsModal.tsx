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
      <DialogContent className="modal-template max-w-[320px]">
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

        <div className="w-full h-px bg-[#E5E5E5] mt-4 mb-7" />

        <div className="flex flex-col gap-3">
          {onEdit && (
            <button
              onClick={() => {
                onEdit();
                onOpenChange(false);
              }}
              className="flex items-center justify-start px-4 py-3 rounded-lg bg-white border border-[#E5E5E5] text-[#303030] font-medium text-sm hover:bg-gray-50 transition-colors"
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
              className="flex items-center justify-start px-4 py-3 rounded-lg bg-white border border-[#E5E5E5] text-[#303030] font-medium text-sm hover:bg-gray-50 transition-colors"
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
              className="flex items-center justify-start px-4 py-3 rounded-lg bg-white border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors"
            >
              Delete Vendor
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
