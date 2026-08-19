import { ref } from 'vue'
import { kho, applyData } from './kho.js'
import { docTuMay, ghiXuongMay, khoCoSan } from './luu-tru.js'
import { danhDauDaDocXong, coDuocGhiChua, ghiLenMayChu, hoaGiaiVoiMayChu } from './dong-bo.js'
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_CDN } from './cau-hinh.js'

/* ============================================================
   TRÌNH TỰ KHỞI ĐỘNG — nơi luật «đọc trước, ghi sau» được thi hành.

   Nghi thức mục 03: chỉ có ĐÚNG MỘT kịch bản thật sự xoá được dữ liệu —
   app khởi động, chưa kịp đọc sổ cũ, dựng một sổ trắng rồi tự lưu đè.

   Trình tự bắt buộc, không được đảo:
     1. Đọc bản offline trên máy  ← xong bước này mới mở cổng ghi
     2. Mở cổng ghi
     3. (nếu có đăng nhập) hoà giải với máy chủ
   Trước bước 2, MỌI lệnh ghi đều bị ghiLenMayChu ném lỗi.
   ============================================================ */

export const trangThai = ref('dang-doc')   // dang-doc | san-sang | loi
export const nguoiDung = ref(null)
export const dongBoOk = ref(false)
export const loiKhoiDong = ref('')

let sb = null

export async function khoiDong () {
  try {
    /* BƯỚC 1 — đọc bản trên máy TRƯỚC. */
    const tuMay = await docTuMay()
    if (tuMay) applyData(tuMay, kho)

    /* BƯỚC 2 — đọc xong mới mở cổng ghi. */
    danhDauDaDocXong()
    trangThai.value = 'san-sang'
  } catch (e) {
    /* Đọc hỏng thì KHÔNG mở cổng ghi. Thà hiện «đang tải» mãi còn hơn
       ghi đè một trang trắng lên sổ thật. */
    loiKhoiDong.value = String(e && e.message ? e.message : e)
    trangThai.value = 'loi'
    return
  }

  /* BƯỚC 3 — nối máy chủ, nhưng chỉ khi người dùng đã đăng nhập từ trước.
     Không tự đăng nhập, không tự tạo tài khoản. */
  try {
    await napThuVien()
    if (!sb) return
    const { data } = await sb.auth.getSession()
    if (data && data.session && data.session.user) {
      nguoiDung.value = data.session.user
      await keoVeTuMayChu()
    }
  } catch (e) {
    /* Mạng hỏng không phải lý do để chặn app — bản offline vẫn dùng được. */
    dongBoOk.value = false
  }
}

/* Có HẸN GIỜ, và đây không phải chuyện nhỏ: nếu mạng chặn CDN một cách
   im lặng (không trả lỗi, chỉ treo), thì `onload` lẫn `onerror` đều không
   bao giờ nổ và lời hứa này treo vĩnh viễn. App offline-first tuyệt đối
   không được đợi CDN vô hạn — quá hẹn thì bỏ, chạy tiếp bằng bản trên máy.
   Đã dính thật lúc viết test: khởi động treo đúng kiểu đó. */
let hanNap = 8000
/* Chỉ dùng trong bài kiểm, để khỏi phải ngồi đợi tám giây thật. */
export function datHanNap (ms) { hanNap = ms }

function napThuVien () {
  return new Promise((xong) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return xong(null)
    if (window.supabase) { taoClient(); return xong(sb) }

    let daXong = false
    const chot = () => { if (!daXong) { daXong = true; taoClient(); xong(sb) } }
    const dongHo = setTimeout(chot, hanNap)

    const t = document.createElement('script')
    t.src = SUPABASE_CDN
    t.onload = () => { clearTimeout(dongHo); chot() }
    t.onerror = () => { clearTimeout(dongHo); chot() }
    document.head.appendChild(t)
  })
}

function taoClient () {
  if (sb || !window.supabase) return
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
}

export async function keoVeTuMayChu () {
  if (!sb || !nguoiDung.value) return
  const kq = await hoaGiaiVoiMayChu(sb, nguoiDung.value, kho, {
    apDung: (d) => applyData(d, kho),
    ghiXuong: () => ghiXuongMay(kho)
  })
  dongBoOk.value = true
  return kq
}

/* ---------------- Lưu có hoãn ---------------- */
let hen = null
export function henLuu (ms = 500) {
  if (hen) clearTimeout(hen)
  hen = setTimeout(luuNgay, ms)
}

export async function luuNgay () {
  if (!coDuocGhiChua()) return { viec: 'chua-doc-xong' }
  kho._updatedAt = Date.now()
  let loiMay = false
  try { await ghiXuongMay(kho) } catch (e) { loiMay = true }

  if (sb && nguoiDung.value) {
    try { await ghiLenMayChu(sb, nguoiDung.value, kho); dongBoOk.value = true }
    catch (e) { dongBoOk.value = false }
  }
  return { viec: loiMay ? 'loi-may' : 'da-luu' }
}

/* ---------------- Đăng nhập ---------------- */
export async function dangNhap (email, matKhau) {
  await napThuVien()
  if (!sb) throw new Error('chưa nối được máy chủ')
  const { data, error } = await sb.auth.signInWithPassword({ email, password: matKhau })
  if (error) throw error
  nguoiDung.value = data.user
  await keoVeTuMayChu()
  return data.user
}

export async function dangXuat () {
  if (sb) await sb.auth.signOut()
  nguoiDung.value = null
  dongBoOk.value = false
}

export function chuTrangThaiLuu () {
  if (!khoCoSan()) return 'Lưu tạm trong phiên này'
  if (nguoiDung.value) return dongBoOk.value ? 'Đã đồng bộ tài khoản' : 'Đã lưu trên máy, chưa đồng bộ được'
  return 'Đã lưu tự động'
}
