/* ============================================================
   BẢN OFFLINE TRÊN MÁY — bê từ index.html v9.6 (dòng 1516–1560).

   ⚠️ KHOÁ LƯU LÀ THỨ KHÔNG ĐƯỢC ĐỔI ⚠️
   `ke-hoach-du-lich-v1` là điều kiện số 2 trong «bốn thứ giữ cho dữ liệu
   cũ tự hiện ra trong v10» (CLAUDE.md luật 2b). Đổi một ký tự — kể cả đổi
   thành `-v10` cho hợp phiên bản — là bản offline trên máy chủ dự án
   thành VÔ HÌNH: app mở ra trắng trơn dù dữ liệu vẫn nằm nguyên đó.
   Đây không phải chỗ để dọn dẹp cho gọn.
   ============================================================ */
export const STORAGE_KEY = 'ke-hoach-du-lich-v1'

/* v9.6 ưu tiên bộ nhớ của Claude khi app chạy trong claude.ai, không có
   thì dùng localStorage. Giữ nguyên thứ tự đó. */
const coKhoClaude = () => typeof window !== 'undefined' &&
  typeof window.storage !== 'undefined' && !!window.storage

function coLocalStorage () {
  try {
    const t = '__khdl_test__'
    window.localStorage.setItem(t, '1')
    window.localStorage.removeItem(t)
    return true
  } catch (e) { return false }
}

export function khoCoSan () {
  if (typeof window === 'undefined') return false
  return coKhoClaude() || coLocalStorage()
}

export async function ghiXuongMay (state) {
  if (!khoCoSan()) return
  const json = JSON.stringify(state)
  if (coKhoClaude()) {
    const res = await window.storage.set(STORAGE_KEY, json)
    if (!res) throw new Error('save failed')
  } else {
    window.localStorage.setItem(STORAGE_KEY, json)
  }
}

/* Trả về object đã parse, hoặc null nếu chưa có gì / đọc không được.
   KHÔNG ném lỗi: chưa có dữ liệu lưu trước đó là chuyện bình thường. */
export async function docTuMay () {
  if (!khoCoSan()) return null
  try {
    let raw = null
    if (coKhoClaude()) {
      const res = await window.storage.get(STORAGE_KEY)
      raw = (res && res.value) ? res.value : null
    } else {
      raw = window.localStorage.getItem(STORAGE_KEY)
    }
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}
