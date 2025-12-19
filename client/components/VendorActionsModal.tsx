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
      <DialogContent className="modal-template p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Vendor Actions</DialogTitle>

        <div className="modal-template-header">
          <h2 className="modal-template-title">Actions</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="modal-template-close-btn"
            aria-label="Close"
          >
            <img
              src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2a270b52419cae9104b1782181d0a66d1f416309?placeholderIfAbsent=true"
              alt="Close"
            />
          </button>
        </div>

        <img
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/249a395a76423ecabf7f10a2086df5d9cd674ac7?placeholderIfAbsent=true"
          className="modal-template-divider"
          alt=""
        />

        <div className="flex flex-col gap-4">
          {onEdit && (
            <button
              onClick={() => {
                onEdit();
                onOpenChange(false);
              }}
              className="text-left p-0 border-none bg-none cursor-pointer font-medium text-base text-[#303030] hover:opacity-70"
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
              className="text-left p-0 border-none bg-none cursor-pointer font-medium text-base text-[#303030] hover:opacity-70"
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
              className="text-left p-0 border-none bg-none cursor-pointer font-medium text-base text-red-600 hover:opacity-70"
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
