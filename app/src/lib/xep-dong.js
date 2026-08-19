import { num } from './dinh-dang.js'

/* ============================================================
   Xếp dòng theo ngày — vết sẹo, đọc kỹ trước khi sửa.
   Bê nguyên từ index.html v9.6 (dòng 1752–1762, 1852).

   Ba tính chất phải giữ, cả ba đều là phản hồi thật qua 9 phiên bản:

   1. XẾP ỔN ĐỊNH. Hai dòng cùng ngày phải giữ nguyên thứ tự người dùng
      đã đặt. Comparator trả 0 khi bằng nhau, và Array.sort của JS là
      ổn định từ ES2019 — đừng thay bằng thuật toán tự chế.

   2. DÒNG TRỐNG CHÌM ĐÁY. Dòng chưa có ngày nằm cuối để người dùng gõ
      tiếp, không bị đẩy lên giữa bảng.

   3. BÁO CÓ ĐỔI CHỖ HAY KHÔNG. Trả về true khi thứ tự thật sự đổi.
      Bảng dùng tín hiệu này để biết khi nào cần cho con trỏ bay theo
      dòng — vẽ lại mà không dời con trỏ thì người dùng mất chỗ đang gõ.
   ============================================================ */

export function sortByDate (list) {
  const truoc = list.map((r) => r.id).join('|')
  list.sort((a, b) => {
    const da = a.date || ''
    const db = b.date || ''
    if (da === db) return 0
    if (!da) return 1 /* chưa có ngày: nằm cuối cho nhập tiếp */
    if (!db) return -1
    return da < db ? -1 : 1 /* yyyy-mm-dd: so chuỗi là chuẩn thời gian */
  })
  return truoc !== list.map((r) => r.id).join('|')
}

/* Chi phí của một dòng lịch trình. Một dòng một số, không cộng dồn gì thêm. */
export function rowTotal (row) {
  return num(row.tripCost)
}

/* Tổng ngoại tệ của cả bảng lịch trình. */
export function tongLichTrinh (rows) {
  return rows.reduce((s, r) => s + rowTotal(r), 0)
}

/* Ví tiền mặt còn lại = tiền đã đổi − tổng các dòng CHỌN «Tiền mặt».
   Mục 05 PRD: không so sai phạm trù. Chỉ trừ dòng nào thật sự chọn
   Tiền mặt, không đem cả lịch trình ra trừ vào ví. */
export function viTienMatConLai (rows, tongDaDoi) {
  const daTieu = rows
    .filter((r) => r.pay === 'Tiền mặt')
    .reduce((s, r) => s + rowTotal(r), 0)
  return num(tongDaDoi) - daTieu
}

/* ============================================================
   CHUYỂN CHỖ MỘT DÒNG — bê nguyên luật của enableRowDrag()
   trong index.html v9.6 (dòng 1698–1706).

   Luật «nhận ngày của hàng xóm»: sau khi thả, dòng nhìn sang hàng xóm
   PHÍA TRÊN trước; không có thì nhìn hàng xóm phía dưới. Nếu hàng xóm
   đó khác ngày thì dòng nhận luôn ngày ấy.

   Đây là thứ làm cho kéo-thả «hôn phối» được với tự-xếp-theo-ngày: thả
   một dòng sang cụm ngày khác thì nó thuộc về ngày đó luôn, chứ không
   bị cú sắp xếp kế tiếp ném ngược về chỗ cũ.

   Trả về true nếu ngày của dòng bị đổi.
   ============================================================ */
export function chuyenDong (list, tu, den) {
  if (tu === den || tu < 0 || tu >= list.length) return false
  const dong = list.splice(tu, 1)[0]
  list.splice(den, 0, dong)
  if (!dong || !('date' in dong)) return false

  const hangXom = list[den - 1] || list[den + 1]
  if (hangXom && (hangXom.date || '') !== (dong.date || '')) {
    dong.date = hangXom.date || ''
    return true
  }
  return false
}
