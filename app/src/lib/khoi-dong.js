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
    /* Đã có client (kể cả client giả trong bài kiểm) thì khỏi nạp lại. */
    if (sb) return xong(sb)
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

/* ============================================================
   ĐĂNG KÝ TÀI KHOẢN MỚI — bê từ signUpPassword() của index.html v9.6
   (dòng 3027–3059).

   Đây là cái cửa làm cho «thử bằng tài khoản phụ» khả thi: không có nó,
   cách duy nhất để thử luồng đồng bộ là đăng nhập tài khoản THẬT — đúng
   con đường luật 7 cấm.

   Giữ bộ câu báo lỗi có hướng dẫn cụ thể của v9.6 — chúng được viết từ
   đúng những trục trặc hay gặp trên bảng điều khiển Supabase.
   ============================================================ */
export async function dangKy (email, matKhau) {
  await napThuVien()
  if (!sb) throw new Error('Chưa nối được máy chủ — kiểm tra mạng rồi thử lại.')

  let res
  try {
    res = await sb.auth.signUp({ email, password: matKhau })
    if (res.error) throw res.error
  } catch (e) {
    throw new Error(dichLoiDangKy(e))
  }

  if (res.data && res.data.session) {
    nguoiDung.value = res.data.user
    await keoVeTuMayChu()
    return { xong: true, chu: 'Tạo tài khoản xong, đã đăng nhập luôn.' }
  }
  /* Supabase đang bật «Confirm email»: tài khoản có rồi nhưng chưa vào được. */
  return {
    xong: false,
    chu: 'Tài khoản đã tạo nhưng Supabase đang bật «Confirm email» nên còn chờ ' +
         'xác nhận. Mở hộp thư bấm link xác nhận (hoặc vào dashboard → ' +
         'Authentication → Sign In / Up tắt «Confirm email»), rồi quay lại đăng nhập.'
  }
}

export function dichLoiDangKy (e) {
  const m = (e && e.message) ? String(e.message) : ''
  if (/already registered|already exists/i.test(m)) {
    return 'Email này đã có tài khoản (có thể từ lần thử trước). Bấm «Lên máy bay» ' +
           'để đăng nhập; nếu báo sai mật khẩu, vào dashboard → Authentication → ' +
           'Users, xoá user này rồi tạo lại.'
  }
  if (/rate ?limit/i.test(m)) {
    return 'Đụng giới hạn thao tác, đợi một lát rồi thử lại nhé.'
  }
  if (/signups? not allowed|disabled/i.test(m)) {
    return 'Supabase đang tắt đăng ký: vào Authentication → Sign In / Up, bật ' +
           '«Allow new users to sign up» rồi thử lại.'
  }
  if (/password/i.test(m)) {
    return 'Mật khẩu chưa đạt yêu cầu của Supabase: «' + m + '».'
  }
  return 'Không tạo được tài khoản. Supabase báo: «' + (m || 'không rõ') + '».'
}

/* CHỈ DÙNG TRONG BÀI KIỂM — tiêm máy chủ giả để thử luồng tài khoản mà
   không chạm mạng. Mã chạy thật không bao giờ gọi hàm này. */
export function datClientThu (sbGia) { sb = sbGia }

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
