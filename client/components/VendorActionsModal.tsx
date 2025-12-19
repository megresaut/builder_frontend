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
      <DialogContent className="small-modal gap-0 [&>button]:hidden" style={{ padding: '32px' }}>
        <DialogTitle className="sr-only">Vendor Actions</DialogTitle>

        <div className="flex w-full flex-col text-2xl text-[#303030] font-semibold" style={{ lineHeight: 1.08 }}>
          <div className="flex w-full items-start justify-between" style={{ gap: '40px 100px' }}>
            <div>Actions</div>
            <img
              loading="lazy"
              src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2a270b52419cae9104b1782181d0a66d1f416309?placeholderIfAbsent=true"
              style={{ width: '18px', aspectRatio: 1, objectFit: 'contain', objectPosition: 'center', cursor: 'pointer' }}
              onClick={() => onOpenChange(false)}
              alt="Close"
            />
          </div>
          <img
            loading="lazy"
            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/249a395a76423ecabf7f10a2086df5d9cd674ac7?placeholderIfAbsent=true"
            style={{ width: '100%', aspectRatio: '333.33', objectFit: 'contain', objectPosition: 'center', marginTop: '16px' }}
            alt=""
          />
        </div>

        <div className="flex mt-7 w-full items-center gap-2.5 justify-end text-base whitespace-nowrap">
          <div
            onClick={() => onOpenChange(false)}
            style={{
              borderRadius: '8px',
              backgroundColor: 'rgba(251, 251, 251, 1)',
              border: '1px solid rgba(218, 218, 218, 1)',
              alignSelf: 'stretch',
              display: 'flex',
              marginTop: 'auto',
              marginBottom: 'auto',
              minHeight: '36px',
              paddingLeft: '12px',
              paddingRight: '12px',
              paddingTop: '7px',
              paddingBottom: '7px',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(48, 48, 48, 1)',
              fontWeight: '400',
              letterSpacing: '-0.32px',
              lineHeight: 1.4,
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ alignSelf: 'stretch', marginTop: 'auto', marginBottom: 'auto' }}>Cancel</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
