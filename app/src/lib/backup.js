import { pad2 } from './ngay.js'

/* ============================================================
   XUẤT BACKUP — bê nguyên từ index.html v9.6 (dòng 3238–3260).
   Nằm trong danh sách PHẢI GIỮ của CLAUDE.md; lô 9 làm rơi phần này
   (chỉ bê phần Nhập), chủ dự án bắt được — lô này trả nợ.

   Vỏ file phải khớp TỪNG CHỮ với v9.6 ({app, kind, exportedAt, data}),
   vì ruotCuaBackup của cả v9.6 lẫn v10 đều đọc đúng vỏ đó — file xuất
   từ v10 phải nhập ngược được vào v9.6 (đường lui hai chiều).

   Khuôn tên do stampName() sinh: du-lich-backup-YYYY-MM-DD-HHMM.json —
   đúng khuôn mà .gitignore đang chặn khỏi repo.
   ============================================================ */
export function stampName (d = new Date()) {
  return 'du-lich-backup-' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' +
         pad2(d.getDate()) + '-' + pad2(d.getHours()) + pad2(d.getMinutes()) + '.json'
}

export function goiBackup (state, luc = new Date()) {
  return {
    ten: stampName(luc),
    json: JSON.stringify({
      app: 'ke-hoach-du-lich',
      kind: 'backup',
      exportedAt: luc.toISOString(),
      data: state
    }, null, 2)
  }
}

/* Đẩy file xuống máy người dùng qua thẻ <a download> — đúng cách v9.6. */
export function taiXuong (state) {
  const { ten, json } = goiBackup(state)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = ten
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return ten
}
