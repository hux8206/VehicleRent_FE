import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  FileText,
  AlertOctagon,
  Scale,
  CheckCircle2,
  ShieldAlert,
  Car,
  Clock,
  ArrowLeft,
  Camera,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng & Quy Định Phạt Nguội - VehicleRent",
  description:
    "Quy chế hoạt động sàn TMĐT VehicleRent: Quyền và nghĩa vụ của bên thuê, trách nhiệm tuân thủ luật giao thông và quy trình xử lý phạt nguội.",
};

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-4 border border-indigo-100">
            <Scale className="w-4 h-4 text-indigo-600" />
            Quy chế hoạt động & Hợp đồng thuê xe điện tử
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Điều Khoản Sử Dụng Dịch Vụ
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            Chào mừng bạn đến với <strong>VehicleRent</strong>. Bằng việc đăng ký tài khoản, đặt xe hoặc đồng ý trở thành Đối tác nhà xe, bạn xác nhận đã đọc, hiểu và cam kết tuân thủ đầy đủ các điều khoản và quy định pháp lý dưới đây.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>Hiệu lực từ: <strong>01/01/2026 (Cập nhật tháng 11/2026)</strong></span>
            <span>•</span>
            <span>Áp dụng cho: <strong>Khách thuê xe máy, ô tô và Chủ phương tiện đối tác</strong></span>
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200/80 space-y-9 text-slate-700 text-sm md:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">1</span>
              <h2>Định nghĩa các bên & Hình thức giao dịch trên sàn</h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
              <li><strong>Sàn VehicleRent ("Chúng tôi"):</strong> Nền tảng công nghệ cung cấp giải pháp tìm kiếm và đặt xe trực tuyến, quản lý hàng đợi giữ chỗ 10 phút, tích hợp cổng thanh toán VietQR, quản lý đội xe cho đối tác và hỗ trợ giải quyết tranh chấp. VehicleRent không trực tiếp sở hữu toàn bộ phương tiện vật lý mà đóng vai trò trung gian công nghệ kết nối.</li>
              <li><strong>Đối tác nhà xe ("Chủ xe"):</strong> Cá nhân hoặc doanh nghiệp hợp pháp sở hữu phương tiện, quản lý kho xe, trực tiếp kiểm tra giấy tờ gốc, ký hợp đồng và bàn giao xe cho khách hàng tại chi nhánh.</li>
              <li><strong>Khách thuê xe ("Người dùng"):</strong> Cá nhân có đầy đủ năng lực hành vi dân sự, sở hữu Giấy phép lái xe hợp pháp, thực hiện đặt giữ chỗ và điều khiển phương tiện.</li>
              <li><strong>Đơn thuê trực tuyến (Online Booking):</strong> Đơn thuê do Khách hàng chủ động tạo trên website, thanh toán cọc trực tuyến qua VietQR PayOS và được hệ thống bảo lãnh giữ chỗ tự động.</li>
              <li><strong>Đơn tạo trực tiếp tại quầy (Walk-in Booking):</strong> Đơn thuê do Đối tác nhà xe lập trực tiếp trên giao diện quản trị cho khách vãng lai đến thuê xe tại chi nhánh hoặc đặt lịch hẹn trước trực tiếp.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">2</span>
              <h2>Điều kiện tiên quyết đối với Khách thuê xe</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">🏍️ Đối với xe máy & xe mô tô:</strong>
                Đủ từ 18 tuổi trở lên, có Căn cước công dân và Giấy phép lái xe hạng <strong>A1</strong> (xe dưới 175cc) hoặc <strong>A2</strong> (xe từ 175cc trở lên) còn hiệu lực.
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">🚗 Đối với xe ô tô:</strong>
                Đủ từ 21 tuổi trở lên, có CCCD chính chủ, Giấy phép lái xe ô tô từ hạng <strong>B1, B2</strong> trở lên với kinh nghiệm lái xe thực tế tối thiểu 01 năm.
              </div>
            </div>
            <p className="text-xs text-slate-500 italic">
              * Khách hàng có nghĩa vụ xuất trình bản gốc bằng lái và CCCD tại thời điểm bàn giao. Nếu không xuất trình được hoặc thông tin không trùng khớp, Đối tác có toàn quyền từ chối giao xe mà không phải bồi thường.
            </p>
          </section>

          {/* Section 3 - WALK-IN BOOKINGS */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">3</span>
              <h2>Quy chế đối với Đơn tạo trực tiếp tại quầy (Walk-in Booking)</h2>
            </div>
            <p className="text-sm">
              Để hỗ trợ Đối tác quản lý toàn diện cả nguồn khách vãng lai và khách đặt trực tiếp tại cơ sở, hệ thống cung cấp tính năng tạo đơn tại quầy với các quy tắc áp dụng riêng biệt:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-semibold">📋 Kiểm tra giấy tờ & Bàn giao:</strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đối tác nhà xe trực tiếp kiểm tra tính hợp lệ của CCCD và Giấy phép lái xe bản gốc của khách trước khi lập đơn và giao chìa khóa. Đối tác tự chịu trách nhiệm đối soát thông tin khách hàng vãng lai.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-semibold">💵 Thanh toán & Cọc linh hoạt:</strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Khách hàng thanh toán tiền thuê và đặt cọc (hoặc miễn cọc 0đ) trực tiếp với Đối tác bằng tiền mặt hoặc chuyển khoản riêng. Giao dịch này không đi qua cổng thanh toán trung gian trực tuyến của sàn.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 - KEY EMPHASIS ON TRAFFIC VIOLATIONS & COLD FINES */}
          <section className="space-y-4 p-5 md:p-6 rounded-2xl bg-rose-50/70 border-2 border-rose-200/90 text-slate-800">
            <div className="flex items-center gap-2.5 text-rose-950 font-extrabold text-lg md:text-xl">
              <Camera className="w-6 h-6 text-rose-600 shrink-0" />
              <h2>Quy định đặc biệt: Tuân thủ Luật Giao thông & Trách nhiệm chịu Phạt Nguội</h2>
            </div>

            <p className="text-sm font-medium text-rose-900 leading-relaxed">
              Đây là quy định có tính chất bắt buộc và mang giá trị pháp lý ràng buộc giữa Khách thuê xe, Chủ xe và Sàn VehicleRent theo Luật Giao thông đường bộ và Nghị định 100/2019/NĐ-CP (sửa đổi, bổ sung bởi Nghị định 123/2021/NĐ-CP):
            </p>

            <div className="space-y-3 text-xs md:text-sm text-slate-700">
              <div className="p-3.5 rounded-xl bg-white border border-rose-100 flex gap-2.5 items-start">
                <span className="font-bold text-rose-600 shrink-0 mt-0.5">4.1.</span>
                <div>
                  <strong>Trách nhiệm điều khiển an toàn:</strong> Khách thuê chịu hoàn toàn trách nhiệm hành chính, dân sự và hình sự đối với mọi hành vi điều khiển phương tiện trong suốt thời gian ghi nhận trong Biên bản bàn giao xe (tính từ thời điểm nhận xe đến thời điểm bàn giao lại xe thành công).
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-rose-100 flex gap-2.5 items-start">
                <span className="font-bold text-rose-600 shrink-0 mt-0.5">4.2.</span>
                <div>
                  <strong>Trách nhiệm chi trả Phạt Nguội:</strong> Trường hợp phương tiện bị hệ thống Camera giám sát ghi lại hình ảnh vi phạm giao thông (vượt tốc độ, vượt đèn đỏ, đi sai làn đường, dừng đỗ sai quy định...) hoặc có thông báo phạt nguội gửi về biển số xe trong khoảng thời gian người thuê sử dụng xe:
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600 text-xs">
                    <li>Khách thuê có nghĩa vụ <strong>tự giác nộp phạt trực tiếp</strong> tại cơ quan Cảnh sát Giao thông có thẩm quyền; HOẶC</li>
                    <li>Khách thuê phải <strong>thanh toán bồi hoàn 100% số tiền phạt</strong> kèm các chi phí phát sinh hợp lý (chi phí đưa xe đi kiểm định lại, phí giải quyết giấy tờ) cho Chủ xe trong vòng <strong>03 ngày làm việc</strong> kể từ khi nhận được thông báo đối soát.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-rose-100 flex gap-2.5 items-start">
                <span className="font-bold text-rose-600 shrink-0 mt-0.5">4.3.</span>
                <div>
                  <strong>Cung cấp thông tin cho Cơ quan Công an:</strong> Trong trường hợp người thuê cố tình trốn tránh, không hợp tác giải quyết phạt nguội hoặc gây tai nạn giao thông bỏ trốn, Sàn VehicleRent và Chủ xe sẽ cung cấp toàn bộ dữ liệu định danh, số điện thoại, hợp đồng và biên bản bàn giao xe cho Cục Cảnh sát Giao thông / Cơ quan Công an để phục vụ xử lý truy cứu theo thẩm quyền pháp luật.
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">5</span>
              <h2>Hành vi nghiêm cấm khi sử dụng phương tiện</h2>
            </div>
            <p>Khách thuê xe tuyệt đối không được thực hiện các hành vi sau:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
              <li>Sử dụng xe vào các hoạt động phi pháp: buôn lậu, vận chuyển chất cấm, vũ khí, hàng trốn thuế, tổ chức đua xe trái phép.</li>
              <li>Điều khiển phương tiện khi trong máu hoặc hơi thở có nồng độ cồn, ma túy hoặc các chất kích thích bị cấm.</li>
              <li>Giao xe cho người khác điều khiển khi người đó không có Giấy phép lái xe hợp lệ hoặc chưa được đăng ký trong thỏa thuận thuê xe.</li>
              <li>Cầm cố, thế chấp, sang nhượng, cho thuê lại hoặc can thiệp tháo gỡ phụ tùng, tráo đổi linh kiện của phương tiện.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">6</span>
              <h2>Quy trình nhận xe, kiểm tra hiện trạng & Xử lý sự cố va chạm</h2>
            </div>
            <p className="text-sm">
              Trước khi nhận xe, Khách thuê và Nhân viên cửa hàng bắt buộc phải cùng nhau kiểm tra, quay video hoặc chụp ảnh hiện trạng xung quanh xe (vết xước, mức nhiên liệu, đồng hồ km) và ký xác nhận biên bản bàn giao.
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs md:text-sm space-y-2">
              <p><strong>Xử lý khi có tai nạn, va quẹt hoặc hỏng hóc:</strong></p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Giữ nguyên hiện trường và liên hệ ngay lập tức cho Hotline Cửa hàng và Sàn VehicleRent để nhận hướng dẫn xử lý.</li>
                <li>Nếu lỗi do Khách thuê: Khách thuê chịu chi phí sửa chữa theo báo giá của garage ủy quyền chính hãng và tiền bồi thường ngày công ngừng kinh doanh của xe (tối đa bằng đơn giá thuê ngày theo hợp đồng).</li>
                <li>Nếu lỗi do hao mòn kỹ thuật tự nhiên (hỏng bugi, đứt sên cam, lốp mòn...): Chủ xe chịu trách nhiệm đổi xe tương đương hoặc hỗ trợ chi phí khắc phục.</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">7</span>
              <h2>Chính sách hủy đơn & Quy định hoàn tiền cọc</h2>
            </div>
            <p className="text-sm">
              Đối với đơn thuê trực tuyến, tỷ lệ hoàn cọc khi khách hàng hủy đơn được quy định chi tiết:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
              <li><strong>Hủy trước ≥ 24h nhận xe:</strong> Hoàn 100% tiền cọc.</li>
              <li><strong>Hủy từ 6h - 24h nhận xe:</strong> Hoàn 100% cọc nếu đơn vừa đặt dưới 30 phút; sau 30 phút chỉ hoàn 50% cọc (50% chuyển cho Chủ xe).</li>
              <li><strong>Hủy cận giờ &lt; 6h nhận xe:</strong> Hoàn 50% cọc nếu đơn vừa đặt dưới 30 phút; sau 30 phút mất 100% cọc (không hoàn tiền).</li>
              <li className="text-emerald-700 font-semibold"><strong>Lỗi do Đối tác không có xe giao:</strong> Khách hàng được bảo lãnh hoàn trả 100% tiền cọc gốc + bồi thường 20% tiền cọc (tối thiểu 50.000đ) do Đối tác chịu trách nhiệm chi trả.</li>
              <li><strong>Đơn tại quầy (Walk-in):</strong> Tiền cọc (nếu có) được giải quyết hoàn trả theo thỏa thuận trực tiếp giữa Khách hàng và Chủ xe.</li>
            </ul>
            <p className="text-xs text-slate-500">
              Chi tiết quy trình chuyển khoản hoàn cọc và biểu phí quy định xem tại <Link href="/refund" className="text-blue-600 hover:underline font-semibold">Chính sách Hoàn cọc của VehicleRent</Link>.
            </p>
          </section>

          {/* Section 8 - PARTNER FINANCIAL & COMMISSION POLICY */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">8</span>
              <h2>Chính sách Tài chính, Hoa hồng sàn & Ưu đãi Đối tác mới</h2>
            </div>
            <p className="text-sm">
              VehicleRent áp dụng cơ chế quản lý ví số dư minh bạch và chính sách hỗ trợ phát triển đối tác nhà xe:
            </p>
            <div className="space-y-2.5 text-xs md:text-sm text-slate-600">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex gap-2.5 items-start text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Ưu đãi khởi nghiệp (Welcome Bonus):</strong> Mỗi tài khoản Đối tác nhà xe đăng ký mới sẽ được <strong>miễn 100% phí hoa hồng sàn cho 05 đơn thuê hoàn thành thành công đầu tiên</strong>. Toàn bộ doanh thu từ 5 đơn này thuộc về Đối tác.
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex gap-2.5 items-start">
                <span className="font-bold text-blue-600 shrink-0 mt-0.5">8.1.</span>
                <div>
                  <strong>Phí hoa hồng sàn tiêu chuẩn:</strong> Từ đơn hoàn thành thứ 6 trở đi, hệ thống tự động khấu trừ phí dịch vụ sàn (mặc định 10% trên tổng giá trị thuê xe) vào số dư Ví đối tác.
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex gap-2.5 items-start">
                <span className="font-bold text-blue-600 shrink-0 mt-0.5">8.2.</span>
                <div>
                  <strong>Hạn mức bảo lãnh tín dụng & Hàng chờ FIFO:</strong> Sàn hỗ trợ hạn mức số dư âm tối đa -500.000 VNĐ để đối tác tiếp tục nhận khách mà không bị gián đoạn. Nếu số dư âm vượt quá hạn mức, các đơn mới sẽ được đưa vào hàng chờ tự động và được giải phóng ngay khi Đối tác thực hiện nạp tiền vào ví.
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex gap-2.5 items-start text-rose-950">
                <span className="font-bold text-rose-600 shrink-0 mt-0.5">8.3.</span>
                <div>
                  <strong>Trách nhiệm bàn giao xe & Chế tài bồi hoàn khi không có xe giao:</strong> Đối tác có nghĩa vụ chuẩn bị phương tiện đúng hẹn, đảm bảo an toàn kỹ thuật theo đúng thỏa thuận đặt xe. Trường hợp Đối tác tự ý hủy đơn, không có xe giao hoặc không đáp ứng được đơn đã cọc thành công, Đối tác có trách nhiệm <strong>hoàn 100% cọc + bồi thường 20% tiền cọc (tối thiểu 50.000đ) cho khách hàng</strong> và bị trừ điểm uy tín (được xem xét miễn phạt nếu chứng minh được sự cố bất khả kháng với Quản trị viên). Đối với trường hợp khách không đến nhận xe sau giờ hẹn (No-show), Đối tác được quyền giải phóng xe ngay và giữ trọn tiền cọc theo quy định.
                </div>
              </div>
            </div>
          </section>

          {/* Section 9 - FEEDBACK, COMPLAINTS & DISPUTE RESOLUTION */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">9</span>
              <h2>Tiếp nhận Phản hồi, Khiếu nại dịch vụ & Tòa án tài phán</h2>
            </div>
            <p className="text-sm">
              VehicleRent tôn trọng mọi ý kiến đóng góp và khiếu nại nhằm không ngừng nâng cao chất lượng dịch vụ:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
              <li>
                <strong>Kênh tiếp nhận chính thức:</strong> Người dùng có thể gửi đóng góp ý kiến hoặc khiếu nại bất kỳ lúc nào tại mục <Link href="/feedback" className="text-blue-600 hover:underline font-semibold">Góp ý & Khiếu nại</Link>. Ban Quản Trị cam kết tiếp nhận và phản hồi chính thức trực tiếp trong Hộp thư phản hồi tài khoản của Quý khách trong vòng <strong>24h đến 72h làm việc</strong>.
              </li>
              <li>
                <strong>Hòa giải & Trọng tài thương mại:</strong> Mọi tranh chấp phát sinh giữa Khách thuê và Đối tác trước tiên sẽ được hòa giải thông qua sự điều phối của Ban Quản Trị Sàn VehicleRent. Trong trường hợp không thể thỏa thuận, một trong các bên có quyền đưa vụ việc ra Tòa án nhân dân có thẩm quyền tại nơi đặt trụ sở của Sàn để phán quyết theo pháp luật Việt Nam.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

