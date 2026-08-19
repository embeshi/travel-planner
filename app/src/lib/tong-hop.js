import { num } from './dinh-dang.js'
import { rowTotal, viTienMatConLai } from './xep-dong.js'

/* ============================================================
   TỔNG CHI PHÍ CẢ CHUYẾN — bê nguyên công thức updateGrandAll()
   của index.html v9.6 (dòng 2208–2247).

   Luật quan trọng, dễ làm sai nếu viết lại từ đầu:
   một khối chỉ được cộng vào tổng khi nó CÓ TIỀN và CÓ TỶ GIÁ.
   Khối có tiền mà thiếu tỷ giá thì KHÔNG cộng 0 vào cho xong — nó phải
   được báo là thiếu, để người dùng không tưởng tổng đã đủ.
   ============================================================ */
export function tongChiPhiCaChuyen (state) {
  const tripFx = state.rows.reduce((s, r) => s + rowTotal(r), 0)
  const bkFx = state.bookings.reduce((s, r) => s + num(r.cost), 0)

  const tripVnd = state.rate ? tripFx * state.rate : null
  const bkVnd = state.bkRate ? bkFx * state.bkRate : null

  let tong = 0
  const thieuTyGia = []
  if (tripFx > 0) {
    if (tripVnd !== null) tong += tripVnd
    else thieuTyGia.push(state.currency)
  }
  if (bkFx > 0) {
    if (bkVnd !== null) tong += bkVnd
    else thieuTyGia.push(state.bkCurrency)
  }

  return { tripFx, bkFx, tripVnd, bkVnd, tong, thieuTyGia }
}

/* Tổng ngoại tệ đã đổi ra tiền mặt. */
export function tongDaDoi (state) {
  return state.cash.reduce((s, r) => s + num(r.fx), 0)
}

/* ============================================================
   BA CON SỐ VÂN TAY — nghi thức giữ dữ liệu, bước 3 và bước 5.

   «Ba con số này là vân tay của sổ — sau khi lên v10, khớp cả ba là
   chắc chắn không rơi rớt gì.»

   Đây là tiêu chí nghiệm thu của mọi lô đụng tới dữ liệu.
   ============================================================ */
export function baConSoVanTay (state) {
  const { tong, thieuTyGia } = tongChiPhiCaChuyen(state)
  return {
    soDongLichTrinh: state.rows.length,
    tongChiPhiVnd: tong,
    viTienMatConLai: viTienMatConLai(state.rows, tongDaDoi(state)),
    donViVi: state.currency,
    thieuTyGia
  }
}
