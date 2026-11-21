"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api, Booking } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  QrCode,
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Store,
  Bike,
  RotateCcw,
  ExternalLink,
  Search,
  Building2,
  Loader2,
  ShieldAlert,
  Info,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format24hDateTime } from "@/components/common/datetime-24h-picker";
import { useLanguage } from "@/context/language-context";

const CANCEL_REASONS = [
  "Thay đổi lịch trình di chuyển",
  "Tìm được phương tiện khác phù hợp hơn",
  "Bận việc gia đình / Cá nhân đột xuất",
  "Thời tiết không thuận lợi",
  "Đặt nhầm thời gian hoặc dòng xe",
  "Lý do khác",
];

const VIETNAM_BANKS = [
  "Vietcombank (VCB)",
  "MB Bank (Quân Đội)",
  "Techcombank (TCB)",
  "BIDV",
  "VietinBank",
  "ACB (Á Châu)",
  "VPBank",
  "TPBank (Tiên Phong)",
  "Sacombank",
  "HDBank",
  "Agribank",
  "VIB (Quốc Tế)",
  "MSB (Hàng Hải)",
  "SHB",
  "SeABank",
  "OCB (Phương Đông)",
  "Khác (Tự nhập)",
];

const getRefundPolicyInfo = (b: Booking) => {
  const startTimeMs = new Date(b.startTime).getTime();
  const createdTimeMs = new Date(b.createdAt).getTime();
  const nowMs = Date.now();
  const diffHours = (startTimeMs - nowMs) / (1000 * 60 * 60);
  const minutesSinceBooking = (nowMs - createdTimeMs) / (1000 * 60);
  const deposit = Number(b.depositAmount) || 0;

  let percent = 0;
  let tier = 3;
  let tierLabel = "Dưới 6h & quá 30p từ lúc đặt: Mất cọc (0%)";
  let badgeColor =
    "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
  let refundAmt = 0;

  if (diffHours >= 24) {
    percent = 100;
    tier = 1;
    refundAmt = deposit;
    tierLabel = "Trước ≥24h nhận xe: Hoàn 100% cọc";
    badgeColor =
      "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
  } else if (diffHours >= 6) {
    if (minutesSinceBooking <= 30) {
      percent = 100;
      tier = 1;
      refundAmt = deposit;
      tierLabel = "Trước 6h - 24h (Vừa đặt ≤30p): Hoàn 100% cọc";
      badgeColor =
        "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    } else {
      percent = 50;
      tier = 2;
      refundAmt = Math.round(deposit * 0.5);
      tierLabel = "Trước 6h - 24h (Quá 30p từ lúc đặt): Hoàn 50% cọc";
      badgeColor =
        "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    }
  } else {
    // diffHours < 6
    if (minutesSinceBooking <= 30) {
      percent = 50;
      tier = 2;
      refundAmt = Math.round(deposit * 0.5);
      tierLabel = "Dưới 6h (Vừa đặt ≤30p): Hoàn 50% cọc";
      badgeColor =
        "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    } else {
      percent = 0;
      tier = 3;
      refundAmt = 0;
      tierLabel = "Dưới 6h & quá 30p từ lúc đặt: Mất cọc (0%)";
      badgeColor =
        "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
    }
  }

  return {
    diffHours: Math.max(0, diffHours),
    minutesSinceBooking: Math.max(0, minutesSinceBooking),
    tier,
    percent,
    refundAmt,
    deposit,
    tierLabel,
    badgeColor,
  };
};

export default function CustomerBookingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rateStar, setRateStar] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // VietQR modal for pending bookings
  const [qrModalBooking, setQrModalBooking] = useState<Booking | null>(null);
  const [qrData, setQrData] = useState<any>(null);

  // Cancel & Refund modal
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReasonSelect, setCancelReasonSelect] = useState<string>("Thay đổi lịch trình di chuyển");
  const [cancelReasonCustom, setCancelReasonCustom] = useState<string>("");
  const [refundBankNameSelect, setRefundBankNameSelect] = useState<string>("Vietcombank (VCB)");
  const [refundBankNameCustom, setRefundBankNameCustom] = useState<string>("");
  const [refundAccountNumber, setRefundAccountNumber] = useState<string>("");
  const [refundAccountName, setRefundAccountName] = useState<string>("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await api.customer.getMyBookings();
      setBookings(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Active polling & checking state
  const [checkingBookingId, setCheckingBookingId] = useState<number | null>(null);

  const handleCheckPaymentStatus = async (bookingId: number) => {
    setCheckingBookingId(bookingId);
    try {
      const res = await api.customer.checkPaymentStatus(bookingId);
      if (res.paid) {
        toast.success(t("booking_paid_success", "🎉 Đã nhận thanh toán cọc thành công! Đơn xe đã được xác nhận (Confirmed)."), {
          duration: 5000,
        });
        if (qrModalBooking?.id === bookingId) {
          setQrModalBooking(null);
          setQrData(null);
        }
        await fetchBookings();
      } else {
        toast.info(res.message || t("booking_not_yet_paid", "Hệ thống chưa nhận được tiền từ PayOS. Vui lòng thử lại sau 5-10 giây."));
      }
    } catch {
      toast.error(t("booking_check_error", "Không thể kết nối máy chủ để kiểm tra trạng thái."));
    } finally {
      setCheckingBookingId(null);
    }
  };

  // Tự động lắng nghe và chủ động kiểm tra trạng thái PayOS khi modal VietQR đang mở
  useEffect(() => {
    if (!qrModalBooking) return;
    const targetBookingId = qrModalBooking.id;

    const pollInterval = setInterval(async () => {
      try {
        const checkRes = await api.customer.checkPaymentStatus(targetBookingId);
        if (checkRes.paid || checkRes.bookingStatus === 1 || checkRes.bookingStatus === 4) {
          clearInterval(pollInterval);
          setQrModalBooking(null);
          setQrData(null);
          toast.success(
            t("booking_paid_success", "🎉 Đã nhận thanh toán cọc thành công! Đơn xe đã được xác nhận (Confirmed)."),
            { duration: 5000 }
          );
          fetchBookings();
          return;
        }
      } catch {
        // bỏ qua lỗi trong lúc poll
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [qrModalBooking]);

  const handleOpenQr = async (b: Booking) => {
    setQrModalBooking(b);
    try {
      const data = await api.customer.getPaymentQr(b.id);
      setQrData(data);
    } catch {
      // fallback
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm(t("bookings_confirm_cancel_prompt", "Bạn có chắc chắn muốn hủy đơn giữ chỗ này?"))) return;
    try {
      await api.customer.cancelBooking(bookingId);
      toast.success(t("bookings_cancel_success", "Đã hủy đơn thành công."));
      fetchBookings();
    } catch {
      toast.error("Không thể hủy đơn.");
    }
  };

  const handleOpenCancelModal = (b: Booking) => {
    setCancelModalBooking(b);
    setCancelReasonSelect("Thay đổi lịch trình di chuyển");
    setCancelReasonCustom("");
    if (user?.bankName && VIETNAM_BANKS.includes(user.bankName)) {
      setRefundBankNameSelect(user.bankName);
      setRefundBankNameCustom("");
    } else if (user?.bankName) {
      setRefundBankNameSelect("Khác (Tự nhập)");
      setRefundBankNameCustom(user.bankName);
    } else {
      setRefundBankNameSelect("Vietcombank (VCB)");
      setRefundBankNameCustom("");
    }
    setRefundAccountNumber(user?.bankAccountNum || "");
    setRefundAccountName(user?.fullName ? user.fullName.toUpperCase() : "");
  };

  const handleConfirmCancelWithRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalBooking) return;

    const reason =
      cancelReasonSelect === "Lý do khác"
        ? cancelReasonCustom.trim()
        : cancelReasonCustom.trim()
        ? `${cancelReasonSelect} - ${cancelReasonCustom.trim()}`
        : cancelReasonSelect;

    const bankName =
      refundBankNameSelect === "Khác (Tự nhập)"
        ? refundBankNameCustom.trim()
        : refundBankNameSelect;

    if (!reason) {
      toast.error(t("cancel_error_provide_reason", "Vui lòng cung cấp lý do hủy đơn!"));
      return;
    }

    const policy = getRefundPolicyInfo(cancelModalBooking);
    const requiresBank =
      (cancelModalBooking.status === 1 || cancelModalBooking.status === 2) && policy.percent > 0;

    if (requiresBank) {
      if (!bankName) {
        toast.error(t("cancel_error_select_bank", "Vui lòng chọn hoặc nhập tên ngân hàng nhận tiền hoàn cọc!"));
        return;
      }
      if (!refundAccountNumber.trim()) {
        toast.error(t("cancel_error_account_number", "Vui lòng nhập số tài khoản ngân hàng!"));
        return;
      }
      if (!refundAccountName.trim()) {
        toast.error(t("cancel_error_account_name", "Vui lòng nhập tên chủ tài khoản ngân hàng!"));
        return;
      }
    }

    setIsSubmittingCancel(true);
    try {
      await api.customer.cancelBooking(cancelModalBooking.id, {
        reason,
        bankName: bankName || undefined,
        bankAccountNumber: refundAccountNumber.trim() || undefined,
        bankAccountName: refundAccountName.trim().toUpperCase() || undefined,
      });

      toast.success(
        cancelModalBooking.status === 1 || cancelModalBooking.status === 2
          ? t("cancel_success_refund_msg", "🎉 Đã gửi yêu cầu hủy đơn & hoàn cọc thành công! Hệ thống đã ghi nhận thông tin hoàn tiền cọc của bạn.")
          : t("bookings_cancel_success", "Đã hủy đơn thành công.")
      );
      setCancelModalBooking(null);
      await fetchBookings();
    } catch (err: any) {
      toast.error(err.message || t("cancel_error_generic", "Không thể hủy đơn lúc này. Vui lòng liên hệ nhà xe hoặc hỗ trợ!"));
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setIsSubmittingReview(true);
    try {
      await api.customer.submitReview(reviewBooking.id, {
        rateStar,
        comment: reviewComment,
      });
      toast.success(t("review_success_toast", "Cảm ơn bạn đã gửi đánh giá trải nghiệm!"));
      // Cập nhật ngay lập tức vào state để khóa không cho đánh giá lại và hiển thị đúng số sao
      setBookings((prev) =>
        prev.map((b) =>
          b.id === reviewBooking.id
            ? {
                ...b,
                review: {
                  id: Date.now(),
                  bookingId: b.id,
                  customerId: b.customerId,
                  storeId: b.storeId,
                  rateStar,
                  comment: reviewComment,
                },
              }
            : b
        )
      );
      setReviewBooking(null);
      setReviewComment("");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi đánh giá.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status
      if (statusFilter !== "ALL" && String(b.status) !== statusFilter) return false;

      // Date Range
      if (fromDate) {
        const itemDate = new Date(b.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(b.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }

      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = b.bookingCode?.toLowerCase().includes(q);
        const matchStore = b.store?.storeName?.toLowerCase().includes(q);
        const matchModel = b.bookingDetails?.some((d) =>
          d.model?.name?.toLowerCase().includes(q)
        );
        if (!matchCode && !matchStore && !matchModel) return false;
      }

      return true;
    });
  }, [bookings, searchQuery, fromDate, toDate, statusFilter]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge className="bg-amber-500 text-white gap-1 animate-pulse">
            <Clock className="h-3 w-3" /> {t("bookings_status_0", "Chờ cọc (Giữ xe 10p)")}
          </Badge>
        );
      case 1:
        return (
          <Badge className="bg-blue-600 text-white gap-1">
            <CheckCircle2 className="h-3 w-3" /> {t("bookings_status_1", "Đã xác nhận (Chờ nhận xe)")}
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-orange-600 text-white gap-1">
            <AlertCircle className="h-3 w-3" /> {t("bookings_status_2", "Hàng chờ xử lý (Ví đối tác)")}
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-indigo-600 text-white gap-1">
            <Bike className="h-3 w-3" /> {t("bookings_status_3", "Đang thuê xe (Active)")}
          </Badge>
        );
      case 4:
        return (
          <Badge className="bg-emerald-600 text-white gap-1">
            <CheckCircle2 className="h-3 w-3" /> {t("bookings_status_4", "Hoàn tất")}
          </Badge>
        );
      case 5:
        return (
          <Badge className="bg-slate-500 text-white gap-1">
            <XCircle className="h-3 w-3" /> {t("bookings_status_5", "Đã hủy / Hết hạn")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("bookings_status_unknown", "Trạng thái")} #{status}</Badge>;
    }
  };

  return (
    <div className="py-10 bg-slate-50/60 dark:bg-slate-950 min-h-screen">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t("bookings_page_title", "Lịch Sử Đơn Thuê Xe")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("bookings_page_desc", "Theo dõi tình trạng đơn đặt chỗ, thanh toán cọc VietQR và biên bản bàn giao xe thực tế.")}
            </p>
          </div>
          <Link href="/">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs rounded-xl gap-1.5 cursor-pointer font-bold shadow-xs">
              <Bike className="h-4 w-4" /> {t("bookings_btn_new_rental", "Đặt thêm xe mới")}
            </Button>
          </Link>
        </div>

        {/* Search & Date Range Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder={t("bookings_search_placeholder", "Tìm theo mã đơn BK-..., dòng xe, tên nhà xe...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-11 text-xs h-10 sm:h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 w-full min-w-0"
            />
          </div>

          <div className="col-span-1 sm:col-span-1 lg:col-span-2 min-w-0 w-full overflow-hidden">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs h-10 sm:h-11 rounded-xl bg-slate-50/50 border-slate-200 w-full max-w-full min-w-0 box-border"
              title={t("bookings_from_date", "Từ ngày đặt xe")}
            />
          </div>

          <div className="col-span-1 sm:col-span-1 lg:col-span-2 min-w-0 w-full overflow-hidden">
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs h-10 sm:h-11 rounded-xl bg-slate-50/50 border-slate-200 w-full max-w-full min-w-0 box-border"
              title={t("bookings_to_date", "Đến ngày")}
            />
          </div>

          <div className="col-span-1 sm:col-span-1 lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full min-w-0 h-10 sm:h-11 text-xs font-semibold px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">{t("bookings_tab_all", "Tất cả trạng thái")}</option>
              <option value="0">{t("bookings_tab_pending", "Chờ thanh toán cọc")}</option>
              <option value="1">{t("bookings_tab_confirmed", "Đã cọc (Chờ giao xe)")}</option>
              <option value="2">{t("bookings_status_2", "Hàng chờ (Thiếu ví)")}</option>
              <option value="3">{t("bookings_tab_active", "Đang thuê (Active)")}</option>
              <option value="4">{t("bookings_tab_completed", "Hoàn tất (Completed)")}</option>
              <option value="5">{t("bookings_tab_cancelled", "Đã hủy (Cancelled)")}</option>
            </select>
          </div>

          <div className="col-span-1 sm:col-span-1 lg:col-span-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFromDate("");
                setToDate("");
                setStatusFilter("ALL");
              }}
              className="w-full min-w-0 h-10 sm:h-11 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center gap-2"
              title={t("bookings_btn_reset_filter", "Đặt lại bộ lọc")}
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span className="sm:hidden font-medium">{t("bookings_btn_reset_filter", "Đặt lại bộ lọc")}</span>
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">
            <Clock className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-xs font-semibold">{t("bookings_loading", "Đang tải lịch sử đơn thuê...")}</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="text-center py-16 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-8 bg-white dark:bg-slate-900">
            <Bike className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {bookings.length === 0 ? t("bookings_empty_title", "Chưa có đơn thuê nào") : t("bookings_no_results", "Không tìm thấy đơn thuê nào phù hợp")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {bookings.length === 0
                ? t("bookings_empty_desc", "Bạn chưa thực hiện đơn đặt xe nào trên hệ thống. Hãy chọn ngay chiếc xe ưng ý cho chuyến đi!")
                : t("bookings_filter_hint", "Hãy thử xóa từ khóa tìm kiếm hoặc mở rộng khoảng ngày lọc.")}
            </p>
            {bookings.length === 0 && (
              <Link href="/" className="inline-block mt-4">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs rounded-xl font-bold cursor-pointer">
                  {t("bookings_find_vehicles", "Tìm xe ngay")}
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const detail = b.bookingDetails?.[0];
              const totalQuantity = (b.bookingDetails || []).reduce((sum, d) => sum + (d.quantity || 1), 0);
              const assignedVehicles = (b.bookingDetails || [])
                .map((d) => d.vehicleItem)
                .filter((vi): vi is NonNullable<typeof vi> => !!vi);
              const isPending = b.status === 0;
              const isCompleted = b.status === 4;

              return (
                <Card
                  key={b.id}
                  className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {b.bookingCode}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {t("bookings_created_at", "Ngày tạo:")} {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div>{getStatusBadge(b.status)}</div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Vehicle & Store info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                            {detail?.model?.name || t("bookings_vehicle_item", "Dòng xe cho thuê")}
                          </h3>
                          <Badge className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                            {totalQuantity > 1 ? `x${totalQuantity} ${t("common_vehicles_unit", "xe")}` : `1 ${t("common_vehicles_unit", "xe")}`}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Store className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            {b.store?.storeName || t("bookings_partner_store", "Nhà xe đối tác")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            {format24hDateTime(b.startTime)} → {format24hDateTime(b.endTime)} ({b.dayRent} {t("booking_days", "ngày")})
                          </span>
                          {b.pickupType === 1 && (
                            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                              <MapPin className="h-3.5 w-3.5" /> {t("bookings_delivery_label", "Giao tận nơi:")} {b.deliveryAddress}
                            </span>
                          )}
                        </div>

                        {/* Handed over vehicle plate or reserved plates */}
                        {assignedVehicles.length > 0 && (
                          <div className="pt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {b.status === 3 || b.status === 4
                                ? t("bookings_license_plate", "Biển số bàn giao:")
                                : t("bookings_holding_plates", "Biển số xe giữ chỗ:")}
                            </span>
                            {assignedVehicles.map((vi) => (
                              <span
                                key={vi.id}
                                className="font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md"
                              >
                                {vi.licensePlate} ({vi.color || t("bookings_color_standard", "Tiêu chuẩn")})
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Refund info for cancelled booking */}
                        {b.status === 5 && (b.refundAmount || b.cancelReason) && (
                          <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{t("bookings_refund_info_title", "Thông tin hoàn trả tiền cọc:")}</span>
                              {b.refundStatus === 1 ? (
                                <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> {t("refund_status_refunded", "Đã hoàn cọc")}
                                </Badge>
                              ) : b.refundStatus === 2 ? (
                                <Badge className="bg-red-600 text-white text-[10px] gap-1">
                                  <XCircle className="h-3 w-3" /> {t("refund_status_rejected", "Từ chối hoàn cọc")}
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500 text-white text-[10px] gap-1">
                                  <Clock className="h-3 w-3" /> {t("refund_status_pending", "Chờ xử lý hoàn cọc")}
                                </Badge>
                              )}
                            </div>
                            {b.refundAmount && (
                              <div className="text-slate-600 dark:text-slate-400 flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                <span>{t("cancel_modal_refund_amount", "Số tiền hoàn cọc:")}</span>
                                <strong className="text-blue-700 dark:text-blue-400 font-bold">{Number(b.refundAmount).toLocaleString("vi-VN")} đ</strong>
                              </div>
                            )}
                            {b.refundBankName && (
                              <div className="text-slate-600 dark:text-slate-400 flex justify-between">
                                <span>{t("bookings_refund_account_label", "Tài khoản nhận hoàn:")}</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {b.refundBankName} - {b.refundAccountNumber} ({b.refundAccountName})
                                </span>
                              </div>
                            )}
                            {b.cancelReason && (
                              <div className="text-slate-500 dark:text-slate-400 italic text-[11px] pt-0.5">
                                {t("cancel_modal_reason_label", "Lý do hủy:")} "{b.cancelReason}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Pricing breakdown */}
                      <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-6 pt-3 md:pt-0 space-y-1 min-w-[180px]">
                        <div className="text-xs text-slate-500 dark:text-slate-200">
                          {t("bookings_total_amount", "Tổng tiền:")} <strong className="text-slate-900 dark:text-slate-100 font-bold">{Number(b.rentAmount).toLocaleString("vi-VN")} đ</strong>
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                          <span className="text-slate-500 dark:text-slate-200 font-normal">{t("bookings_deposit_amount", "Tiền cọc:")}</span> {Number(b.depositAmount).toLocaleString("vi-VN")} đ
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isPending && t("bookings_pending_hint", "Phiên giữ chỗ sẽ tự động hủy nếu không thanh toán trong 10 phút.")}
                        {isCompleted && t("bookings_completed_hint", "Chuyến đi đã hoàn thành an toàn. Hãy để lại đánh giá cho nhà xe!")}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {isPending && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(b.id)}
                              className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 h-8 rounded-lg cursor-pointer shrink-0"
                            >
                              {t("cancel_modal_close", "Hủy đơn")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={checkingBookingId === b.id}
                              onClick={() => handleCheckPaymentStatus(b.id)}
                              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs h-8 rounded-lg gap-1.5 cursor-pointer font-semibold shrink-0"
                            >
                              <RotateCcw className={`h-3.5 w-3.5 ${checkingBookingId === b.id ? "animate-spin" : ""}`} />
                              <span>{checkingBookingId === b.id ? t("bookings_btn_checking", "Đang đối soát...") : t("bookings_btn_check_payment", "Kiểm tra thanh toán")}</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleOpenQr(b)}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 rounded-lg gap-1.5 cursor-pointer font-bold shadow-xs shrink-0"
                            >
                              <QrCode className="h-3.5 w-3.5" /> {t("bookings_btn_pay_qr", "Quét VietQR")}
                            </Button>
                          </>
                        )}

                        {(b.status === 1 || b.status === 2) && (() => {
                          const policy = getRefundPolicyInfo(b);
                          return (
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                              {/* Policy preview pill beside cancel button */}
                              <div
                                className={`text-[11px] font-semibold border px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs ${policy.badgeColor}`}
                                title={`${policy.tierLabel} (Còn ${policy.diffHours.toFixed(1)}h đến giờ nhận, Đặt cách đây ${policy.minutesSinceBooking.toFixed(0)} phút)`}
                              >
                                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  {t("refund_label_short", "Hoàn")} <strong>{policy.percent}%</strong> ({policy.refundAmt.toLocaleString("vi-VN")} đ)
                                </span>
                                <span className="text-[10px] opacity-80 font-normal hidden lg:inline">
                                  ({policy.tierLabel})
                                </span>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenCancelModal(b)}
                                className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 h-8 rounded-lg cursor-pointer font-medium gap-1.5 shrink-0"
                              >
                                <XCircle className="h-3.5 w-3.5" /> {t("bookings_btn_cancel", "Hủy đơn & Hoàn cọc")}
                              </Button>
                            </div>
                          );
                        })()}

                        {isCompleted && (
                          b.review ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl text-xs">
                              <div className="flex items-center gap-1">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`h-3.5 w-3.5 ${
                                        s <= b.review!.rateStar
                                          ? "text-amber-500 fill-amber-400"
                                          : "text-slate-200 dark:text-slate-700 fill-slate-100 dark:fill-slate-800"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="font-bold text-amber-900 dark:text-amber-200 ml-1">
                                  {b.review.rateStar}/5 {t("review_stars_label", "sao")}
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                                ✓ {t("bookings_reviewed", "Đã đánh giá")}
                              </span>
                              {b.review.comment && (
                                <span className="text-[11px] text-slate-600 dark:text-slate-400 italic truncate max-w-[200px]">
                                  "{b.review.comment}"
                                </span>
                              )}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReviewBooking(b);
                                setRateStar(5);
                                setReviewComment("");
                              }}
                              className="text-xs border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 h-8 rounded-lg gap-1.5 shadow-2xs cursor-pointer font-semibold"
                            >
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" /> {t("bookings_btn_review", "Viết đánh giá chuyến đi")}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* VietQR View Modal */}
      {qrModalBooking && (
        <Dialog open={!!qrModalBooking} onOpenChange={() => setQrModalBooking(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6 text-center border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">{t("vietqr_modal_customer_title", "Thanh Toán VietQR Giữ Chỗ")}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                {t("vietqr_modal_booking_code", "Mã đơn:")} <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{qrModalBooking.bookingCode}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 flex flex-col items-center">
              <div className="w-56 h-56 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 flex items-center justify-center">
                {qrData?.qrCode ? (
                  <img src={qrData.qrCode} alt="Mã QR PayOS thanh toán cọc đơn thuê xe" className="w-full h-full object-contain rounded-xl bg-white p-1" />
                ) : (
                  <QrCode className="h-20 w-20 text-slate-300 dark:text-slate-600 animate-pulse" />
                )}
              </div>
              <div className="mt-3 text-xs space-y-1.5 w-full bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                {qrData?.accountName && (
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>{t("vietqr_modal_account_name", "Chủ tài khoản:")}</span>
                    <strong className="text-slate-900 dark:text-slate-100 uppercase font-bold">{qrData.accountName}</strong>
                  </div>
                )}
                {qrData?.accountNumber && (
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>{t("vietqr_modal_account_num", "Số tài khoản:")}</span>
                    <strong className="font-mono text-slate-900 dark:text-slate-100 font-bold">{qrData.accountNumber}</strong>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>{t("bookings_deposit_amount", "Số tiền cọc:")}</span>
                  <strong className="text-blue-700 dark:text-blue-400 font-black">{Number(qrModalBooking.depositAmount).toLocaleString("vi-VN")} VNĐ</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <span>{t("vietqr_modal_memo", "Nội dung CK:")}</span>
                  <strong className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold">
                    {qrData?.transactionRef || qrModalBooking.bookingCode}
                  </strong>
                </div>
              </div>
              {qrData?.checkoutUrl && (
                <a
                  href={qrData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 underline"
                >
                  <span>{t("booking_open_banking", "Mở cổng thanh toán PayOS trực tiếp")}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrModalBooking(null)}
                className="w-full sm:w-1/3 cursor-pointer border-slate-200 dark:border-slate-700"
              >
                {t("cancel_modal_close", "Đóng")}
              </Button>
              <Button
                type="button"
                disabled={checkingBookingId === qrModalBooking.id}
                onClick={() => handleCheckPaymentStatus(qrModalBooking.id)}
                className="w-full sm:w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className={`h-4 w-4 ${checkingBookingId === qrModalBooking.id ? "animate-spin" : ""}`} />
                <span>{checkingBookingId === qrModalBooking.id ? t("bookings_btn_checking", "Đang kiểm tra với PayOS...") : t("booking_transferred_check_now", "Tôi đã chuyển khoản — Kiểm tra ngay")}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <Dialog open={!!reviewBooking} onOpenChange={() => setReviewBooking(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">{t("review_modal_title", "Đánh giá dịch vụ nhà xe")}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                {t("review_modal_desc", "Đơn thuê xe")} {reviewBooking.bookingDetails?.[0]?.model?.name} ({reviewBooking.store?.storeName})
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
              {/* Star Rating */}
              <div className="space-y-1.5 text-center py-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("review_rating_label", "Chấm điểm chất lượng:")}</Label>
                <div className="flex justify-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRateStar(s)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          s <= rateStar
                            ? "text-amber-500 fill-amber-400"
                            : "text-slate-300 dark:text-slate-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Textarea */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("review_comment_label", "Nhận xét chi tiết:")}</Label>
                <Textarea
                  placeholder={t("review_comment_placeholder", "Chia sẻ trải nghiệm về chất lượng xe, độ sạch sẽ, thái độ phục vụ của chủ nhà xe...")}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="text-xs min-h-[90px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewBooking(null)}
                  className="rounded-xl border-slate-200 dark:border-slate-700"
                >
                  {t("cancel_modal_close", "Hủy")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingReview}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  {isSubmittingReview ? t("cancel_modal_submitting", "Đang gửi...") : t("review_submit_btn", "Gửi đánh giá")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Booking & Refund Dialog */}
      {cancelModalBooking && (
        <Dialog open={!!cancelModalBooking} onOpenChange={() => setCancelModalBooking(null)}>
          <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
            <DialogHeader className="shrink-0 p-5 sm:p-6 pb-4 border-b border-red-100 dark:border-red-950/60 bg-red-50/70 dark:bg-red-950/30">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
                <AlertCircle className="h-4 w-4" />
                <span>{t("cancel_modal_header", "Xác nhận hủy đặt xe & Hoàn cọc")}</span>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("cancel_modal_title", "Hủy đơn đặt xe")} #{cancelModalBooking.bookingCode}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
                {t("cancel_modal_desc", "Vui lòng xác nhận lý do hủy đơn và cung cấp thông tin tài khoản ngân hàng để hệ thống thực hiện hoàn trả tiền cọc.")}
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const policy = getRefundPolicyInfo(cancelModalBooking);
              return (
                <form
                  onSubmit={handleConfirmCancelWithRefund}
                  className="flex flex-col flex-1 min-h-0 overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    {/* 3-Tier Policy Visual Grid */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <ShieldAlert className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span>{t("refund_policy_title", "Quy định hoàn tiền cọc khi hủy xe")}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          <span>Nhận xe sau: <strong>{policy.diffHours.toFixed(1)}h</strong></span>
                          <span className="mx-1.5">•</span>
                          <span>Đã đặt: <strong>{policy.minutesSinceBooking.toFixed(0)} phút trước</strong></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        {/* Tier 1 */}
                        <div
                          className={`p-2.5 rounded-xl border transition-all ${
                            policy.percent === 100
                              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30 text-emerald-950 dark:text-emerald-200 font-semibold"
                              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-60"
                          }`}
                        >
                          <div className="text-[10px] uppercase font-bold tracking-wider">Trước ≥ 24h (hoặc ≤30p)</div>
                          <div className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">Hoàn 100%</div>
                          <div className="text-[10px] mt-0.5">
                            {policy.percent === 100 ? "Đang áp dụng ✓" : "Hoàn toàn bộ"}
                          </div>
                        </div>

                        {/* Tier 2 */}
                        <div
                          className={`p-2.5 rounded-xl border transition-all ${
                            policy.percent === 50
                              ? "bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30 text-amber-950 dark:text-amber-200 font-semibold"
                              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-60"
                          }`}
                        >
                          <div className="text-[10px] uppercase font-bold tracking-wider">6h-24h / &lt;6h (≤30p)</div>
                          <div className="text-base font-black text-amber-700 dark:text-amber-400 mt-0.5">Hoàn 50%</div>
                          <div className="text-[10px] mt-0.5">
                            {policy.percent === 50 ? "Đang áp dụng ✓" : "Bù 50% nhà xe"}
                          </div>
                        </div>

                        {/* Tier 3 */}
                        <div
                          className={`p-2.5 rounded-xl border transition-all ${
                            policy.percent === 0
                              ? "bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/30 text-rose-950 dark:text-rose-200 font-semibold"
                              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-60"
                          }`}
                        >
                          <div className="text-[10px] uppercase font-bold tracking-wider">Dưới &lt; 6h (&gt;30p)</div>
                          <div className="text-base font-black text-rose-700 dark:text-rose-400 mt-0.5">Hoàn 0%</div>
                          <div className="text-[10px] mt-0.5">
                            {policy.percent === 0 ? "Đang áp dụng ✓" : "Không hoàn cọc"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Refund Calculation Summary Banner */}
                    <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          {t("cancel_modal_deposit_paid", "Cọc đã đóng:")}{" "}
                          <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                            {policy.deposit.toLocaleString("vi-VN")} đ
                          </strong>{" "}
                          ({t("cancel_modal_refund_rate", "Tỷ lệ hoàn:")} <strong className="text-blue-700 dark:text-blue-400">{policy.percent}%</strong>)
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                          {t("cancel_modal_refund_amount", "Số tiền hoàn về:")}{" "}
                          <span className="text-base font-black text-blue-700 dark:text-blue-400">
                            {policy.refundAmt.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t("cancel_modal_vehicle", "Dòng xe:")}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {cancelModalBooking.bookingDetails?.[0]?.model?.name || t("bookings_vehicle_item", "Xe đã đặt")}
                        </span>
                      </div>
                    </div>

                    {/* Cancellation Reason */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t("cancel_modal_reason_label", "Lý do hủy đơn")} <span className="text-red-500">*</span>
                      </Label>
                      <select
                        value={cancelReasonSelect}
                        onChange={(e) => setCancelReasonSelect(e.target.value)}
                        className="w-full text-xs h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CANCEL_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      {(cancelReasonSelect === "Lý do khác" || cancelReasonCustom) && (
                        <Input
                          placeholder={t("cancel_modal_reason_placeholder", "Nhập chi tiết lý do của bạn...")}
                          value={cancelReasonCustom}
                          onChange={(e) => setCancelReasonCustom(e.target.value)}
                          className="text-xs h-9 rounded-xl mt-1.5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          required={cancelReasonSelect === "Lý do khác"}
                        />
                      )}
                    </div>

                    {/* Bank Details (Only required if refundAmt > 0) */}
                    {policy.percent > 0 ? (
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span>{t("cancel_modal_bank_section", "Thông tin tài khoản nhận tiền hoàn cọc")} ({policy.refundAmt.toLocaleString("vi-VN")} đ)</span>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-slate-700 dark:text-slate-300">
                            {t("cancel_modal_bank_name", "Ngân hàng thụ hưởng")} <span className="text-red-500">*</span>
                          </Label>
                          <select
                            value={refundBankNameSelect}
                            onChange={(e) => setRefundBankNameSelect(e.target.value)}
                            className="w-full text-xs h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {VIETNAM_BANKS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>

                          {refundBankNameSelect === "Khác (Tự nhập)" && (
                            <Input
                              placeholder={t("cancel_modal_bank_name_custom", "Nhập tên ngân hàng của bạn...")}
                              value={refundBankNameCustom}
                              onChange={(e) => setRefundBankNameCustom(e.target.value)}
                              className="text-xs h-9 rounded-xl mt-1.5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                              required
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-700 dark:text-slate-300">
                              {t("cancel_modal_bank_account", "Số tài khoản")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="text"
                              placeholder="VD: 0987654321..."
                              value={refundAccountNumber}
                              onChange={(e) => setRefundAccountNumber(e.target.value)}
                              className="text-xs h-9 font-mono font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-700 dark:text-slate-300">
                              {t("cancel_modal_account_name", "Tên chủ tài khoản")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="text"
                              placeholder="VD: NGUYEN VAN A"
                              value={refundAccountName}
                              onChange={(e) => setRefundAccountName(e.target.value.toUpperCase())}
                              className="text-xs h-9 uppercase font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">{t("cancel_modal_late_warning_title", "Lưu ý về quy định hủy sát giờ (< 6h):")}</strong>
                          <p className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
                            {t("cancel_modal_late_warning", "Do đơn đặt xe bị hủy cách giờ nhận xe dưới 6 tiếng, toàn bộ tiền cọc được đối tác nhà xe giữ để bù đắp chi phí giữ xe và chuẩn bị phương tiện. Bạn không cần cung cấp tài khoản ngân hàng.")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Warning box */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        {t("cancel_modal_notice", "Lưu ý: Sau khi xác nhận hủy, xe đã giữ sẽ được tự động mở lại cho khách hàng khác thuê.")}
                        {policy.percent > 0 && ` ${t("cancel_modal_admin_review_notice", "Quản trị viên sàn sẽ đối soát thông tin tài khoản và tiến hành chuyển khoản hoàn lại tiền cọc cho bạn theo quy định.")}`}
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="shrink-0 p-4 sm:p-5 flex flex-row items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCancelModalBooking(null)}
                      disabled={isSubmittingCancel}
                      className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {t("cancel_modal_close", "Đóng")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingCancel}
                      className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isSubmittingCancel ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{t("cancel_modal_submitting", "Đang xử lý...")}</span>
                        </>
                      ) : (
                        <span>
                          {policy.percent > 0
                            ? `${t("cancel_modal_confirm", "Xác nhận hủy & Hoàn")} ${policy.refundAmt.toLocaleString("vi-VN")} đ`
                            : t("cancel_modal_confirm_zero", "Xác nhận hủy đặt xe")}
                        </span>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

