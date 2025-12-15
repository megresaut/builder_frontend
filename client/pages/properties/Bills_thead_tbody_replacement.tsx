// This is the pattern for Bills table thead and tbody replacement
// Replace the entire <thead>...</thead> section (lines 1026-1237) with this dynamic version:

<thead>
  <tr className="border-b border-gray-200 bg-gray-50 h-12">
    {billsColumnManagement.columnOrder.map((columnKey) => {
      if (!billsColumnManagement.visibleColumns.has(columnKey)) {
        return null;
      }
      if (columnKey === "status" && selectedTab === "approved") {
        return null; // Skip status column for approved bills
      }
      return (
        <th
          key={columnKey}
          className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ lineHeight: "24px" }}
          onClick={() => handleSortClick(columnKey)}
        >
          <div className="flex items-center gap-2">
            {billsColumnConfig[columnKey]?.icon}
            <span className="font-medium text-sm text-gray-700">
              {billsColumnConfig[columnKey]?.label || columnKey}
            </span>
            {getSortIndicator(columnKey) && (
              <span className="text-xs font-bold text-gray-500">
                {getSortIndicator(columnKey)}
              </span>
            )}
          </div>
        </th>
      );
    })}
    <th
      className="sticky right-0 px-2 py-3 text-center border-gray-200 w-20"
      style={{
        borderLeftWidth: "2px",
        borderLeftColor: "rgb(210,209,207)",
        backgroundColor: "white",
      }}
    >
      <span className="font-medium text-sm text-gray-700">
        Actions
      </span>
    </th>
  </tr>
</thead>

// And replace the tbody with this:

<tbody>
  {getSortedData()
    .slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    )
    .map((bill) => {
      const handleRowClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("td:last-child")) {
          return;
        }
        const isApproved = selectedTab === "approved";
        const path = propertyId
          ? `/property/${propertyId}/bills/record${isApproved ? "?readOnly=true" : ""}`
          : `/bills/record${isApproved ? "?readOnly=true" : ""}`;
        navigate(path);
      };

      const renderBillCell = (columnKey: string) => {
        switch (columnKey) {
          case "vendor":
            return (
              <div className="flex items-center gap-2">
                <VendorAvatar name={bill.vendor} color={bill.vendorColor} />
                <span className="text-gray-900 font-normal text-sm">
                  {bill.vendor}
                </span>
              </div>
            );
          case "statementDate":
            return (
              <span className="text-gray-900 font-normal text-sm">
                {bill.statementDate}
              </span>
            );
          case "dueDate":
            return (
              <span className="text-gray-900 font-normal text-sm">
                {bill.dueDate}
              </span>
            );
          case "memo":
            return (
              <span className="text-gray-900 font-normal text-sm truncate max-w-xs block">
                {bill.memo}
              </span>
            );
          case "invoiceNumber":
            return (
              <span className="text-gray-900 font-normal text-sm">
                {bill.invoiceNumber}
              </span>
            );
          case "amount":
            return (
              <span className="text-gray-900 font-normal text-sm">
                ${bill.amount}
              </span>
            );
          case "status":
            return (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-900 font-normal text-sm">
                  {getTimeAgo(bill.importedAt)}
                </span>
              </div>
            );
          default:
            return null;
        }
      };

      return (
        <tr
          key={bill.id}
          className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12 cursor-pointer"
          onClick={handleRowClick}
        >
          {billsColumnManagement.columnOrder.map((columnKey) => {
            if (!billsColumnManagement.visibleColumns.has(columnKey)) {
              return null;
            }
            if (columnKey === "status" && selectedTab === "approved") {
              return null;
            }
            return (
              <td
                key={columnKey}
                className="px-3 py-3 border-r border-gray-200 whitespace-nowrap"
              >
                {renderBillCell(columnKey)}
              </td>
            );
          })}
          <td
            className="sticky right-0 px-2 py-3 border-gray-200 w-20 flex items-center justify-center"
            style={{
              borderLeftWidth: "1px",
              backgroundColor: "white",
            }}
          >
            <ActionButton
              billId={bill.id}
              bill={bill}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              tab={selectedTab}
              propertyId={propertyId}
            />
          </td>
        </tr>
      );
    })}
</tbody>