export const BillStatusBadge = ({
  status,
}: {
  status: "Pushed" | "Push Failed";
}) => {
  const dotColor = status === "Pushed" ? "#059669" : "#DC2626";
  const label = status === "Pushed" ? "Pushed" : "Push Failed";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: dotColor, fontSize: "14px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: dotColor,
          flexShrink: 0,
        }}
      />
      {label}
    </div>
  );
};
