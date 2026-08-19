import { dayKeyInfo, pad2, weekdayOf } from './ngay.js'
import { rowTotal } from './xep-dong.js'

/* ============================================================
   GOM DÒNG THEO NGÀY — bê nguyên thuật toán renderDailyCosts()
   của index.html v9.6 (dòng 2075–2125).

   Ba chỗ dễ làm sai nếu viết lại từ đầu:

   1. THỨ TỰ NHÓM theo hạng `cls` trước, rồi mới tới ngày:
        cls 0 ngày lịch thật → 1 số trần → 2 chữ tự do → 3 chưa ghi ngày.
      Nhóm chữ tự do giữ thứ tự XUẤT HIỆN, không xếp theo bảng chữ cái.

   2. NHÃN NGÀY kiểu Việt: dd/mm. Chỉ kèm năm khi chuyến vắt qua nhiều năm —
      thêm năm vô cớ làm nhãn dài ra mà không thêm thông tin gì.

   3. Nhóm «chưa ghi ngày» luôn nằm CUỐI, để dòng đang gõ dở không bị
      đẩy lên giữa bảng.
   ============================================================ */
export function nhomTheoNgay (rows, { chiDongCoTien = false } = {}) {
  const nhom = new Map()
  let thuTuXuatHien = 0

  for (const r of rows) {
    const tien = rowTotal(r)
    if (chiDongCoTien && tien <= 0) continue

    const tin = dayKeyInfo(r.date)
    let g = nhom.get(tin.key)
    if (!g) {
      g = {
        key: tin.key,
        none: tin.none,
        cls: tin.cls,
        sortNum: tin.sortNum,
        y: tin.y || 0,
        mo: tin.mo || 0,
        d: tin.d || 0,
        nhan: tin.label || '',
        thu: '',
        ngayGoc: r.date || '',
        xuatHien: thuTuXuatHien++,
        dong: [],
        tong: 0
      }
      nhom.set(tin.key, g)
    }
    g.dong.push(r)
    g.tong += tien
  }

  const ds = [...nhom.values()]

  /* Nhãn: chỉ kèm năm khi chuyến vắt qua nhiều năm */
  const cacNam = new Set(ds.filter((g) => g.cls === 0 && g.y).map((g) => g.y))
  const nhieuNam = cacNam.size > 1
  for (const g of ds) {
    if (g.cls === 0) {
      g.nhan = pad2(g.d) + '/' + pad2(g.mo) + ((nhieuNam && g.y) ? '/' + g.y : '')
      g.thu = weekdayOf(g.y, g.mo, g.d)
    }
  }

  ds.sort((a, b) => {
    if (a.cls !== b.cls) return a.cls - b.cls
    if (a.cls === 2) return a.xuatHien - b.xuatHien
    return a.sortNum - b.sortNum
  })

  return ds
}

/* Ngày cao nhất được đánh dấu 🔥 (bảng thiết kế mục 02).
   Trả về key của nhóm, hoặc null khi chưa có nhóm nào có tiền. */
export function nhomCaoNhat (ds) {
  let cao = null
  for (const g of ds) {
    if (g.tong > 0 && (!cao || g.tong > cao.tong)) cao = g
  }
  return cao ? cao.key : null
}

/* Trải các nhóm về một danh sách phẳng đúng thứ tự đang hiển thị.
   Enter và kéo thả đều cần thứ tự NHÌN THẤY, không phải thứ tự trong mảng gốc. */
export function traiPhang (ds) {
  return ds.flatMap((g) => g.dong)
}
