import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Calendar,
  MoreVertical,
  Bell,
  Edit,
  Upload,
  Link,
  Mail,
  Send,
  Paperclip,
} from "lucide-react";
import WorkOrders from "./WorkOrders";
import { fetchJSON } from "@/api/fetchJSON";


function renderUpdateDescription(u) {
  switch (u.update_type) {
    case "task_created":
      return <>created this task</>;

    case "status_changed":
      return (
        <>
          updated status from{" "}
          <span className="text-[#2463eb] font-medium">
            {u.old_value?.status}
          </span>{" "}
          to{" "}
          <span className="text-[#059669] font-medium">
            {u.new_value?.status}
          </span>
        </>
      );

    case "priority_changed":
      return (
        <>
          updated priority from{" "}
          <span className="text-[#2463eb] font-medium">
            {u.old_value?.priority}
          </span>{" "}
          to{" "}
          <span className="text-[#059669] font-medium">
            {u.new_value?.priority}
          </span>
        </>
      );

    case "fto_created":
      return (
        <>
          created Field Team Order{" "}
          <span className="text-[#2463eb] font-medium">
            #{u.new_value?.fto_id}
          </span>
        </>
      );

    default:
      return <>made an update</>;
  }
}

export default function TaskSummary() {
  const { taskId } = useParams<{ taskId: string }>();
  const [activeTab, setActiveTab] = useState("workorders");
  const [messageText, setMessageText] = useState("");
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);
  
  useEffect(() => {
    async function loadAttachments() {
      try {
        const list = await fetchJSON(`/maintenance/attachments/tasks/${taskId}`);
        setAttachments(list || []);
      } catch (err) {
        console.error("Failed to load attachments:", err);
      } finally {
        setLoadingAttachments(false);
      }
    }
  
    loadAttachments();
  }, [taskId]);
  
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchJSON(`/maintenance/tasks/summary?id=${taskId}`);
        setSummary(data);
      } catch (err) {
        console.error("Failed to load summary:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [taskId]);
  

  useEffect(() => {
    async function loadUpdates() {
      try {
        const data = await fetchJSON(`/maintenance/tasks/updates/${taskId}`);
        setUpdates(data || []);
      } catch (err) {
        console.error("Failed to load updates:", err);
      } finally {
        setLoadingUpdates(false);
      }
    }
  
    loadUpdates();
  }, [taskId]);
  
  if (loading || !summary) {
    return <div className="p-6">Loading...</div>;
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const form = new FormData();
    form.append("file", file);
  
    try {
      const res = await fetch(`/maintenance/attachments/tasks/${taskId}`, {
        method: "POST",
        body: form,
      });
  
      if (!res.ok) {
        console.error("Upload failed:", await res.text());
        return;
      }
  
      const newFile = await res.json();
  
      // Update the UI immediately
      setAttachments((prev) => [...prev, newFile]);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      // Reset so user can re-upload same file if needed
      e.target.value = "";
    }
  }
  
  
  return (
    <div
      className="flex flex-col px-6 py-9 pb-6 bg-white border-l"
      style={{ borderLeftColor: "rgb(210,209,207)" }}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between gap-10 flex-wrap w-full">
        <div className="flex flex-col justify-start font-['Geist',sans-serif]">
        <div className="text-[#303030] text-[28px] font-semibold leading-[1.07]">
          {summary.title}
        </div>
        <div className="flex items-center gap-1 mt-1 text-base text-[#717179] font-medium">
          <span>ID</span>
          <span>/</span>
          <span>{summary.reference_number}</span>
        </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 min-h-[40px] px-4 py-2.5 bg-[#013764] text-white rounded-lg shadow-[0px_0px_0px_1px_rgba(0,45,90,1)] font-['Geist',sans-serif] text-base font-medium hover:bg-[#014777] transition-colors">
            Update task
          </button>
          <button className="flex items-center justify-center w-10 h-10 bg-white border border-[#dadada] rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex flex-col mt-9 w-full">
        <div className="flex items-start gap-6 min-h-[36px] w-full border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#717179] font-medium">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-1.5 py-2 ${
              activeTab === "summary"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab("workorders")}
            className={`flex items-center gap-1.5 py-2 ${
              activeTab === "workorders"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Work orders
          </button>
          <button
            onClick={() => setActiveTab("fieldteam")}
            className={`flex items-center gap-1.5 py-2 ${
              activeTab === "fieldteam"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Field Team Orders
          </button>
        </div>

        {/* Notifications Banner */}
        {activeTab === "workorders" && (
          <div className="flex flex-col mt-5 w-full border border-[#e3e3e3] rounded-[10px] overflow-hidden font-['Geist',sans-serif]">
            <div className="flex items-center justify-between gap-10 px-3 py-3 bg-[#f9f9f9] max-w-full flex-wrap">
              <div className="flex items-center gap-2">
                <Bell className="w-[18px] h-[18px]" />
                <div className="text-base text-[#303030] font-bold tracking-[-0.32px]">
                  Notifications
                </div>
              </div>
            </div>
            <div className="flex flex-col px-3 py-3 bg-white">
              <div className="flex items-center justify-between flex-wrap">
                <div className="flex items-center gap-2 min-w-[240px] flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]"></div>
                  <div className="text-base text-[#303030]">
                    A bill from Edgerton Inc. was uploaded, would you like to update work order status?
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm tracking-[-0.28px]">
                  <button className="text-[#303030] underline hover:no-underline">
                    Dismiss
                  </button>
                  <button className="text-[#2463eb] hover:underline">
                    Approve
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-[240px] flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]"></div>
                  <div className="text-base text-[#303030]">
                    Estimate differed from invoice by $50.50
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm tracking-[-0.28px]">
                  <button className="text-[#303030] underline hover:no-underline">
                    Dismiss
                  </button>
                  <button className="text-[#2463eb] hover:underline">
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "summary" && (
          <div className="flex flex-col mt-5 w-full border border-[#e3e3e3] rounded-[10px] overflow-hidden font-['Geist',sans-serif]">
            <div className="flex items-center justify-between gap-10 px-3 py-3 bg-[#f9f9f9] max-w-full flex-wrap">
              <div className="flex items-center gap-2">
                <Bell className="w-[18px] h-[18px]" />
                <div className="text-base text-[#303030] font-bold tracking-[-0.32px]">
                  Notifications
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-3 bg-white flex-wrap">
              <div className="flex items-center gap-2 min-w-[240px] flex-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]"></div>
                <div className="text-base text-[#303030]">
                  Task looks similar to a previous task XYZ. Would you like to
                  link tasks?
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm tracking-[-0.28px]">
                <button className="text-[#303030] underline hover:no-underline">
                  Dismiss
                </button>
                <button className="text-[#2463eb] hover:underline">
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Section */}
        <div className="flex flex-col mt-5 w-full px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
          <div className="flex items-center justify-between gap-10 w-full flex-wrap">
            <div className="flex items-center gap-5 min-w-[240px] flex-wrap">
              <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                <div className="text-[#303030] font-medium">Status</div>
                <div className="flex items-center justify-between gap-5 px-1.5 pr-3 py-1.5 bg-white border border-[#dadada] rounded-lg shadow-sm w-[159px]">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#d1fae5] rounded-2xl text-[#059669] text-sm tracking-[-0.28px]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="flex-shrink-0"
                    >
                      <path
                        d="M3.5 7L5.83333 9.33333L10.5 4.66667"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{summary.status}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                <div className="text-[#303030] font-medium">Priority</div>
                <div className="flex items-center justify-between gap-5 px-1.5 pr-3 py-1.5 bg-white border border-[#dadada] rounded-lg shadow-sm w-[135px]">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#dbe9fe] rounded-2xl text-[#2463eb] text-sm tracking-[-0.28px]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="flex-shrink-0"
                    >
                      <path
                        d="M2.91602 7H11.0827"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{summary.priority}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#303030] flex-1 min-w-0">
                <div className="text-sm font-medium">Due Date</div>
                <div className="flex items-center justify-between gap-4 px-3 py-1.5 bg-white border border-[#dadada] rounded-lg shadow-sm text-base tracking-[-0.32px] w-[149px]">
                  <span>{summary.due_date ? new Date(summary.due_date).toLocaleDateString() : "None"}</span>
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-[#303030] tracking-[-0.28px]">
              <span className="font-normal">Last Updated</span>
              <span className="font-medium">{summary.last_updated ? new Date(summary.last_updated).toLocaleDateString() : "None"}</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex mt-5 w-full gap-6 flex-wrap lg:flex-nowrap">
          {/* Show WorkOrders component when work orders tab is active */}
          {activeTab === "workorders" && <WorkOrders />}

          {/* Show summary content when summary tab is active */}
          {activeTab === "summary" && (
            <>
              {/* Left Column */}
              <div className="flex flex-col min-w-[240px] flex-1">
            {/* Task Details Card */}
            <div className="flex flex-col w-full px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
              <div className="flex justify-between items-start gap-10 w-full flex-wrap">
                <div className="flex flex-col min-w-[240px] flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-[#303030] text-[22px] font-semibold leading-[1.36]">
                      Overview
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-[#717179] font-medium">
                    Created by{" "}
                    <span className="font-bold text-[#2463eb]">
                      {summary.created_by?.name}
                    </span>{" "}
                    for{" "}
                    <span className="font-bold text-[#2463eb]">
                      {summary.property.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-[#717179] tracking-[-0.28px]">
                  <span>Created</span>
                  <span>{summary.date_requested ? new Date(summary.date_requested).toLocaleDateString() : "None"}</span>
                  <Edit className="w-4 h-4 ml-2 text-[#2463eb]" />
                  <span className="text-[#2463eb] font-medium">Edit</span>
                </div>
              </div>

              <div className="flex flex-col mt-5 w-full items-start text-sm text-[#717179]">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Category:</span>
                  <span className="font-medium">{summary.category}</span>
                </div>
              </div>

              <div className="mt-5 text-sm text-[#717179] font-semibold">
                Description:
              </div>
              <div className="mt-5 text-sm text-[#717179] font-medium leading-4">
                {summary.description}
              </div>

              <div className="w-full h-px bg-[#e5e5e5] mt-5"></div>   

              <div className="flex items-center gap-8 mt-5 flex-wrap">
                <div className="flex flex-col items-center">
                  <div className="text-sm text-[#717179]">TOTAL EXPENSE</div>
                  <div className="mt-1 text-2xl text-[#303030] font-medium">
                    ${summary.total_expense.toFixed(2)}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-sm text-[#717179]">WORK ORDERS</div>
                  <div className="mt-1 text-2xl text-[#303030] font-medium">
                    {summary.work_order_count}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-sm text-[#717179]">FTOs</div>
                  <div className="mt-1 text-2xl text-[#303030] font-medium">
                    {summary.fto_count}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
              <div className="text-base text-[#303030] font-medium">Notes</div>
              <textarea
                placeholder="Add some note here"
                className="mt-4 min-h-[81px] w-full px-3 py-2 bg-white border border-[#dadada] rounded-lg text-sm text-[#303030] placeholder:text-[#a1a1a9] resize-none focus:outline-none focus:border-[#2463eb]"
                rows={4}
              />
            </div>

            {/* Files Section */}
            <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
              <div className="text-base text-[#303030] font-medium">Files</div>
              <div className="mt-4 flex flex-col items-center px-52 py-7 bg-white border border-dashed border-[rgba(18,18,18,0.4)] rounded-lg">
                <input
                  type="file"
                  id="task-file-input"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e)}
                />
                <button
                  onClick={() => document.getElementById("task-file-input").click()}
                  className="flex items-center gap-2 min-h-[36px] px-3 py-1.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm text-base text-[#303030] tracking-[-0.32px] hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                <div className="mt-3 px-2.5 py-2.5 flex flex-col items-center text-sm text-[#09090b]">
                  <div>Choose a file or drag & drop it here</div>
                  <div className="mt-1.5 text-sm">Maximum 500 MB file size</div>
                </div>
              </div>

              {/* File List */}
              <div className="mt-4 flex flex-col w-full">
                <div className="flex items-center gap-2 text-sm text-[#09090b] font-['Geist',sans-serif] font-medium">
                  <span>Files</span>
                </div>

                {loadingAttachments ? (
                  <div className="mt-2 text-gray-500 text-sm">Loading files...</div>
                ) : attachments.length === 0 ? (
                  <div className="mt-2 text-gray-500 text-sm">No files uploaded</div>
                ) : (
                  <div className="mt-2 flex flex-col gap-2 w-full">
                    {attachments.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => window.open(file.storage_path, "_blank")}
                        className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Icon */}
                          <div className="flex-shrink-0 w-10 h-10 bg-[#ef4444] rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {file.file_type.startsWith("image") ? "IMG" : "FILE"}
                            </span>
                          </div>

                          {/* File info */}
                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            <div className="text-sm text-[#303030] font-medium truncate">
                              {file.file_name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#717179] mt-0.5">
                              <span>{file.file_type}</span>
                              <span>{Math.round(file.file_size / 1024)} KB</span>
                            </div>
                          </div>
                        </div>

                        {/* Delete button - we'll wire up later */}
                        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M2 14L14 2M14 14L2 2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Linked Tasks Section */}
            <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
              <div className="flex items-center justify-between gap-10 text-base font-medium flex-wrap">
                <div className="flex items-center gap-1 text-[#303030]">
                  <span>Linked tasks</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <circle cx="8" cy="8" r="6" fill="#e5e5e5" />
                    <text
                      x="50%"
                      y="50%"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                    >
                      3
                    </text>
                  </svg>
                </div>
                <button className="flex items-center gap-1 text-[#2463eb] tracking-[-0.32px] hover:underline">
                  <Link className="w-4 h-4" />
                  Link tasks
                </button>
              </div>
              <div className="mt-4 flex items-center justify-center min-h-[72px] w-full px-3 py-7 bg-white border border-[#dadada] rounded-lg text-sm text-[#09090b]">
                No linked tasks yet
              </div>
            </div>

            {/* Updates Section */}
            <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-white border border-[#e5e5e5] rounded-lg shadow-sm">
              <div className="text-base text-[#303030] font-['Geist',sans-serif] font-medium mb-4">
                Updates
              </div>

              {/* 2-COLUMN LAYOUT */}
              <div className="flex gap-4">

                {/* LEFT FIXED TIMELINE COLUMN */}
                <div className="flex flex-col items-center w-[72px] pt-[4px]">

                  {/* + BUTTON DOT */}
                  <div className="w-10 h-10 rounded-full bg-[#013764]/10 border-[3px] border-[#013764]/40"></div>

                  {/* CONNECTOR */}
                  <div className="w-[2px] h-10 bg-gray-200 mt-1 mb-1"></div>

                  {/* UPDATE DOTS BELOW */}
                  {updates.map((u, idx) => {
                    let bg = "bg-gray-200";
                    let border = "border-gray-300";
                    let text = "text-gray-600";

                    if (u.update_type === "task_created" || u.update_type === "fto_created") {
                      bg = "bg-[#dbe9fe]";
                      border = "border-[#2463eb]";
                      text = "text-[#2463eb]";
                    } else if (u.update_type === "status_changed" || u.update_type === "priority_changed") {
                      bg = "bg-[#d1fae5]";
                      border = "border-[#059669]";
                      text = "text-[#059669]";
                    }

                    return (
                      <div key={u.id} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full border ${bg} ${border} ${text}`}></div>

                        {idx < updates.length - 1 && (
                          <div className="w-[2px] h-10 bg-gray-200 my-1"></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT CONTENT COLUMN */}
                <div className="flex flex-col flex-1 gap-3">

                  {/* === UPDATE TASK CARD === */}
                  <div className="flex items-center gap-3 pl-[12px] pr-5 py-4 bg-white border border-[#e5e5e5] rounded-xl">
                    <button className="flex items-center justify-center w-10 h-10 bg-[#013764] rounded-full text-white">
                      <span className="text-lg font-semibold">+</span>
                    </button>

                    <div className="text-lg font-medium text-[#013764]">
                      Update Task
                    </div>
                  </div>

                  {/* === UPDATE CARDS === */}
                  {!loadingUpdates &&
                    updates.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-start gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg"
                      >
                        {/* Actor bubble */}
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-base text-[#2463eb] font-semibold flex-shrink-0">
                          {u.actor?.initials || "?"}
                        </div>

                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="text-sm text-[#303030]">
                            <span className="font-medium">{u.actor?.name || "System"}</span>{" "}
                            {renderUpdateDescription(u)}
                          </div>

                          <div className="text-xs text-[#a1a1a9] mt-1">
                            {new Date(u.created_at).toLocaleString()}
                          </div>

                          {u.attachments && u.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#e5e5e5] space-y-2">
                              {u.attachments.map((a) => (
                                <button
                                  key={a.id}
                                  onClick={() => window.open(a.storage_path, "_blank")}
                                  className="flex items-center gap-2 text-xs text-[#2463eb] hover:underline"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  {a.file_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="flex flex-col min-w-[240px] w-[376px]">
            {/* Location Section */}
            <div className="flex flex-col w-full px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm">
              <div className="text-base text-[#303030] font-['Geist',sans-serif] font-medium">
                Location
              </div>
              <div className="flex flex-col mt-3 w-full text-sm">
                <img
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/067809472377195b06444da037ab0e0c9542bf94?placeholderIfAbsent=true"
                  alt="Property"
                  className="w-full aspect-[1.8] rounded-lg object-cover"
                />
                <div className="mt-4 w-full">
                  <div className="text-sm font-['Inter',sans-serif] font-medium">
                    <span className="font-['Geist',sans-serif] font-bold text-[#2463eb]">
                      (C) {summary.property.address_line1}, {summary.property.city}, {summary.property.state} {summary.property.postal_code}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-[#717179] font-['Geist',sans-serif]">
                    {summary.property.full_address}
                  </div>
                </div>
                <img
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b2c68a80effe0893f444c93ea4b66f4db8c65123?placeholderIfAbsent=true"
                  alt="Map"
                  className="mt-6 w-full aspect-[2.33] rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Assignees Section */}
            <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
              <div className="text-base text-[#303030] font-medium">
                Assignees
              </div>
              <div className="mt-4 flex w-full px-0.5 py-0.5 bg-[#f2f2f2] rounded-lg shadow-[0px_0px_0px_1px_rgba(210,209,207,1)] text-sm text-[#282828] text-center">
                <button className="flex items-center justify-center flex-1 px-4 py-1.5 bg-white rounded-md shadow-sm text-[#09090b] font-medium">
                  Staff
                </button>
                <button className="flex items-center justify-center flex-1 px-4 py-1.5 text-[#282828]">
                  Vendors
                </button>
                <button className="flex items-center justify-center flex-1 px-4 py-1.5 text-[#282828]">
                  Field Team
                </button>
              </div>

              <div className="flex flex-col mt-4 w-full">
                <div className="text-sm text-[#303030] font-medium">
                  Assigned to
                </div>
                <div className="flex items-center justify-between mt-3 w-full">
                  <div className="flex items-center gap-2.5 min-w-[240px] flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl text-[#2463eb] font-semibold leading-[0.8]">
                      JL
                    </div>
                    <div className="flex flex-col flex-1 text-sm">
                      <div className="text-[#2463eb] font-medium tracking-[-0.28px]">
                        Julia LoSchiavo   
                      </div>
                      <div className="mt-1 text-[#a1a1a9]">Staff member</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-base text-[#2463eb] font-medium tracking-[-0.32px]">
                      Edit
                    </div>
                    <div className="mt-1 text-sm text-[#a1a1a9]">
                      (203) 927-1280
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

              <div className="flex flex-col mt-4 w-full">
                <div className="text-sm text-[#303030] font-medium">
                  Collaborators
                </div>
                <div className="flex items-center justify-between mt-3 w-full gap-10 text-[#2463eb]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl font-semibold leading-[0.8]">
                      CH
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl font-semibold leading-[0.8]">
                      CS
                    </div>
                  </div>
                  <div className="text-base font-medium tracking-[-0.32px]">
                    Edit
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

              <button className="flex items-center justify-center gap-1 mt-4 w-full text-sm text-[#2463eb] font-medium tracking-[-0.28px] hover:underline">
                <Mail className="w-4 h-4" />
                Email staff
              </button>
            </div>

            {/* Contacts Section */}
            <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
              <div className="text-base text-[#303030] font-medium">
                Contacts
              </div>

              <div className="flex flex-col mt-4 w-full">
                <div className="text-sm text-[#303030] font-medium">
                  Created by
                </div>
                <div className="flex items-center justify-between mt-3 w-full">
                  <div className="flex items-center gap-2.5 min-w-[240px] flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl text-[#2463eb] font-semibold leading-[0.8]">
                      JL
                    </div>
                    <div className="flex flex-col flex-1 text-sm">
                      <div className="text-[#2463eb] font-medium tracking-[-0.28px]">
                        {summary.created_by?.name}
                      </div>
                      <div className="mt-1 text-[#a1a1a9]">Staff member</div>
                    </div>
                  </div>
                  <div className="text-sm text-[#a1a1a9]">{summary.created_by?.email || "No email"}</div>
                </div>
              </div>

              <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

              <div className="flex flex-col mt-4 w-full text-sm">
                <div className="text-[#303030] font-medium">Rental owners</div>
                <div className="flex items-center gap-2.5 mt-3 min-h-[40px] w-full">
                  <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl text-[#2463eb] font-semibold leading-[0.8]">
                    PJ
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="text-[#2463eb] font-medium tracking-[-0.28px]">
                      Peter & Ali Jennison
                    </div>
                    <div className="mt-1 text-[#a1a1a9]">Rental Owner</div>
                  </div>
                  <div className="text-[#a1a1a9]">(203) 927-1280</div>
                </div>
              </div>

              <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

              <button className="flex items-center justify-center gap-1 mt-4 w-full text-sm text-[#2463eb] font-medium tracking-[-0.28px] hover:underline">
                <Mail className="w-4 h-4" />
                Email contacts
              </button>
            </div>

            {/* Client Communication Section */}
            <div className="flex flex-col mt-[18px] min-h-[200px]">
              <div className="flex flex-col w-full max-w-[376px] bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm overflow-hidden px-4 py-6">
                
                <div className="text-lg font-semibold text-[#303030] tracking-[-0.32px]">
                  Client Communication
                </div>

                <div className="flex items-center justify-center mt-6 mb-4">
                  <div className="px-4 py-2 bg-[#e5e5e5] text-[#717179] text-sm rounded-lg font-medium">
                    Coming soon
                  </div>
                </div>

                <div className="text-center text-sm text-[#a1a1a9] font-medium">
                  This feature is currently under development.
                </div>

              </div>
            </div>

            {/* <div className="flex flex-col mt-[18px] min-h-[534px]">
              <div className="flex flex-col w-full max-w-[376px] bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-10 px-4 py-4 bg-white border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#303030]">
                  <div className="font-medium">Client Communication</div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 min-h-[28px] px-3 py-0.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm tracking-[-0.32px] hover:bg-gray-50 transition-colors">
                      English
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <MoreVertical className="w-5 h-5" />
                  </div>
                </div>

                <div className="px-4 space-y-4 mt-4 font-['Geist',sans-serif]">
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                      MT
                    </div>
                    <div className="flex flex-col min-w-[240px] flex-1 text-black">
                      <div className="text-base font-semibold">
                        Michael Tran
                      </div>
                      <div className="mt-2 text-sm leading-4">
                        I just got back from a hiking trip, and the views were
                        breathtaking! You should try it.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                      SP
                    </div>
                    <div className="flex flex-col min-w-[240px] flex-1 text-black">
                      <div className="text-base font-semibold">Sara Patel</div>
                      <div className="mt-2 text-sm leading-4">
                        The new art exhibit at the gallery opens this weekend.
                        Are you interested in going?
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                      DK
                    </div>
                    <div className="flex flex-col min-w-[240px] flex-1 text-black">
                      <div className="text-base font-semibold">David Kim</div>
                      <div className="mt-2 text-sm leading-4">
                        There's a great concert happening in the park next week.
                        We should grab some tickets!
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                      EJ
                    </div>
                    <div className="flex flex-col min-w-[240px] flex-1 text-black">
                      <div className="text-base font-semibold">
                        Emma Johnson
                      </div>
                      <div className="mt-2 text-sm leading-4">
                        I found a cute little cafe that serves the best
                        pastries. Want to check it out together?
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col mt-4 w-full">
                  <div className="flex flex-col px-4 py-4 bg-white border-b border-[#e5e5e5]">
                    <div className="flex min-h-[98px] w-full max-w-[345px] px-5 py-[17px] bg-white border border-[#2463eb] rounded-lg font-['Geist',sans-serif] text-sm text-black leading-4">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="I found a cute little cafe that serves the best pastries. Want to check it out together?"
                        className="flex-1 resize-none focus:outline-none"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-10 mt-2.5 w-full py-px overflow-hidden">
                      <button className="flex items-center justify-center w-[33px] min-h-[28px] px-2 py-1.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        <Paperclip className="w-[17px] h-[17px]" />
                      </button>
                      <button className="flex items-center gap-1.5 w-[156px] min-h-[28px] px-3 pr-2 py-0.5 bg-[#2463eb] border border-[#dadada] rounded-lg shadow-sm font-['Geist',sans-serif] text-base text-white tracking-[-0.32px] hover:bg-[#1d4ed8] transition-colors">
                        Send Message
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
            </>
          )}

          {/* Field Team Orders tab content - placeholder */}
          {activeTab === "fieldteam" && (
            <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
              <p className="text-gray-500 text-lg">Field Team Orders content coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
