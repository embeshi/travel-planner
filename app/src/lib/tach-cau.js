import { DANH_MUC, KENH_THANH_TOAN } from './kho.js'

/* ============================================================
   BỘ TÁCH CÂU CHẠY OFFLINE — luồng F2 (PRD mục 04).

   «bolt về khách sạn 120 baht tiền mặt»
      → { activity: 'Bolt về khách sạn', tripCost: '120',
          pay: 'Tiền mặt', cat: '🚕 Di chuyển' }

   Ba luật, cả ba đều là luật an toàn chứ không phải tiện nghi:

   1. HOÀN TOÀN OFFLINE. Không gọi mạng, không cần khoá API. Mất sóng giữa
      chợ vẫn ghi được — đó là cả lý do luồng này tồn tại.

   2. KHÔNG BAO GIỜ TỰ GHI. Hàm này chỉ TRẢ VỀ bản đọc được; màn hình phải
      hiện bản xem trước bốn ô để người dùng sửa rồi mới ghi. PRD mục 05:
      «không tự ghi dữ liệu từ AI khi chưa xác nhận».

   3. ĐOÁN SAI THÌ IM LẶNG. Không đoán được danh mục thì để trống, KHÔNG
      nhét bừa «Khác» — dòng để trống thì người dùng còn biết mà sửa, dòng
      bị điền bừa thì trôi qua mắt.
   ============================================================ */

/* Từ khoá đoán danh mục. Cố tình ngắn và cụ thể — thà bỏ sót còn hơn đoán
   bừa. Bỏ sót thì ô trống, người dùng thấy ngay; đoán bừa thì lọt lưới. */
const TU_KHOA_DANH_MUC = [
  ['🚕 Di chuyển', ['grab', 'bolt', 'taxi', 'xe ôm', 'tàu điện', 'bts', 'mrt', 'tuk tuk',
    'tuktuk', 'xe buýt', 'buýt', 'vé xe', 'tàu', 'phà', 'thuê xe', 'xăng']],
  ['🍜 Ăn uống', ['ăn', 'quán', 'cơm', 'phở', 'bún', 'mì', 'cà phê', 'cafe', 'trà',
    'nước', 'bia', 'nhà hàng', 'buffet', 'lẩu', 'nướng', 'kem', 'bánh', 'chè', 'sữa']],
  ['🎟 Vé', ['vé', 'tham quan', 'bảo tàng', 'chùa', 'đền', 'cung điện', 'công viên',
    'show', 'massage', 'spa', 'tour']],
  ['🛍 Mua sắm', ['mua', 'chợ', 'siêu thị', 'quà', 'áo', 'quần', 'giày', 'túi',
    'mỹ phẩm', '7-eleven', 'cửa hàng']],
  ['🏨 Lưu trú', ['khách sạn', 'hotel', 'homestay', 'hostel', 'phòng', 'airbnb']]
]

/* Cách gọi khác của bốn kênh thanh toán. Chuỗi TRẢ VỀ phải đúng nguyên văn
   danh sách của v9.6 — dữ liệu thật đang dùng đúng những chuỗi đó. */
const CACH_GOI_KENH = [
  ['Tiền mặt', ['tiền mặt', 'tienmat', 'cash', 'mặt']],
  ['Momo', ['momo']],
  ['Zalo', ['zalo', 'zalopay']],
  ['Thẻ ngân hàng', ['thẻ', 'the ngan hang', 'card', 'visa', 'master', 'quẹt thẻ', 'ngân hàng']]
]

const DON_VI = ['baht', 'bath', 'thb', '฿', 'k', 'nghìn', 'ngàn', 'đồng', 'vnd', 'đ',
  'usd', 'gbp', 'yen', 'won']



export function tachCau (cau) {
  const goc = String(cau || '').trim()
  if (!goc) return { activity: '', tripCost: '', pay: '', cat: '', doc: [] }

  const thuong = goc.toLowerCase()
  const doc = []            /* đọc được những gì — để giải thích cho người dùng */

  /* --- Số tiền: lấy số ĐỨNG RIÊNG, dài nhất --- */
  let tripCost = ''
  let khucSo = null
  /* Hậu tố nghìn phải nằm TRONG biểu thức. Để nó ngoài thì «350k» không
     khớp được — chữ «k» dính ngay sau số làm lookahead từ chối cả cụm,
     và người dùng mất trắng con số. Đã dính thật lúc thử. */
  const cacSo = [...thuong.matchAll(/(?<![\w.,])(\d+(?:[.,]\d+)?)\s?(k|nghìn|ngàn)?(?![\p{L}\d])/gu)]
  if (cacSo.length) {
    const chon = cacSo.reduce((a, b) => (b[1].length >= a[1].length ? b : a))
    let so = doiSoKieuViet(chon[1])
    if (chon[2]) so = String(Math.round(parseFloat(so) * 1000))
    tripCost = so
    khucSo = { tu: chon.index, den: chon.index + chon[0].length }
    doc.push('số tiền')
  }

  /* --- Kênh thanh toán --- */
  let pay = ''
  let khucKenh = null
  for (const [chuan, cach] of CACH_GOI_KENH) {
    for (const c of cach) {
      const i = thuong.indexOf(c)
      if (i >= 0) { pay = chuan; khucKenh = { tu: i, den: i + c.length }; break }
    }
    if (pay) break
  }
  if (pay) doc.push('nguồn tiền')

  /* --- Danh mục: đoán, và im lặng khi không chắc --- */
  let cat = ''
  for (const [ma, tu] of TU_KHOA_DANH_MUC) {
    if (tu.some((t) => thuong.includes(t))) { cat = ma; break }
  }
  if (cat) doc.push('danh mục')

  /* --- Tên hoạt động: bỏ khúc số, khúc kênh, và đơn vị tiền --- */
  let ten = goc
  const cacKhuc = [khucSo, khucKenh].filter(Boolean).sort((a, b) => b.tu - a.tu)
  for (const k of cacKhuc) ten = ten.slice(0, k.tu) + ' ' + ten.slice(k.den)
  const boDonVi = new RegExp('\\b(' + DON_VI.map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi')
  ten = ten.replace(boDonVi, ' ').replace(/\s+/g, ' ').trim()
  ten = ten.replace(/^[-–—,.:;]+|[-–—,.:;]+$/g, '').trim()
  if (ten) ten = ten[0].toUpperCase() + ten.slice(1)

  return { activity: ten, tripCost, pay, cat, doc }
}

/* ============================================================
   ĐỔI SỐ NGƯỜI VIỆT GÕ SANG SỐ MÁY HIỂU.

   Người Việt gõ «1.200» là một nghìn hai, «45,5» là bốn mươi lăm phẩy năm.
   Dữ liệu thì lưu dấu chấm làm dấu thập phân. Đọc thẳng «1.200» bằng
   parseFloat ra 1,2 — SAI GẤP MỘT NGHÌN LẦN, mà lại không có dấu hiệu gì
   trên màn hình. Đây là loại lỗi tệ nhất trong app tiền bạc.

   Luật:
     · dấu phẩy → luôn là dấu thập phân
     · dấu chấm + đúng BA chữ số → phân cách nghìn, bỏ đi
     · dấu chấm + một hoặc hai chữ số → dấu thập phân, giữ lại
   ============================================================ */
export function doiSoKieuViet (thoS) {
  let s = String(thoS).trim()
  if (s.includes(',')) return s.replace(/\./g, '').replace(',', '.')
  /* 1.200 · 1.200.000 → bỏ chấm; 45.5 · 45.50 → giữ */
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return s.replace(/\./g, '')
  return s
}

/* Bản xem trước có đủ để ghi chưa. Thiếu số tiền thì chưa. */
export function duDeGhi (ban) {
  return !!(ban && ban.tripCost && parseFloat(ban.tripCost) > 0)
}
