# Prompt để dán vào Claude Artifacts

> Copy toàn bộ phần trong khung dưới đây. Đọc mục «Ba lưu ý» ở cuối trước khi dán.

---

Xây cho tôi một app web «Kế hoạch du lịch» hoàn chỉnh, chạy trong một artifact React duy nhất. Đây là sổ tay chuyến đi cá nhân: gộp vé, khách sạn, lịch trình, đổi tiền, hành lý và mọi khoản chi giữa chuyến vào một chỗ. Người dùng là một người Việt đi du lịch nước ngoài tự túc, dùng điện thoại là chính, hay mất sóng.

## Áo: Retro Boarding Pass

Cả app trông như một tấm vé máy bay thập niên 90. Viền khối dày, bóng đổ lệch đặc (không mờ), sọc ba màu, con dấu nghiêng, thanh tổng vân mã vạch.

Bảng màu — dùng đúng, không thêm màu mới:

```
--kem:#F6EFE3        nền app
--giay:#FFFDF7       thẻ, ô nhập, hàng dữ liệu
--navy:#1F3A5F       chữ chính, viền, bóng khối
--muc-phu:#5B6F87    chữ mô tả
--nhan:#6C7F98       nhãn mono trên giấy
--vach:#D9CFBB       vạch chia mảnh
--san-ho:#E14B4B     nhấn chính: tab đang chọn, FAB, nhãn cột
--san-ho-hover:#C93F3F
--san-ho-press:#AE3232
--san-ho-nhat:#FBE4E1   nền dòng vừa ghi
--nghe:#F2B33D       nút phụ, cột ngày cao nhất, viền focus
--nghe-nhat:#FDF1DB  nền cảnh báo ngoại tuyến
--duyet:#2E6F4E      dấu đã đồng bộ, việc đã xong
--duyet-nhat:#E7F0E9
--loi:#B3261E        vượt ví tiền mặt
--khoa:#F1EAE0       nền phần khóa
--khoa-muc:#A99C88
```

Chữ:
- `IBM Plex Mono` 600, in hoa, giãn chữ `.12em` cho **nhãn, tem, và mọi con số**. Chỉ dùng cho nhãn từ ba chữ trở xuống.
- `Be Vietnam Pro` cho mọi câu tiếng Việt dài, chữ thường, 13–15px.
- Số KPI 26px mono, số tiền trong hàng 15px mono.

Hình khối:
- Bo góc: `4px` cho chip và ô nhập, `6px` cho thẻ và sheet, tròn hoàn toàn cho FAB.
- Viền `2px solid` navy cho thẻ và nút chính, `1.5px` cho chip và ô nhập.
- Bóng khối đặc, không blur: `2px 2px 0` cho chip nhấn, `3px 3px 0` cho thẻ con, `4px 4px 0` cho thẻ chính. Hàng dữ liệu trong bảng thì **không bóng**.
- Focus: `outline: 3px solid var(--nghe); outline-offset: 2px`.
- Khoảng cách theo thang 4 / 8 / 12 / 16 / 24 / 32.

Ba mô-típ vé, và luật dùng chúng:
1. **Sọc ba màu** `repeating-linear-gradient(90deg, san-ho 0 20px, navy 20px 40px, nghe 40px 60px)` — **tối đa một dải mỗi màn**, luôn ở mép trên cùng của khung app. Không dán vào thẻ con.
2. **Thanh tổng vân mã vạch** — nền navy đặc phủ `repeating-linear-gradient(90deg, transparent 0 3px, rgba(255,255,255,.16) 3px 4px)`, chữ kem mono in hoa. Trên desktop thêm hai lỗ bấm tròn hai đầu và đường xé nét đứt; **trên mobile thì không một nét đứt nào**.
3. **Con dấu nghiêng** — viền 2px, chữ mono in hoa, xoay `-5deg`. Đã đồng bộ dùng màu duyệt, ngoại tuyến dùng màu cảnh báo. **Tối đa một con dấu mỗi màn**, đặt ở header.

Quy tắc bất di bất dịch: **vùng dữ liệu phải sạch.** Hàng bảng, ô nhập và ô số luôn nền giấy trơn. Vân mã vạch chỉ sống trong thanh Tổng cộng. Nét đứt chỉ dùng cho khối AI và đường phân cách lớn.

## Bốn tab

Thanh tab đáy trên mobile, sidebar trái 186px trên desktop. Breakpoint duy nhất: `701px`.

1. **🏠 Hôm nay** — landing khi đang trong chuyến. Hai thẻ KPI: «Đã chi hôm nay» và «Ví tiền mặt còn». Danh sách lịch trình hôm nay tick được. Vài chip tick nhanh từ sổ tay. FAB ＋ góc phải dưới.
2. **🗓 Kế hoạch** — toàn bộ lịch trình nhóm theo ngày, mỗi ngày có tổng riêng. Kéo thả đổi thứ tự và đổi ngày. Dưới cùng là thanh Tổng cộng, khối gói bay & khách sạn, khối đổi tiền.
3. **🧳 Sổ tay** — các danh sách checklist (Hành lý, Mua mang về, Đi đâu, Ăn gì…), mỗi món đúng một dòng, có thanh tiến độ. Desktop bày ba cột cùng lúc.
4. **📊 Tổng kết** — KPI, biểu đồ cột chi theo ngày (ngày cao nhất tô nghệ), cơ cấu theo danh mục và theo kênh thanh toán, khối ✦ AI kể chuyện chuyến đi.

## Dữ liệu

Một khoản chi / một dòng lịch trình gồm: `date`, `activity`, `cost`, `pay`, `cat`, `done`.

- `cat` — sáu danh mục: 🍜 Ăn uống, 🚕 Di chuyển, 🎟 Vé, 🛍 Mua sắm, 🏨 Lưu trú, 📦 Khác.
- `pay` — bốn kênh: Tiền mặt, Momo, Zalo, Thẻ.
- Chuyến đi có: tên, ngày đi, ngày về, ví tiền mặt đã đổi, tỷ giá, tổng tiền vé và khách sạn, ngân sách dự trù.

Tính toán:
- «Ví tiền mặt còn» = tiền đã đổi − tổng các dòng chọn **Tiền mặt**. Âm thì thẻ đổi sang viền và chữ màu lỗi, nền san hô nhạt.
- Quy đổi VNĐ hiện ngay dưới ô số tiền khi đang gõ.
- Mọi con số ở Tổng kết tính lại từ dữ liệu thật, không hardcode.

Nạp sẵn dữ liệu mẫu: chuyến Bangkok 6 ngày (01–06/08), khoảng 14 dòng rải đều các ngày, hôm nay là ngày 04/08, ví tiền mặt 3.740 ฿, tỷ giá 720 ₫/฿.

## Bốn luồng phải chạy thật

**F1 · Ghi một khoản trong ba chạm.** Chạm FAB → bottom sheet trượt lên. Trong sheet: ô số tiền cỡ lớn + numpad tự vẽ (1–9, 000, 0, ⌫), hàng chip danh mục, hàng chip kênh thanh toán, nút Lưu. Đúng ba chạm sau khi sheet mở: số tiền → danh mục → nguồn tiền → Lưu. Trên desktop thay bằng panel ghi nhanh luôn mở, không che nội dung, Enter nhảy theo cột.

**F2 · Ghi bằng một câu.** Ô ✦ ở đầu màn desktop (và trong sheet trên mobile). Người dùng gõ «bolt về khách sạn 120 baht tiền mặt» rồi Enter. App tự tách số tiền, kênh thanh toán, đoán danh mục theo từ khóa, và làm sạch tên hoạt động. **Luôn hiện bản xem trước bốn ô để sửa trước khi ghi** — không bao giờ ghi thẳng. Hai nút: «Xác nhận ghi» và «Sửa tay» (đổ dữ liệu đã tách vào sheet thường).

**F3 · Sửa lịch trình.** Trong tab Kế hoạch: kéo tay cầm ⠿ đổi thứ tự và thả sang ngày khác, sửa tên và số tiền tại chỗ, bấm chip để xoay vòng danh mục và kênh thanh toán, nút đổi ngày, nút × xóa, nút ＋ thêm dòng. Dòng đang kéo nghiêng `-0.5deg` và nhấc bóng lên.

**F6 · Tổng kết sau chuyến.** Có công tắc «Trong chuyến / Sau chuyến» để xem được cả hai giai đoạn. Sang «Sau chuyến»: băng-rôn 🎉 trượt xuống một lần rồi đóng được, app mở thẳng tab Tổng kết. Nút «Tạo bản tổng kết» chạy trạng thái chờ ~0,9 giây rồi sinh một đoạn văn tiếng Việt **viết từ số liệu thật** — số khoản chi, tổng tiền, ngày tiêu nhiều nhất và khoản lớn nhất ngày đó, danh mục chiếm tỷ trọng cao nhất, ví tiền mặt còn lại. Nút Xuất PDF chỉ bật sau khi có bản nháp.

## Phanh an toàn

- Mọi hành động ghi đều có **toast + Hoàn tác 5 giây**, kèm vạch đếm ngược chạy cạn. Toast nền navy, chữ kem, nút Hoàn tác viền nghệ.
- Dòng vừa ghi nền san hô nhạt rồi phai dần về giấy trong 1,2 giây.
- Mọi điểm AI đều là tầng phủ: bên cạnh nút ✦ luôn có đường làm tay tương đương nhìn thấy được, và không kết quả nào ghi vào dữ liệu khi chưa xác nhận.

## Chuyển động

Tất cả dưới 250ms, chỉ dùng `opacity` và `transform`. Sheet trượt lên 220ms ease-out. Toast trồi lên 8px trong 160ms. Nút bấm lùi 2px và bóng khối co còn 1px trong 90ms. Dòng kéo nghiêng 120ms. Băng-rôn trượt xuống 240ms, không lặp. **Không hiệu ứng lặp vô hạn, không blob bay, không xoay thẻ 3D.** Thêm khối này:

```css
@media (prefers-reduced-motion: reduce){
  *{animation-duration:.01ms !important; transition-duration:.01ms !important}
}
```

## Nghiệm thu

Trước khi trả kết quả, tự kiểm tám điểm:
1. Ghi được một khoản chi trong đúng ba chạm, FAB không che hàng dữ liệu.
2. Cả hai tư thế đều dùng chung một hệ token, không có màu hay cỡ chữ lạ.
3. Bảng desktop không cuộn ngang ở 1280px — cột dùng `minmax()` và `fr`, không khóa `min-width`.
4. Thanh Tổng cộng trên mobile không một nét đứt.
5. Mỗi điểm AI đều có bản xem trước, nút xác nhận, và đường làm tay.
6. Mỗi màn tối đa một dải sọc và một con dấu.
7. Vùng nhập liệu và hàng bảng nền giấy trơn, không vân, không sọc.
8. Chữ tiếng Việt dài không bị in hoa mono; mono in hoa chỉ ở nhãn ngắn và số.

Viết bằng React trong một file, style bằng inline style hoặc `<style>` với biến CSS ở `:root`. Không dùng thư viện ngoài. Font tải từ Google Fonts. Giao diện và toàn bộ nội dung bằng tiếng Việt.

---

## Ba lưu ý khi dán

**1. Artifacts không lưu được dữ liệu.** Claude Artifacts chặn `localStorage`, nên app sẽ mất dữ liệu khi tải lại trang. Prompt trên cố tình để state trong bộ nhớ. Khi nào anh tải mã về chạy trên máy thật thì thêm một câu: *«Lưu toàn bộ state vào localStorage dưới khóa `ke-hoach-du-lich-v10` và khôi phục khi tải lại.»*

**2. Nên chia làm hai lượt.** Lượt đầu dán từ đầu đến hết mục «Bốn luồng phải chạy thật» — để Claude dựng xong khung và F1. Lượt sau nói *«giờ làm tiếp F2, F3, F6 và phần phanh an toàn»*. Dán một lần cả bài dễ bị cắt ngang giữa chừng.

**3. Nếu ra sai áo.** Câu sửa hiệu quả nhất: *«Bóng đổ phải đặc, không blur — `4px 4px 0 #1F3A5F`. Bỏ mọi `box-shadow` có blur và mọi gradient nền.»*
