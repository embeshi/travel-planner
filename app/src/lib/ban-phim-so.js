/* ============================================================
   BÀN PHÍM SỐ TỰ VẼ — cho luồng ghi chi 3 chạm (PRD F1).

   ⚠️ ĐÂY LÀ CHỖ DẤU PHẨY THÀNH VẤN ĐỀ THẬT ⚠️
   Ở bảng lịch trình, ô Chi phí là <input type="number"> nên TRÌNH DUYỆT
   lo phần đọc số: người dùng gõ dấu phẩy thì nó tự dịch sang dấu chấm.
   Đó là lý do cả 30 dòng có phần lẻ trong sổ thật đều là dấu chấm.

   Bàn phím tự vẽ KHÔNG có người gác đó. Mình phải tự lo. Luật ở đây:
     · HIỆN cho người dùng bằng dấu phẩy — đúng thói quen tiếng Việt
     · LƯU xuống dữ liệu bằng dấu chấm — đúng khuôn 61 dòng đang có
   Lẫn lộn hai thứ này là mất tiền lẻ mà không ai thấy.

   Bảng thiết kế vẽ bàn phím KHÔNG có phím thập phân (1–9, 000, 0, ⌫).
   Nhưng 30/61 dòng thật của chủ dự án có 2 chữ số lẻ — đúng một nửa sổ.
   Nên em thêm phím «,». Bỏ nó đi là luồng nhanh không ghi nổi một nửa
   những khoản mà chủ dự án thật sự hay ghi.
   ============================================================ */

export const SO_LE_TOI_DA = 2

/* Một phím → chuỗi mới. Thuần, không đụng gì bên ngoài.
   Chuỗi ở đây dùng dấu CHẤM, phần hiển thị mới đổi sang phẩy. */
export function bam (hienTai, phim) {
  const s = String(hienTai || '')

  if (phim === '⌫') return s.slice(0, -1)
  if (phim === 'xoa') return ''

  if (phim === ',' || phim === '.') {
    if (s.includes('.')) return s          /* đã có dấu rồi, không thêm nữa */
    if (s === '') return '0.'              /* gõ dấu trước số → thành 0, */
    return s + '.'
  }

  if (phim === '000') {
    if (s === '' || s === '0') return s    /* 000 ở đầu là vô nghĩa */
    return them(s, '000')
  }

  if (/^[0-9]$/.test(phim)) {
    if (s === '0') return phim             /* không để 0 dính đầu */
    return them(s, phim)
  }

  return s
}

function them (s, chu) {
  const sau = s + chu
  const dau = sau.indexOf('.')
  if (dau === -1) return sau
  /* Cắt bớt phần lẻ vượt hạn mức thay vì từ chối cả cú bấm —
     bấm mà không thấy gì xảy ra làm người dùng tưởng phím hỏng. */
  return sau.slice(0, dau + 1 + SO_LE_TOI_DA)
}

/* Chuỗi lưu xuống dữ liệu: dấu chấm, bỏ dấu thừa ở đuôi. */
export function deLuu (hienTai) {
  let s = String(hienTai || '').trim()
  if (s === '' || s === '.') return ''
  if (s.endsWith('.')) s = s.slice(0, -1)
  return s
}

/* Chuỗi cho người đọc: dấu phẩy, có chấm phân cách nghìn. */
export function deHien (hienTai) {
  const s = String(hienTai || '')
  if (s === '') return '0'
  const [nguyen, le] = s.split('.')
  const nhom = (nguyen || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return le === undefined ? nhom : nhom + ',' + le
}

export const PHIM = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫']
