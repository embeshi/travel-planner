import { num, fmtFx } from './dinh-dang.js'
import { rowTotal } from './xep-dong.js'

/* ============================================================
   TIỀN TỆ & TỶ GIÁ — bê từ index.html v9.6 (sec-fx, sec-book, sec-cash).

   Mười hai loại tiền, đúng thứ tự và đúng chữ của menu v9.6. Mã (USD…)
   là thứ nằm trong sổ (`currency`, `bkCurrency`) — không được đổi.
   ============================================================ */
export const TIEN_TE = [
  { ma: 'USD', ten: 'Đô la Mỹ', kh: '$' },
  { ma: 'GBP', ten: 'Bảng Anh', kh: '£' },
  { ma: 'EUR', ten: 'Euro', kh: '€' },
  { ma: 'JPY', ten: 'Yên Nhật', kh: '¥' },
  { ma: 'KRW', ten: 'Won Hàn', kh: '₩' },
  { ma: 'CNY', ten: 'Nhân dân tệ', kh: '¥' },
  { ma: 'THB', ten: 'Baht Thái', kh: '฿' },
  { ma: 'SGD', ten: 'Đô Singapore', kh: 'S$' },
  { ma: 'TWD', ten: 'Đài tệ', kh: 'NT$' },
  { ma: 'MYR', ten: 'Ringgit Malaysia', kh: 'RM' },
  { ma: 'AUD', ten: 'Đô Úc', kh: 'A$' },
  { ma: 'HKD', ten: 'Đô Hồng Kông', kh: 'HK$' }
]

export function nhanTienTe (ma) {
  const t = TIEN_TE.find((x) => x.ma === ma)
  return t ? `${t.ma} – ${t.ten} (${t.kh})` : ma
}

/* Ô tỷ giá → số trong sổ. v9.6: parseFloat, hữu hạn và > 0 thì nhận,
   còn lại là null (không có tỷ giá) — KHÔNG phải 0. Tỷ giá 0 nhân vào
   tổng là im lặng cho ra 0 ₫, đúng loại lỗi âm thầm cần tránh. */
export function docTyGia (chuoi) {
  const v = num(chuoi)
  return v > 0 ? v : null
}

/* ---------------- Đổi tiền (sec-cash) ---------------- */
export function tongDoiTien (state) {
  let vnd = 0; let fx = 0
  for (const r of state.cash) { vnd += num(r.vnd); fx += num(r.fx) }
  return { vnd, fx, tyGiaTB: vnd > 0 && fx > 0 ? vnd / fx : null }
}

/* Lời nhắc dưới bảng đổi tiền — nguyên văn v9.6 (dòng 2262–2287).
   Chỉ so với các dòng CHỌN «Tiền mặt», không đem cả lịch trình ra so
   (PRD mục 05: không so sai phạm trù). */
export function loiNhacTienMat (state) {
  const cashFx = tongDoiTien(state).fx
  const cur = state.currency
  const cashSpendFx = state.rows
    .filter((r) => r.pay === 'Tiền mặt')
    .reduce((s, r) => s + rowTotal(r), 0)

  if (cashFx > 0 && cashSpendFx > 0) {
    const diff = cashFx - cashSpendFx
    if (diff >= 0) {
      return {
        kieu: 'du',
        chu: '✓ Đủ cho các khoản chi bằng tiền mặt trong lịch trình (' + fmtFx(cashSpendFx) + ' ' + cur +
          '), còn dư khoảng ' + fmtFx(diff) + ' ' + cur + '.'
      }
    }
    return {
      kieu: 'vuot',
      chu: 'Các khoản đánh dấu «Tiền mặt» trong lịch trình (' + fmtFx(cashSpendFx) + ' ' + cur +
        ') đang vượt số tiền mặt đã đổi khoảng ' + fmtFx(-diff) + ' ' + cur + ' — cân nhắc đổi thêm nhé.'
    }
  }
  if (cashFx > 0) {
    return {
      kieu: 'meo',
      chu: 'Mẹo: chọn «Tiền mặt» ở cột Thanh toán cho các khoản chi bằng tiền mặt để app đối chiếu với số đã đổi.'
    }
  }
  return { kieu: '', chu: '' }
}

/* ---------------- Gói bay & khách sạn (sec-book) ---------------- */
export function tongGoiBay (state) {
  const fx = state.bookings.reduce((s, r) => s + num(r.cost), 0)
  return { fx, vnd: state.bkRate && fx > 0 ? fx * state.bkRate : null }
}
