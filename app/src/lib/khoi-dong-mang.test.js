// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { dichLoiMang, LOI_MANG, dangNhap, dichLoiDangKy, datClientThu, nguoiDung } from './khoi-dong.js'
import { datLaiCongDoc } from './dong-bo.js'

describe('v10.7 · lỗi mạng nói tiếng Việt', () => {
  beforeEach(() => { datLaiCongDoc(); nguoiDung.value = null })

  it('các câu tiếng Anh của trình duyệt → một câu tiếng Việt có trấn an', () => {
    for (const m of ['Failed to fetch', 'TypeError: NetworkError when attempting to fetch resource.', 'Load failed', 'fetch failed']) {
      expect(dichLoiMang(new Error(m))).toBe(LOI_MANG)
    }
    expect(LOI_MANG).toContain('Dữ liệu trên máy vẫn an toàn')
  })
  it('lỗi khác giữ nguyên lời gốc — không dịch bừa', () => {
    expect(dichLoiMang(new Error('Invalid login credentials'))).toBe('Invalid login credentials')
  })
  it('đăng nhập lúc mất mạng → người dùng thấy tiếng Việt, không thấy «Failed to fetch»', async () => {
    datClientThu({ auth: { signInWithPassword: async () => { throw new TypeError('Failed to fetch') } } })
    await expect(dangNhap('a@b.c', 'x')).rejects.toThrow(LOI_MANG)
    datClientThu({ auth: { signInWithPassword: async () => ({ data: null, error: new Error('Failed to fetch') }) } })
    await expect(dangNhap('a@b.c', 'x')).rejects.toThrow(LOI_MANG)
    datClientThu(null)
  })
  it('đăng ký lúc mất mạng cũng vậy', () => {
    expect(dichLoiDangKy(new Error('Failed to fetch'))).toBe(LOI_MANG)
  })
})
