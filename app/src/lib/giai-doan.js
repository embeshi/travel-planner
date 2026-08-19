import { dayKeyInfo, pad2 } from './ngay.js'

/* ============================================================
   GIAI ĐOẠN CHUYẾN ĐI — mới của v10 (PRD mục 03B).

   App tự mở đúng tab theo giai đoạn:
     trước chuyến → 🗓 Kế hoạch   (còn đang xếp lịch)
     trong chuyến → 🏠 Hôm nay    (đang đi, cần ghi chi nhanh)
     sau chuyến   → 📊 Tổng kết   (đã về, xem lại)

   Mốc ngày lấy từ khách sạn trước; chưa có thì suy từ chính lịch trình.
   Không có mốc nào thì coi như chưa khởi hành — mở Kế hoạch, vì đó là
   chỗ duy nhất làm được việc gì đó.
   ============================================================ */

export function homNayISO (d = new Date()) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

/* Mốc đi/về của chuyến. Ưu tiên ngày khách sạn vì đó là thứ người dùng
   chủ động điền; không có thì lấy ngày sớm nhất và muộn nhất trong lịch trình. */
export function mocChuyenDi (state) {
  const ci = (state.hotel && state.hotel.checkin) || ''
  const co = (state.hotel && state.hotel.checkout) || ''
  if (ci || co) return { di: ci || co, ve: co || ci, tu: 'khach-san' }

  const ngay = state.rows
    .map((r) => r.date)
    .filter((d) => d && dayKeyInfo(d).cls === 0)
    .sort()
  if (!ngay.length) return { di: '', ve: '', tu: 'chua-co' }
  return { di: ngay[0], ve: ngay[ngay.length - 1], tu: 'lich-trinh' }
}

/* 'chua-co' | 'truoc' | 'trong' | 'sau' */
export function giaiDoan (state, homNay = homNayISO()) {
  const { di, ve } = mocChuyenDi(state)
  if (!di && !ve) return 'chua-co'
  if (di && homNay < di) return 'truoc'
  if (ve && homNay > ve) return 'sau'
  return 'trong'
}

export const TAB_THEO_GIAI_DOAN = {
  'chua-co': 'ke-hoach',
  truoc: 'ke-hoach',
  trong: 'hom-nay',
  sau: 'tong-ket'
}

export function tabMoDau (state, homNay = homNayISO()) {
  return TAB_THEO_GIAI_DOAN[giaiDoan(state, homNay)]
}

/* «Ngày 4/6 của chuyến» trên đầu màn Hôm nay. Trả null khi chưa đủ mốc. */
export function ngayThuMay (state, homNay = homNayISO()) {
  const { di, ve } = mocChuyenDi(state)
  if (!di || !ve) return null
  const mot = 86400000
  const tong = Math.round((new Date(ve) - new Date(di)) / mot) + 1
  const thu = Math.round((new Date(homNay) - new Date(di)) / mot) + 1
  if (!isFinite(tong) || !isFinite(thu) || tong < 1) return null
  return { thu, tong }
}
