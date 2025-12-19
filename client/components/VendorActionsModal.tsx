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
      <DialogContent className="small-modal p-0 gap-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Vendor Actions</DialogTitle>

        <div className="small-modal-header-wrapper">
          <div className="small-modal-header">
            <div>Actions</div>
            <img
              loading="lazy"
              src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2a270b52419cae9104b1782181d0a66d1f416309?placeholderIfAbsent=true"
              className="small-modal-close-btn"
              onClick={() => onOpenChange(false)}
              alt="Close"
            />
          </div>
          <img
            loading="lazy"
            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/249a395a76423ecabf7f10a2086df5d9cd674ac7?placeholderIfAbsent=true"
            className="small-modal-divider"
            alt=""
          />
        </div>

        <div className="small-modal-footer">
          <div
            onClick={() => onOpenChange(false)}
            className="small-modal-cancel-btn"
          >
            <div className="self-stretch my-auto">Cancel</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
