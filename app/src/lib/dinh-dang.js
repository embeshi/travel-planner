/* ============================================================
   Định dạng số và sinh id.
   Bê nguyên từ index.html v9.6 (dòng 1478–1489). Không đổi hành vi.
   ============================================================ */

export function uid () {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

const vndFmt = new Intl.NumberFormat('vi-VN')

export function fmtVND (n) {
  return vndFmt.format(Math.round(n)) + ' ₫'
}

export function fmtFx (n) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n)
}

/* Đọc một ô nhập ra số. Rác thì trả 0 — KHÔNG trả NaN, vì NaN lọt vào
   phép cộng là cả bảng tổng hỏng theo. Đây là hành vi v9.6, giữ nguyên.

   Lưu ý đã có từ v9.6 và cố tình không sửa ở lô này:
   parseFloat('12,5') ra 12 chứ không phải 12,5 — dấu phẩy bị cắt.
   Người dùng gõ dấu phẩy thập phân sẽ mất phần lẻ. Muốn sửa thì phải
   sửa ở lô riêng và nghiệm thu riêng, không lẫn vào việc bê code. */
export function num (v) {
  const n = parseFloat(v)
  return isFinite(n) ? n : 0
}

/* Tỷ giá thực tế của một lần đổi tiền: bao nhiêu đồng cho 1 ngoại tệ.
   Rút từ updateCashRate (dòng 1997) — phần tính, bỏ phần vẽ DOM.
   Trả null khi chưa đủ dữ liệu để component hiện dấu «—». */
export function tyGiaThucTe (vnd, fx) {
  const a = num(vnd)
  const b = num(fx)
  if (a > 0 && b > 0) return a / b
  return null
}
