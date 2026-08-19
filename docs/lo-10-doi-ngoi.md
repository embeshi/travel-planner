# Lô 10 · Đổi ngôi — việc của thuyền trưởng

Đây là lô DUY NHẤT đụng tới bản chạy thật. Xưởng đã chuẩn bị xong mọi thứ
nhưng **cố tình dừng trước nút bấm cuối**: nghi thức giữ dữ liệu quy định
bước 4 và bước 5 là việc của chủ dự án, không phải của xưởng.

---

## Trước khi bắt đầu — ba thứ phải có trong tay

| | Ở đâu |
|---|---|
| Backup JSON mới nhất | `~/Downloads/du-lich-backup-*.json` |
| Bản chụp CSV toàn bảng Supabase | `~/Downloads/trips_rows*.csv` |
| Đường lui 60 giây | `~/Downloads/index-v9.6-duong-lui.html` |

Nếu backup cũ hơn một tuần: mở app v9.6 đang chạy, xuất backup mới, **gửi nó
ra khỏi máy** (tự gửi email cho mình hoặc thả lên Drive). Backup nằm trong
thư mục Tải về của đúng một chiếc máy thì chưa gọi là backup.

## Ba con số vân tay

Ghi ra giấy trước khi đổi, đối chiếu lại sau khi đổi. Lần chụp gần nhất:

```
số dòng lịch trình      61
tổng chi phí cả chuyến  (xem ba-con-so-van-tay.txt trong ~/Downloads)
ví tiền mặt còn lại     (xem ba-con-so-van-tay.txt trong ~/Downloads)
```

Con số thật hiện tại lấy từ app v9.6 đang chạy, hoặc mở
`app/public/soi-backup.html` bằng cách **nhấp đúp** rồi chọn file backup.

---

## Bước 1 · Thử bản v10 mà KHÔNG đăng nhập

```bash
cd ~/Desktop/travel-planner-new/app && npm run build && npx vite preview
```

Mở địa chỉ nó in ra, rồi:

- [ ] Bấm **Nhập backup**, chọn file JSON. Ba con số phải khớp cả ba.
- [ ] Gõ tiếng Việt có dấu vào ô tên hoạt động, bấm Enter chốt dấu — chữ
      không được nằm dở dang.
- [ ] Kéo một dòng sang ngày khác, xem nó nhận đúng ngày cụm mới.
- [ ] Thu hẹp cửa sổ qua mốc 701px: thanh Tổng cộng không được có nét đứt.
- [ ] Ghi thử một khoản có phần lẻ, rồi Hoàn tác — số dòng phải trở lại như cũ.
- [ ] **Không bấm Đăng nhập ở bước này.**

Có bất kỳ chỗ nào sai → dừng, báo xưởng. Đừng đi tiếp.

## Bước 2 · Thử luồng đăng nhập bằng tài khoản phụ

- [ ] Đăng ký một tài khoản mới bằng email phụ ngay trên bản v10.
- [ ] Nhập backup, sửa một dòng, tải lại trang — dữ liệu phải còn.
- [ ] Đăng xuất, đăng nhập lại — dữ liệu vẫn phải còn.

Tài khoản mới ghi vào dòng dữ liệu của riêng nó, tài khoản thật nằm yên.

## Bước 3 · Bật GitHub Pages theo lối mới

Một lần duy nhất, trên GitHub:

**Settings → Pages → Source** → chọn **GitHub Actions**

Không bấm bước này thì workflow chạy xong vẫn không có gì lên sóng.

## Bước 4 · Gộp v10 vào nhánh chính

```bash
cd ~/Desktop/travel-planner-new
git checkout main && git merge v10 && git push origin main
```

Vào tab **Actions** trên GitHub xem nó chạy. Ba việc: cài thư viện → chạy
test → dựng bản phát. Test đỏ là nó **tự dừng, không phát** — đó là chủ ý.

## Bước 5 · Đối chiếu trên bản thật

- [ ] Mở `embeshi.github.io/travel-planner`
- [ ] Bấm nút **⟳** cạnh tem phiên bản
- [ ] Tem phải hiện **v10.0**
- [ ] Đăng nhập tài khoản thật
- [ ] **Đối chiếu lại ba con số vân tay**

Thấy trống trơn → **DỪNG TAY NGAY**. Đừng gõ gì, đừng thêm dòng. Mỗi thao
tác lúc đó đều có nguy cơ ghi trang trắng đè lên sổ thật. Dùng đường lui.

## Đường lui 60 giây

**Sau khi đã đổi nguồn Pages sang GitHub Actions, đường lui là GẠT LẠI
CÔNG TẮC — không phải sửa file:**

> Settings → Pages → Source → chọn lại **Deploy from a branch** (main · root)

`index.html` v9.6 vẫn nằm nguyên ở gốc repo (v10 không đụng tới nó), nên
gạt công tắc về là bản cũ lên sóng lại ngay. Rồi bấm **⟳** trong app —
không bấm thì trình duyệt còn giữ bản v10 trong bộ nhớ đệm.

File `index-v9.6-duong-lui.html` trong `~/Downloads` là đai dự phòng cuối
cùng: chỉ cần tới nếu chẳng may `index.html` ở gốc repo bị sửa mất — dán
nội dung nó đè lên rồi mới gạt công tắc.

Đường lui này còn hiệu lực vì v10 giữ đúng luật chỉ-thêm-không-đổi:
`cat` và `done` là trường thêm trên dòng, đã kiểm là v9.6 đọc rồi lưu lại
vẫn giữ nguyên chúng.

> Ngoại lệ đã biết: `budget` (ngân sách dự trù) là trường cấp cao nhất nên
> v9.6 sẽ xoá nó. Một con số gõ lại trong mười giây, không phải dữ liệu chuyến đi.

## Giữ backup thêm một tuần

Xoá backup là việc của tương lai, không bao giờ là việc của hôm nay.
