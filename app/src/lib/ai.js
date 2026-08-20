import { ref } from 'vue'
import { fmtVND, fmtFx, num } from './dinh-dang.js'
import { DANH_MUC, KENH_THANH_TOAN } from './kho.js'
import { tongChiPhiCaChuyen, coCauTheoDanhMuc, coCauTheoKenh, trungBinhMoiNgay, soVoiDuTru, tongDaDoi } from './tong-hop.js'
import { viTienMatConLai, rowTotal } from './xep-dong.js'
import { nhomTheoNgay, nhomCaoNhat } from './nhom-ngay.js'
import { doiSoKieuViet } from './tach-cau.js'

/* ============================================================
   TẦNG AI GỌI MẠNG — lô 11b, «cách c»: người dùng tự cầm chìa khoá.

   Khoá API nằm trong localStorage CỦA RIÊNG TỪNG MÁY, dưới một khoá lưu
   TÁCH BIỆT với sổ chuyến đi. Ba điều tuyệt đối:
     · KHÔNG nằm trong `kho` — kho được đồng bộ lên Supabase
     · KHÔNG lọt vào file backup JSON — backup chỉ xuất `kho`
     · KHÔNG bao giờ vào repo — nó chỉ sống trong trình duyệt
   Mất máy thì thu hồi khoá trên openrouter.ai/keys là xong.

   Và luật cũ không đổi: AI KHÔNG BAO GIỜ tự ghi vào sổ. Mọi kết quả đều
   đi qua bản xem trước cho người dùng sửa rồi mới xác nhận.
   ============================================================ */
export const KHOA_API = 'ke-hoach-du-lich-api-key'

const docKhoa = () => {
  try { return window.localStorage.getItem(KHOA_API) || '' } catch (e) { return '' }
}

/* ref để giao diện tự cập nhật khi dán/xoá khoá */
export const khoaAI = ref(typeof window === 'undefined' ? '' : docKhoa())

export function luuKhoaAI (k) {
  const s = String(k || '').trim()
  try { window.localStorage.setItem(KHOA_API, s) } catch (e) {}
  khoaAI.value = s
}
export function xoaKhoaAI () {
  try { window.localStorage.removeItem(KHOA_API) } catch (e) {}
  khoaAI.value = ''
}
export const coKhoaAI = () => !!khoaAI.value

/* ------------------------------------------------------------
   Gọi OpenRouter thẳng từ trình duyệt — v10.3 đổi nhà cung cấp theo
   yêu cầu chủ dự án (trước đó là Anthropic trực tiếp).
   - model: google/gemini-3.7-flash — nhẹ và rẻ, hợp hai việc nhỏ này
   - chuẩn OpenAI chat completions: Authorization Bearer, đọc choices[]
   - OpenRouter cho phép gọi từ trình duyệt; khoá là CỦA người dùng,
     nằm trên máy người dùng — vẫn đúng «cách c»
   ------------------------------------------------------------ */
export const MODEL_AI = 'google/gemini-3.7-flash'
const HAN_GOI = 60000

export async function goiAI (noiDung, { maxTokens = 8000 } = {}) {
  const khoa = khoaAI.value
  if (!khoa) throw new Error('Chưa có khoá API. Dán khoá ở khối ✦ trong tab Tổng kết.')

  const dungGio = new AbortController()
  const henGio = setTimeout(() => dungGio.abort(), HAN_GOI)
  let res
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: dungGio.signal,
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + khoa
      },
      body: JSON.stringify({
        model: MODEL_AI,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: noiDung }]
      })
    })
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('Chờ quá lâu không thấy trả lời — thử lại sau nhé.')
    throw new Error('Không nối được mạng. Tính năng ✦ cần có sóng; mọi thứ khác vẫn chạy offline.')
  } finally {
    clearTimeout(henGio)
  }

  if (!res.ok) throw new Error(await dichLoiOpenRouter(res))
  const data = await res.json()

  const luaChon = data.choices && data.choices[0]
  /* Bộ lọc nội dung có thể chặn — xem finish_reason trước khi đọc chữ */
  if (luaChon && luaChon.finish_reason === 'content_filter') {
    throw new Error('Model từ chối trả lời câu này. Thử diễn đạt khác, hoặc làm tay.')
  }
  const chu = ((luaChon && luaChon.message && luaChon.message.content) || '').trim()
  if (!chu) throw new Error('AI trả về rỗng — thử lại nhé.')
  return chu
}

/* OpenRouter hay kèm lời giải thích trong thân lỗi — đọc được thì đưa luôn
   cho người dùng, đỡ phải đoán. */
async function dichLoiOpenRouter (res) {
  let them = ''
  try {
    const t = await res.json()
    if (t && t.error && t.error.message) them = ' (' + t.error.message + ')'
  } catch (e) { /* thân không phải JSON thì thôi */ }
  return dichLoiHTTP(res.status) + them
}

export function dichLoiHTTP (status) {
  if (status === 401) {
    return 'Khoá API không đúng hoặc đã bị thu hồi. Kiểm tra lại ở openrouter.ai/keys rồi dán lại.'
  }
  if (status === 402) {
    return 'Tài khoản OpenRouter hết credit. Nạp thêm ở openrouter.ai/credits rồi thử lại.'
  }
  if (status === 429) {
    return 'Gọi hơi dày, đụng giới hạn. Đợi một phút rồi thử lại.'
  }
  if (status === 400) {
    return 'Yêu cầu không hợp lệ — có thể nội dung quá dài. Thử rút gọn.'
  }
  if (status >= 500) {
    return 'Máy chủ OpenRouter đang trục trặc. Thử lại sau ít phút.'
  }
  return 'Không gọi được AI (mã ' + status + ').'
}

/* Đọc JSON ra khỏi câu trả lời — cùng chiêu với docTyGiaTuTraLoi của v9.6:
   gỡ rào ```json rồi bắt cặp ngoặc nhọn đầu tiên. */
export function docJSON (chu) {
  const sach = String(chu || '').replace(/```json|```/g, '').trim()
  const khop = sach.match(/\{[\s\S]*?\}/)
  return JSON.parse(khop ? khop[0] : sach)
}

/* ------------------------------------------------------------
   SỐ LIỆU CHUYẾN ĐI — nguyên liệu chung cho cả bản viết tay lẫn AI.
   Chỉ gửi đi các CON SỐ TỔNG HỢP và tên khoản chi lớn nhất — không gửi
   nguyên cả sổ.
   ------------------------------------------------------------ */
export function soLieuChuyen (state) {
  const tong = tongChiPhiCaChuyen(state)
  const cacNgay = nhomTheoNgay(state.rows, { chiDongCoTien: true })
  const keyDinh = nhomCaoNhat(cacNgay)
  const ngayDinh = cacNgay.find((g) => g.key === keyDinh) || null
  let khoanLonNhat = null
  if (ngayDinh) {
    for (const r of ngayDinh.dong) {
      const t = rowTotal(r)
      if (!khoanLonNhat || t > khoanLonNhat.tienFx) {
        khoanLonNhat = { ten: r.activity || 'không tên', tienFx: t }
      }
    }
  }
  const dm = coCauTheoDanhMuc(state).ds
  const kenh = coCauTheoKenh(state).ds
  return {
    title: state.title,
    currency: state.currency,
    soKhoan: state.rows.filter((r) => rowTotal(r) > 0).length,
    tongVnd: tong.tong,
    thieuTyGia: tong.thieuTyGia,
    tb: trungBinhMoiNgay(state),
    ngayDinh: ngayDinh ? { nhan: ngayDinh.nhan, tongFx: ngayDinh.tong } : null,
    khoanLonNhat,
    danhMucDau: dm.length ? { ten: dm[0].ten, phanTram: Math.round(dm[0].phanTram) } : null,
    kenhDau: kenh.length ? { ten: kenh[0].ten, tienFx: kenh[0].tien } : null,
    viConFx: viTienMatConLai(state.rows, tongDaDoi(state)),
    duTru: soVoiDuTru(state)
  }
}

/* ------------------------------------------------------------
   BẢN NHÁP KHÔNG CẦN AI — đường làm tay, chạy offline, 0 đồng.
   Câu chữ dựng từ đúng các con số thật, không bịa.
   ------------------------------------------------------------ */
export function banNhapNoiBo (state) {
  const s = soLieuChuyen(state)
  if (!s.soKhoan) return 'Chuyến đi chưa có khoản chi nào có số tiền — chưa có gì để tổng kết.'

  const cau = []
  const ngay = s.tb ? `${s.tb.songay} ngày ` : ''
  cau.push(`Chuyến ${s.title} ${ngay}khép lại với ${s.soKhoan} khoản chi, tổng cộng ${fmtVND(s.tongVnd)}.`)
  if (s.duTru) {
    cau.push(s.duTru.chenh > 0
      ? `So với dự trù, chuyến này vượt ${s.duTru.phanTram.toFixed(1)}%.`
      : `So với dự trù, chuyến này tiết kiệm được ${Math.abs(s.duTru.phanTram).toFixed(1)}%.`)
  }
  if (s.ngayDinh) {
    let c = `Ngày tiêu nhiều nhất là ${s.ngayDinh.nhan} với ${fmtFx(s.ngayDinh.tongFx)} ${s.currency}`
    if (s.khoanLonNhat) c += `, khoản lớn nhất hôm đó là ${s.khoanLonNhat.ten} (${fmtFx(s.khoanLonNhat.tienFx)} ${s.currency})`
    cau.push(c + '.')
  }
  if (s.danhMucDau) cau.push(`${s.danhMucDau.ten} chiếm tỷ trọng cao nhất: ${s.danhMucDau.phanTram}%.`)
  cau.push(`Ví tiền mặt còn lại ${fmtFx(s.viConFx)} ${s.currency}.`)
  return cau.join(' ')
}

/* ------------------------------------------------------------
   ✦ AI KỂ CHUYỆN — gửi số liệu tổng hợp, nhận về MỘT đoạn văn.
   ------------------------------------------------------------ */
export async function keChuyenBangAI (state) {
  const s = soLieuChuyen(state)
  if (!s.soKhoan) return banNhapNoiBo(state)

  const dong = [
    `Tên chuyến: ${s.title}`,
    `Số khoản chi: ${s.soKhoan}`,
    `Tổng chi phí: ${fmtVND(s.tongVnd)}`,
    s.tb ? `Số ngày: ${s.tb.songay} · trung bình mỗi ngày: ${fmtVND(s.tb.moiNgay)}` : null,
    s.ngayDinh ? `Ngày tiêu nhiều nhất: ${s.ngayDinh.nhan} (${fmtFx(s.ngayDinh.tongFx)} ${s.currency})` : null,
    s.khoanLonNhat ? `Khoản lớn nhất ngày đó: ${s.khoanLonNhat.ten} (${fmtFx(s.khoanLonNhat.tienFx)} ${s.currency})` : null,
    s.danhMucDau ? `Danh mục lớn nhất: ${s.danhMucDau.ten} (${s.danhMucDau.phanTram}%)` : null,
    s.kenhDau ? `Kênh trả nhiều nhất: ${s.kenhDau.ten} (${fmtFx(s.kenhDau.tienFx)} ${s.currency})` : null,
    `Ví tiền mặt còn lại: ${fmtFx(s.viConFx)} ${s.currency}`,
    s.duTru ? `So dự trù ${fmtVND(s.duTru.duTru)}: chênh ${s.duTru.phanTram.toFixed(1)}%` : null
  ].filter(Boolean).join('\n')

  const deBai =
    'Viết MỘT đoạn văn tiếng Việt (khoảng 100–150 chữ) tổng kết chuyến đi từ các số liệu dưới đây, ' +
    'giọng ấm áp như kể lại cho chính người vừa đi về. LUẬT: chỉ dùng đúng các con số cho sẵn, ' +
    'không bịa thêm số hay sự kiện nào; không tiêu đề, không gạch đầu dòng, không markdown; ' +
    'trả lời chỉ gồm đoạn văn.\n\n' + dong

  return goiAI(deBai, { maxTokens: 8000 })
}

/* ------------------------------------------------------------
   ✦ TÁCH CÂU KHÓ — cho câu mà bộ tách offline chịu thua.
   Trả về ĐÚNG hình dạng bản xem trước của tachCau, để đổ vào cùng một
   luồng xem-trước-rồi-xác-nhận. Trường nào AI đoán không chắc thì phải
   trống, không nhét bừa — cùng luật với bộ tách offline.
   ------------------------------------------------------------ */
export async function tachCauBangAI (cau) {
  const dsKenh = KENH_THANH_TOAN.join(' | ')
  const dsDM = DANH_MUC.map((d) => d.ma).join(' | ')
  const deBai =
    'Tách câu ghi chi tiêu tiếng Việt sau thành JSON. Trả về CHỈ MỘT object JSON trần, ' +
    'không rào code, không giải thích: {"activity": string, "tripCost": string, "pay": string, "cat": string}. ' +
    'LUẬT: tripCost là chuỗi số dùng DẤU CHẤM làm thập phân (ví dụ "236.17"), không phân cách nghìn; ' +
    `pay phải là một trong [${dsKenh}] hoặc chuỗi rỗng nếu câu không nói; ` +
    `cat phải là một trong [${dsDM}] hoặc chuỗi rỗng nếu không chắc; ` +
    'activity là tên hoạt động đã bỏ số tiền và tên kênh thanh toán, viết hoa chữ đầu. ' +
    'Không chắc trường nào thì để trường đó rỗng, tuyệt đối không đoán bừa.\n\nCâu: ' + cau

  const chu = await goiAI(deBai, { maxTokens: 2000 })
  let tho
  try { tho = docJSON(chu) } catch (e) {
    throw new Error('AI trả lời không đọc được — thử lại hoặc ghi tay.')
  }

  /* Kiểm từng trường — AI cũng không được vượt rào */
  const pay = KENH_THANH_TOAN.includes(tho.pay) ? tho.pay : ''
  const cat = DANH_MUC.some((d) => d.ma === tho.cat) ? tho.cat : ''
  let tripCost = ''
  if (tho.tripCost !== undefined && tho.tripCost !== null && String(tho.tripCost).trim() !== '') {
    const so = doiSoKieuViet(String(tho.tripCost))
    if (isFinite(parseFloat(so)) && parseFloat(so) > 0) tripCost = so
  }
  const activity = typeof tho.activity === 'string' ? tho.activity.trim() : ''

  const doc = []
  if (tripCost) doc.push('số tiền')
  if (pay) doc.push('nguồn tiền')
  if (cat) doc.push('danh mục')
  return { activity, tripCost, pay, cat, doc }
}
