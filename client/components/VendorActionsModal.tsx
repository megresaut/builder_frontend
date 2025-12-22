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
  const footer = (
    <div
      onClick={() => onOpenChange(false)}
      style={{
        borderRadius: "8px",
        backgroundColor: "rgba(251, 251, 251, 1)",
        border: "1px solid rgba(218, 218, 218, 1)",
        alignSelf: "stretch",
        display: "flex",
        marginTop: "auto",
        marginBottom: "auto",
        minHeight: "36px",
        paddingLeft: "12px",
        paddingRight: "12px",
        paddingTop: "7px",
        paddingBottom: "7px",
        alignItems: "center",
        gap: "8px",
        color: "rgba(48, 48, 48, 1)",
        fontWeight: "400",
        letterSpacing: "-0.32px",
        lineHeight: 1.4,
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
      }}
    >
      <div style={{ alignSelf: "stretch", marginTop: "auto", marginBottom: "auto" }}>
        Cancel
      </div>
    </div>
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
