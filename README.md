# Kế hoạch du lịch ✈️

App PWA cá nhân quản lý trọn vòng đời một chuyến đi: lên kế hoạch → ghi chi tiêu giữa chuyến → tổng kết sau chuyến. Giao diện tiếng Việt, chạy được cả khi offline.

Bản đang chạy: **embeshi.github.io/travel-planner** (v10, app Vue trong thư mục `app/`).

## Tính năng

Bốn tab chính (mobile: thanh tab đáy · laptop ≥701px: sidebar trái):

- **🏠 Hôm nay**: lịch trình trong ngày, ghi chi nhanh luôn mở, KPI, tick nhanh và «✦ Nhịp chi»
- **🗓 Kế hoạch**: bảng lịch trình & chi phí (tự xếp nhóm theo ngày, kéo thả hàng), kèm ba thẻ:
  - 💱 **Tỷ giá**: nhập tay hoặc bấm ⟳ để tự lấy tỷ giá thị trường
  - ✈️🏨 **Gói bay & khách sạn**: khoản đã thanh toán với tỷ giá riêng, tự tính số đêm
  - 💵 **Đổi tiền**: các lần đổi VNĐ sang ngoại tệ, tỷ giá thực tế và lời nhắc đủ/vượt
- **🧳 Sổ tay**: danh sách hành lý và sổ tay (mua gì · đi đâu · ăn gì)
- **📊 Tổng kết**: tổng chi cả chuyến, chi theo ngày, và 🎫 Kệ vé cất lại các chuyến đã xong

Thêm nữa:
- **Ghi nhanh bằng câu**: gõ một câu, app tự tách ra hoạt động · chi phí · thanh toán (chạy offline, không cần AI)
- **Tầng AI ✦ (tuỳ chọn)**: dán khoá API OpenRouter của riêng bạn. Khoá chỉ nằm trên máy bạn, và mọi kết quả AI đều phải xem trước rồi xác nhận
- **Backup**: xuất/nhập file JSON ngay trên header. File tương thích hai chiều với bản v9.6

## Lưu trữ dữ liệu

- Đăng nhập thì dữ liệu đồng bộ lên **Supabase** (mỗi tài khoản một bản ghi).
- Luôn có một bản **offline trên máy** (localStorage), nên mất mạng vẫn dùng được.
- Nên xuất backup JSON định kỳ. **Đừng commit file backup vào repo**: nó chứa dữ liệu thật, và `.gitignore` đã chặn sẵn.

## Chạy trên máy

Cần Node 22.

```bash
cd app
npm install
npm run dev        # mở http://localhost:5173/travel-planner/  (phải có /travel-planner/)
npm test           # chạy toàn bộ test (Vitest)
npm run build      # dựng bản phát vào app/dist
```

Khi thử bản đang phát triển, **đừng đăng nhập tài khoản thật**. Hãy dùng tài khoản phụ hoặc không đăng nhập.

## Công nghệ

Vue 3 + Vite · Vitest + @vue/test-utils + jsdom · Supabase · service worker cho offline. Không dùng thư viện UI: màu và cỡ chữ nằm trong `app/src/assets/tokens.css`.

## Triển khai

Đẩy lên nhánh `main` thì GitHub Actions (`.github/workflows/deploy.yml`) chạy `npm ci → npm test → npm run build` rồi phát lên GitHub Pages. Test đỏ thì không phát.

Workflow `giu-am.yml` chạy mỗi ngày để giữ Supabase bản miễn phí không bị ngủ.

## Đường lui v9.6

Các file ở gốc repo (`index.html`, `sw.js`, `manifest.webmanifest`, icon) là bản **v9.6 đóng băng**. Đừng xoá. Nếu v10 gặp sự cố: GitHub → Settings → Pages → Source → «Deploy from a branch» (`main` · root) là v9.6 lên sóng lại ngay.

## Tài liệu

- `CLAUDE.md`: sổ tay dự án và các luật giữ dữ liệu (đọc trước khi sửa code)
- `docs/prd-ke-hoach-du-lich.html`: PRD đầy đủ của v10
- `docs/nghi-thuc-giu-du-lieu-v10.html`: nghi thức giữ dữ liệu, đọc trước khi đụng tới dữ liệu
