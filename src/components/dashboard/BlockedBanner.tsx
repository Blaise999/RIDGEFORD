import { ShieldAlert } from "lucide-react";

export function BlockedBanner() {
  return (
    <div className="mx-5 sm:mx-8 mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-red-500/15 text-red-300 grid place-items-center shrink-0">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[15px] font-semibold text-red-200">
          Your account is currently suspended.
        </div>
        <p className="text-[13.5px] text-red-300 mt-0.5">
          You can still view your balance and past transactions, but you cannot send money or initiate transfers.
          Please contact support to resolve this.
        </p>
      </div>
    </div>
  );
}
