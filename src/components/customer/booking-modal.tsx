"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VehicleModel, Promotion, api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  QrCode,
  ShieldCheck,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  MapPin,
  Calendar,
  Loader2,
  Trash2,
  RefreshCw,
  Smartphone,
  Download,
  Tag,
  Ticket,
  ChevronDown,
  ChevronUp,
  X,
  Percent,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { format24hDateTime } from "@/components/common/datetime-24h-picker";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: VehicleModel;
  startTime: string;
  endTime: string;
}

export function BookingModal({
  isOpen,
  onClose,
  model,
  startTime,
  endTime,
}: BookingModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Form states
  const [step, setStep] = useState<"form" | "payment">("form");
  const [pickupType, setPickupType] = useState<number>(0); // 0: Tại cửa hàng, 1: Giao tận nơi
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [paymentType, setPaymentType] = useState<number>(1); // 1: Cọc 30%, 0: Toàn bộ
  const [quantity, setQuantity] = useState<number>(1);
  const [hasAgreedLicense, setHasAgreedLicense] = useState<boolean>(false);
  const [hasAgreedTerms, setHasAgreedTerms] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment states
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [qrInfo, setQrInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [minDeposit, setMinDeposit] = useState<number>(0);

  // Promotion states
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    title: string;
    discountType: number;
    discountValue: number;
    discountAmount: number;
  } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [showPromoList, setShowPromoList] = useState(false);

  useEffect(() => {
    api.config
      .get()
      .then((cfg) => {
        if (cfg?.minDepositPercent !== undefined) {
          setMinDeposit(Number(cfg.minDepositPercent));
        }
      })
      .catch(() => {});
  }, []);

  // Calculation & Time validation
  const start = new Date(startTime);
  const end = new Date(endTime);
  const isTimeValid =
    !isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() > start.getTime();
  const diffHours = isTimeValid
    ? (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    : 0;
  const dayRent = isTimeValid ? Math.ceil(diffHours / 24) : 0;
  const unitPrice = Number(model.rentPrice);
  const maxAvailable = Math.max(1, model.availableCount ?? 1);
  const rentAmount = dayRent * unitPrice * quantity;
  const rawDepositPercent = model.store?.rentalPolicy?.depositPercent !== undefined
    ? Number(model.store.rentalPolicy.depositPercent)
    : minDeposit;
  // Tôn trọng mức cọc tối thiểu do Admin quy định
  const depositPercent = Math.max(minDeposit, rawDepositPercent);
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalRentAmount = Math.max(0, rentAmount - discountAmount);
  const depositAmount =
    paymentType === 1 ? Math.round((finalRentAmount * depositPercent) / 100) : finalRentAmount;

  // Giờ hoạt động của cửa hàng (Requirement 1)
  const storeOpenTime = model.store?.openTime || "07:00";
  const storeCloseTime = model.store?.closeTime || "21:00";

  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const extractMinutesFromStr = (dateTimeStr: string) => {
    if (dateTimeStr && dateTimeStr.includes("T")) {
      const timePart = dateTimeStr.split("T")[1].substring(0, 5);
      const [h, m] = timePart.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    }
    return -1;
  };

  const startMins = extractMinutesFromStr(startTime);
  const endMins = extractMinutesFromStr(endTime);
  const openMins = parseTime(storeOpenTime);
  const closeMins = parseTime(storeCloseTime);

  const isStartWithinHours = startMins === -1 || (startMins >= openMins && startMins <= closeMins);
  const isEndWithinHours = endMins === -1 || (endMins >= openMins && endMins <= closeMins);
  const isOperatingHoursValid = isStartWithinHours && isEndWithinHours;

  // Tải danh sách mã ưu đãi khi mở modal
  useEffect(() => {
    if (isOpen) {
      api.promotions
        .getActive()
        .then((list) => {
          setPromotions(list);
        })
        .catch(() => {});

      // Kiểm tra mã ưu đãi đã lưu tạm từ trang chủ
      try {
        const preCode = sessionStorage.getItem("pending_promo_code");
        if (preCode) {
          setPromoCodeInput(preCode);
        }
      } catch {}
    }
  }, [isOpen]);

  const handleApplyPromo = async (codeToTry?: string) => {
    const code = (codeToTry || promoCodeInput).trim().toUpperCase();
    if (!code) {
      toast.error("Vui lòng nhập mã khuyến mãi!");
      return;
    }
    if (!isTimeValid || dayRent <= 0) {
      toast.error("Vui lòng chọn thời gian thuê hợp lệ trước khi áp dụng mã!");
      return;
    }

    setIsValidatingPromo(true);
    try {
      const res = await api.promotions.validate({
        code,
        dayRent,
        rentAmount,
      });

      if (res.valid) {
        setAppliedPromo({
          code: res.code,
          title: res.title,
          discountType: res.discountType,
          discountValue: res.discountValue,
          discountAmount: res.discountAmount,
        });
        setPromoCodeInput(res.code);
        toast.success(res.message);
        setShowPromoList(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Mã không hợp lệ hoặc chưa đủ điều kiện áp dụng!");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    toast.info("Đã gỡ bỏ mã khuyến mãi.");
  };

  const handleDownloadQr = () => {
    if (!qrInfo?.qrCode) {
      toast.error("Mã QR chưa sẵn sàng để tải về");
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = qrInfo.qrCode;
      link.download = `VietQR-${bookingResult?.booking?.bookingCode || "booking"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã tải mã QR về máy! Bạn có thể quét mã từ thư viện ảnh trên App ngân hàng.");
    } catch {
      window.open(qrInfo.qrCode, "_blank");
    }
  };

  // Countdown timer for 10-minute hold
  useEffect(() => {
    if (step !== "payment" || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.error("Phiên giữ chỗ 10 phút đã hết hạn! Vui lòng đặt lại.");
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft, onClose]);

  // Tự động lắng nghe Webhook PayOS xác nhận thanh toán thành công (polling 2.5s)
  useEffect(() => {
    if (step !== "payment" || !bookingResult?.booking?.id) return;
    const targetBookingId = bookingResult.booking.id;

    const pollInterval = setInterval(async () => {
      try {
        // Chủ động kiểm tra trạng thái thanh toán từ PayOS
        const statusRes = await api.customer.checkPaymentStatus(targetBookingId);
        if (statusRes.paid || statusRes.bookingStatus === 1 || statusRes.bookingStatus === 4) {
          clearInterval(pollInterval);
          toast.success(
            "🎉 Thanh toán thành công! Đơn xe của bạn đã được xác nhận (Confirmed).",
            { duration: 5000 }
          );
          onClose();
          router.push("/customer/bookings");
          return;
        }

        const bookings = await api.customer.getMyBookings();
        const found: any = bookings.find((b: any) => b.id === targetBookingId);
        if (found && (found.status === 1 || found.bookingStatus === 1 || found.bookingStatus === 4)) {
          clearInterval(pollInterval);
          toast.success(
            "🎉 Thanh toán thành công! Đơn xe của bạn đã được xác nhận (Confirmed).",
            { duration: 5000 }
          );
          onClose();
          router.push("/customer/bookings");
        }
      } catch {
        // bỏ qua lỗi mạng tạm thời trong lúc poll
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [step, bookingResult, onClose, router]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTimeValid) {
      toast.error("Thời gian trả xe phải sau thời gian nhận xe! Vui lòng chọn lại thời gian đặt xe.");
      return;
    }
    if (!isOperatingHoursValid) {
      toast.error(
        `Giờ nhận/trả xe (${startTime.split("T")[1]?.substring(0, 5)} - ${endTime.split("T")[1]?.substring(0, 5)}) ngoài khung giờ hoạt động của nhà xe (${storeOpenTime} - ${storeCloseTime}). Vui lòng điều chỉnh lại!`
      );
      return;
    }
    if (!hasAgreedLicense) {
      toast.error("Vui lòng xác nhận bạn đã có Giấy phép lái xe chính chủ hợp lệ để tiếp tục!");
      return;
    }
    if (!hasAgreedTerms) {
      toast.error("Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục!");
      return;
    }
    if (pickupType === 1 && !deliveryAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao xe tận nơi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.customer.createBooking({
        modelId: model.id,
        storeId: model.storeId,
        startTime,
        endTime,
        pickupType,
        deliveryAddress: pickupType === 1 ? deliveryAddress : undefined,
        paymentType,
        quantity,
        promotionCode: appliedPromo ? appliedPromo.code : undefined,
      });

      setBookingResult(res);
      // Fetch or generate QR
      const qrData = await api.customer.getPaymentQr(res.booking.id);
      setQrInfo(qrData);
      setStep("payment");
      setTimeLeft(600);
      toast.success("Đã tạo phiên giữ xe 10 phút! Vui lòng thanh toán cọc.");
    } catch (err: any) {
      toast.error(err.message || "Không thể đặt xe lúc này. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePaymentSuccess = () => {
    toast.success("Thanh toán thành công! Đơn hàng đã chuyển sang trạng thái Confirmed.");
    onClose();
    router.push("/customer/bookings");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl">
        {/* Header - Fixed at top */}
        <DialogHeader className="shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              {step === "form" ? "Bước 1/2: Xác thực & Đặt xe" : "Bước 2/2: Giữ xe 10 phút & Quét VietQR"}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {step === "form" ? t("booking_modal_title", `Đặt xe ${model.name}`) : t("vietqr_modal_customer_title", "Thanh toán VietQR động")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
            {step === "form"
              ? t("booking_modal_desc", "Cung cấp thông tin nhận xe để khởi tạo phiên giữ chỗ.")
              : t("vietqr_modal_scan_hint", "Hệ thống đang tạm khóa xe trong 10 phút. Quét mã QR bằng ứng dụng ngân hàng số.")}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {step === "form" ? (
            <form id="booking-form" onSubmit={handleCreateBooking} className="space-y-5">
              {/* Summary Banner */}
              <div className="rounded-2xl border bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{model.name}</span>
                    {quantity > 1 && (
                      <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5">
                        x{quantity} xe
                      </Badge>
                    )}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      {format24hDateTime(startTime)} → {format24hDateTime(endTime)} ({isTimeValid ? `${dayRent} ${t("booking_days", "ngày")}` : "Thời gian không hợp lệ"})
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <Clock className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                      Mở cửa: {storeOpenTime} - {storeCloseTime}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right sm:border-l sm:pl-4 border-blue-200 dark:border-blue-900/60">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{t("booking_deposit_rate", "Tổng tiền cọc cần thanh toán:")}</span>
                  <div className="text-lg font-black text-blue-700 dark:text-blue-400">
                    {isTimeValid ? `${depositAmount.toLocaleString("vi-VN")} đ` : "0 đ"}
                  </div>
                </div>
              </div>

              {/* Vehicle Quantity Selector */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 rounded-2xl">
                <div>
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{t("booking_quantity", "Số lượng xe cần thuê")}</Label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Điểm thuê này hiện có <strong className="text-blue-600 dark:text-blue-400 font-bold">{maxAvailable}</strong> xe sẵn sàng
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 disabled:opacity-40"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center font-extrabold text-sm text-slate-900 dark:text-slate-100 select-none">
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 disabled:opacity-40"
                    disabled={quantity >= maxAvailable}
                    onClick={() => setQuantity((prev) => Math.min(maxAvailable, prev + 1))}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Operating Hours Alert Banner */}
              {!isOperatingHoursValid && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
                  <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Giờ nhận hoặc trả xe ngoài giờ mở cửa của nhà xe:</span>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      Nhà xe chỉ hoạt động từ <strong>{storeOpenTime}</strong> đến <strong>{storeCloseTime}</strong> hàng ngày. Vui lòng quay lại màn hình chọn xe để điều chỉnh lại khung giờ nhằm đảm bảo có nhân viên bàn giao xe cho bạn!
                    </p>
                  </div>
                </div>
              )}

              {/* Time Validation Alert Banner */}
              {!isTimeValid && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Thời gian đặt xe không hợp lệ:</span>
                    <p className="mt-0.5 text-red-600 leading-relaxed">
                      Ngày giờ trả xe ({format24hDateTime(endTime)}) không được trước hoặc bằng ngày giờ nhận xe ({format24hDateTime(startTime)}). Vui lòng điều chỉnh lại thời gian trước khi xác nhận đặt xe.
                    </p>
                  </div>
                </div>
              )}

              {/* Pickup Option */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">{t("booking_delivery_opt", "Hình thức nhận xe")}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPickupType(0)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
                      pickupType === 0
                        ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 ring-2 ring-blue-600/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> {t("booking_pickup_store", "Nhận tại cửa hàng")}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {model.store?.address || "Địa chỉ nhà xe đối tác"}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupType(1)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
                      pickupType === 1
                        ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 ring-2 ring-blue-600/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> {t("booking_doorstep", "Giao xe tận nơi")}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Giao đến khách sạn / sân bay / địa chỉ của bạn
                    </div>
                  </button>
                </div>

                {pickupType === 1 && (
                  <div className="pt-1.5">
                    <Input
                      placeholder={t("booking_delivery_placeholder", "Nhập địa chỉ giao xe chi tiết (ví dụ: Khách sạn Mường Thanh, 123 Võ Nguyên Giáp)...")}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required
                      className="text-xs h-10 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>

              {/* Driver License Legal Notice & Confirmation */}
              <div className="rounded-2xl border-2 border-amber-300/80 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/70 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2">
                      Cam Kết Giấy Phép Lái Xe (GPLX) Chính Chủ
                      <Badge className="bg-amber-600 text-white text-[10px] uppercase font-bold tracking-wider">
                        Bắt buộc
                      </Badge>
                    </h4>
                    <p className="text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                      Theo quy định của pháp luật và chính sách thuê xe, người nhận xe bắt buộc phải có <strong>Giấy phép lái xe chính chủ hợp lệ</strong> và xuất trình <strong>bản gốc</strong> khi nhận xe tại cửa hàng.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/90 dark:border-amber-800/60 p-3 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong>Cảnh báo quan trọng:</strong> Nếu tại thời điểm nhận xe, Quý khách <strong>không có bằng lái chính chủ</strong> hoặc bằng lái không hợp lệ, <strong>cửa hàng sẽ từ chối bàn giao xe</strong> và không chịu trách nhiệm hoàn lại tiền cọc.
                  </p>
                </div>

                {/* Checkbox confirmation */}
                <label
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName !== "INPUT") {
                      setHasAgreedLicense(!hasAgreedLicense);
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    hasAgreedLicense
                      ? "bg-amber-100/90 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30 text-amber-950 dark:text-amber-200 font-bold"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasAgreedLicense}
                    onChange={(e) => setHasAgreedLicense(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <span className="text-xs leading-relaxed">
                    Tôi xác nhận đã có <strong>Giấy phép lái xe chính chủ hợp lệ</strong> và cam kết mang theo bản gốc khi nhận xe.
                  </span>
                </label>

                {/* Checkbox Tuân thủ Nghị định 13: Điều khoản & Bảo mật */}
                <label
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName !== "INPUT") {
                      setHasAgreedTerms(!hasAgreedTerms);
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    hasAgreedTerms
                      ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/30 text-blue-950 dark:text-blue-200 font-medium"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasAgreedTerms}
                    onChange={(e) => setHasAgreedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                  />
                  <span className="text-xs leading-relaxed">
                    Tôi đồng ý với{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("footer_terms", "Điều khoản dịch vụ")}
                    </Link>{" "}
                    và{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("footer_privacy", "Chính sách bảo mật")}
                    </Link>{" "}
                    của VehicleRent.
                  </span>
                </label>
              </div>

              {/* Promotion / Voucher Section */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Ticket className="h-4 w-4" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-900">Mã giảm giá & Khuyến mãi</Label>
                      <p className="text-[11px] text-slate-500">Áp dụng voucher để nhận ưu đãi thuê xe</p>
                    </div>
                  </div>

                  {promotions.length > 0 && !appliedPromo && (
                    <button
                      type="button"
                      onClick={() => setShowPromoList(!showPromoList)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                    >
                      <span>Mã có sẵn ({promotions.length})</span>
                      {showPromoList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                {/* If promo is already applied */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                            {appliedPromo.code}
                          </span>
                          <span className="text-xs font-bold text-emerald-800">{appliedPromo.title}</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          Tiết kiệm: <strong>-{appliedPromo.discountAmount.toLocaleString("vi-VN")} đ</strong> cho đơn thuê này
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePromo}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2.5 rounded-lg gap-1"
                    >
                      <X className="h-3.5 w-3.5" /> Gỡ bỏ
                    </Button>
                  </div>
                ) : (
                  /* Input to enter voucher code */
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Tag className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
                        <Input
                          type="text"
                          placeholder="Nhập mã voucher (VD: CHAOBANMOI)..."
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          className="pl-9 text-xs h-9 uppercase font-mono font-bold rounded-xl bg-white border-slate-200"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleApplyPromo()}
                        disabled={isValidatingPromo || !promoCodeInput.trim()}
                        className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                      >
                        {isValidatingPromo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Áp dụng"}
                      </Button>
                    </div>

                    {/* Quick Available Promo List Drawer */}
                    {showPromoList && promotions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="text-[11px] font-bold text-slate-600">Chọn nhanh mã ưu đãi:</div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {promotions.map((p) => {
                            const isEligible = dayRent >= p.minRentDays;
                            return (
                              <div
                                key={p.id}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${
                                  isEligible
                                    ? "bg-white border-slate-200 hover:border-blue-400"
                                    : "bg-slate-100/70 border-slate-200 opacity-60"
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                                      {p.code}
                                    </span>
                                    {p.tag && (
                                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                        {p.tag}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{p.title}</div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {p.minRentDays > 1 ? `${t("promo_min_days", "Áp dụng từ")} ${p.minRentDays} ${t("booking_days", "ngày thuê")}` : t("promo_all_orders", "Áp dụng cho mọi đơn")}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={!isEligible}
                                  onClick={() => handleApplyPromo(p.code)}
                                  className="h-7 px-3 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shrink-0 cursor-pointer"
                                >
                                  {isEligible ? t("promo_choose", "Chọn mã") : `${t("promo_min_need", "Cần")} ≥${p.minRentDays} ${t("booking_days", "ngày")}`}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Breakdown Summary */}
                <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>
                      {t("booking_base_rent", "Giá thuê gốc")} ({dayRent} {t("booking_days", "ngày")}{quantity > 1 ? ` × ${quantity} xe` : ""}):
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{rentAmount.toLocaleString("vi-VN")} đ</span>
                  </div>
                  {appliedPromo && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>{t("booking_discount", "Giảm giá")} ({appliedPromo.code}):</span>
                      <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-800 font-extrabold text-slate-900 dark:text-slate-100">
                    <span>{t("booking_final_rent", "Tổng tiền thuê sau giảm:")}</span>
                    <span className="text-sm text-blue-700 dark:text-blue-400">{finalRentAmount.toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Option */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">{t("booking_payment_opt", "Tùy chọn thanh toán")}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType(1)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentType === 1
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-600/30"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="font-bold text-xs">{t("booking_deposit_opt", `Cọc trước ${depositPercent}% giữ xe`)}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-extrabold mt-1">
                      {depositAmount.toLocaleString("vi-VN")} đ
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType(0)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentType === 0
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-600/30"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="font-bold text-xs">{t("booking_full_opt", "Thanh toán 100%")}</div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-extrabold mt-1">
                      {finalRentAmount.toLocaleString("vi-VN")} đ
                    </div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Step 2: Payment with VietQR & 10-Minute Countdown */
            <div className="space-y-6">
              {/* Live Countdown Banner - Solid, stable, high contrast */}
              <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-300 dark:border-orange-800 p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{t("booking_time_remaining", "Thời gian giữ chỗ còn lại")}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {t("booking_time_remaining_desc", "Xe đã được tạm khóa. Quá 10 phút đơn sẽ tự động hủy.")}
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400 tracking-wider">
                  {formatTimer(timeLeft)}
                </div>
              </div>

              {/* Driver License Handover Notice */}
              <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/40 p-4 flex items-start gap-3 text-amber-950 dark:text-amber-200 shadow-xs">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-extrabold text-sm text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    {t("booking_notice_header", "LƯU Ý QUAN TRỌNG KHI ĐẾN NHẬN XE")}
                  </h4>
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                    {t("booking_notice_body", "Quý khách bắt buộc phải mang theo Giấy phép lái xe chính chủ (bản gốc) khi đến nhận xe tại cửa hàng. Cửa hàng sẽ đối chiếu và không bàn giao xe nếu Quý khách không xuất trình được bằng lái chính chủ hợp lệ!")}
                  </p>
                </div>
              </div>

              {/* QR Code and Payment Details */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                {/* Dynamic QR Display */}
                <div className="flex flex-col items-center bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm w-full sm:w-auto shrink-0">
                  {qrInfo?.qrCode ? (
                    <img
                      src={qrInfo.qrCode}
                      alt={`Mã VietQR thanh toán tiền cọc thuê xe ${model?.name || ""}`}
                      className="w-56 h-56 object-contain rounded-xl bg-white p-2"
                    />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 gap-2">
                      <QrCode className="h-12 w-12" />
                      <span className="text-xs">{t("booking_generating_qr", "Đang sinh mã VietQR...")}</span>
                    </div>
                  )}
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2 text-center">
                    {t("vietqr_modal_scan_hint", "Quét bằng mọi ứng dụng Mobile Banking")}
                  </span>

                  {/* Actions for Mobile: Chuyển khoản ngay & Tải QR */}
                  <div className="w-full space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {qrInfo?.checkoutUrl && (
                      <Button
                        type="button"
                        onClick={() => {
                          window.open(qrInfo.checkoutUrl, "_blank");
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9.5 rounded-xl gap-2 shadow-xs cursor-pointer"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>{t("booking_open_banking", "Mở ứng dụng ngân hàng thanh toán")}</span>
                      </Button>
                    )}

                    {qrInfo?.qrCode && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadQr}
                        className="w-full border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 font-bold text-xs h-9.5 rounded-xl gap-2 shadow-xs cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        <span>{t("booking_download_qr", "Tải ảnh mã VietQR")}</span>
                      </Button>
                    )}
                  </div>

                  <div className="mt-2.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center leading-normal max-w-[220px] border border-slate-100 dark:border-slate-700">
                    💡 <strong>{t("booking_mobile_tip_title", "Mẹo điện thoại:")}</strong> {t("booking_mobile_tip_body", "Tải QR về máy, sau đó mở App ngân hàng chọn Quét QR từ Thư viện ảnh để thanh toán siêu nhanh!")}
                  </div>
                </div>

                {/* Transfer Breakdown */}
                <div className="flex-1 space-y-3 text-xs w-full">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>{t("vietqr_modal_booking_code", "Mã đơn đặt xe:")}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {bookingResult?.booking?.bookingCode || "BK-..."}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>{t("booking_vehicle_info", "Dòng xe & Số lượng:")}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {model.name} {quantity > 1 ? `(${quantity} xe)` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>{t("vietqr_modal_account_name", "Chủ tài khoản:")}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 uppercase">
                        {qrInfo?.accountName || "NGUYEN VAN HUU"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>{t("vietqr_modal_bank", "Ngân hàng thụ hưởng:")}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {qrInfo?.bankName || (qrInfo?.bin === "970422" ? "MB Bank (Quân Đội)" : "MB Bank / PayOS")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>{t("vietqr_modal_account_num", "Số tài khoản:")}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {qrInfo?.accountNumber || "VQRQANJGX1330"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(qrInfo?.accountNumber || "VQRQANJGX1330");
                            toast.success(t("toast_copied_account", "Đã sao chép số tài khoản!"));
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors cursor-pointer"
                          title="Sao chép số tài khoản"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                      <span>{t("booking_deposit_transfer", "Số tiền cọc cần chuyển:")}</span>
                      <span className="text-base font-black text-blue-700 dark:text-blue-400">
                        {depositAmount.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                      <span>{t("vietqr_modal_memo", "Nội dung chuyển khoản:")}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {bookingResult?.payment?.transactionRef || "VR-..."}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(bookingResult?.payment?.transactionRef || "");
                            toast.success(t("toast_copied_memo", "Đã sao chép nội dung chuyển khoản!"));
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors cursor-pointer"
                          title="Sao chép nội dung"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{t("booking_listening_payment", "Đang tự động lắng nghe thanh toán từ Mobile Banking...")}</span>
                  </div>

                  {/* Dev Sandbox simulation button */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSimulatePaymentSuccess}
                    className="w-full text-[11px] text-slate-400 hover:text-slate-600 h-7"
                  >
                    [{t("booking_simulate_test", "Mô phỏng thanh toán test")}]
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Always visible at bottom, never clipped */}
        <DialogFooter className="shrink-0 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-end gap-2">
          {step === "form" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700"
              >
                {t("cancel_modal_close", "Hủy bỏ")}
              </Button>
              <Button
                type="submit"
                form="booking-form"
                disabled={isSubmitting || !isTimeValid || !hasAgreedLicense || !hasAgreedTerms}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md gap-1.5 cursor-pointer disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("booking_locking_vehicle", "Đang khóa xe 10 phút...")}</span>
                  </>
                ) : !isTimeValid ? (
                  <span>{t("booking_time_invalid", "Thời gian không hợp lệ")}</span>
                ) : (
                  <span>{t("booking_confirm_button", "Xác nhận đặt xe & Giữ chỗ")}</span>
                )}
              </Button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700"
              >
                {t("booking_close_save", "Đóng (Đơn lưu trong Lịch sử)")}
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (!bookingResult?.booking?.id) return;
                  try {
                    const res = await api.customer.checkPaymentStatus(bookingResult.booking.id);
                    if (res.paid) {
                      toast.success(t("booking_paid_success", "🎉 Đã nhận thanh toán cọc thành công!"));
                      onClose();
                      router.push("/customer/bookings");
                    } else {
                      toast.info(res.message || t("booking_not_yet_paid", "Chưa nhận được giao dịch. Vui lòng thử lại sau vài giây."));
                    }
                  } catch {
                    toast.error(t("booking_check_error", "Không thể kiểm tra giao dịch lúc này."));
                  }
                }}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{t("booking_transferred_check_now", "Tôi đã chuyển khoản — Kiểm tra ngay")}</span>
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
