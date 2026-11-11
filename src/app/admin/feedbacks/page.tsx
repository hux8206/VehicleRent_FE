"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { api, Feedback, FeedbackStats } from "@/lib/api";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  Trash2,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Loader2,
  Eye,
  X,
  Save,
  Tag,
  Headphones,
  Sparkles,
  FileText,
  ThumbsUp,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  SERVICE: { label: "Dịch Vụ", icon: Headphones, color: "bg-blue-50 text-blue-700 border-blue-200" },
  APP_UI: { label: "Giao Diện", icon: Sparkles, color: "bg-purple-50 text-purple-700 border-purple-200" },
  POLICY: { label: "Chính Sách", icon: FileText, color: "bg-amber-50 text-amber-700 border-amber-200" },
  VEHICLE: { label: "Chất Lượng Xe", icon: ThumbsUp, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  BUG: { label: "Báo Lỗi Kỹ Thuật", icon: AlertCircle, color: "bg-rose-50 text-rose-700 border-rose-200" },
  OTHER: { label: "Đóng Góp Khác", icon: HelpCircle, color: "bg-slate-50 text-slate-700 border-slate-200" },
};

const STATUS_MAP: Record<number, { label: string; color: string; badge: string }> = {
  0: { label: "Mới tiếp nhận", color: "text-amber-700 bg-amber-50 border-amber-200", badge: "Chờ xử lý" },
  1: { label: "Đang xử lý", color: "text-blue-700 bg-blue-50 border-blue-200", badge: "Đã tiếp nhận" },
  2: { label: "Đã giải quyết", color: "text-emerald-700 bg-emerald-50 border-emerald-200", badge: "Đã hoàn tất" },
};

export default function AdminFeedbacksPage() {
  const { user, role, isLoading: authLoading } = useAuth();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    avgRating: 5,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal detail/update
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [newStatus, setNewStatus] = useState<number>(0);
  const [adminNote, setAdminNote] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.admin.feedbacks.getAll({
        status: statusFilter !== "ALL" ? Number(statusFilter) : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setFeedbacks(res.feedbacks || []);
      setStats(res.stats || { total: 0, pending: 0, inProgress: 0, resolved: 0, avgRating: 5 });
    } catch (err) {
      console.error("Lỗi tải danh sách ý kiến đóng góp:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role === 0) {
      loadData();
    }
  }, [role, statusFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenDetail = (f: Feedback) => {
    setSelectedFeedback(f);
    setNewStatus(f.status);
    setAdminNote(f.adminNote || "");
    setUpdateMsg(null);
  };

  const handleSaveStatus = async () => {
    if (!selectedFeedback) return;
    setIsUpdating(true);
    setUpdateMsg(null);
    try {
      await api.admin.feedbacks.updateStatus(selectedFeedback.id, {
        status: newStatus,
        adminNote: adminNote.trim(),
      });
      setUpdateMsg("Cập nhật trạng thái thành công!");
      // Cập nhật lại danh sách tại chỗ
      setFeedbacks((prev) =>
        prev.map((item) =>
          item.id === selectedFeedback.id
            ? { ...item, status: newStatus, adminNote: adminNote.trim() }
            : item
        )
      );
      // Reload lại thống kê
      loadData();
      setTimeout(() => setSelectedFeedback(null), 1000);
    } catch (err: any) {
      setUpdateMsg(err?.message || "Không thể cập nhật lúc này.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ý kiến đóng góp #${id}?`)) return;
    try {
      await api.admin.feedbacks.delete(id);
      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
      loadData();
    } catch (err) {
      alert("Xóa không thành công.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (role !== 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <Shield className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Từ Chối Truy Cập</h2>
          <p className="text-xs text-slate-500">
            Chức năng này chỉ dành riêng cho Ban Quản Trị Sàn (Admin).
          </p>
          <Link href="/">
            <Button className="mt-2 text-xs font-bold rounded-xl">Quay lại trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/admin" className="hover:text-blue-600 flex items-center gap-1 font-semibold">
                <ArrowLeft className="w-3.5 h-3.5" /> Báo cáo sàn
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-bold">Hòm thư góp ý khách hàng</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2.5">
              <MessageSquare className="w-7 h-7 text-blue-600" />
              <span>Ý Kiến Đóng Góp & Phản Hồi</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="rounded-xl text-xs font-bold bg-white"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Làm mới dữ liệu
            </Button>
            <Link href="/feedback" target="_blank">
              <Button size="sm" className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở Form Góp Ý Khách</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Tổng Ý Kiến
            </span>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
              Chờ Tiếp Nhận
            </span>
            <div className="text-2xl font-black text-amber-900">{stats.pending}</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
              Đang Xử Lý
            </span>
            <div className="text-2xl font-black text-blue-900">{stats.inProgress}</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Đã Giải Quyết
            </span>
            <div className="text-2xl font-black text-emerald-900">{stats.resolved}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Đánh Giá TB
            </span>
            <div className="text-2xl font-black text-amber-500 flex items-center gap-1">
              <span>{stats.avgRating}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo họ tên, email, số điện thoại, tiêu đề..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              />
            </form>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "0", label: "Mới gửi" },
                { id: "1", label: "Đang xử lý" },
                { id: "2", label: "Đã xong" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === t.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả chủ đề</option>
              <option value="SERVICE">Dịch vụ & Trải nghiệm</option>
              <option value="APP_UI">Giao diện & Ứng dụng</option>
              <option value="POLICY">Chính sách & Biểu phí</option>
              <option value="VEHICLE">Chất lượng xe</option>
              <option value="BUG">Báo lỗi kỹ thuật</option>
              <option value="OTHER">Đóng góp khác</option>
            </select>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span>Đang tải danh sách ý kiến đóng góp...</span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Chưa có ý kiến đóng góp nào</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Khi khách hàng gửi form góp ý trên website, toàn bộ thông tin sẽ được hiển thị và quản lý tại đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {feedbacks.map((f) => {
                const cat = CATEGORY_MAP[f.category] || CATEGORY_MAP.OTHER;
                const CatIcon = cat.icon;
                const st = STATUS_MAP[f.status] || STATUS_MAP[0];

                return (
                  <div
                    key={f.id}
                    className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    {/* Left Info */}
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${st.color}`}
                        >
                          {st.badge}
                        </span>

                        {/* Category Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cat.color}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          <span>{cat.label}</span>
                        </span>

                        {/* Rating Stars */}
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                          {"★".repeat(f.rating)}
                          <span className="text-slate-400 font-normal text-[11px] ml-1">
                            ({f.rating}/5)
                          </span>
                        </div>

                        {/* Time */}
                        <span className="text-[11px] text-slate-400">
                          {new Date(f.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>

                      {/* Subject */}
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                        {f.subject}
                      </h3>

                      {/* Content preview */}
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {f.content}
                      </p>

                      {/* Sender details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{f.fullName}</span>
                          {f.userId && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                              Thành viên
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{f.email}</span>
                        </div>
                        {f.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{f.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Admin Note if exists */}
                      {f.adminNote && (
                        <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-700">
                          <span className="font-bold text-slate-900 mr-1.5">Ghi chú của Admin:</span>
                          <span>{f.adminNote}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleOpenDetail(f)}
                        className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem & Xử lý</span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDelete(f.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa ý kiến"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal View & Update Status */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Chi tiết ý kiến #{selectedFeedback.id}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {selectedFeedback.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {updateMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    updateMsg.includes("thành công")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{updateMsg}</span>
                </div>
              )}

              {/* Sender Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Người gửi:</span>
                  <span className="font-bold text-slate-800">{selectedFeedback.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Email:</span>
                  <a
                    href={`mailto:${selectedFeedback.email}`}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    {selectedFeedback.email}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Số điện thoại:</span>
                  <span className="font-bold text-slate-800">
                    {selectedFeedback.phone || "Không cung cấp"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Thời gian gửi:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedFeedback.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Full Content */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Nội dung phản hồi từ khách hàng:
                </span>
                <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.content}
                </div>
              </div>

              {/* Update Status form */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                  Cập nhật tiến độ xử lý của Admin
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "Mới gửi (Chờ)", color: "border-amber-300 bg-amber-50 text-amber-800" },
                    { val: 1, label: "Đang xử lý", color: "border-blue-300 bg-blue-50 text-blue-800" },
                    { val: 2, label: "Đã giải quyết", color: "border-emerald-300 bg-emerald-50 text-emerald-800" },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setNewStatus(s.val)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        newStatus === s.val
                          ? `${s.color} ring-2 ring-blue-500/30 shadow-xs`
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ghi chú nội bộ / Kế hoạch phản hồi
                  </label>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Ghi chú nội dung đã trao đổi với khách hoặc phương án giải quyết kỹ thuật..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFeedback(null)}
                className="rounded-xl text-xs font-bold"
              >
                Đóng
              </Button>
              <Button
                size="sm"
                onClick={handleSaveStatus}
                disabled={isUpdating}
                className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Lưu Cập Nhật</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

