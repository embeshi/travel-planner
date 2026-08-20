import { describe, it, expect } from 'vitest'
import { donSoChoChuyenMoi } from './chuyen-moi.js'
import { khoMacDinh, applyData } from './kho.js'
import { soMau } from './du-lieu-mau.js'

const dungSo = () => applyData(soMau(), khoMacDinh())

describe('donSoChoChuyenMoi · dọn đúng đồ của chuyến, giữ đúng đồ của người', () => {
  it('dọn sạch phần thuộc về chuyến cũ', () => {
    const k = donSoChoChuyenMoi(dungSo())
    expect(k.rows).toEqual([])
    expect(k.cash).toEqual([])
    expect(k.bookings).toEqual([])
    expect(k.hotel).toEqual({ name: '', address: '', checkin: '', checkout: '' })
    expect(k.budget).toBe('')
    expect(k.rate).toBe(null)
    expect(k.bkRate).toBe(null)
    expect(k.shopping).toEqual([])
    expect(k.places).toEqual([])
    expect(k.food).toEqual([])
    expect(k.title).toBe('Chuyến đi của mình')
  })

  it('HÀNH LÝ giữ nguyên danh sách món — chỉ bỏ tick', () => {
    /* Gần 40 món gõ tay qua nhiều chuyến. Dọn mất là bắt gõ lại —
       đúng điều dự án thề không làm. */
    const k = donSoChoChuyenMoi(dungSo())
    expect(k.skincare).toHaveLength(12)
    expect(k.makeup).toHaveLength(13)
    expect(k.essentials).toHaveLength(13)
    expect([...k.skincare, ...k.makeup, ...k.essentials].every((m) => m.packed === false)).toBe(true)
    expect(k.skincare[0].name).toBeTruthy()
  })

  it('hình dạng sổ KHÔNG đổi — vẫn đủ 21 khối, v9.6 vẫn đọc được', () => {
    const k = donSoChoChuyenMoi(dungSo())
    expect(Object.keys(k).sort()).toEqual(Object.keys(khoMacDinh()).sort())
  })

  it('sau khi dọn, app hiểu là «chưa có chuyến» để mở màn cuống vé', async () => {
    const { mocChuyenDi } = await import('./giai-doan.js')
    const k = donSoChoChuyenMoi(dungSo())
    expect(mocChuyenDi(k).tu).toBe('chua-co')
  })

  it('dọn xong vẫn ghi được chuyến mới lên cùng sổ (không vỡ tham chiếu reactive)', () => {
    const k = dungSo()
    donSoChoChuyenMoi(k)
    k.rows.push({ id: 'x', date: '2026-09-01', activity: 'Chuyến mới', tripCost: '10', pay: '' })
    expect(k.rows).toHaveLength(1)
  })
})
