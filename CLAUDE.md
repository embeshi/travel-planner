# Kế hoạch du lịch — sổ tay dự án

## Dự án là gì
App PWA cá nhân quản lý trọn vòng đời chuyến đi: lên kế hoạch (vé, khách sạn, lịch trình,
đổi tiền, hành lý, wishlist) → ghi chi tiêu giữa chuyến → tổng kết sau chuyến.
Giao diện tiếng Việt. Trao đổi với chủ dự án bằng tiếng Việt, giải thích ngắn gọn,
tránh thuật ngữ khi không cần thiết.

## Kiến trúc

Đang ở giữa đợt đại tu v10. Hai thứ cùng tồn tại cho tới lô 10:

**Bản đang chạy thật (v9.6) — nhánh `main`, ĐỪNG ĐỤNG khi làm v10**
- `index.html` — TOÀN BỘ app v9.6 trong một file: HTML + CSS + JS thuần, ~147KB.
- `sw.js` — service worker. Điều hướng network-first, không cache *.supabase.co.
  Tên kho đệm hiện tại: travel-planner-v8
- `manifest.webmanifest`, `icon-512.png`, `icon-192.png`, `apple-touch-icon.png`

**Bản v10 đang thi công — thư mục `app/`, chỉ có trên nhánh `v10`**
- Vue 3 + Vite. Bốn phụ thuộc, không hơn: `vue`, `vite`, `@vitejs/plugin-vue`, `vitest`.
- `app/index.html` — app thật · `app/linh-kien.html` — bảng linh kiện (tài liệu sống)
- `app/src/assets/tokens.css` — chép từ mục 07 bảng thiết kế, nguồn duy nhất của màu và thang
- `app/src/components/` — linh kiện dùng chung · `app/src/lib/` — logic thuần bê từ v9.6
- `vite.config.js` đặt `base: '/travel-planner/'`. Sai chỗ này chỉ lộ ra lúc deploy.
  Dev server chạy ở `http://localhost:5173/travel-planner/`, không phải ở gốc.

**Chung cho cả hai**
- Dữ liệu: Supabase (một khoản jsonb cho mỗi tài khoản) + bản offline trên máy người dùng.
- Triển khai: đẩy lên nhánh chính → GitHub Pages tại embeshi.github.io/travel-planner
- Breakpoint DUY NHẤT: 700px (mobile ≤700, laptop ≥701).

## LUẬT KHÔNG ĐƯỢC PHÁ
App đang chạy thật với **HAI tài khoản người dùng thật** — chủ dự án và một người
dùng khác. Cả hai vào chung một địa chỉ web, nên đẩy lên nhánh chính là đổi app cho
cả hai cùng lúc. Dữ liệu một chuyến đi đã hoàn thành, không tái tạo được, và chủ dự án
KHÔNG tự xuất backup hộ tài khoản kia được.
Đọc `docs/nghi-thuc-giu-du-lieu-v10.html` và `docs/phu-luc-du-lieu-nguoi-dung-that.html`
trước khi làm bất cứ việc gì đụng tới dữ liệu.
1. KHÔNG chạy bất kỳ câu SQL nào lên Supabase. Không tạo, sửa, xoá bảng hay cột.
2. KHÔNG đổi địa chỉ Supabase, khoá công khai, hay cách gắn dòng dữ liệu với tài khoản.
3. Chỉ được THÊM trường vào hình dạng dữ liệu. Cấm đổi tên hoặc bỏ trường cũ —
   để bản cũ vẫn đọc được dữ liệu, giữ đường lui.
4. Đọc trước — ghi sau: chưa đọc và dựng xong dữ liệu thì không được lưu gì lên máy chủ.
   Thà hiện "đang tải" mãi còn hơn ghi đè một trang trắng.
5. Phụ thuộc: KHÔNG tải bất cứ thứ gì từ CDN lúc chạy (trừ hai ngoại lệ có sẵn từ v9.6:
   supabase-js và Google Fonts, cả hai đều được service worker trữ lại).
   Thư viện mới phải nằm trong `package.json` + `package-lock.json` và được build vào `dist/`.
   Không thêm thư viện UI (Tailwind, Vuetify, Headless UI…) — áo Retro là hàng may đo,
   và bảng thiết kế đã bàn giao đủ token. App phải chạy trọn vẹn khi offline.
6. KHÔNG commit file backup JSON hay bản chụp CSV vào repo — chứa dữ liệu thật, repo công khai.
   Khuôn tên thật do `stampName()` sinh ra: `du-lich-backup-YYYY-MM-DD-HHMM.json`.
   Bản chụp Supabase: `trips_rows*.csv` / `.sql`. Cả hai đã bị `.gitignore` chặn.
7. KHÔNG đăng nhập tài khoản thật vào bản v10 chưa nghiệm thu. Muốn thử thì mở file
   trên máy và KHÔNG đăng nhập, hoặc đăng ký một tài khoản thử bằng email phụ.
   Đây là con đường DUY NHẤT dẫn tới kịch bản «ghi đè trang trắng».
8. Giữ đường lui 60 giây: `index.html` v9.6 luôn lùi về được. Đường lui này CHỈ còn
   hiệu lực chừng nào v10 tuân thủ luật chỉ-thêm-không-đổi ở mục 3 — phá mục 3 là
   mất luôn đường lui.
9. Nghiệm thu bằng BA CON SỐ VÂN TAY: số dòng lịch trình · tổng chi phí cả chuyến (VNĐ)
   · ví tiền mặt còn lại. Ba con số này được ghi ở file NGOÀI repo (chúng là dữ liệu
   tài chính thật) — hỏi chủ dự án khi cần đối chiếu.

## Quy trình mỗi lần sửa
1. Đọc `docs/prd-ke-hoach-du-lich.html` trước khi đổi giao diện. Mục 05 là luật nên/không-nên,
   mục 01B là áo Retro Boarding Pass đã chốt.
2. Làm theo lô nhỏ. Mỗi lô một commit riêng, thông điệp tiếng Việt ngắn gọn.
3. Trước khi báo xong, tự kiểm và nói rõ đã kiểm những gì:
   - `cd app && npm run build` phải chạy sạch — MỌI lô, không để dồn đến cuối
   - `cd app && npm test` phải xanh
   - mở thật trong trình duyệt và soi bằng mắt, không chỉ đọc code
   - đổi bề ngang cửa sổ qua lại mốc 701px với bất kỳ lô nào đụng bố cục
   - xác nhận đoạn vừa sửa nằm đúng hàm cần sửa — kiểm theo nội dung thân hàm,
     không tin vị trí dòng (dự án này từng dính lỗi đấu tréo dây vì tin vị trí)
   - nếu có sửa `index.html` của v9.6: `git status` phải cho thấy đúng chủ ý
4. Không báo "xong" khi chưa tự chạy kiểm.
5. Mọi ô nhập phải đi qua linh kiện `ONhap` — nó mang sẵn giáp bộ gõ tiếng Việt.
   Không dùng `<input>` trần trong app.

## Đánh số phiên bản
- Tem hiển thị trong app chỉ nhảy khi thay đổi được đẩy lên nhánh chính.
- Vá nhỏ: v9.6 → v9.7. Đại tu: v10.
- Sửa nhiều thứ rồi mới đẩy một lần thì gộp chung MỘT số.
- Lô nào thay icon hoặc tệp tĩnh thì phải nâng tên kho đệm trong `sw.js` cùng lúc,
  nếu không icon cũ sẽ bám lại trên máy người dùng.

## Điều tối kỵ về giao diện (rút từ phản hồi thật qua 9 phiên bản)
- Khối "Tổng cộng" trên mobile: KHÔNG nét đứt, không viền trang trí.
- Không chữ hướng dẫn dài dưới mỗi mục, không banner to, không blob/sparkle, không xoay 3D.
- Bảng trên desktop không được cuộn ngang; trên mobile là thẻ dọc nén,
  mỗi món trong danh sách đúng một dòng.
- Không so sánh sai phạm trù trong lời nhắc tiền bạc.
- PHẢI GIỮ: Enter thông minh hai chế độ, giáp bộ gõ tiếng Việt (isComposing),
  tự xếp nhóm theo ngày ở cả ba bảng, kéo thả hàng bằng tay nắm, nút ⟳ trị cache,
  tem phiên bản luôn hiển thị, backup xuất/nhập JSON.

## Tài liệu trong repo
- `docs/prd-ke-hoach-du-lich.html` — PRD đầy đủ cho bản v10
- `docs/bang-thiet-ke-v10.html` — bảng thiết kế từ Claude Design (mở bằng trình duyệt;
  cần `docs/support.js` nằm cùng thư mục và cần mạng để tải React từ CDN)
- `docs/prototype-f1-f3-f6-v10.html` — prototype chạm được cho luồng F1, F2, F3, F6
- `docs/prompt-claude-artifacts.md` — bản tóm tắt áo Retro Boarding Pass dạng prompt,
  dùng như bản rút gọn của mục 01B
- `docs/support.js` — thư viện chạy nội bộ của hai file .dc.html trên. Không phải mã của app.
- `docs/nghi-thuc-giu-du-lieu-v10.html` — nghi thức 5 bước, luật «đọc trước ghi sau»,
  bảng «gặp gì thì làm gì». ĐỌC TRƯỚC khi làm bất cứ việc gì đụng tới dữ liệu.
- `docs/phu-luc-du-lieu-nguoi-dung-that.html` — phụ lục cho tình huống có tài khoản
  người dùng thứ hai: bốn kịch bản mất dữ liệu, hai cách thử an toàn, lịch chuyển giao
  có báo trước, và đường lui 60 giây.

## Cảnh báo tên gọi
`docs/prompt-claude-artifacts.md` mô tả dòng lịch trình là `date, activity, cost, pay,
cat, done`. Đó là bản RÚT GỌN cho Artifacts, KHÔNG phải hình dạng thật. Hình dạng thật
(đã đối chiếu với file backup): `id, date, activity, location, tripCost, pay, notes`
— `cost` thật ra tên là `tripCost`, và `done` chưa tồn tại. Luôn tin PRD mục 02 và
dữ liệu thật, đừng tin file prompt.
Tiền được lưu dạng CHUỖI, không phải số — `tripCost`, `cost`, `vnd`, `fx`. Luôn đi qua
`num()` trước khi tính.
