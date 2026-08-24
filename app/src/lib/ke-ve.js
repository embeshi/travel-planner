import { uid, fmtVND, fmtFx } from './dinh-dang.js'
import { applyData } from './kho.js'
import { tongChiPhiCaChuyen, tongDaDoi } from './tong-hop.js'
import { viTienMatConLai } from './xep-dong.js'
import { mocChuyenDi } from './giai-doan.js'
import { dayKeyInfo, pad2 } from './ngay.js'
import { donSoChoChuyenMoi } from './chuyen-moi.js'

/* ============================================================
   KỆ VÉ — bảng thiết kế M9 · L9. Mỗi chuyến đã cất là một tấm
   boarding pass đóng dấu, nằm cuối tab Tổng kết.

   Một vé = số liệu CHỐT lúc cất + bản chụp trọn sổ của chuyến đó.
   Bản chụp KHÔNG chứa kệ (tránh kệ lồng kệ phình vô hạn), và applyData
   đã có luật «vắng kệ thì giữ kệ» nên xem lại một vé không làm bay kệ.
   ============================================================ */

export function ngayGon (iso) {
  const t = dayKeyInfo(iso)
  return t.cls === 0 ? pad2(t.d) + '/' + pad2(t.mo) : (iso || '')
}

export function coGiDeCat (kho) {
  return kho.rows.length > 0 || kho.cash.length > 0 || kho.bookings.length > 0 ||
    !!(kho.hotel.checkin || kho.hotel.checkout)
}

/* Bản chụp trọn sổ của CHUYẾN — mọi khối trừ kệ. */
export function chupSo (kho) {
  const { chuyenDaCat, ...chuyen } = JSON.parse(JSON.stringify(kho))
  return chuyen
}

/* Cất chuyến đang mở thành một vé trên đầu kệ. KHÔNG dọn sổ —
   việc dọn là quyết định riêng của người gọi (ChuyenMoi có phanh riêng). */
export function catChuyenLenKe (kho) {
  const moc = mocChuyenDi(kho)
  const tong = tongChiPhiCaChuyen(kho)
  const ve = {
    id: uid(),
    ten: kho.title,
    di: moc.di || '',
    ve: moc.ve || '',
    currency: kho.currency,
    soDong: kho.rows.length,
    tongVnd: tong.tong,
    viFx: viTienMatConLai(kho.rows, tongDaDoi(kho)),
    catLuc: new Date().toISOString(),
    data: chupSo(kho)
  }
  kho.chuyenDaCat.unshift(ve)          /* vé mới nhất nằm đầu kệ */
  return ve
}

/* Cất chuyến hiện tại (nếu có gì để cất) rồi đưa vé xuống sổ — hoán đổi
   an toàn: không nhánh nào làm mất chuyến nào. */
export function xemLaiVe (kho, idVe) {
  const i = kho.chuyenDaCat.findIndex((v) => v.id === idVe)
  if (i === -1) return null
  const ve = kho.chuyenDaCat[i]
  if (coGiDeCat(kho)) catChuyenLenKe(kho)
  /* vé vừa cất nằm đầu kệ nên vé cần gỡ đã trôi xuống — tìm lại theo id */
  kho.chuyenDaCat.splice(kho.chuyenDaCat.findIndex((v) => v.id === idVe), 1)
  donSoChoChuyenMoi(kho)               /* nền sạch trước khi đổ chuyến cũ vào */
  applyData(ve.data, kho)
  return ve.ten
}

/* Gỡ một vé khỏi kệ. Giao diện phải hỏi xác nhận TRƯỚC khi gọi. */
export function xoaVe (kho, idVe) {
  const i = kho.chuyenDaCat.findIndex((v) => v.id === idVe)
  if (i >= 0) kho.chuyenDaCat.splice(i, 1)
  return i >= 0
}

/* Chữ trên vé — đúng ba dòng số liệu của bảng thiết kế M9. */
export function nhanVe (ve) {
  return {
    tuyen: ve.ten,
    ngay: ve.di && ve.ve ? ngayGon(ve.di) + ' – ' + ngayGon(ve.ve) : '',
    soDong: String(ve.soDong),
    tong: fmtVND(ve.tongVnd),
    vi: fmtFx(ve.viFx) + ' ' + ve.currency
  }
}
