import { ref } from 'vue'

/* ============================================================
   CHẾ ĐỘ SÁNG / TỐI — lựa chọn CỦA MÁY NÀY, không phải của sổ.

   Giống khoá AI (lib/ai.js): nằm trong localStorage dưới một khoá lưu
   TÁCH BIỆT với sổ chuyến đi.
     · KHÔNG nằm trong `kho` — kho được đồng bộ lên Supabase
     · KHÔNG lọt vào file backup JSON
   Mỗi máy tự nhớ sáng hay tối; đổi ở laptop không kéo điện thoại theo.

   Nút ở header xoay vòng Sáng → Tối → Theo máy. «Theo máy» là mặc định
   khi chưa bấm lần nào, và nghe theo cài đặt sáng/tối của hệ điều hành.

   ⚠️ app/index.html có một đoạn <script data-che-do> trong <head> lặp lại
   ĐÚNG khoá lưu và luật chọn dưới đây, để áp chế độ trước khi trang hiện
   (không chớp nền sáng). Đổi ở đây thì đổi cả ở đó — che-do.test.js chạy
   thật đoạn script ấy và so với cheDoThat để canh việc này.
   ============================================================ */
export const KHOA_CHE_DO = 'ke-hoach-du-lich-che-do'
export const CAC_CHE_DO = ['sang', 'toi', 'theo-may']
const TRUY_VAN_TOI = '(prefers-color-scheme: dark)'

export function docCheDo () {
  try {
    const c = window.localStorage.getItem(KHOA_CHE_DO)
    return CAC_CHE_DO.includes(c) ? c : 'theo-may'
  } catch (e) { return 'theo-may' }
}

/* ref để nút ở header tự cập nhật nhãn */
export const cheDo = ref(typeof window === 'undefined' ? 'theo-may' : docCheDo())

export function mayDangToi () {
  try { return !!window.matchMedia(TRUY_VAN_TOI).matches } catch (e) { return false }
}

/* Lựa chọn → màu thật đang áp: 'sang' | 'toi' */
export function cheDoThat (chon, mayToi = mayDangToi()) {
  if (chon === 'sang' || chon === 'toi') return chon
  return mayToi ? 'toi' : 'sang'
}

export function cheDoTiepTheo (chon) {
  return CAC_CHE_DO[(CAC_CHE_DO.indexOf(chon) + 1) % CAC_CHE_DO.length]
}

export function apCheDo (chon) {
  document.documentElement.setAttribute('data-che-do', cheDoThat(chon))
}

export function datCheDo (chon) {
  if (!CAC_CHE_DO.includes(chon)) return
  try { window.localStorage.setItem(KHOA_CHE_DO, chon) } catch (e) {}
  cheDo.value = chon
  apCheDo(chon)
}

/* Gọi một lần lúc app khởi động: áp lại cho chắc, và khi đang «theo máy»
   thì đổi màu ngay lúc người dùng đổi sáng/tối trong hệ điều hành. */
export function batDauCheDo () {
  apCheDo(cheDo.value)
  try {
    window.matchMedia(TRUY_VAN_TOI).addEventListener('change', () => {
      if (cheDo.value === 'theo-may') apCheDo('theo-may')
    })
  } catch (e) {}
}
