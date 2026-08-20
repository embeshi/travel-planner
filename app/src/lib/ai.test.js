// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  KHOA_API, khoaAI, luuKhoaAI, xoaKhoaAI, coKhoaAI,
  goiClaude, dichLoiHTTP, docJSON, soLieuChuyen, banNhapNoiBo,
  keChuyenBangAI, tachCauBangAI
} from './ai.js'
import { kho, applyData, khoMacDinh } from './kho.js'
import { STORAGE_KEY } from './luu-tru.js'

const traLoi = (chu, them = {}) => ({
  ok: true, status: 200,
  json: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: chu }], ...them })
})

let fetchCu
beforeEach(() => {
  window.localStorage.clear()
  xoaKhoaAI()
  applyData(khoMacDinh(), kho)
  fetchCu = globalThis.fetch
})
afterEach(() => { globalThis.fetch = fetchCu })

describe('khoá API · CỦA MÁY NÀY, không phải của sổ', () => {
  it('lưu vào một khoá localStorage TÁCH BIỆT với sổ chuyến đi', () => {
    luuKhoaAI('sk-ant-thu-nghiem')
    expect(window.localStorage.getItem(KHOA_API)).toBe('sk-ant-thu-nghiem')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(null)
    expect(KHOA_API).not.toBe(STORAGE_KEY)
  })

  it('khoá KHÔNG lọt vào kho — nghĩa là không lên Supabase, không vào backup', () => {
    luuKhoaAI('sk-ant-bi-mat')
    expect(JSON.stringify(kho)).not.toContain('sk-ant-bi-mat')
    expect(Object.keys(khoMacDinh())).not.toContain('apiKey')
  })

  it('xoá là sạch, và ref phản ứng theo', () => {
    luuKhoaAI('sk-x'); expect(coKhoaAI()).toBe(true)
    xoaKhoaAI()
    expect(coKhoaAI()).toBe(false)
    expect(window.localStorage.getItem(KHOA_API)).toBe(null)
    expect(khoaAI.value).toBe('')
  })
})

describe('goiClaude · gọi đúng chuẩn trình duyệt', () => {
  it('chưa có khoá thì chặn ngay, không gọi mạng', async () => {
    let daGoi = false
    globalThis.fetch = async () => { daGoi = true; return traLoi('x') }
    await expect(goiClaude('hỏi gì đó')).rejects.toThrow('Chưa có khoá API')
    expect(daGoi).toBe(false)
  })

  it('gửi đủ bốn header bắt buộc và thân đúng model', async () => {
    luuKhoaAI('sk-ant-abc')
    let bat = null
    globalThis.fetch = async (url, cfg) => { bat = { url, cfg }; return traLoi('chào') }
    await goiClaude('xin chào')
    expect(bat.url).toBe('https://api.anthropic.com/v1/messages')
    expect(bat.cfg.headers['x-api-key']).toBe('sk-ant-abc')
    expect(bat.cfg.headers['anthropic-version']).toBe('2023-06-01')
    /* Header CORS bắt buộc để trình duyệt gọi thẳng — thiếu là bị chặn */
    expect(bat.cfg.headers['anthropic-dangerous-direct-browser-access']).toBe('true')
    expect(bat.cfg.headers['anthropic-beta']).toContain('server-side-fallback')
    const than = JSON.parse(bat.cfg.body)
    expect(than.model).toBe('claude-opus-5')
    expect(than.fallbacks).toBe('default')
    expect(than.output_config.effort).toBe('low')
  })

  it('bộ lọc an toàn từ chối (stop_reason refusal) → báo rõ, không đọc bừa nội dung', async () => {
    luuKhoaAI('sk-x')
    globalThis.fetch = async () => traLoi('', { stop_reason: 'refusal' })
    await expect(goiClaude('x')).rejects.toThrow('từ chối')
  })

  it('mất mạng → nói rõ tính năng ✦ cần sóng, phần còn lại vẫn offline', async () => {
    luuKhoaAI('sk-x')
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
    await expect(goiClaude('x')).rejects.toThrow('offline')
  })
})

describe('dichLoiHTTP · lỗi nào cũng có lối ra', () => {
  it('401 → chỉ chỗ kiểm khoá', () => expect(dichLoiHTTP(401)).toContain('console.anthropic.com'))
  it('429 → bảo đợi', () => expect(dichLoiHTTP(429)).toContain('Đợi'))
  it('500 → máy chủ, thử lại sau', () => expect(dichLoiHTTP(500)).toContain('Anthropic'))
})

describe('docJSON · gỡ rào như v9.6', () => {
  it('đọc được JSON trần, JSON trong rào, JSON kèm chữ thừa', () => {
    expect(docJSON('{"a":1}')).toEqual({ a: 1 })
    expect(docJSON('```json\n{"a":2}\n```')).toEqual({ a: 2 })
    expect(docJSON('Đây nhé:\n{"a":3}\nHết.')).toEqual({ a: 3 })
  })
})

describe('soLieuChuyen + banNhapNoiBo · đường làm tay', () => {
  const dungSo = () => applyData({
    title: 'Bangkok thử', currency: 'THB', rate: 700,
    rows: [
      { id: 'a', date: '2026-08-01', activity: 'Ăn phở', tripCost: '100', pay: 'Tiền mặt', cat: '🍜 Ăn uống' },
      { id: 'b', date: '2026-08-02', activity: 'Vé Wat Arun', tripCost: '900', pay: 'Thẻ ngân hàng', cat: '🎟 Vé' },
      { id: 'c', date: '2026-08-02', activity: 'Taxi', tripCost: '50', pay: 'Tiền mặt' }
    ],
    cash: [{ id: 'c0', date: '', vnd: '720000', fx: '1000', place: '' }],
    hotel: { checkin: '2026-08-01', checkout: '2026-08-03', name: '', address: '' }
  }, khoMacDinh())

  it('gom đúng các con số cho bản kể chuyện', () => {
    const s = soLieuChuyen(dungSo())
    expect(s.soKhoan).toBe(3)
    expect(s.ngayDinh.nhan).toBe('02/08')
    expect(s.khoanLonNhat).toEqual({ ten: 'Vé Wat Arun', tienFx: 900 })
    expect(s.danhMucDau.ten).toBe('🎟 Vé')
    expect(s.viConFx).toBe(1000 - 150)
  })

  it('bản nháp nội bộ chứa đúng các con số, không cần mạng', () => {
    const nhap = banNhapNoiBo(dungSo())
    expect(nhap).toContain('3 khoản chi')
    expect(nhap).toContain('02/08')
    expect(nhap).toContain('Vé Wat Arun')
    expect(nhap).toContain('850')          /* ví còn 850 THB */
  })

  it('sổ trống thì nói thẳng là chưa có gì, không chia cho 0', () => {
    expect(banNhapNoiBo(khoMacDinh())).toContain('chưa có khoản chi')
  })
})

describe('keChuyenBangAI · gửi số liệu tổng hợp, không gửi cả sổ', () => {
  it('đề bài chứa các con số thật và luật không bịa', async () => {
    luuKhoaAI('sk-x')
    let than = null
    globalThis.fetch = async (u, cfg) => { than = JSON.parse(cfg.body); return traLoi('Chuyến đi thật vui.') }
    const k = applyData({
      title: 'BKK', currency: 'THB', rate: 700,
      rows: [{ id: 'a', date: '2026-08-01', activity: 'Ăn', tripCost: '100', pay: 'Momo', cat: '🍜 Ăn uống' }]
    }, khoMacDinh())
    const chu = await keChuyenBangAI(k)
    expect(chu).toBe('Chuyến đi thật vui.')
    const deBai = than.messages[0].content
    expect(deBai).toContain('70.000 ₫')          /* 100 × 700 */
    expect(deBai).toContain('không bịa')
    expect(deBai).not.toContain('"rows"')        /* không gửi nguyên sổ */
  })
})

describe('tachCauBangAI · AI cũng không được vượt rào', () => {
  const chuanBi = (jsonChu) => {
    luuKhoaAI('sk-x')
    globalThis.fetch = async () => traLoi(jsonChu)
  }

  it('đọc JSON hợp lệ và trả đúng hình dạng bản xem trước', async () => {
    chuanBi('```json\n{"activity":"Bolt về khách sạn","tripCost":"120","pay":"Tiền mặt","cat":"🚕 Di chuyển"}\n```')
    const b = await tachCauBangAI('bolt về khách sạn 120 baht tiền mặt')
    expect(b).toMatchObject({ activity: 'Bolt về khách sạn', tripCost: '120', pay: 'Tiền mặt', cat: '🚕 Di chuyển' })
    expect(b.doc).toEqual(['số tiền', 'nguồn tiền', 'danh mục'])
  })

  it('pay/cat lạ ngoài danh sách chuẩn → về rỗng, không nhét bừa', async () => {
    chuanBi('{"activity":"X","tripCost":"50","pay":"Ví điện tử","cat":"🎁 Quà"}')
    const b = await tachCauBangAI('x')
    expect(b.pay).toBe('')
    expect(b.cat).toBe('')
  })

  it('tripCost kiểu Việt «1.200» được hiểu là một nghìn hai', async () => {
    chuanBi('{"activity":"Taxi","tripCost":"1.200","pay":"","cat":""}')
    expect((await tachCauBangAI('x')).tripCost).toBe('1200')
  })

  it('tripCost âm hoặc rác → rỗng để nút ghi còn bị khoá', async () => {
    chuanBi('{"activity":"X","tripCost":"-5","pay":"","cat":""}')
    expect((await tachCauBangAI('x')).tripCost).toBe('')
  })

  it('AI trả về không phải JSON → báo lỗi tử tế, không nổ trắng', async () => {
    chuanBi('Xin lỗi, tôi không chắc lắm về câu này.')
    await expect(tachCauBangAI('x')).rejects.toThrow('không đọc được')
  })
})
