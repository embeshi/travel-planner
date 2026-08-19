import { kho, monMoi } from './kho.js'

/* ============================================================
   SỔ TAY & HÀNH LÝ — sáu danh sách, bê nguyên từ v9.6.

   Tên khối (skincare · makeup · essentials · shopping · places · food)
   là tên CỘT TRONG SỔ THẬT, không được đổi (CLAUDE.md điều kiện 3).
   Nhãn hiển thị thì đổi được, tên khối thì không.

   `packed` là cờ đã-xong của v9.6. Mỗi danh sách có một cách gọi «xong»
   khác nhau — vali thì «đã cho vào vali», món ăn thì «đã ăn thử». Giữ
   nguyên vì đó là chữ người dùng đã quen qua chín phiên bản.
   ============================================================ */

export const DANH_SACH = [
  { khoa: 'skincare',   nhan: 'Skincare',    bt: '✨', nhom: 'hanh-ly', xong: 'đã cho vào vali' },
  { khoa: 'makeup',     nhan: 'Makeup',      bt: '💄', nhom: 'hanh-ly', xong: 'đã cho vào vali' },
  { khoa: 'essentials', nhan: 'Đồ dùng',     bt: '🧴', nhom: 'hanh-ly', xong: 'đã cho vào vali' },
  { khoa: 'shopping',   nhan: 'Mua mang về', bt: '🛍', nhom: 'so-tay',  xong: 'đã mua' },
  { khoa: 'places',     nhan: 'Đi đâu chơi', bt: '📍', nhom: 'so-tay',  xong: 'đã đến' },
  { khoa: 'food',       nhan: 'Ăn gì ngon',  bt: '🍜', nhom: 'so-tay',  xong: 'đã ăn thử' }
]

export const moTa = (khoa) => DANH_SACH.find((d) => d.khoa === khoa)

/* Gợi ý nhanh — chép nguyên từ index.html v9.6. */
export const GOI_Y = {
  skincare: ["Sữa rửa mặt","Toner","Kem chống nắng","Kem dưỡng ẩm","Serum","Mặt nạ","Tẩy trang","Dưỡng môi","Xịt khoáng"],
  makeup: ["Kem nền / Cushion","Son môi","Mascara","Phấn phủ","Kẻ mày","Má hồng","Kẻ mắt","Che khuyết điểm","Cọ trang điểm","Lens (kính áp tròng)","Nước rửa lens","Thuốc nhỏ mắt"],
  essentials: ["Hộ chiếu / giấy tờ","Sạc điện thoại","Pin dự phòng","Ổ cắm chuyển đổi","Thuốc cá nhân","Bàn chải & kem đánh răng","Kính râm","Ô / áo mưa","Dép đi trong nhà","Tai nghe","Bình nước","Túi đựng đồ bẩn","Máy sấy tóc","Máy duỗi tóc"],
  shopping: ["Xoài sấy dẻo","Dầu gió / dầu hít","Rong biển Tao Kae Noi","Trà sữa Thái (gói pha)","Kem đánh răng thảo dược","Mỹ phẩm Srichand / Mistine","Túi NaRaYa","Quần họa tiết voi","Snack 7-Eleven","Nước hoa khô","Sầu riêng sấy giòn","Kẹo me / me sấy","Mực rim Bento","Bánh dừa nướng","Mì MAMA (mì Thái)","Gia vị lẩu Tom Yum","Muối ớt chấm Thái","Dầu cù là Tiger Balm","Xà phòng thảo dược Madame Heng","Trà Thái ChaTraMue","Cà phê Thái hòa tan","Khăn lụa Jim Thompson","Móc khóa / lưu niệm voi","Lăn nách Thái"],
  places: ["Chợ Chatuchak","Wat Arun","Wat Pho","Hoàng cung (Grand Palace)","ICONSIAM","Chinatown Yaowarat","Chợ đêm Jodd Fairs","Khao San Road","Terminal 21","Chợ nổi Damnoen Saduak"],
  food: ["Pad Thái","Tom Yum","Som Tam (gỏi đu đủ)","Xôi xoài","Hủ tiếu thuyền (Boat Noodles)","Cơm gà Khao Man Gai","Cà ri xanh","Moo Ping (thịt xiên nướng)","Bánh dừa Khanom Krok","Kem dừa","Trà sữa Thái chính gốc","Roti chuối","Trứng chiên hàu (Hoi Tod)","Trái cây lề đường"]}

/* Tiến độ một danh sách. */
export function tienDo (ds) {
  const tong = ds.length
  const xong = ds.filter((m) => m.packed).length
  return { xong, tong, phanTram: tong ? Math.round((xong / tong) * 100) : 0 }
}

/* Gợi ý còn lại: bỏ những món đã có trong danh sách rồi.
   So không phân biệt hoa thường và bỏ khoảng trắng thừa — người dùng gõ
   «kem chống nắng» thì không nên gợi ý «Kem chống nắng» lần nữa. */
export function goiYConLai (khoa, ds) {
  const daCo = new Set(ds.map((m) => (m.name || '').trim().toLowerCase()))
  return (GOI_Y[khoa] || []).filter((ten) => !daCo.has(ten.trim().toLowerCase()))
}

export function themMon (khoa, ten) {
  const t = (ten || '').trim()
  if (!t) return null
  const m = monMoi(t)
  kho[khoa].push(m)
  return m
}

export function xoaMon (khoa, id) {
  const i = kho[khoa].findIndex((m) => m.id === id)
  if (i >= 0) kho[khoa].splice(i, 1)
}
