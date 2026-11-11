"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, Promotion } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Power,
  Calendar,
  Percent,
  Tag,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<number>(0); // 0: %, 1: VND
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minRentDays, setMinRentDays] = useState<number>(1);
  const [maxDiscount, setMaxDiscount] = useState<string>("");
  const [tag, setTag] = useState("GÓI PHỔ BIẾN");
  const [bullet1, setBullet1] = useState("");
  const [bullet2, setBullet2] = useState("");
  const [usageLimit, setUsageLimit] = useState<number>(1000);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Delete Confirm Modal
  const [deletingPromo, setDeletingPromo] = useState<Promotion | null>(null);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const data = await api.admin.promotions.getAll();
      setPromotions(data);
    } catch {
      toast.error("Không thể tải danh sách khuyến mãi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      toast.error("Vui lòng điền mã và tiêu đề khuyến mãi!");
      return;
    }

    const bullets: string[] = [];
    if (bullet1.trim()) bullets.push(bullet1.trim());
    if (bullet2.trim()) bullets.push(bullet2.trim());

    setIsSubmitting(true);
    try {
      await api.admin.promotions.create({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim() || undefined,
        discountType,
        discountValue: Number(discountValue),
        minRentDays: Number(minRentDays) || 1,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        tag: tag.trim() || undefined,
        bullets,
        usageLimit: Number(usageLimit) || 1000,
        isActive,
      });

      toast.success(`Đã tạo thành công mã khuyến mãi "${code.trim().toUpperCase()}"! Khuyến mãi sẽ hiển thị ngay trên trang chủ.`);
      setIsCreateOpen(false);
      resetForm();
      fetchPromotions();
    } catch (err: any) {
      toast.error(err.message || "Tạo khuyến mãi thất bại. Vui lòng kiểm tra lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (promo: Promotion) => {
    try {
      await api.admin.promotions.toggle(promo.id);
      toast.success(`Đã ${promo.isActive ? "tạm dừng" : "kích hoạt"} mã ${promo.code}`);
      fetchPromotions();
    } catch (err: any) {
      toast.error(err.message || "Thao tác thất bại.");
    }
  };

  const handleDelete = async () => {
    if (!deletingPromo) return;
    try {
      await api.admin.promotions.delete(deletingPromo.id);
      toast.success(`Đã xóa thành công chương trình "${deletingPromo.code}"`);
      setDeletingPromo(null);
      fetchPromotions();
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa khuyến mãi.");
    }
  };

  const resetForm = () => {
    setCode("");
    setTitle("");
    setDescription("");
    setDiscountType(0);
    setDiscountValue(10);
    setMinRentDays(1);
    setMaxDiscount("");
    setTag("GÓI PHỔ BIẾN");
    setBullet1("");
    setBullet2("");
    setUsageLimit(1000);
    setIsActive(true);
  };

  // Filter logic
  const filteredPromotions = promotions.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tag && p.tag.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "active") return p.isActive;
    if (statusFilter === "inactive") return !p.isActive;
    return true;
  });

  const activeCount = promotions.filter((p) => p.isActive).length;
  const totalUsed = promotions.reduce((acc, cur) => acc + (cur.usedCount || 0), 0);

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Lý Khuyến Mãi & Voucher
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thiết lập mã giảm giá hiển thị trực tiếp trên trang chủ và tích hợp vào popup đặt xe của khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/#pricing"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>Xem trên Trang chủ</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
          >
            <Plus className="h-4 w-4" /> Tạo Khuyến Mãi Mới
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">Tổng chương trình</span>
              <div className="text-2xl font-black text-slate-900">{promotions.length}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Ticket className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">Đang kích hoạt</span>
              <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">Đang tạm dừng</span>
              <div className="text-2xl font-black text-slate-400">{promotions.length - activeCount}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">Lượt khách đã dùng</span>
              <div className="text-2xl font-black text-blue-700">{totalUsed}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              type="text"
              placeholder="Tìm kiếm mã hoặc tiêu đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-xs h-10 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className={`text-xs h-9 rounded-xl font-bold ${statusFilter === "all" ? "bg-blue-600 text-white" : ""}`}
            >
              Tất cả ({promotions.length})
            </Button>
            <Button
              type="button"
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              className={`text-xs h-9 rounded-xl font-bold ${statusFilter === "active" ? "bg-emerald-600 text-white" : ""}`}
            >
              Đang áp dụng ({activeCount})
            </Button>
            <Button
              type="button"
              variant={statusFilter === "inactive" ? "default" : "outline"}
              onClick={() => setStatusFilter("inactive")}
              className={`text-xs h-9 rounded-xl font-bold ${statusFilter === "inactive" ? "bg-slate-600 text-white" : ""}`}
            >
              Tạm dừng ({promotions.length - activeCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promotions Table */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-3.5 px-4">Mã Voucher</th>
                <th className="py-3.5 px-4">Tiêu Đề & Quyền Lợi</th>
                <th className="py-3.5 px-4">Mức Giảm Giá</th>
                <th className="py-3.5 px-4">Điều Kiện</th>
                <th className="py-3.5 px-4">Đã Dùng / Giới Hạn</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải danh sách khuyến mãi...
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Không tìm thấy chương trình khuyến mãi nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Mã Voucher & Tag */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1">
                        <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {promo.code}
                        </span>
                        {promo.tag && (
                          <div>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              {promo.tag}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Tiêu đề & Quyền lợi */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <div className="font-bold text-slate-900 text-sm">{promo.title}</div>
                      {promo.description && (
                        <div className="text-slate-500 text-[11px] mt-0.5 leading-relaxed line-clamp-2">
                          {promo.description}
                        </div>
                      )}
                      {Array.isArray(promo.bullets) && promo.bullets.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {promo.bullets.map((b, i) => (
                            <span key={i} className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              ✓ {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Mức giảm */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-extrabold text-emerald-600 text-sm">
                        {promo.discountType === 0
                          ? `Giảm ${Number(promo.discountValue)}%`
                          : `Giảm ${Number(promo.discountValue).toLocaleString("vi-VN")} đ`}
                      </div>
                      {promo.discountType === 0 && promo.maxDiscount && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Tối đa {Number(promo.maxDiscount).toLocaleString("vi-VN")} đ
                        </div>
                      )}
                    </td>

                    {/* Điều kiện */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-slate-700 font-medium">
                        {promo.minRentDays > 1 ? `Thuê từ ${promo.minRentDays} ngày` : "Mọi lịch trình"}
                      </div>
                    </td>

                    {/* Lượt dùng */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-slate-800">
                        {promo.usedCount} / {promo.usageLimit || "∞"}
                      </div>
                      <div className="w-20 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, ((promo.usedCount || 0) / (promo.usageLimit || 1000)) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4 align-top">
                      {promo.isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                          Đang kích hoạt
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 border-slate-200 font-bold">
                          Tạm dừng
                        </Badge>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(promo)}
                          className={`h-8 px-2.5 rounded-lg text-xs font-bold ${
                            promo.isActive
                              ? "text-amber-700 hover:bg-amber-50"
                              : "text-emerald-700 hover:bg-emerald-50"
                          }`}
                          title={promo.isActive ? "Tạm dừng mã" : "Kích hoạt mã"}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {promo.isActive ? "Tắt" : "Bật"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingPromo(promo)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Xóa khuyến mãi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Tạo Khuyến Mãi Mới */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg w-[95vw] rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Ticket className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg font-black text-slate-900">
                Tạo Chương Trình Khuyến Mãi Mới
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Mã sau khi tạo sẽ tự động xuất hiện trên trang chủ và sẵn sàng để khách hàng chọn khi đặt xe.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Mã Voucher (Viết hoa)</Label>
                <Input
                  type="text"
                  placeholder="VD: HE2026, VIP10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="text-xs uppercase font-mono font-bold h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Huy hiệu hiển thị (Tag)</Label>
                <Input
                  type="text"
                  placeholder="VD: GÓI PHỔ BIẾN, TÂN THỦ, HOT"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Tiêu đề khuyến mãi</Label>
              <Input
                type="text"
                placeholder="VD: Giảm 20% Cho Chuyến Du Lịch Hè"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Mô tả chi tiết</Label>
              <Textarea
                rows={2}
                placeholder="Ưu đãi áp dụng cho các chuyến đi từ 3 ngày trở lên..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Hình thức giảm</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType(0)}
                    className={`h-10 rounded-xl border text-xs font-bold transition-all ${
                      discountType === 0
                        ? "bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-600/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    Phần trăm (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType(1)}
                    className={`h-10 rounded-xl border text-xs font-bold transition-all ${
                      discountType === 1
                        ? "bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-600/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    Cố định (VNĐ)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  {discountType === 0 ? "Mức giảm (%)" : "Mức giảm (VNĐ)"}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  required
                  className="text-xs h-10 rounded-xl font-bold"
                />
              </div>
            </div>

            {/* Conditions: minRentDays, maxDiscount, usageLimit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Thuê tối thiểu (ngày)</Label>
                <Input
                  type="number"
                  min={1}
                  value={minRentDays}
                  onChange={(e) => setMinRentDays(Number(e.target.value))}
                  className="text-xs h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Giảm tối đa (VNĐ)</Label>
                <Input
                  type="number"
                  placeholder="Không giới hạn"
                  disabled={discountType === 1}
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  className="text-xs h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Tổng lượt dùng</Label>
                <Input
                  type="number"
                  min={1}
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  className="text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            {/* Bullets */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <Label className="text-xs font-bold text-slate-700">Quyền lợi hiển thị trên thẻ (Bullets)</Label>
              <Input
                type="text"
                placeholder="Dòng 1: VD: Từ 3 ngày: Giảm ngay 15%"
                value={bullet1}
                onChange={(e) => setBullet1(e.target.value)}
                className="text-xs h-9 rounded-xl"
              />
              <Input
                type="text"
                placeholder="Dòng 2: VD: Miễn phí giao xe tận nơi"
                value={bullet2}
                onChange={(e) => setBullet2(e.target.value)}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="h-10 text-xs font-semibold rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Lưu & Xuất Bản Khuyến Mãi</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Xác nhận xóa */}
      <Dialog open={Boolean(deletingPromo)} onOpenChange={() => setDeletingPromo(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <DialogTitle className="text-base font-bold text-slate-900">
                Xác Nhận Xóa Khuyến Mãi
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa chương trình khuyến mãi{" "}
              <strong>{deletingPromo?.code}</strong> ({deletingPromo?.title})? Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingPromo(null)}
              className="h-9 text-xs font-semibold rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

