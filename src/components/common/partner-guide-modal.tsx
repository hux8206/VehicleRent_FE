"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Clock, CheckCircle2, Sparkles, ExternalLink } from "lucide-react";

export const PARTNER_GUIDE_VIDEO_ID = "fTreYyAXjIY";
export const PARTNER_GUIDE_EMBED_URL = `https://www.youtube-nocookie.com/embed/${PARTNER_GUIDE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`;
export const PARTNER_GUIDE_WATCH_URL = `https://youtu.be/${PARTNER_GUIDE_VIDEO_ID}?si=wvyEBrEeGHX9KvDu`;

interface PartnerGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal hiển thị video hướng dẫn sử dụng 16:9 sắc nét, responsive cho đối tác
 */
export function PartnerGuideModal({ open, onOpenChange }: PartnerGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-[90vw] p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-slate-800 text-left">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold text-[10px] uppercase tracking-wide gap-1">
              <Sparkles className="h-3 w-3 text-amber-600" /> Hướng Dẫn Đối Tác
            </Badge>
            <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5 text-amber-600" /> Thời lượng: 2 phút
            </span>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Video Hướng Dẫn Thiết Lập Cửa Hàng & Vận Hành Đội Xe
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Xem video hướng dẫn chi tiết từng bước: đăng ký cơ sở chi nhánh, tạo dòng xe, quản lý từng biển số xe và giao nhận xe tại quầy.
          </DialogDescription>
        </DialogHeader>

        {/* Khung video 16:9 sắc nét, responsive tối ưu trên cả điện thoại */}
        <div className="my-2 relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-slate-200 dark:border-slate-800">
          {open && (
            <iframe
              src={PARTNER_GUIDE_EMBED_URL}
              title="Hướng dẫn sử dụng dành cho Đối tác - VehicleRent"
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>

        {/* Tóm tắt các nội dung chính trong video */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Khởi tạo chi nhánh
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Thêm xe &amp; biển số
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Bàn giao xe &amp; đơn quầy
            </span>
          </div>

          <a
            href={PARTNER_GUIDE_WATCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-bold hover:underline shrink-0"
          >
            <span>Mở xem trên YouTube</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PartnerGuideBannerProps {
  className?: string;
}

/**
 * Thẻ banner nhỏ gọn gàng thông báo xem video hướng dẫn cho Đối tác
 */
export function PartnerGuideBanner({ className = "" }: PartnerGuideBannerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={`group relative rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-amber-200/90 dark:border-amber-800/60 dark:from-amber-950/40 dark:to-orange-950/20 ${className}`}
      >
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <PlayCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-2xs">
                Video 2 phút
              </span>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                Dành cho Đối Tác
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-0.5 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              Mới bắt đầu? Xem video hướng dẫn 2 phút thiết lập cửa hàng &amp; quản lý biển số xe
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center shrink-0">
          <Button
            type="button"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 h-8.5 px-3.5 pointer-events-none group-hover:bg-amber-700"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Xem video ngay</span>
          </Button>
        </div>
      </div>

      <PartnerGuideModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
