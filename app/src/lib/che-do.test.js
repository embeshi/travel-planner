// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  KHOA_CHE_DO, CAC_CHE_DO, cheDo, docCheDo, datCheDo, cheDoThat, cheDoTiepTheo, apCheDo
} from './che-do.js'
import { STORAGE_KEY } from './luu-tru.js'
import { KHOA_API } from './ai.js'

const matchMediaCu = window.matchMedia
const mayToi = (toi) => {
  window.matchMedia = (q) => ({
    matches: /prefers-color-scheme:\s*dark/.test(q) ? toi : false,
    media: q, addEventListener () {}, removeEventListener () {}
  })
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-che-do')
  cheDo.value = 'theo-may'
})
afterEach(() => { window.matchMedia = matchMediaCu; vi.restoreAllMocks() })

describe('chế độ sáng/tối · CỦA MÁY NÀY, không phải của sổ', () => {
  it('chưa bấm lần nào → «theo máy»', () => {
    expect(docCheDo()).toBe('theo-may')
  })

  it('lưu vào một khoá localStorage TÁCH BIỆT với sổ chuyến đi và khoá AI', () => {
    datCheDo('toi')
    expect(window.localStorage.getItem(KHOA_CHE_DO)).toBe('toi')
    expect(KHOA_CHE_DO).not.toBe(STORAGE_KEY)
    expect(KHOA_CHE_DO).not.toBe(KHOA_API)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(null)
    expect(docCheDo()).toBe('toi')
    expect(cheDo.value).toBe('toi')
  })

  it('giá trị lạ trong kho máy → coi như «theo máy», không vỡ', () => {
    window.localStorage.setItem(KHOA_CHE_DO, 'tim-tim')
    expect(docCheDo()).toBe('theo-may')
  })

  it('datCheDo bỏ qua giá trị lạ, không ghi gì', () => {
    datCheDo('tim-tim')
    expect(window.localStorage.getItem(KHOA_CHE_DO)).toBe(null)
    expect(cheDo.value).toBe('theo-may')
  })

  it('localStorage hỏng (chế độ riêng tư) → không ném lỗi', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('chặn') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('chặn') })
    expect(docCheDo()).toBe('theo-may')
    expect(() => datCheDo('toi')).not.toThrow()
    expect(cheDo.value).toBe('toi')
  })
})

describe('nút xoay vòng Sáng → Tối → Theo máy', () => {
  it('đi đúng vòng ba bước', () => {
    expect(CAC_CHE_DO).toEqual(['sang', 'toi', 'theo-may'])
    expect(cheDoTiepTheo('sang')).toBe('toi')
    expect(cheDoTiepTheo('toi')).toBe('theo-may')
    expect(cheDoTiepTheo('theo-may')).toBe('sang')
  })
})

describe('lựa chọn → màu thật đang áp', () => {
  it('sáng/tối chọn tay thì bất kể máy', () => {
    expect(cheDoThat('sang', true)).toBe('sang')
    expect(cheDoThat('toi', false)).toBe('toi')
  })
  it('theo máy thì nghe máy', () => {
    expect(cheDoThat('theo-may', true)).toBe('toi')
    expect(cheDoThat('theo-may', false)).toBe('sang')
  })

  it('apCheDo gắn data-che-do lên <html>', () => {
    mayToi(true)
    apCheDo('theo-may')
    expect(document.documentElement.getAttribute('data-che-do')).toBe('toi')
    apCheDo('sang')
    expect(document.documentElement.getAttribute('data-che-do')).toBe('sang')
  })

  it('apCheDo đổi màu thanh trạng thái điện thoại (theme-color) theo màu thật đang áp', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = '#1F3A5F'
    document.head.appendChild(meta)
    apCheDo('toi')
    expect(meta.content).toBe('#121923')
    apCheDo('sang')
    expect(meta.content).toBe('#1F3A5F')
    meta.remove()
  })
})

/* Luật tokens.css: linh kiện không viết màu thẳng — chỗ nào viết là chỗ đó
   lệch màu ở chế độ tối. Lưới này bắt ngay lúc npm test, trước khi lên sóng. */
describe('linh kiện không viết màu cứng', () => {
  const thuMuc = resolve(process.cwd(), 'src')
  const tepVue = readdirSync(thuMuc, { recursive: true })
    .filter((f) => String(f).endsWith('.vue'))

  it('có tìm thấy file .vue để soi', () => {
    expect(tepVue.length).toBeGreaterThan(10)
  })

  for (const f of tepVue) {
    it(String(f), () => {
      const nguon = readFileSync(resolve(thuMuc, String(f)), 'utf8')
      /* Dòng nào ghi «cố ý» là ngoại lệ đã cân nhắc (ví dụ màu giấy in trong
         @media print — khi in app luôn dùng màu sáng, xem tokens.css). */
      const style = (nguon.match(/<style[\s\S]*?<\/style>/g) || []).join('\n')
        .split('\n').filter((d) => !d.includes('cố ý')).join('\n')
      expect(style.match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(/g)).toBe(null)
    })
  }
})

/* index.html có một đoạn script trong <head> áp chế độ TRƯỚC khi trang hiện.
   Nó không import được che-do.js nên phải lặp lại khoá lưu và luật chọn.
   Bài kiểm này chạy thật đoạn script đó và so với cheDoThat, để hai bên
   không bao giờ lệch nhau. */
describe('script chống chớp trong index.html khớp với che-do.js', () => {
  /* jsdom đổi import.meta.url khỏi file:// — đọc theo thư mục chạy test (app/) */
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
  const khoi = /<script data-che-do>([\s\S]*?)<\/script>/.exec(html)
  const chay = () => new Function(khoi[1])()

  it('nằm trong <head>, trước khi app được nạp', () => {
    expect(khoi).not.toBe(null)
    expect(html.indexOf('<script data-che-do>')).toBeLessThan(html.indexOf('</head>'))
  })

  for (const luu of [null, 'sang', 'toi', 'theo-may', 'tim-tim']) {
    for (const toi of [true, false]) {
      it(`kho máy = ${luu} · máy ${toi ? 'tối' : 'sáng'}`, () => {
        if (luu) window.localStorage.setItem(KHOA_CHE_DO, luu)
        mayToi(toi)
        chay()
        expect(document.documentElement.getAttribute('data-che-do')).toBe(cheDoThat(docCheDo(), toi))
      })
    }
  }
})
