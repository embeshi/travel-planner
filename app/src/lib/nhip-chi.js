import { num, fmtFx } from './dinh-dang.js'
import { rowTotal, viTienMatConLai } from './xep-dong.js'
import { mocChuyenDi } from './giai-doan.js'
import { dayKeyInfo, pad2 } from './ngay.js'
import { tongDaDoi } from './tong-hop.js'

/* ============================================================
   ✦ NHỊP CHI — thẻ cột phải màn Hôm nay laptop (bảng thiết kế L1):
   «Ba ngày đầu bạn tiêu nhanh hơn dự trù 12%. Nếu giữ nhịp này, ví tiền
   mặt sẽ hết vào chiều ngày thứ năm.»

   Tính hoàn toàn từ số liệu thật trên máy, không gọi mạng, không AI —
   cùng tinh thần «Viết nháp không cần AI». Thiếu dữ liệu thì nói thẳng
   là chưa đủ, không bịa một câu cho có.
   ============================================================ */
const hopLe = (d) => !!d && dayKeyInfo(d).cls === 0
const khoang = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
function congNgay (iso, n) {
  const t = dayKeyInfo(iso)
  return new Date(Date.UTC(t.y, t.mo - 1, t.d + n)).toISOString().slice(0, 10)
}
const ngayGon = (iso) => { const t = dayKeyInfo(iso); return pad2(t.d) + '/' + pad2(t.mo) }

export function nhipChi (state, homNay) {
  const { di, ve } = mocChuyenDi(state)
  if (!hopLe(di) || !hopLe(homNay)) return { du: false, chu: 'Chưa có ngày đi — chưa đoán được nhịp.' }
  const soNgay = hopLe(ve) ? khoang(di, ve) + 1 : null
  const thuMay = khoang(di, homNay) + 1
  if (thuMay < 2) return { du: false, chu: 'Mới ngày đầu — sau ngày thứ hai mới có nhịp để so.' }
  const daQua = Math.max(1, Math.min(thuMay, soNgay || thuMay))

  const dongToiNay = state.rows.filter((r) => hopLe(r.date) && r.date <= homNay)
  const chiFx = dongToiNay.reduce((s, r) => s + rowTotal(r), 0)
  const cau = []

  /* Nhịp so dự trù — chỉ khi có dự trù VÀ tỷ giá; phần gói bay trả trước
     tách khỏi quỹ lịch trình để không so sai phạm trù. */
  const duTru = num(state.budget)
  if (duTru > 0 && state.rate && soNgay) {
    const bkVnd = state.bkRate ? state.bookings.reduce((s, r) => s + num(r.cost), 0) * state.bkRate : 0
    const quy = Math.max(0, duTru - bkVnd)
    const duTruToiNay = quy * (daQua / soNgay)
    if (duTruToiNay > 0) {
      const chenh = ((chiFx * state.rate) / duTruToiNay - 1) * 100
      const dau = daQua + ' ngày đầu'
      if (Math.abs(chenh) < 3) cau.push(dau + ' bạn tiêu đúng nhịp dự trù.')
      else cau.push(dau + ' bạn tiêu ' + (chenh > 0 ? 'nhanh' : 'chậm') + ' hơn dự trù ' + Math.round(Math.abs(chenh)) + '%.')
    }
  }

  /* Ví tiền mặt — chỉ so với dòng chọn «Tiền mặt» (PRD mục 05) */
  const daDoi = tongDaDoi(state)
  if (daDoi > 0) {
    const viCon = viTienMatConLai(state.rows, daDoi)
    const tienMat = dongToiNay.filter((r) => r.pay === 'Tiền mặt').reduce((s, r) => s + rowTotal(r), 0)
    if (viCon <= 0) cau.push('Ví tiền mặt đã cạn — cân nhắc đổi thêm.')
    else if (tienMat > 0) {
      const moiNgay = tienMat / daQua
      const conDuoc = viCon / moiNgay
      const conLai = soNgay ? soNgay - daQua : null
      if (conLai !== null && conDuoc >= conLai) {
        cau.push('Nếu giữ nhịp này, ví tiền mặt đủ tới cuối chuyến (còn dư khoảng ' +
          fmtFx(viCon - moiNgay * conLai) + ' ' + state.currency + ').')
      } else {
        const het = congNgay(homNay, Math.floor(conDuoc))
        cau.push('Nếu giữ nhịp này, ví tiền mặt sẽ hết vào ngày ' + ngayGon(het) +
          (soNgay ? ' (ngày thứ ' + (daQua + Math.floor(conDuoc)) + '/' + soNgay + ')' : '') + '.')
      }
    }
  }

  if (!cau.length) return { du: false, chu: 'Chưa đủ dữ liệu để đoán nhịp — cần ngân sách dự trù hoặc vài khoản tiền mặt đã ghi.' }
  return { du: true, chu: cau.join(' ') }
}
