"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { api, Feedback } from "@/lib/api";
import {
  MessageSquare,
  Send,
  Star,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Headphones,
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Loader2,
  ThumbsUp,
  Inbox,
  Clock,
  RotateCw,
} from "lucide-react";

const CATEGORIES = [
  {
    id: "SERVICE",
    label: "Dịch Vụ & Trải Nghiệm",
    desc: "Thái độ phục vụ, quy trình giao nhận xe, hỗ trợ chăm sóc",
    icon: Headphones,
  },
  {
    id: "APP_UI",
    label: "Giao Diện & Ứng Dụng",
    desc: "Tính năng website, tốc độ phản hồi, trải nghiệm đặt xe",
    icon: Sparkles,
  },
  {
    id: "POLICY",
    label: "Chính Sách & Biểu Phí",
    desc: "Mức cọc, điều khoản hoàn hủy, bảng giá niêm yết",
    icon: FileText,
  },
  {
    id: "VEHICLE",
    label: "Chất Lượng Phương Tiện",
    desc: "Động cơ, độ mới, vệ sinh xe, bảo dưỡng định kỳ",
    icon: ThumbsUp,
  },
  {
    id: "BUG",
    label: "Báo Lỗi & Sự Cố Kỹ Thuật",
    desc: "Lỗi hiển thị, trục trặc thanh toán VietQR, lỗi đăng nhập",
    icon: AlertCircle,
  },
  {
    id: "OTHER",
    label: "Đóng Góp Khác",
    desc: "Các sáng kiến và đề xuất hợp tác mở rộng khác",
    icon: HelpCircle,
  },
];

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: "Rất không hài lòng", color: "text-red-500" },
  2: { text: "Cần cải thiện nhiều", color: "text-amber-500" },
  3: { text: "Bình thường / Tạm ổn", color: "text-yellow-600" },
  4: { text: "Hài lòng", color: "text-blue-600" },
  5: { text: "Rất hài lòng & Xuất sắc", color: "text-emerald-600" },
};

export default function CustomerFeedbackPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("SERVICE");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const [activeTab, setActiveTab] = useState<"send" | "inbox">("send");
  const [myFeedbacks, setMyFeedbacks] = useState<Feedback[]>([]);
  const [isLoadingMyFeedbacks, setIsLoadingMyFeedbacks] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMyFeedbacks = async () => {
    if (!user) return;
    setIsLoadingMyFeedbacks(true);
    try {
      const data = await api.feedbacks.getMyFeedbacks();
      setMyFeedbacks(data || []);
    } catch {
      setMyFeedbacks([]);
    } finally {
      setIsLoadingMyFeedbacks(false);
    }
  };

  // Auto-fill thông tin nếu người dùng đã đăng nhập & tải danh sách phản hồi của tôi
  useEffect(() => {
    if (user) {
      if (!fullName && user.fullName) setFullName(user.fullName);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      fetchMyFeedbacks();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !subject.trim() || !content.trim()) {
      setErrorMessage(t("toast_fill_required", "Vui lòng điền đầy đủ các thông tin bắt buộc (*)"));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.feedbacks.submit({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        category,
        rating,
        subject: subject.trim(),
        content: content.trim(),
      });

      setIsSuccess(true);
      if (user) {
        fetchMyFeedbacks();
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || t("feedback_error_generic", "Không thể gửi ý kiến đóng góp lúc này. Vui lòng thử lại sau ít phút.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setIsSuccess(false);
    setSubject("");
    setContent("");
    setRating(5);
    setCategory("SERVICE");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb / Back button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("nav_home", "Quay lại trang chủ")}</span>
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-bold shadow-2xs">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t("feedback_badge", "Hòm Thư Lắng Nghe & Cải Tiến Liên Tục")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-slate-100 tracking-tight">
            {t("feedback_title", "Đóng Góp Ý Kiến & Phản Hồi")}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t("feedback_desc", "Mỗi ý kiến của bạn là động lực và cơ sở để Ban Quản Trị nâng cấp chất lượng xe, tối ưu quy trình giao nhận và hoàn thiện trải nghiệm dịch vụ.")}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("send");
              setIsSuccess(false);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "send"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi Ý Kiến & Góp Ý</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("inbox");
              if (user) fetchMyFeedbacks();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "inbox"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Hòm Thư Phản Hồi Từ BQT</span>
            {user && myFeedbacks.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === "inbox" ? "bg-white text-blue-700" : "bg-blue-100 text-blue-700"
                }`}
              >
                {myFeedbacks.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden">
          {activeTab === "inbox" ? (
            /* Customer Feedback Inbox & BQT Replies */
            <div className="p-6 sm:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Ý Kiến & Phản Hồi Của Bạn
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Theo dõi tiến độ xử lý và câu trả lời chính thức từ Ban Quản Trị VehicleRent
                  </p>
                </div>
                {user && (
                  <button
                    type="button"
                    onClick={fetchMyFeedbacks}
                    disabled={isLoadingMyFeedbacks}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoadingMyFeedbacks ? "animate-spin text-blue-600" : ""}`} />
                    <span>Làm mới</span>
                  </button>
                )}
              </div>

              {!user ? (
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900">
                      Đăng nhập để xem phản hồi từ Ban Quản Trị
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Các ý kiến đóng góp cùng câu trả lời giải đáp từ Ban Quản Trị sẽ được lưu giữ đồng bộ trong tài khoản của bạn.
                    </p>
                  </div>
                  <Link
                    href="/login?redirect=/feedback"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-colors"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : isLoadingMyFeedbacks ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-xs font-semibold">Đang tải danh sách phản hồi...</p>
                </div>
              ) : myFeedbacks.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900">
                      Bạn chưa gửi ý kiến đóng góp nào
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Mọi thắc mắc, phản ánh dịch vụ hoặc đề xuất cải tiến của bạn đều được Ban Quản Trị tiếp nhận và xử lý nghiêm túc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("send")}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Gửi góp ý ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myFeedbacks.map((f) => {
                    const catObj = CATEGORIES.find((c) => c.id === f.category);
                    const statusInfo =
                      f.status === 2
                        ? { label: "Đã giải quyết", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
                        : f.status === 1
                        ? { label: "Đang xử lý", color: "bg-blue-50 text-blue-700 border-blue-200" }
                        : { label: "Mới tiếp nhận", color: "bg-amber-50 text-amber-700 border-amber-200" };

                    return (
                      <div
                        key={f.id}
                        className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 transition-colors shadow-2xs space-y-3.5"
                      >
                        {/* Meta info */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                              {catObj?.label || f.category}
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-amber-500 text-xs font-bold">
                              {"★".repeat(f.rating)}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-400">
                            {new Date(f.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>

                        {/* Subject & User content */}
                        <div className="space-y-1.5">
                          <h4 className="text-sm sm:text-base font-black text-slate-900">
                            {f.subject}
                          </h4>
                          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {f.content}
                          </div>
                        </div>

                        {/* Admin Response Box */}
                        {f.adminNote ? (
                          <div className="p-4 bg-linear-to-r from-blue-50/90 via-sky-50/80 to-blue-50/90 rounded-2xl border border-blue-200/90 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                Phản hồi chính thức từ Ban Quản Trị Sàn
                              </span>
                              <span className="text-[11px] text-blue-700 font-semibold">
                                {new Date(f.updatedAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-blue-950 font-medium whitespace-pre-line leading-relaxed pl-1">
                              {f.adminNote}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Ý kiến của bạn đã được tiếp nhận. Ban Quản Trị đang xem xét và sẽ gửi phản hồi trực tiếp tại đây trong thời gian sớm nhất.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : isSuccess ? (
            /* Success State */
            <div className="p-8 sm:p-14 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">
                  Gửi Ý Kiến Đóng Góp Thành Công!
                </h3>
                <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Cảm ơn bạn đã dành thời gian quý báu để chia sẻ với VehicleRent. Ý kiến của bạn đã
                  được chuyển trực tiếp đến Ban Quản Trị Sàn để xem xét và xử lý.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 max-w-md mx-auto text-left text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Chủ đề:</span>
                  <span className="font-bold text-slate-800">
                    {CATEGORIES.find((c) => c.id === category)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Đánh giá:</span>
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    {"★".repeat(rating)} ({rating}/5)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Người gửi:</span>
                  <span className="font-bold text-slate-800">{fullName}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Gửi thêm ý kiến khác
                </button>
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleResetForm();
                      setActiveTab("inbox");
                      fetchMyFeedbacks();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-colors cursor-pointer"
                  >
                    Xem hòm thư phản hồi của bạn →
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-colors"
                  >
                    Trở về trang chủ
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* Feedback Form */
            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-medium">{errorMessage}</p>
                </div>
              )}

              {/* 1. Chọn mức độ hài lòng (Star Rating) */}
              <div className="space-y-3 pb-6 border-b border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mức độ hài lòng chung của bạn đối với dịch vụ
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating !== null ? hoverRating : rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(star)}
                          className="p-1 focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              active
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-100 text-slate-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs font-bold">
                    <span
                      className={
                        RATING_LABELS[hoverRating !== null ? hoverRating : rating]?.color
                      }
                    >
                      {RATING_LABELS[hoverRating !== null ? hoverRating : rating]?.text}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Chọn chủ đề góp ý */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t("feedback_type", "Chọn lĩnh vực bạn muốn đóng góp ý kiến")} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-600/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon
                            className={`w-4 h-4 ${
                              isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? "text-blue-900 dark:text-blue-200" : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {cat.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {cat.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Tiêu đề và Nội dung chi tiết */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("feedback_subject", "Tiêu đề ý kiến")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Tóm tắt ngắn gọn ý kiến hoặc vấn đề của bạn..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("feedback_content", "Nội dung chi tiết")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Mô tả cụ thể trải nghiệm, các điểm bạn thấy hài lòng hoặc những chi tiết cần cải thiện..."
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all leading-relaxed"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Càng mô tả cụ thể, Ban Quản Trị càng dễ dàng xác minh và hỗ trợ kịp thời.
                  </p>
                </div>
              </div>

              {/* 4. Thông tin người gửi */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Thông tin người gửi (để Ban Quản Trị phản hồi lại bạn)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t("auth_fullname", "Họ và tên")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t("auth_email", "Email liên hệ")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t("auth_phone", "Số điện thoại")} <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Cam kết bảo mật & Nút Gửi */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Bảo mật danh tính & thông tin liên hệ theo Nghị định 13/2023/NĐ-CP</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("feedback_sending", "Đang gửi ý kiến...")}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t("feedback_submit", "Gửi ý kiến đóng góp")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

