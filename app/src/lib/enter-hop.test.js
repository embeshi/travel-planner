import { describe, it, expect } from 'vitest'
import { taoEnterHop } from './enter-hop.js'

const dung = (laDienThoai) => {
  const ds = [{ id: 'a' }, { id: 'b' }]
  const roi = []
  const hop = taoEnterHop({
    danhSach: () => ds, cot: ['ten', 'tien', 'ghi'],
    roiVao: (id, c) => roi.push(id + ':' + c),
    themDong: async () => { const m = { id: 'moi' }; ds.push(m); return m },
    laDienThoai: () => laDienThoai
  })
  return { ds, roi, hop }
}

describe('Enter hai chế độ · bảng nhỏ', () => {
  it('laptop: nhảy ĐÚNG CỘT xuống dòng dưới; dòng cuối thì đẻ dòng mới cùng cột', async () => {
    const { roi, hop, ds } = dung(false)
    await hop('a', 'tien')
    expect(roi).toEqual(['b:tien'])
    await hop('b', 'ghi')
    expect(ds).toHaveLength(3)
    expect(roi.at(-1)).toBe('moi:ghi')
  })
  it('điện thoại: đi tuần tự trong thẻ, hết thẻ mới sang thẻ dưới', async () => {
    const { roi, hop } = dung(true)
    await hop('a', 'ten'); await hop('a', 'tien'); await hop('a', 'ghi')
    expect(roi).toEqual(['a:tien', 'a:ghi', 'b:ten'])
  })
  it('id lạ thì không làm gì', async () => {
    const { roi, hop } = dung(false)
    await hop('khong-co', 'ten')
    expect(roi).toEqual([])
  })
})
