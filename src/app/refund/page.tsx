import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  CreditCard,
  Building,
  ArrowLeft,
  CalendarCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Chính Sách Hủy Chuyến & Hoàn Tiền Cọc - VehicleRent",
  description:
    "Quy định minh bạch về đặt cọc, cơ chế giữ chỗ 10 phút, điều kiện hủy đơn và thời gian hoàn tiền cọc trên sàn VehicleRent.",
};

export default function RefundPolicyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-10 md:py-16">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Navigation / Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Về trang chủ
          </Link>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200/80 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-4 border border-amber-200">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            Minh bạch tài chính & Quyền lợi khách hàng
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Chính Sách Hủy Chuyến & Hoàn Tiền Cọc
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            Để đảm bảo quyền lợi công bằng cho cả Khách thuê xe và Đối tác nhà xe, VehicleRent áp dụng quy trình đặt cọc tự động qua VietQR và chính sách hoàn tiền minh bạch theo các mốc thời gian rõ ràng.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>Phiên bản: <strong>Tháng 11/2026</strong></span>
            <span>•</span>
            <span>Tiêu chuẩn: <strong>Hệ thống VietQR tự động & Khấu trừ ví đối tác</strong></span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ✓ Bảo lãnh: Hoàn 150% tiền cọc nếu đối tác không đáp ứng được đơn đặt
            </span>
            <span>•</span>
            <span>Thời gian xử lý hoàn cọc: <strong>24h - 48h làm việc</strong></span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200/80 space-y-9 text-slate-700 text-sm md:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">1</span>
              <h2>Cơ chế Đặt Cọc: Đơn Trực Tuyến & Đơn Tại Quầy</h2>
            </div>
            <p>
              Tùy thuộc vào hình thức đặt thuê trên hệ thống VehicleRent, quy chế tiền cọc được phân định rõ:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Đơn trực tuyến (Online Booking):
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tiền cọc được thanh toán trực tuyến qua cổng VietQR PayOS (tỷ lệ tối thiểu 15% do nhà xe quy định). Hệ thống tự động khóa xe độc quyền trong <strong>10 phút</strong> để khách thanh toán. Nếu quá 10 phút, đơn tự động hủy và xe được mở lại.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-amber-600" /> Đơn tạo tại quầy (Walk-in Booking):
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đối tác nhà xe trực tiếp thỏa thuận mức cọc (hỗ trợ cọc 0đ hoặc thu cọc tiền mặt) với khách vãng lai. Tiền cọc và tiền thuê đơn tại quầy không qua cổng thanh toán sàn và do hai bên tự quản lý.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 - TIMELINE REFUND TABLE */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">2</span>
              <h2>Bảng Quy Định Tỷ Lệ Hoàn Tiền Cọc Đơn Trực Tuyến</h2>
            </div>
            <p className="text-sm">
              Trường hợp Khách hàng chủ động yêu cầu hủy Đơn đặt trực tuyến đã cọc thành công qua cổng thanh toán sàn, mức hoàn tiền cọc được tính căn cứ theo khoảng cách đến <strong>Giờ Nhận Xe</strong> và <strong>Thời gian từ lúc tạo đơn (áp dụng cơ chế ân hạn 30 phút)</strong>:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-100/80 text-slate-900 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 md:p-4">Thời điểm hủy đơn</th>
                    <th className="p-3.5 md:p-4">Thời gian từ lúc đặt</th>
                    <th className="p-3.5 md:p-4">Tỷ lệ hoàn tiền cọc</th>
                    <th className="p-3.5 md:p-4">Ghi chú & Chi phí</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3.5 md:p-4 font-semibold text-emerald-700">
                      Trước giờ nhận xe ≥ 24 giờ
                    </td>
                    <td className="p-3.5 md:p-4 text-slate-600 text-xs">
                      Không giới hạn
                    </td>
                    <td className="p-3.5 md:p-4 font-bold text-emerald-600">
                      Hoàn 100% tiền cọc
                    </td>
                    <td className="p-3.5 md:p-4 text-slate-500 text-xs">
                      Khách hàng nhận lại đầy đủ 100% tiền cọc đã đóng.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3.5 md:p-4 font-semibold text-amber-700" rowSpan={2}>
                      Trước giờ nhận xe từ 6h đến dưới 24h
                    </td>
                    <td className="p-3.5 md:p-4 font-medium text-emerald-700 text-xs bg-emerald-50/40">
                      Vừa đặt dưới 30 phút (≤ 30p)
                    </td>
                    <td className="p-3.5 md:p-4 font-bold text-emerald-600 bg-emerald-50/40">
                      Hoàn 100% tiền cọc
                    </td>
                    <td className="p-3.5 md:p-4 text-slate-500 text-xs bg-emerald-50/40">
                      Chính sách ân hạn hỗ trợ khách đổi ý hoặc thao tác nhầm ngay sau khi đặt.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3.5 md:p-4 font-medium text-amber-700 text-xs">
                      Đã quá 30 phút (&gt; 30p)
                    </td>
                    <td className="p-3.5 md:p-4 font-bold text-amber-600">
                      Hoàn 50% tiền cọc
                    </td>
                    <td className="p-3.5 md:p-4 text-slate-500 text-xs">
                      50% tiền cọc còn lại được chuyển bù đắp chi phí giữ xe cho Chủ cửa hàng.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 bg-rose-50/20">
                    <td className="p-3.5 md:p-4 font-semibold text-rose-700" rowSpan={2}>
                      Cận giờ dưới 6 giờ trước giờ nhận
                    </td>
                    <td className="p-3.5 md:p-4 font-medium text-amber-700 text-xs bg-amber-50/40">
                      Vừa đặt dưới 30 phút (≤ 30p)
                    </td>
                    <td className="p-3.5 md:p-4 font-bold text-amber-600 bg-amber-50/40">
                      Hoàn 50% tiền cọc
                    </td>
                    <td className="p-3.5 md:p-4 text-slate-500 text-xs bg-amber-50/40">
                      Hỗ trợ hoàn 50% cọc nếu vừa đặt cận giờ và hủy ngay trong 30 phút.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 bg-rose-50/30">
                    <td className="p-3.5 md:p-4 font-medium text-rose-700 text-xs">
                      Đã quá 30 phút hoặc Không đến nhận
                    </td>
                    <td className="p-3.5 md:p-4 font-bold text-rose-600">
                      Mất cọc 100% (Hoàn 0%)
                    </td>
                    <td className="p-3.5 md:p-4 text-slate-500 text-xs">
                      100% tiền cọc được bồi hoàn cho Chủ xe để bù đắp thiệt hại chi phí cơ hội.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 - FAULT BY STORE / FORCE MAJEURE */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">3</span>
              <h2>Trường hợp Hủy do Lỗi từ Cửa hàng (Hoàn 150% Cọc) hoặc Bất khả kháng (Hoàn 100%)</h2>
            </div>
            <p>
              Nhằm bảo vệ tối đa quyền lợi của Khách thuê xe và nâng cao tính cam kết trách nhiệm giữ chữ tín của Đối tác:
            </p>
            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1.5">
                <strong className="text-emerald-900 block font-bold text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  Bảo lãnh Hoàn trả 150% Tiền Cọc khi Lỗi từ Cửa hàng:
                </strong>
                <p className="text-xs md:text-sm text-emerald-900/90 leading-relaxed">
                  Nếu đến giờ hẹn nhận xe mà Cửa hàng không có xe giao, tự ý hủy đơn, xe bị sự cố kỹ thuật nghiêm trọng không thể vận hành và cửa hàng không cung cấp được dòng xe tương đương hoặc tốt hơn thay thế, hoặc xe thực tế sai lệch nghiêm trọng so với mô tả: <strong>Khách hàng được hoàn trả ngay lập tức 150% tiền cọc</strong> (bao gồm <strong>100% tiền cọc gốc</strong> đã thanh toán + <strong>50% tiền phạt bồi thường vi phạm hợp đồng</strong> do Đối tác chi trả thông qua cơ chế tự động khấu trừ ví sàn).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1.5">
                <strong className="text-slate-900 block font-bold text-sm">
                  🌧️ Sự kiện bất khả kháng (Hoàn 100% tiền cọc gốc):
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trong trường hợp bão lũ, thiên tai, sạt lở đường hoặc các lệnh cấm di chuyển chính thức do cơ quan Nhà nước ban hành tại địa phương nhận xe khiến chuyến đi không thể thực hiện: Khách hàng được <strong>hoàn trả 100% tiền cọc gốc</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 - REFUND PROCESS & TIME */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">4</span>
              <h2>Quy trình & Thời gian nhận lại Tiền Hoàn Cọc</h2>
            </div>
            <div className="space-y-2.5 text-xs md:text-sm text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex gap-2.5 items-start">
                <span className="font-bold text-blue-600 shrink-0">Bước 1:</span>
                <div>Khách hàng thao tác bấm <strong>Hủy đơn</strong> trong trang <Link href="/customer/bookings" className="text-blue-600 hover:underline font-medium">Lịch sử đơn thuê</Link>.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex gap-2.5 items-start">
                <span className="font-bold text-blue-600 shrink-0">Bước 2:</span>
                <div>Hệ thống tự động đối chiếu mốc thời gian hủy so với giờ nhận xe và thời gian tạo đơn (áp dụng cơ chế ân hạn 30 phút) để xác định chính xác tỷ lệ hoàn cọc (100%, 50% hoặc 0%).</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex gap-2.5 items-start">
                <span className="font-bold text-blue-600 shrink-0">Bước 3:</span>
                <div>Bộ phận Kế toán VehicleRent thực hiện lệnh chuyển khoản hoàn tiền về số tài khoản ngân hàng của Quý khách trong vòng <strong>24 giờ - 48 giờ làm việc</strong> (không tính Thứ 7, Chủ nhật và ngày Lễ Tết).</div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">5</span>
              <h2>Quy định về Tiền Thế Chân / Đặt cọc tài sản khi nhận xe</h2>
            </div>
            <p className="text-sm">
              Ngoài tiền cọc đơn thuê được thanh toán qua PayOS trên web, tại thời điểm nhận xe thực tế tại chi nhánh, tùy theo loại xe (xe máy phân khối lớn hoặc ô tô), cửa hàng có thể yêu cầu giữ Căn cước công dân gốc hoặc tiền cọc giữ xe (thế chân) theo thỏa thuận dân sự. Tiền thế chân này sẽ được cửa hàng <strong>hoàn trả 100% ngay khi khách hàng trả xe nguyên vẹn</strong> theo đúng biên bản bàn giao.
            </p>
          </section>

          {/* Section 6 - COMPLAINTS & FEEDBACK */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">6</span>
              <h2>Kênh Tiếp Nhận Khiếu Nại & Đối Soát Hoàn Cọc</h2>
            </div>
            <p className="text-sm">
              Nếu Quý khách gặp sự cố về việc nhận lại tiền hoàn cọc, tranh chấp hiện trạng xe hoặc đối tác nhà xe không hoàn trả tiền thế chân đúng cam kết, Quý khách vui lòng gửi thông tin tại trang <Link href="/feedback" className="text-blue-600 hover:underline font-semibold">Góp ý & Khiếu nại dịch vụ</Link>. Ban Quản Trị Sàn VehicleRent sẽ tiếp nhận, tiến hành đối chiếu hồ sơ và gửi thông báo phản hồi chính thức trong vòng <strong>24h đến 72h làm việc</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

