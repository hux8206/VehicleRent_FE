import React from "react";
import { ShieldCheck, Award, AlertCircle } from "lucide-react";

interface StoreReputationBadgeProps {
  score?: number;
  className?: string;
  showText?: boolean;
}

export function StoreReputationBadge({
  score = 100,
  className = "",
  showText = true,
}: StoreReputationBadgeProps) {
  const currentScore = typeof score === "number" ? score : 100;

  if (currentScore >= 90) {
    return (
      <span
        title={`Điểm uy tín cửa hàng: ${currentScore}/100 (Xuất sắc)`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs ${className}`}
      >
        <Award className="h-3 w-3 text-emerald-600 shrink-0" />
        {showText ? <span>Uy tín {currentScore}đ</span> : <span>{currentScore}đ</span>}
      </span>
    );
  }

  if (currentScore >= 70) {
    return (
      <span
        title={`Điểm uy tín cửa hàng: ${currentScore}/100 (Tốt)`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs ${className}`}
      >
        <ShieldCheck className="h-3 w-3 text-blue-600 shrink-0" />
        {showText ? <span>Uy tín {currentScore}đ</span> : <span>{currentScore}đ</span>}
      </span>
    );
  }

  return (
    <span
      title={`Điểm uy tín cửa hàng: ${currentScore}/100 (Cần cải thiện)`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs ${className}`}
    >
      <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
      {showText ? <span>Uy tín {currentScore}đ</span> : <span>{currentScore}đ</span>}
    </span>
  );
}
