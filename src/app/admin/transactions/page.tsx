"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  api,
  PayoutRequest,
  PaymentRecord,
  WalletHistory,
  Booking,
} from "@/lib/api";
import { format24hDateTime } from "@/components/common/datetime-24h-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Receipt,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Building2,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Download,
  AlertCircle,
  ShieldAlert,
  QrCode,
  Copy,
  Check,
  Bike,
  User,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";

const getBankShortName = (bankName: string = "") => {
  const b = bankName.toLowerCase();
  if (b.includes("vcb") || b.includes("vietcombank")) return "VCB";
  if (b.includes("mb")) return "MB";
  if (b.includes("tcb") || b.includes("techcombank")) return "TCB";
  if (b.includes("bidv")) return "BIDV";
  if (b.includes("vietin") || b.includes("icb")) return "ICB";
  if (b.includes("acb")) return "ACB";
  if (b.includes("vpbank") || b.includes("vpb")) return "VPB";
  if (b.includes("tpbank") || b.includes("tpb")) return "TPB";
  if (b.includes("sacombank") || b.includes("stb")) return "STB";
  if (b.includes("hdbank") || b.includes("hdb")) return "HDB";
  if (b.includes("agribank") || b.includes("vba")) return "VBA";
  if (b.includes("vib")) return "VIB";
  if (b.includes("msb")) return "MSB";
  if (b.includes("shb")) return "SHB";
  if (b.includes("seabank") || b.includes("seab")) return "SEAB";
  if (b.includes("ocb")) return "OCB";
  return "VCB";
};

export default function AdminTransactionsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"payouts" | "payments" | "wallet" | "refunds">("payouts");
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [walletHistories, setWalletHistories] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<Booking[]>([]);

  // Filter states
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Payout review modal
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<1 | 2>(1); // 1: Approve, 2: Reject
  const [reviewNote, setReviewNote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Refund review modal
  const [selectedRefund, setSelectedRefund] = useState<Booking | null>(null);
  const [reviewRefundAction, setReviewRefundAction] = useState<1 | 2>(1); // 1: Refunded, 2: Rejected
  const [reviewRefundNote, setReviewRefundNote] = useState("");
  const [isSubmittingRefundReview, setIsSubmittingRefundReview] = useState(false);

  // VietQR modal for quick refund transfer
  const [vietQrModalRefund, setVietQrModalRefund] = useState<Booking | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${t("toast_copied_generic", "Đã sao chép:")} ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [poData, payData, whData, rfData] = await Promise.all([
        api.admin.getPayouts(),
        api.admin.getPayments(),
        api.admin.getWalletHistories(),
        api.admin.getRefunds(),
      ]);
      setPayouts(poData || []);
      setPayments(payData || []);
      setWalletHistories(whData || []);
      setRefunds(rfData || []);
    } catch {
      toast.error("Không thể tải toàn bộ dữ liệu giao dịch.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setStatusFilter("ALL");
  };

  // ─── Filtered Datasets ───────────────────────────────────────────
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      // Status
      if (statusFilter !== "ALL" && String(p.status) !== statusFilter) return false;

      // Date Range
      if (fromDate) {
        const itemDate = new Date(p.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(p.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }

      // Keyword Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = String(p.id).includes(q) || `po-${p.id}`.includes(q);
        const matchPartner = p.partner?.fullName?.toLowerCase().includes(q) || p.accountHolder.toLowerCase().includes(q);
        const matchPhone = p.partner?.phone?.toLowerCase().includes(q);
        const matchBank = p.bankName.toLowerCase().includes(q) || p.bankAccountNum.toLowerCase().includes(q);
        const matchStore = p.partner?.stores?.some((s) => s.storeName.toLowerCase().includes(q));
        if (!matchId && !matchPartner && !matchPhone && !matchBank && !matchStore) return false;
      }

      return true;
    });
  }, [payouts, search, fromDate, toDate, statusFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      // Status
      if (statusFilter !== "ALL" && String(pay.paymentStatus) !== statusFilter) return false;

      // Date Range
      if (fromDate) {
        const itemDate = new Date(pay.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(pay.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }

      // Keyword Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchRef = pay.transactionRef.toLowerCase().includes(q);
        const matchBookingCode = pay.booking?.bookingCode?.toLowerCase().includes(q);
        const matchCustomer = pay.booking?.customer?.fullName?.toLowerCase().includes(q) || pay.booking?.customer?.phone?.includes(q);
        const matchStore = pay.booking?.store?.storeName?.toLowerCase().includes(q);
        if (!matchRef && !matchBookingCode && !matchCustomer && !matchStore) return false;
      }

      return true;
    });
  }, [payments, search, fromDate, toDate, statusFilter]);

  const filteredWalletHistories = useMemo(() => {
    return walletHistories.filter((wh) => {
      // Type/Status
      if (statusFilter !== "ALL" && String(wh.type) !== statusFilter) return false;

      // Date Range
      if (fromDate) {
        const itemDate = new Date(wh.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(wh.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchDesc = wh.description?.toLowerCase().includes(q);
        const matchPartner = wh.wallet?.partner?.fullName?.toLowerCase().includes(q) || wh.wallet?.partner?.phone?.includes(q);
        const matchBooking = wh.booking?.bookingCode?.toLowerCase().includes(q);
        if (!matchDesc && !matchPartner && !matchBooking) return false;
      }

      return true;
    });
  }, [walletHistories, search, fromDate, toDate, statusFilter]);

  const filteredRefunds = useMemo(() => {
    return refunds.filter((rf) => {
      // Status
      if (statusFilter !== "ALL" && String(rf.refundStatus ?? 0) !== statusFilter) return false;

      // Date Range (cancelTime or createdAt)
      const targetDate = rf.cancelTime || rf.createdAt;
      if (fromDate && targetDate) {
        const itemDate = new Date(targetDate).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate && targetDate) {
        const itemDate = new Date(targetDate).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCode = rf.bookingCode?.toLowerCase().includes(q);
        const matchCustomer =
          rf.customer?.fullName?.toLowerCase().includes(q) ||
          rf.customer?.phone?.includes(q) ||
          rf.customer?.email?.toLowerCase().includes(q);
        const matchStore = rf.store?.storeName?.toLowerCase().includes(q);
        const matchBank =
          rf.refundBankName?.toLowerCase().includes(q) ||
          rf.refundAccountNumber?.toLowerCase().includes(q) ||
          rf.refundAccountName?.toLowerCase().includes(q);
        const matchModel = rf.bookingDetails?.some((d) =>
          d.model?.name?.toLowerCase().includes(q)
        );
        const matchReason = rf.cancelReason?.toLowerCase().includes(q);

        if (!matchCode && !matchCustomer && !matchStore && !matchBank && !matchModel && !matchReason) {
          return false;
        }
      }

      return true;
    });
  }, [refunds, search, fromDate, toDate, statusFilter]);

  // Handle Review Payout
  const handleReviewPayout = async () => {
    if (!selectedPayout) return;
    setIsSubmittingReview(true);
    try {
      const res = await api.admin.reviewPayout(selectedPayout.id, {
        status: reviewAction,
        note: reviewNote.trim() || (reviewAction === 1 ? "Đã chuyển khoản giải ngân thành công" : "Từ chối và hoàn tiền về ví"),
      });
      toast.success(res.message || "Xử lý yêu cầu rút tiền thành công!");
      setPayouts((prev) =>
        prev.map((p) => (p.id === selectedPayout.id ? { ...p, status: reviewAction, note: reviewNote } : p))
      );
      setSelectedPayout(null);
      setReviewNote("");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xử lý rút tiền.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Review Refund
  const handleReviewRefund = async () => {
    if (!selectedRefund) return;
    setIsSubmittingRefundReview(true);
    try {
      const res = await api.admin.reviewRefund(selectedRefund.id, {
        refundStatus: reviewRefundAction,
        adminNote: reviewRefundNote.trim() || undefined,
      });
      toast.success(res.message || "Xử lý yêu cầu hoàn cọc thành công!");
      setSelectedRefund(null);
      setReviewRefundNote("");
      if (vietQrModalRefund?.id === selectedRefund.id) {
        setVietQrModalRefund(null);
      }
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xử lý hoàn cọc.");
    } finally {
      setIsSubmittingRefundReview(false);
    }
  };

  // Overall Metrics
  const pendingPayouts = payouts.filter((p) => p.status === 0);
  const totalPendingPayoutAmount = pendingPayouts.reduce((acc, cur) => acc + Number(cur.amount), 0);

  const approvedPayouts = payouts.filter((p) => p.status === 1);
  const totalApprovedPayoutAmount = approvedPayouts.reduce((acc, cur) => acc + Number(cur.amount), 0);

  const pendingRefunds = refunds.filter((r) => r.refundStatus === 0);
  const totalPendingRefundAmount = pendingRefunds.reduce(
    (acc, cur) => acc + (Number(cur.refundAmount) || 0),
    0
  );

  const completedRefunds = refunds.filter((r) => r.refundStatus === 1);
  const totalCompletedRefundAmount = completedRefunds.reduce(
    (acc, cur) => acc + (Number(cur.refundAmount) || 0),
    0
  );

  const successPayments = payments.filter((p) => p.paymentStatus === 1);
  const totalPayosRevenue = successPayments.reduce((acc, cur) => acc + Number(cur.amount), 0);

  return (
    <div className="py-8 sm:py-10 bg-slate-50/60 dark:bg-slate-950 min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t("admin_tx_title", "Quản Lý Giao Dịch & Dòng Tiền Toàn Sàn")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("admin_tx_desc", "Giám sát dòng tiền cọc PayOS, xử lý yêu cầu rút tiền của đối tác và tra cứu biến động số dư ví.")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="text-xs font-semibold rounded-xl h-9 gap-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              {t("admin_tx_refresh", "Làm mới")}
            </Button>
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold rounded-xl h-9 text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                {t("admin_tx_back_report", "Về Báo Cáo Sàn")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Priority Pending Payout Banner */}
        {pendingPayouts.length > 0 && (
          <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/40 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-amber-950 dark:text-amber-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/20 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-600 text-white border-none text-[10px] font-black uppercase">
                    {t("admin_tx_urgent_action", "Cần phê duyệt ngay")}
                  </Badge>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
                    {pendingPayouts.length} {t("admin_tx_payout_requests", "yêu cầu rút tiền")}
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-amber-950 dark:text-amber-200 mt-0.5">
                  {t("admin_tx_total_payout_amount", "Tổng tiền yêu cầu giải ngân:")}{" "}
                  <span className="font-mono text-emerald-800 dark:text-emerald-400">
                    {totalPendingPayoutAmount.toLocaleString("vi-VN")} VNĐ
                  </span>
                </h4>
                <p className="text-xs text-amber-800/90 dark:text-amber-300 mt-0.5">
                  {t("admin_tx_payout_hint", "Vui lòng đối soát và chuyển khoản vào tài khoản ngân hàng chính chủ của đối tác trước khi duyệt.")}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setActiveTab("payouts");
                setStatusFilter("0");
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              {t("admin_tx_view_pending_payouts", "Xem")} {pendingPayouts.length} {t("admin_tx_payouts_waiting", "yêu cầu chờ duyệt")}
            </Button>
          </div>
        )}

        {/* Priority Pending Refund Requests Banner */}
        {pendingRefunds.length > 0 && (
          <div className="rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/40 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-rose-950 dark:text-rose-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-rose-600 text-white border-none text-[10px] font-black uppercase">
                    {t("admin_tx_refund_banner_badge", "Yêu cầu hoàn cọc khách hủy xe")}
                  </Badge>
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-400">
                    {pendingRefunds.length} {t("admin_tx_refunds_waiting", "đơn chờ chuyển khoản hoàn cọc")}
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-rose-950 dark:text-rose-200 mt-0.5">
                  {t("admin_tx_total_refund_amount", "Tổng tiền cọc cần hoàn trả khách:")}{" "}
                  <span className="font-mono text-rose-700 dark:text-rose-400">
                    {totalPendingRefundAmount.toLocaleString("vi-VN")} VNĐ
                  </span>
                </h4>
                <p className="text-xs text-rose-800/90 dark:text-rose-300 mt-0.5">
                  {t("admin_tx_refund_hint", "Khách hàng hủy đặt xe theo đúng chính sách hoàn cọc. Vui lòng kiểm tra STK ngân hàng hoặc quét VietQR để hoàn tiền cho khách.")}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setActiveTab("refunds");
                setStatusFilter("0");
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              {t("admin_tx_view_pending_refunds", "Xem")} {pendingRefunds.length} {t("admin_tx_refunds_waiting_short", "đơn chờ hoàn cọc")}
            </Button>
          </div>
        )}

        {/* 5 Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Card 1 */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("admin_tx_card_payos_rev", "Thu cọc qua PayOS")}
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {totalPayosRevenue.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>{successPayments.length} {t("admin_tx_success_transactions", "giao dịch thành công")}</span>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("admin_tx_card_pending_payout", "Rút tiền chờ duyệt")}
              </span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
              {totalPendingPayoutAmount.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
              {pendingPayouts.length} {t("admin_tx_payout_waiting_label", "lệnh chờ duyệt chi")}
            </div>
          </Card>

          {/* Card 3: Yêu cầu hoàn cọc */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("admin_tx_card_pending_refund", "Hoàn cọc chờ xử lý")}
              </span>
              <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <RotateCcw className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono">
              {totalPendingRefundAmount.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-[11px] text-rose-800 dark:text-rose-400 font-medium">
              {pendingRefunds.length} {t("admin_tx_refund_waiting_label", "đơn khách chờ nhận hoàn")}
            </div>
          </Card>

          {/* Card 4 */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("admin_tx_card_approved_payout", "Đã giải ngân rút ví")}
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {totalApprovedPayoutAmount.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {approvedPayouts.length} {t("admin_tx_payouts_completed_label", "lượt rút tiền đã chi trả")}
            </div>
          </Card>

          {/* Card 5 */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("admin_tx_card_wallet_tx", "Tổng biến động ví")}
              </span>
              <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono">
              {walletHistories.length} {t("admin_tx_turns_label", "lượt")}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Nạp ví, hoa hồng sàn, hoàn cọc
            </div>
          </Card>
        </div>

        {/* ─── TAB NAVIGATION & ADVANCED FILTERS ─── */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Top Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("refunds");
                  handleResetFilters();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "refunds"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <RotateCcw className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>{t("admin_tab_refunds", "Yêu Cầu Hoàn Cọc")}</span>
                {pendingRefunds.length > 0 ? (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                    {pendingRefunds.length}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({refunds.length})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("payouts");
                  handleResetFilters();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "payouts"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t("admin_tab_payouts", "Yêu Cầu Rút Tiền")}</span>
                {pendingPayouts.length > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {pendingPayouts.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("payments");
                  handleResetFilters();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "payments"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>{t("admin_tab_payments", "Giao Dịch PayOS")} ({payments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("wallet");
                  handleResetFilters();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "wallet"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ArrowUpRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>{t("admin_tab_wallet_history", "Biến Động Số Dư Ví")} ({walletHistories.length})</span>
              </button>
            </div>

            {/* Results Counter */}
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("admin_tx_display_count", "Hiển thị:")}{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {activeTab === "refunds"
                  ? filteredRefunds.length
                  : activeTab === "payouts"
                  ? filteredPayouts.length
                  : activeTab === "payments"
                  ? filteredPayments.length
                  : filteredWalletHistories.length}
              </span>{" "}
              {t("admin_tx_records_label", "bản ghi")}
            </div>
          </div>

          {/* Filter Bar (Search + Date Range + Status) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                placeholder={
                  activeTab === "refunds"
                    ? t("admin_search_refund_ph", "Tìm mã đơn BK-..., khách, SĐT, STK, ngân hàng, dòng xe...")
                    : activeTab === "payouts"
                    ? t("admin_search_payout_ph", "Tìm theo mã #PO, tên đối tác, STK, ngân hàng, SĐT...")
                    : activeTab === "payments"
                    ? t("admin_search_payment_ph", "Tìm theo mã đơn BK-..., mã giao dịch TX-..., khách, SĐT...")
                    : t("admin_search_wallet_ph", "Tìm theo nội dung, tên đối tác, số điện thoại...")
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 text-xs h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* From Date */}
            <div className="lg:col-span-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                title={t("bookings_from_date", "Từ ngày")}
              />
            </div>

            {/* To Date */}
            <div className="lg:col-span-2">
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs h-10 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                title={t("bookings_to_date", "Đến ngày")}
              />
            </div>

            {/* Status Dropdown */}
            <div className="lg:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 text-xs font-semibold px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">{t("bookings_tab_all", "Tất cả trạng thái")}</option>
                {activeTab === "refunds" && (
                  <>
                    <option value="0">{t("refund_status_pending", "Chờ hoàn tiền (Pending)")}</option>
                    <option value="1">{t("refund_status_refunded", "Đã hoàn cọc (Refunded)")}</option>
                    <option value="2">{t("refund_status_rejected", "Từ chối hoàn cọc (Rejected)")}</option>
                  </>
                )}
                {activeTab === "payouts" && (
                  <>
                    <option value="0">{t("payout_status_pending", "Chờ duyệt (Pending)")}</option>
                    <option value="1">{t("payout_status_approved", "Đã chi tiền (Approved)")}</option>
                    <option value="2">{t("payout_status_rejected", "Đã từ chối (Rejected)")}</option>
                  </>
                )}
                {activeTab === "payments" && (
                  <>
                    <option value="1">{t("payment_status_success", "Thành công (Success)")}</option>
                    <option value="0">{t("payment_status_pending", "Đang chờ (Pending)")}</option>
                    <option value="2">{t("payment_status_failed", "Thất bại (Failed)")}</option>
                  </>
                )}
                {activeTab === "wallet" && (
                  <>
                    <option value="0">{t("wallet_type_deposit", "Nạp ví (Deposit)")}</option>
                    <option value="1">Trừ hoa hồng sàn</option>
                    <option value="2">{t("wallet_type_refund", "Hoàn tiền (Refund)")}</option>
                    <option value="3">{t("wallet_type_withdrawal", "Rút tiền (Withdrawal)")}</option>
                  </>
                )}
              </select>
            </div>

            {/* Reset Filter Button */}
            <div className="lg:col-span-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="w-full h-10 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700 cursor-pointer"
                title={t("bookings_btn_reset_filter", "Đặt lại bộ lọc")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {(search || fromDate || toDate || statusFilter !== "ALL") && (
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Đang lọc theo:</span>
              {search && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                  Từ khóa: "{search}"
                </Badge>
              )}
              {fromDate && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                  Từ: {fromDate}
                </Badge>
              )}
              {toDate && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                  Đến: {toDate}
                </Badge>
              )}
              {statusFilter !== "ALL" && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                  Trạng thái: {statusFilter}
                </Badge>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-red-600 hover:underline font-semibold ml-1 cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* ─── TAB 0: REFUND REQUESTS TABLE ─── */}
          {activeTab === "refunds" && (
            <div className="border rounded-2xl overflow-hidden mt-3">
              {filteredRefunds.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-1">
                  <RotateCcw className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Không tìm thấy yêu cầu hoàn tiền cọc nào</p>
                  <p className="text-slate-400">Chưa có đơn xe bị hủy cần hoàn cọc theo điều kiện lọc.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="text-xs font-bold">Mã đơn / Ngày hủy</TableHead>
                      <TableHead className="text-xs font-bold">Khách hàng</TableHead>
                      <TableHead className="text-xs font-bold">Nhà xe & Xe</TableHead>
                      <TableHead className="text-xs font-bold text-right">Cọc / Hoàn lại</TableHead>
                      <TableHead className="text-xs font-bold">Tài khoản nhận hoàn</TableHead>
                      <TableHead className="text-xs font-bold">Lý do hủy</TableHead>
                      <TableHead className="text-xs font-bold text-center">Trạng thái</TableHead>
                      <TableHead className="text-xs font-bold text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.map((rf) => {
                      const isPending = rf.refundStatus === 0;
                      const isRefunded = rf.refundStatus === 1;
                      const isRejected = rf.refundStatus === 2;
                      const deposit = Number(rf.depositAmount) || 0;
                      const refundAmt = Number(rf.refundAmount) || 0;
                      const refundPercent =
                        deposit > 0 ? Math.round((refundAmt / deposit) * 100) : 0;
                      const modelName =
                        rf.bookingDetails?.[0]?.model?.name || "Xe cho thuê";

                      return (
                        <TableRow key={rf.id} className="hover:bg-slate-50/50">
                          {/* Mã đơn / Ngày hủy */}
                          <TableCell className="text-xs font-mono">
                            <div className="font-bold text-slate-900">{rf.bookingCode}</div>
                            <div className="text-[11px] text-slate-500">
                              {rf.cancelTime ? (
                                <>
                                  {new Date(rf.cancelTime).toLocaleDateString("vi-VN")}{" "}
                                  {new Date(rf.cancelTime).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </>
                              ) : (
                                "—"
                              )}
                            </div>
                          </TableCell>

                          {/* Khách hàng */}
                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900">
                              {rf.customer?.fullName || "Khách hàng"}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{rf.customer?.phone || "—"}</span>
                            </div>
                          </TableCell>

                          {/* Nhà xe & Xe */}
                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900">
                              {rf.store?.storeName || "—"}
                            </div>
                            <div className="text-[11px] text-indigo-700 font-medium">
                              {modelName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Nhận: {format24hDateTime(rf.startTime)}
                            </div>
                          </TableCell>

                          {/* Tiền cọc & Mức hoàn */}
                          <TableCell className="text-xs text-right font-mono">
                            <div className="text-[11px] text-slate-500">
                              Cọc: {deposit.toLocaleString("vi-VN")} đ
                            </div>
                            <div className="text-sm font-black text-blue-700">
                              {refundAmt.toLocaleString("vi-VN")} đ
                            </div>
                            <div className="text-[10px] font-bold text-emerald-700">
                              Hoàn {refundPercent}%
                            </div>
                          </TableCell>

                          {/* Tài khoản nhận hoàn */}
                          <TableCell className="text-xs">
                            {rf.refundBankName ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-blue-700 flex items-center gap-1">
                                  <Building2 className="h-3 w-3" /> {rf.refundBankName}
                                </div>
                                <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                                  <span>{rf.refundAccountNumber}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyText(
                                        rf.refundAccountNumber || "",
                                        `stk-${rf.id}`
                                      )
                                    }
                                    className="p-0.5 hover:text-blue-600 transition-colors cursor-pointer"
                                    title="Sao chép số tài khoản"
                                  >
                                    {copiedKey === `stk-${rf.id}` ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                    )}
                                  </button>
                                </div>
                                <div className="text-[10px] text-slate-600 uppercase font-semibold">
                                  {rf.refundAccountName}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                {refundPercent === 0
                                  ? "Không hoàn cọc (<6h)"
                                  : "Chưa cung cấp"}
                              </span>
                            )}
                          </TableCell>

                          {/* Lý do hủy đơn */}
                          <TableCell className="text-xs text-slate-700 max-w-[200px]">
                            <div
                              className="truncate font-medium text-[11px]"
                              title={rf.cancelReason || ""}
                            >
                              {rf.cancelReason || "—"}
                            </div>
                          </TableCell>

                          {/* Trạng thái */}
                          <TableCell className="text-xs text-center">
                            {isPending && (
                              <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1">
                                <Clock className="h-3 w-3" /> Chờ hoàn tiền
                              </Badge>
                            )}
                            {isRefunded && (
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Đã hoàn cọc
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] gap-1">
                                <XCircle className="h-3 w-3" /> Đã từ chối
                              </Badge>
                            )}
                          </TableCell>

                          {/* Hành động */}
                          <TableCell className="text-xs text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {rf.refundAccountNumber && refundAmt > 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() => setVietQrModalRefund(rf)}
                                    className="h-7 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2 shadow-xs gap-1 cursor-pointer"
                                    title="Quét VietQR chuyển tiền tức thì"
                                  >
                                    <QrCode className="h-3 w-3" /> Quét VietQR
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRefund(rf);
                                    setReviewRefundAction(1);
                                    setReviewRefundNote(
                                      "Đã chuyển khoản hoàn cọc cho khách qua ngân hàng"
                                    );
                                  }}
                                  className="h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 shadow-xs cursor-pointer"
                                >
                                  Duyệt hoàn
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRefund(rf);
                                    setReviewRefundAction(2);
                                    setReviewRefundNote(
                                      "Thông tin số tài khoản không khớp hoặc khách không đủ điều kiện hoàn"
                                    );
                                  }}
                                  className="h-7 text-[11px] font-bold text-rose-700 border-rose-200 hover:bg-rose-50 rounded-lg px-2 cursor-pointer"
                                >
                                  Từ chối
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Đã xử lý
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* ─── TAB 1: PAYOUT REQUESTS TABLE ─── */}
          {activeTab === "payouts" && (
            <div className="border rounded-2xl overflow-hidden mt-3">
              {filteredPayouts.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-1">
                  <DollarSign className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Không tìm thấy yêu cầu rút tiền nào</p>
                  <p className="text-slate-400">Hãy thử thay đổi điều kiện tìm kiếm hoặc ngày lọc.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="text-xs font-bold">Mã / Ngày tạo</TableHead>
                      <TableHead className="text-xs font-bold">Đối tác & Cửa hàng</TableHead>
                      <TableHead className="text-xs font-bold">Ngân hàng thụ hưởng</TableHead>
                      <TableHead className="text-xs font-bold text-right">Số tiền rút</TableHead>
                      <TableHead className="text-xs font-bold text-center">Trạng thái</TableHead>
                      <TableHead className="text-xs font-bold">Ghi chú</TableHead>
                      <TableHead className="text-xs font-bold text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((p) => {
                      const isPending = p.status === 0;
                      const isApproved = p.status === 1;
                      const isRejected = p.status === 2;

                      return (
                        <TableRow key={p.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs font-mono">
                            <div className="font-bold text-slate-900">#PO-{p.id}</div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(p.createdAt).toLocaleDateString("vi-VN")}{" "}
                              {new Date(p.createdAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900">
                              {p.partner?.fullName || p.accountHolder}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {p.partner?.stores?.[0]?.storeName || `SĐT: ${p.partner?.phone}`}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-blue-700 flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {p.bankName}
                            </div>
                            <div className="font-mono text-slate-900 font-bold">
                              {p.bankAccountNum}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase">
                              Chủ TK: {p.accountHolder}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-right font-black text-emerald-700 font-mono text-sm">
                            {Number(p.amount).toLocaleString("vi-VN")} đ
                          </TableCell>

                          <TableCell className="text-xs text-center">
                            {isPending && (
                              <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1">
                                <Clock className="h-3 w-3" /> Chờ duyệt
                              </Badge>
                            )}
                            {isApproved && (
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Đã chi trả
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] gap-1">
                                <XCircle className="h-3 w-3" /> Đã từ chối
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                            {p.note || "—"}
                          </TableCell>

                          <TableCell className="text-xs text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayout(p);
                                    setReviewAction(1);
                                    setReviewNote("Đã chuyển khoản giải ngân thành công");
                                  }}
                                  className="h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 shadow-xs"
                                >
                                  Duyệt chi
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayout(p);
                                    setReviewAction(2);
                                    setReviewNote("Thông tin số tài khoản hoặc ngân hàng không khớp");
                                  }}
                                  className="h-7 text-[11px] font-bold text-rose-700 border-rose-200 hover:bg-rose-50 rounded-lg px-2.5"
                                >
                                  Từ chối
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Đã xử lý
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* ─── TAB 2: PAYOS PAYMENTS TABLE ─── */}
          {activeTab === "payments" && (
            <div className="border rounded-2xl overflow-hidden mt-3">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-1">
                  <Receipt className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Không tìm thấy giao dịch PayOS nào</p>
                  <p className="text-slate-400">Chưa có giao dịch quét cọc VietQR phù hợp bộ lọc.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="text-xs font-bold">Mã GD / Thời gian</TableHead>
                      <TableHead className="text-xs font-bold">Đơn đặt xe</TableHead>
                      <TableHead className="text-xs font-bold">Khách hàng</TableHead>
                      <TableHead className="text-xs font-bold">Nhà xe / Chi nhánh</TableHead>
                      <TableHead className="text-xs font-bold text-right">Số tiền cọc</TableHead>
                      <TableHead className="text-xs font-bold text-center">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((pay) => {
                      const isSuccess = pay.paymentStatus === 1;
                      const isPending = pay.paymentStatus === 0;

                      return (
                        <TableRow key={pay.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs font-mono">
                            <div className="font-bold text-blue-700">
                              {pay.transactionRef}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(pay.createdAt).toLocaleDateString("vi-VN")}{" "}
                              {new Date(pay.createdAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900 font-mono">
                              {pay.booking?.bookingCode || `BK-#${pay.bookingId}`}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {pay.paymentType === 1 ? "Đặt cọc xe" : "Thanh toán toàn bộ"}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900">
                              {pay.booking?.customer?.fullName || "Khách vãng lai"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              SĐT: {pay.booking?.customer?.phone || "—"}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900">
                              {pay.booking?.store?.storeName || "—"}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {pay.booking?.store?.address || "—"}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-right font-black text-slate-900 font-mono text-sm">
                            {Number(pay.amount).toLocaleString("vi-VN")} đ
                          </TableCell>

                          <TableCell className="text-xs text-center">
                            {isSuccess && (
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Đã nhận tiền
                              </Badge>
                            )}
                            {isPending && (
                              <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1">
                                <Clock className="h-3 w-3" /> Chờ quét mã
                              </Badge>
                            )}
                            {pay.paymentStatus === 2 && (
                              <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] gap-1">
                                <XCircle className="h-3 w-3" /> Thất bại
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* ─── TAB 3: WALLET HISTORIES TABLE ─── */}
          {activeTab === "wallet" && (
            <div className="border rounded-2xl overflow-hidden mt-3">
              {filteredWalletHistories.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-1">
                  <ArrowUpRight className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Không tìm thấy biến động số dư ví nào</p>
                  <p className="text-slate-400">Hãy thử thay đổi điều kiện ngày hoặc từ khóa lọc.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="text-xs font-bold">Thời gian</TableHead>
                      <TableHead className="text-xs font-bold">Đối tác / Chi nhánh</TableHead>
                      <TableHead className="text-xs font-bold">Loại giao dịch</TableHead>
                      <TableHead className="text-xs font-bold text-right">Biến động (+/-)</TableHead>
                      <TableHead className="text-xs font-bold text-right">Số dư trước / sau</TableHead>
                      <TableHead className="text-xs font-bold">Nội dung chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWalletHistories.map((wh) => {
                      const isDeposit = wh.type === 0;
                      const isCommission = wh.type === 1;
                      const isRefund = wh.type === 2;
                      const isWithdrawal = wh.type === 3;

                      return (
                        <TableRow key={wh.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs font-mono">
                            <div className="font-bold text-slate-900">
                              {new Date(wh.createdAt).toLocaleDateString("vi-VN")}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(wh.createdAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900">
                              {wh.wallet?.partner?.fullName || "Đối tác"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {wh.wallet?.partner?.stores?.[0]?.storeName || `SĐT: ${wh.wallet?.partner?.phone}`}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            {isDeposit && (
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                                <ArrowDownLeft className="h-3 w-3" /> Nạp tiền ví
                              </Badge>
                            )}
                            {isCommission && (
                              <Badge className="bg-purple-50 text-purple-800 border-purple-300 text-[10px] gap-1">
                                <Receipt className="h-3 w-3" /> Trừ hoa hồng sàn
                              </Badge>
                            )}
                            {isRefund && (
                              <Badge className="bg-blue-50 text-blue-800 border-blue-300 text-[10px] gap-1">
                                <RotateCcw className="h-3 w-3" /> Hoàn tiền ví
                              </Badge>
                            )}
                            {isWithdrawal && (
                              <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1">
                                <ArrowUpRight className="h-3 w-3" /> Rút tiền về NH
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-right font-mono font-black text-sm">
                            {isDeposit || isRefund ? (
                              <span className="text-emerald-600">
                                +{Number(wh.amount).toLocaleString("vi-VN")} đ
                              </span>
                            ) : (
                              <span className="text-rose-600">
                                -{Number(wh.amount).toLocaleString("vi-VN")} đ
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-right font-mono">
                            <div className="text-slate-500 text-[11px]">
                              Trước: {Number(wh.balanceBefore).toLocaleString("vi-VN")} đ
                            </div>
                            <div className="font-bold text-slate-900">
                              Sau: {Number(wh.balanceAfter).toLocaleString("vi-VN")} đ
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-slate-700 max-w-[240px]">
                            <div className="truncate font-medium">{wh.description}</div>
                            {wh.booking?.bookingCode && (
                              <div className="text-[11px] text-blue-600 font-mono">
                                Đơn: {wh.booking.bookingCode}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* ─── REVIEW PAYOUT DIALOG ─── */}
      {selectedPayout && (
        <Dialog open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                {reviewAction === 1 ? "Phê Duyệt Giải Ngân Tiền Rút" : "Từ Chối Yêu Cầu Rút Tiền"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mã yêu cầu: <span className="font-mono font-bold text-slate-900">#PO-{selectedPayout.id}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 bg-slate-50 rounded-2xl border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Đối tác:</span>
                <strong className="text-slate-900">{selectedPayout.partner?.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng:</span>
                <strong className="text-blue-700">{selectedPayout.bankName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <strong className="font-mono text-slate-900">{selectedPayout.bankAccountNum}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <strong className="text-slate-900 uppercase">{selectedPayout.accountHolder}</strong>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-slate-500">Số tiền cần chuyển:</span>
                <strong className="font-mono text-base font-black text-emerald-700">
                  {Number(selectedPayout.amount).toLocaleString("vi-VN")} VNĐ
                </strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ghi chú xác nhận / Lý do từ chối:</Label>
              <Input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc mã giao dịch ngân hàng..."
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayout(null)}
                disabled={isSubmittingReview}
                className="rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleReviewPayout}
                disabled={isSubmittingReview}
                className={`rounded-xl font-bold text-white ${
                  reviewAction === 1
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSubmittingReview
                  ? "Đang xử lý..."
                  : reviewAction === 1
                  ? "Xác nhận đã giải ngân"
                  : "Xác nhận từ chối"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── VIETQR QUICK REFUND TRANSFER DIALOG ─── */}
      {vietQrModalRefund && (() => {
        const bankShort = getBankShortName(vietQrModalRefund.refundBankName || "");
        const accountNo = vietQrModalRefund.refundAccountNumber || "";
        const accountName = vietQrModalRefund.refundAccountName || "";
        const refundAmt = Number(vietQrModalRefund.refundAmount) || 0;
        const addInfo = `Hoan coc don ${vietQrModalRefund.bookingCode}`;
        const qrUrl = `https://img.vietqr.io/image/${bankShort}-${accountNo}-compact2.png?amount=${refundAmt}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;

        return (
          <Dialog open={!!vietQrModalRefund} onOpenChange={() => setVietQrModalRefund(null)}>
            <DialogContent className="max-w-md rounded-2xl p-6 text-center space-y-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>{t("vietqr_modal_admin_title", "Quét VietQR Chuyển Tiền Hoàn Cọc")}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {t("vietqr_modal_booking_code", "Mã đơn:")} <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{vietQrModalRefund.bookingCode}</span> • {t("vietqr_modal_customer_name", "Khách:")} <strong>{vietQrModalRefund.customer?.fullName}</strong>
                </DialogDescription>
              </DialogHeader>

              {/* QR Image Box */}
              <div className="flex flex-col items-center">
                <div className="w-56 h-56 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 flex items-center justify-center shadow-xs">
                  <img
                    src={qrUrl}
                    alt="VietQR hoàn cọc"
                    className="w-full h-full object-contain rounded-xl bg-white p-1"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  {t("vietqr_modal_scan_hint", "Mở app ngân hàng bất kỳ để quét mã và chuyển tiền trong 5 giây")}
                </p>
              </div>

              {/* Bank Details with Copy Buttons */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">{t("vietqr_modal_bank", "Ngân hàng:")}</span>
                  <strong className="text-blue-700 dark:text-blue-400 font-bold">{vietQrModalRefund.refundBankName}</strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">{t("vietqr_modal_account_num", "Số tài khoản:")}</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                    <span>{accountNo}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(accountNo, "modal-stk")}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                    >
                      {copiedKey === "modal-stk" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">{t("vietqr_modal_account_name", "Chủ tài khoản:")}</span>
                  <strong className="text-slate-900 dark:text-slate-100 uppercase font-bold">{accountName}</strong>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{t("cancel_modal_refund_amount", "Số tiền hoàn:")}</span>
                  <strong className="font-mono text-base font-black text-blue-700 dark:text-blue-400">
                    {refundAmt.toLocaleString("vi-VN")} VNĐ
                  </strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">{t("vietqr_modal_memo", "Nội dung chuyển khoản:")}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <span>{addInfo}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(addInfo, "modal-memo")}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                    >
                      {copiedKey === "modal-memo" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVietQrModalRefund(null)}
                  className="rounded-xl flex-1 text-xs border-slate-200 dark:border-slate-700"
                >
                  {t("cancel_modal_close", "Đóng")}
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await api.admin.reviewRefund(vietQrModalRefund.id, {
                        refundStatus: 1,
                        adminNote: "Đã quét VietQR chuyển khoản hoàn cọc thành công",
                      });
                      toast.success(t("admin_tx_refund_success_toast", "🎉 Đã xác nhận hoàn tiền cọc cho khách thành công!"));
                      setVietQrModalRefund(null);
                      await fetchData();
                    } catch (err: any) {
                      toast.error(err.message || t("admin_tx_status_error", "Lỗi khi cập nhật trạng thái"));
                    }
                  }}
                  className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex-1 text-xs gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t("vietqr_modal_confirm_sent", "Xác nhận đã chuyển tiền")}</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ─── REVIEW REFUND DIALOG ─── */}
      {selectedRefund && (
        <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6 space-y-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <RotateCcw
                  className={`h-5 w-5 ${
                    reviewRefundAction === 1 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                />
                {reviewRefundAction === 1
                  ? t("admin_confirm_refund_title", "Xác Nhận Đã Hoàn Cọc Cho Khách")
                  : t("admin_reject_refund_title", "Từ Chối Hoàn Tiền Cọc")}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                {t("vietqr_modal_booking_code", "Đơn đặt xe:")} <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedRefund.bookingCode}</span> • {t("vietqr_modal_customer_name", "Khách:")} <strong>{selectedRefund.customer?.fullName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("vietqr_modal_customer_name", "Khách hàng:")}</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {selectedRefund.customer?.fullName} ({selectedRefund.customer?.phone})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t("bookings_partner_store", "Nhà xe đối tác:")}</span>
                <strong className="text-slate-900 dark:text-slate-100">{selectedRefund.store?.storeName}</strong>
              </div>
              {selectedRefund.refundBankName && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t("cancel_modal_bank_name", "Ngân hàng thụ hưởng:")}</span>
                    <strong className="text-blue-700 dark:text-blue-400">{selectedRefund.refundBankName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t("cancel_modal_bank_account", "Số tài khoản:")}</span>
                    <strong className="font-mono text-slate-900 dark:text-slate-100">
                      {selectedRefund.refundAccountNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t("cancel_modal_account_name", "Tên chủ tài khoản:")}</span>
                    <strong className="text-slate-900 dark:text-slate-100 uppercase">
                      {selectedRefund.refundAccountName}
                    </strong>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-slate-500 dark:text-slate-400">{t("cancel_modal_refund_amount", "Số tiền cọc hoàn lại:")}</span>
                <strong className="font-mono text-base font-black text-blue-700 dark:text-blue-400">
                  {Number(selectedRefund.refundAmount || 0).toLocaleString("vi-VN")} VNĐ
                </strong>
              </div>
              {selectedRefund.cancelReason && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic border-t border-slate-200 dark:border-slate-700 pt-1">
                  {t("cancel_modal_reason_label", "Lý do khách hủy:")} "{selectedRefund.cancelReason}"
                </div>
              )}
            </div>

            {reviewRefundAction === 2 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p>
                  {t("admin_refund_reject_notice", "Lưu ý: Khi từ chối hoàn cọc, số tiền cọc sẽ được tự động hoàn lại vào ví số dư của đối tác nhà xe.")}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("admin_refund_note_label", "Ghi chú xác nhận / Lý do từ chối:")}</Label>
              <Input
                type="text"
                value={reviewRefundNote}
                onChange={(e) => setReviewRefundNote(e.target.value)}
                placeholder={
                  reviewRefundAction === 1
                    ? t("admin_refund_note_approve_ph", "Nhập mã giao dịch ngân hàng hoặc ghi chú...")
                    : t("admin_refund_note_reject_ph", "Nhập lý do từ chối hoàn tiền cọc...")
                }
                className="text-xs h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <DialogFooter className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRefund(null)}
                disabled={isSubmittingRefundReview}
                className="rounded-xl border-slate-200 dark:border-slate-700"
              >
                {t("cancel_modal_close", "Hủy bỏ")}
              </Button>
              <Button
                size="sm"
                onClick={handleReviewRefund}
                disabled={isSubmittingRefundReview}
                className={`rounded-xl font-bold text-white ${
                  reviewRefundAction === 1
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSubmittingRefundReview
                  ? "Đang xử lý..."
                  : reviewRefundAction === 1
                  ? "Xác nhận đã hoàn cọc"
                  : "Xác nhận từ chối"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

