import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditUtilityAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "add" | "edit";
  editData?: {
    provider: string;
    accountNumber: string;
    status: "active" | "inactive";
    username: string;
    password: string;
  } | null;
}

export default function EditUtilityAccountModal({
  open,
  onOpenChange,
  mode = "edit",
  editData,
}: EditUtilityAccountModalProps) {
  const [provider, setProvider] = useState(editData?.provider || "");
  const [accountNumber, setAccountNumber] = useState(editData?.accountNumber || "");
  const [status, setStatus] = useState<"active" | "inactive">(editData?.status || "active");
  const [username, setUsername] = useState(editData?.username || "");
  const [password, setPassword] = useState(editData?.password || "");

  const isAddMode = mode === "add";
  const title = isAddMode ? "Add Utility Account" : "Edit Utility Account";
  const buttonText = isAddMode ? "Add Account" : "Save Changes";
  const passwordPlaceholder = isAddMode
    ? "Input Utility Provider Password"
    : "Input Admin Password to see Password";

  useEffect(() => {
    if (mode === "add") {
      setProvider("");
      setAccountNumber("");
      setStatus("active");
      setUsername("");
      setPassword("");
    } else if (editData) {
      setProvider(editData.provider || "");
      setAccountNumber(editData.accountNumber || "");
      setStatus(editData.status || "active");
      setUsername(editData.username || "");
      setPassword(editData.password || "");
    }
  }, [mode, editData]);

  const handleSave = () => {
    const action = isAddMode ? "Adding" : "Saving";
    console.log(`${action} utility account:`, {
      provider,
      accountNumber,
      status,
      username,
      password,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[694px] p-8 gap-0 rounded-2xl">
        <DialogTitle className="text-[#303030] text-2xl font-semibold leading-[1.25] mb-4">
          {title}
        </DialogTitle>

        <div className="flex flex-col gap-4">
          {/* Utility Provider */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] text-sm font-medium leading-[1.43]">
              Utility Provider <span className="text-red-600">*</span>
            </label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-full rounded-lg bg-[#F7F7F7] border-[#E5E5E5] px-3 py-2 text-base text-[#303030] font-normal tracking-[-0.32px] leading-[1.4] data-[state=open]:text-[#303030]">
                <SelectValue placeholder="Select Provider">{provider && provider}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="National Grid">National Grid</SelectItem>
                <SelectItem value="ConEd">ConEd</SelectItem>
                <SelectItem value="Greenwich Water">Greenwich Water</SelectItem>
                <SelectItem value="Optium">Optium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Number and Status */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                Account Number <span className="text-red-600">*</span>
              </label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Input Account Number"
                className="rounded-lg bg-[#F7F7F7] border-[#E5E5E5] px-3 py-2 text-base text-[#303030] font-normal tracking-[-0.32px] leading-[1.4] placeholder:text-[#A1A1A9]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                Status <span className="text-red-600">*</span>
              </label>
              <Select value={status} onValueChange={(val) => setStatus(val as "active" | "inactive")}>
                <SelectTrigger className="w-full rounded-lg bg-[#F7F7F7] border-[#E5E5E5] px-3 py-[5px] min-h-[38px] text-sm text-[#059669] font-normal tracking-[-0.28px] leading-[1.4]">
                  <SelectValue>
                    {status === "active" ? (
                      <div className="flex items-center gap-1.5 bg-[#D1FAE5] rounded-2xl px-3 py-1 w-fit">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[#059669] text-sm">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-red-100 rounded-2xl px-3 py-1 w-fit">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_inactive)">
                            <path d="M8.00065 5.3335V8.00016M8.00065 10.6668H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </g>
                        </svg>
                        <span className="text-red-700 text-sm">Inactive</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Utility Provider Username and Password */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                Utility Provider Username <span className="text-red-600">*</span>
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Input Provider Name"
                className="rounded-lg bg-[#F7F7F7] border-[#E5E5E5] px-3 py-2 text-base text-[#303030] font-normal tracking-[-0.32px] leading-[1.4] placeholder:text-[#A1A1A9]"
              />
            </div>

            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                Utility Provider Password <span className="text-red-600">*</span>
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={passwordPlaceholder}
                className="rounded-lg bg-[#F7F7F7] border-[#E5E5E5] px-3 py-2 text-base text-[#303030] font-normal tracking-[-0.32px] leading-[1.4] placeholder:text-[#A1A1A9]"
              />
            </div>
          </div>

          {/* Save Changes Button */}
          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-[#013764] shadow-[0_0_0_1px_rgba(0,45,90,1)] px-4 py-2 min-h-[36px] flex items-center justify-center gap-2 text-white text-base font-medium mt-2 hover:bg-[#012a4d] transition-colors"
          >
            {buttonText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
