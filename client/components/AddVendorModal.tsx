import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AddVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddVendorModal({
  open,
  onOpenChange,
}: AddVendorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[694px] p-8 gap-0">
        <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px] mb-4">
          Add Vendor
        </DialogTitle>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Vendor Name{" "}
                <span className="text-red-600">*</span>
              </label>
              <Input
                placeholder="Input Vendor Name"
                className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[20px]">
                Primary Email
              </label>
              <Input
                type="email"
                placeholder="Input Vendor Email"
                className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[20px]">
              Vendor Phone Number
            </label>
            <Input
              type="tel"
              placeholder="Input Vendor Phone"
              className="h-10 rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[20px]">
              Notes
            </label>
            <Textarea
              placeholder="Insert Vendor Notes"
              className="min-h-[169px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%] resize-none"
            />
          </div>

          <button className="flex h-9 w-full items-center justify-center gap-2 px-4 rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors mt-2">
            <span className="text-white font-medium text-base">
              Create Vendor
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
