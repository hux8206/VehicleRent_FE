"use client";

import React, { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { ArrowLeft, Bug, CheckCircle2, ShieldAlert } from "lucide-react";

export default function SentryExamplePage() {
  const [hasTriggered, setHasTriggered] = useState(false);

  const handleTriggerError = () => {
    setHasTriggered(true);
    // Gửi lỗi thử nghiệm lên Sentry
    Sentry.captureException(new Error("VehicleRent Test Error: Sentry is connected successfully!"));
    // Cũng có thể ném exception trực tiếp
    try {
      // @ts-expect-error test function
      myUndefinedFunction();
    } catch (err) {
      Sentry.captureException(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-6 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto">
          <Bug className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Sentry Verification Page</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Trang thử nghiệm kích hoạt lỗi để xác thực kết nối giữa hệ thống VehicleRent và Dashboard Sentry của bạn.
          </p>
        </div>

        {hasTriggered ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 text-left">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Đã kích hoạt lỗi thử nghiệm và gửi thành công lên Sentry! Bạn có thể kiểm tra tab <b>Issues</b> trên trang Sentry của bạn.
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleTriggerError}
            className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Kích hoạt lỗi thử nghiệm (Trigger Test Error)</span>
          </button>
        )}

        <div className="pt-2 border-t border-slate-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

