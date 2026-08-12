/* ============================================================
   Đọc và xếp ngày.
   Bê nguyên từ index.html v9.6 (dòng 2044–2073, 2600–2618).

   `dayKeyInfo` là trái tim của việc tự xếp nhóm theo ngày ở cả ba bảng.
   Nó cố tình dễ dãi: ô chọn lịch cho ra «2026-08-04», nhưng người dùng
   gõ tay thì ra «29/10», «29/10/26», «3», hay cả chữ «Ngày cuối».
   Cái nào cũng phải xếp được, không cái nào được làm vỡ bảng.
   ============================================================ */

export function dayKeyInfo (raw) {
  const t = (raw || '').trim()
  if (!t) return { key: '__none__', none: true, cls: 3, sortNum: 0, label: 'Chưa ghi ngày' }

  /* ô chọn lịch lưu dạng năm-tháng-ngày */
  const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) {
    const y = +m[1]; const mo = +m[2]; const d = +m[3]
    return {
      key: 'd:' + y + '-' + mo + '-' + d,
      none: false,
      cls: 0,
      sortNum: y * 10000 + mo * 100 + d,
      y, mo, d
    }
  }

  /* 29/10 hoặc 29/10/2026 */
  const m2 = t.match(/^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?$/)
  if (m2) {
    const d2 = +m2[1]; const mo2 = +m2[2]
    let y2 = m2[3] ? +m2[3] : 0
    if (y2 && y2 < 100) y2 += 2000
    return {
      key: 'd:' + y2 + '-' + mo2 + '-' + d2,
      none: false,
      cls: 0,
      sortNum: y2 * 10000 + mo2 * 100 + d2,
      y: y2, mo: mo2, d: d2
    }
  }

  /* chỉ một con số: «ngày thứ mấy của chuyến» */
  if (/^\d+([.,]\d+)?$/.test(t)) {
    return {
      key: t.toLowerCase(),
      none: false,
      cls: 1,
      sortNum: parseFloat(t.replace(',', '.')),
      label: 'Ngày ' + t
    }
  }

  /* chữ tự do */
  return { key: t.toLowerCase(), none: false, cls: 2, sortNum: 0, label: t }
}

export function pad2 (n) {
  return (n < 10 ? '0' : '') + n
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export function weekdayOf (y, mo, d) {
  if (!y || !mo || !d) return ''
  const dt = new Date(y, mo - 1, d)
  return isNaN(dt.getTime()) ? '' : WEEKDAYS[dt.getDay()]
}

/* Số ngày lưu trú từ check-in / check-out.
   Rút từ updateStayLength (dòng 2600) — phần tính, bỏ phần vẽ DOM.
   Giữ nguyên từng câu chữ nhãn để giao diện v10 không đổi lời. */
export function soNgayLuuTru (checkin, checkout) {
  if (!checkin || !checkout) return { nhan: '—', loi: false, dem: null }

  const dem = Math.round((new Date(checkout) - new Date(checkin)) / 86400000)
  if (!isFinite(dem)) return { nhan: '—', loi: false, dem: null }

  if (dem > 0) return { nhan: (dem + 1) + ' ngày ' + dem + ' đêm', loi: false, dem }
  if (dem === 0) return { nhan: 'Trong ngày', loi: false, dem: 0 }
  return { nhan: 'Check-out cần sau check-in', loi: true, dem }
}
