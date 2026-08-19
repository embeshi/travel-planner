import { reactive } from 'vue'
import { num, uid } from './dinh-dang.js'

/* ============================================================
   KHO DỮ LIỆU — hình dạng sổ, bê nguyên từ index.html v9.6.

   Tên mọi khối và mọi cột ở đây phải khớp TỪNG CHỮ với v9.6.
   Đây là điều kiện số 3 trong «bốn thứ giữ cho dữ liệu cũ tự hiện ra»
   (CLAUDE.md). Đổi một tên là sổ cũ còn nguyên nhưng app đọc không ra.

   Đã đối chiếu với file backup thật ngày 12/08/2026: khớp 100%,
   không thiếu khoá nào, không thừa khoá nào.

   TIỀN LÀ CHUỖI, không phải số — tripCost, cost, vnd, fx.
   Luôn đi qua num() trước khi tính.
   ============================================================ */

export function khoMacDinh () {
  return {
    title: 'Chuyến đi của mình',
    _updatedAt: 0,
    currency: 'THB',
    rate: null,
    rows: [],
    cash: [],
    bookings: [],
    bkCurrency: 'GBP',
    bkRate: null,
    hotel: { name: '', address: '', checkin: '', checkout: '' },
    skincare: [],
    makeup: [],
    essentials: [],
    activePack: 'skincare',
    packSeed1: false,
    packSeed2: false,
    shopping: [],
    places: [],
    food: [],
    activeNote: 'shopping'
  }
}

export const kho = reactive(khoMacDinh())

/* ---------------- Dựng dòng mới ---------------- */

/* `cat` là trường DUY NHẤT v10 thêm vào. Nó phải là tùy chọn:
   dòng cũ không có thì hiện «Chưa phân loại», không bắt nhập,
   không tự điền bừa (nghi thức mục 02, điều ③). */
export function dongMoi () {
  return {
    id: uid(), activity: '', date: '', location: '', notes: '',
    tripCost: '', pay: '', cat: '', done: false
  }
}

/* `done` là trường tùy chọn THỨ HAI của v10 (màn Hôm nay tick được từng việc).
   Cùng luật với `cat`: dòng cũ không có thì coi như chưa xong, không tự
   điền bừa, và v9.6 đọc rồi lưu lại vẫn giữ nguyên — đã kiểm. */
export function daXong (row) { return !!(row && row.done) }
export function dongTienMatMoi () {
  return { id: uid(), date: '', vnd: '', fx: '', place: '' }
}
export function dongGoiBayMoi (name = '') {
  return { id: uid(), name, vendor: '', date: '', cost: '', note: '' }
}
export function monMoi (name = '') {
  return { id: uid(), name, note: '', packed: false }
}

export const CHUA_PHAN_LOAI = 'Chưa phân loại'
export function danhMucCua (row) {
  const c = (row && row.cat) || ''
  return c.trim() ? c : CHUA_PHAN_LOAI
}

/* ============================================================
   applyData — bê NGUYÊN VĂN từ index.html v9.6 (dòng 1563–1609).

   Hai phép nâng cấp dữ liệu cũ nằm sẵn trong đây, đừng gỡ:
   1. `preCost` của bản rất cũ được cộng dồn vào `tripCost` rồi xoá.
   2. `bookings` bỏ dòng trống, và dòng cũ chỉ có `type` thì đặt tên
      «Vé máy bay» / «Khách sạn».

   Hàm này CỐ TÌNH dễ dãi: mọi trường đều kiểm kiểu rồi mới nhận,
   sai kiểu thì rơi về mặc định. Sổ méo cũng phải mở được, không được
   ném lỗi rồi bỏ người dùng với màn hình trắng.

   Lưu ý: các dòng được trả về NGUYÊN OBJECT, nên trường lạ (cat, done)
   đi qua đây vẫn còn. Đã kiểm: v9.6 cũng vậy — nên đường lui 60 giây
   không làm mất trường mới của v10.
   ============================================================ */
export function applyData (data, dich = kho) {
  if (!data || typeof data !== 'object') return dich

  dich.title = typeof data.title === 'string' ? data.title : dich.title
  dich.currency = typeof data.currency === 'string' ? data.currency : dich.currency
  dich.rate = (typeof data.rate === 'number' && isFinite(data.rate)) ? data.rate : null

  dich.rows = (Array.isArray(data.rows) ? data.rows : []).map((r) => {
    if (r && num(r.preCost) > 0) {
      r.tripCost = String(num(r.tripCost) + num(r.preCost))
    }
    if (r) delete r.preCost
    return r
  })

  dich.cash = Array.isArray(data.cash) ? data.cash : []

  dich.bookings = (Array.isArray(data.bookings) ? data.bookings : []).map((r) => {
    if (!r) return null
    const hasData = !!(r.name || r.vendor || r.date || r.cost || r.note)
    if (!hasData) return null /* bỏ các dòng trống từ phiên bản cũ */
    let name = r.name || ''
    if (!name && r.type === 'flight') name = 'Vé máy bay'
    if (!name && r.type === 'hotel') name = 'Khách sạn'
    return {
      id: r.id || uid(),
      name,
      vendor: r.vendor || '',
      date: r.date || '',
      cost: r.cost || '',
      note: r.note || ''
    }
  }).filter(Boolean)

  dich.bkCurrency = typeof data.bkCurrency === 'string' ? data.bkCurrency : dich.bkCurrency
  dich.bkRate = (typeof data.bkRate === 'number' && isFinite(data.bkRate)) ? data.bkRate : null

  if (data.hotel && typeof data.hotel === 'object') {
    dich.hotel.name = typeof data.hotel.name === 'string' ? data.hotel.name : ''
    dich.hotel.address = typeof data.hotel.address === 'string' ? data.hotel.address : ''
    dich.hotel.checkin = typeof data.hotel.checkin === 'string' ? data.hotel.checkin : ''
    dich.hotel.checkout = typeof data.hotel.checkout === 'string' ? data.hotel.checkout : ''
  }

  dich.skincare = Array.isArray(data.skincare) ? data.skincare : []
  dich.makeup = Array.isArray(data.makeup) ? data.makeup : []
  dich.essentials = Array.isArray(data.essentials) ? data.essentials : []
  dich.activePack = (typeof data.activePack === 'string') ? data.activePack : 'skincare'
  dich.packSeed1 = !!data.packSeed1
  dich.packSeed2 = !!data.packSeed2
  dich.shopping = Array.isArray(data.shopping) ? data.shopping : []
  dich.places = Array.isArray(data.places) ? data.places : []
  dich.food = Array.isArray(data.food) ? data.food : []
  dich.activeNote = (typeof data.activeNote === 'string') ? data.activeNote : 'shopping'
  dich._updatedAt = (typeof data._updatedAt === 'number') ? data._updatedAt : 0

  return dich
}

/* Đọc một file backup (đã JSON.parse) — vỏ ngoài có dạng
   { app, kind, exportedAt, data }. Trả về phần ruột. */
export function ruotCuaBackup (obj) {
  if (obj && typeof obj === 'object' && obj.data && typeof obj.data === 'object') return obj.data
  return obj
}

/* Sáu danh mục của v10 (PRD mục 03B). Thứ tự này là thứ tự chip xoay vòng
   khi bấm, nên đừng xáo — người dùng nhớ vị trí bằng cơ bắp ngón tay. */
export const DANH_MUC = [
  { ma: '🍜 Ăn uống', bt: '🍜', ten: 'Ăn uống' },
  { ma: '🚕 Di chuyển', bt: '🚕', ten: 'Di chuyển' },
  { ma: '🎟 Vé', bt: '🎟', ten: 'Vé' },
  { ma: '🛍 Mua sắm', bt: '🛍', ten: 'Mua sắm' },
  { ma: '🏨 Lưu trú', bt: '🏨', ten: 'Lưu trú' },
  { ma: '📦 Khác', bt: '📦', ten: 'Khác' }
]

/* Bấm chip để xoay vòng danh mục (PRD luồng F3). Vòng cuối quay về rỗng,
   để người dùng bỏ phân loại được — không có ngõ cụt. */
export function danhMucKeTiep (hienTai) {
  const i = DANH_MUC.findIndex((d) => d.ma === hienTai)
  if (i === -1) return DANH_MUC[0].ma
  if (i === DANH_MUC.length - 1) return ''
  return DANH_MUC[i + 1].ma
}

/* Bốn kênh thanh toán — bê nguyên danh sách của v9.6, KHÔNG đổi chữ.
   Dữ liệu thật đang dùng đúng những chuỗi này; đổi một chữ là 61 dòng cũ
   rơi khỏi phép đối chiếu ví tiền mặt. */
export const KENH_THANH_TOAN = ['Tiền mặt', 'Momo', 'Zalo', 'Thẻ ngân hàng', 'Khác']
