import { describe, it, expect, afterEach } from 'vitest'
import { docTyGiaTuApiCongKhai, layTyGiaThiTruong } from './ty-gia.js'

describe('docTyGiaTuApiCongKhai', () => {
  it('đọc được câu trả lời hợp lệ', () => {
    expect(docTyGiaTuApiCongKhai({ result: 'success', rates: { VND: 784.283273 } })).toBe(784.283273)
  })
  it('trả null khi câu trả lời không dùng được', () => {
    expect(docTyGiaTuApiCongKhai(null)).toBe(null)
    expect(docTyGiaTuApiCongKhai({})).toBe(null)
    expect(docTyGiaTuApiCongKhai({ result: 'error' })).toBe(null)
    expect(docTyGiaTuApiCongKhai({ result: 'success', rates: {} })).toBe(null)
    expect(docTyGiaTuApiCongKhai({ result: 'success', rates: { VND: 0 } })).toBe(null)
    expect(docTyGiaTuApiCongKhai({ result: 'success', rates: { VND: -5 } })).toBe(null)
  })
})

describe('layTyGiaThiTruong · chỉ một đường, không còn nhánh Claude', () => {
  const fetchCu = globalThis.fetch
  afterEach(() => { globalThis.fetch = fetchCu })

  it('gọi đúng er-api với mã tiền, trả về số', async () => {
    const goi = []
    globalThis.fetch = async (url) => { goi.push(String(url)); return { ok: true, json: async () => ({ result: 'success', rates: { VND: 720 } }) } }
    expect(await layTyGiaThiTruong('THB')).toBe(720)
    expect(goi).toEqual(['https://open.er-api.com/v6/latest/THB'])
  })

  it('er-api hỏng → NÉM LỖI ngay, KHÔNG gọi thêm api.anthropic.com', async () => {
    const goi = []
    globalThis.fetch = async (url) => { goi.push(String(url)); return { ok: false, status: 503, json: async () => ({}) } }
    await expect(layTyGiaThiTruong('JPY')).rejects.toThrow('503')
    expect(goi.some((u) => u.includes('anthropic'))).toBe(false)
    expect(goi).toHaveLength(1)
  })

  it('câu trả lời méo → ném lỗi rõ, không ghi bậy vào ô tỷ giá', async () => {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ result: 'success', rates: { VND: 0 } }) })
    await expect(layTyGiaThiTruong('USD')).rejects.toThrow('không dùng được')
  })

  it('mất mạng → lỗi lan lên cho giao diện báo', async () => {
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
    await expect(layTyGiaThiTruong('USD')).rejects.toThrow()
  })
})
