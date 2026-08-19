/* ============================================================
   DỮ LIỆU MẪU — dựng theo ĐÚNG KHUÔN của sổ thật, nhưng nội dung bịa.

   Vì sao có file này: file backup thật chứa dữ liệu tài chính thật và
   repo này công khai, nên không được commit (CLAUDE.md luật 6). Nhưng
   test tự động thì cần một bộ dữ liệu chạy lại được trên mọi máy.

   Nên: lấy KHUÔN của sổ thật (đã dò ngày 12/08/2026), bỏ nội dung đi.
   Những ca hiểm dưới đây có thật trong sổ của chủ dự án, không phải
   em bịa cho khó:
     · 61 dòng trải 6 ngày, ngày đông nhất có 21 dòng
     · tiền là CHUỖI: 30 dòng số nguyên, 30 dòng 2 chữ số lẻ, 1 dòng rỗng
     · pay: 36 «Thẻ ngân hàng» · 15 «Tiền mặt» · 9 «Zalo» · 1 để trống
     · location rỗng ở 39/61 · notes rỗng ở 20/61 · activity rỗng ở 2 dòng
     · KHÔNG dòng nào có `cat` — đúng như sổ cũ trước v10
   ============================================================ */

/* Bộ sinh số giả có hạt cố định — cùng đầu vào luôn ra cùng kết quả,
   để test không nhấp nháy. */
function boSinh (hat) {
  let s = hat
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

const NGAY = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06']
const VIEC = ['Quán ăn', 'Cà phê', 'Taxi', 'Vé tham quan', 'Chợ đêm', 'Tàu điện', 'Massage', 'Siêu thị']
const NOI = ['Quận 1', 'Bến tàu', 'Phố cổ', 'Trung tâm', 'Ga chính']

export function soMau () {
  const r = boSinh(20260812)

  /* 61 dòng: ngày thứ 3 gánh 21 dòng, năm ngày còn lại 8 dòng mỗi ngày */
  const soDongMoiNgay = [8, 8, 21, 8, 8, 8]
  const rows = []
  let i = 0
  soDongMoiNgay.forEach((n, iNgay) => {
    for (let k = 0; k < n; k++, i++) {
      /* 30 dòng nguyên · 30 dòng 2 chữ số lẻ · 1 dòng rỗng */
      let tripCost
      if (i === 60) tripCost = ''
      else if (i % 2 === 0) tripCost = String(50 + Math.floor(r() * 900))
      else tripCost = (50 + Math.floor(r() * 900)) + '.' + String(10 + Math.floor(r() * 89))

      /* 36 Thẻ · 15 Tiền mặt · 9 Zalo · 1 trống */
      let pay
      if (i === 59) pay = ''
      else if (i < 36) pay = 'Thẻ ngân hàng'
      else if (i < 51) pay = 'Tiền mặt'
      else pay = 'Zalo'

      rows.push({
        id: 'r' + String(i).padStart(2, '0'),
        date: NGAY[iNgay],
        activity: i < 59 ? VIEC[i % VIEC.length] + ' ' + (i + 1) : '',
        location: i < 22 ? NOI[i % NOI.length] : '',
        notes: i < 41 ? 'ghi chú ' + (i + 1) : '',
        tripCost,
        pay
        /* CỐ TÌNH không có `cat` — đúng như 61 dòng thật của sổ cũ */
      })
    }
  })

  const monAn = (ten, n, soTick, soGhiChu) =>
    Array.from({ length: n }, (_, k) => ({
      id: ten + k,
      name: ten + ' ' + (k + 1),
      note: k < soGhiChu ? 'ghi chú' : '',
      packed: k < soTick
    }))

  return {
    title: 'Chuyến mẫu',
    _updatedAt: 1786000000000,
    currency: 'THB',
    rate: 720,
    rows,
    cash: [{ id: 'c0', date: '2026-07-30', vnd: '7200000', fx: '10000', place: 'Tiệm vàng' }],
    bookings: [{ id: 'b0', name: 'Gói bay + khách sạn', vendor: 'Đại lý', date: '2026-07-01', cost: '480', note: '' }],
    bkCurrency: 'GBP',
    bkRate: 34000,
    hotel: { name: 'Khách sạn mẫu', address: '', checkin: '2026-08-01', checkout: '2026-08-06' },
    skincare: monAn('skincare', 12, 9, 2),
    makeup: monAn('makeup', 13, 13, 0),
    essentials: monAn('essentials', 13, 11, 0),
    activePack: 'skincare',
    packSeed1: true,
    packSeed2: true,
    shopping: [],
    places: [],
    food: monAn('food', 2, 2, 2),
    activeNote: 'shopping'
  }
}

/* Bọc trong vỏ backup y như file thật xuất ra. */
export function backupMau () {
  return {
    app: 'ke-hoach-du-lich',
    kind: 'backup',
    exportedAt: '2026-08-12T04:23:51.032Z',
    data: soMau()
  }
}
