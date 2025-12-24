<thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-12">
                  {tasksColumnManagement.columnOrder.filter(colKey => tasksColumnManagement.visibleColumns.has(colKey)).map((colKey) => {
                    const colConfig = tasksColumnConfig[colKey];
                    const sortIndicator = getTasksSortIndicator(colKey);
                    return (
                      <th
                        key={colKey}
                        draggable
                        onDragStart={() => tasksColumnManagement.handleColumnDragStart(colKey)}
                        onDragOver={(e) => tasksColumnManagement.handleColumnDragOver(e, colKey)}
                        onDragLeave={tasksColumnManagement.handleColumnDragLeave}
                        onDrop={(e) => tasksColumnManagement.handleColumnDrop(e, colKey)}
                        onClick={() => handleTasksSortClick(colKey)}
                        className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors relative"
                        style={{
                          opacity: tasksColumnManagement.draggedColumn === colKey ? 0.5 : 1,
                          transition: "opacity 0.2s ease",
                        }}
                      >
                        {tasksColumnManagement.dropTargetColumn === colKey && tasksColumnManagement.draggedColumn && (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              bottom: 0,
                              width: "2px",
                              backgroundColor: "#3b82f6",
                              left: tasksColumnManagement.dropPosition === "before" ? "0" : "auto",
                              right: tasksColumnManagement.dropPosition === "after" ? "0" : "auto",
                            }}
                          />
                        )}
                        <div className="flex items-center gap-2">
                          {colConfig?.icon}
                          <span className="font-medium text-sm text-gray-700">
                            {colConfig?.label}
                          </span>
                          {sortIndicator && (
                            <span className="text-xs font-bold text-gray-700 ml-1">
                              {sortIndicator}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="sticky right-0 px-2 py-3 text-center w-20 bg-white border-l border-gray-200">
                    <span className="font-medium text-sm text-gray-700">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
