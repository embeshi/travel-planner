import { describe, it, expect, beforeEach } from 'vitest'
import { DANH_SACH, GOI_Y, moTa, tienDo, goiYConLai, themMon, xoaMon } from './so-tay.js'
import { kho, applyData, khoMacDinh } from './kho.js'

beforeEach(() => { applyData(khoMacDinh(), kho) })

describe('DANH_SACH · tên khối là tên CỘT TRONG SỔ THẬT', () => {
  it('đủ sáu danh sách, đúng tên cột của v9.6', () => {
    /* Đổi một tên khoá ở đây là dữ liệu cũ còn nguyên nhưng app đọc không ra
       (CLAUDE.md — điều kiện số 3 giữ cho dữ liệu tự hiện ra). */
    expect(DANH_SACH.map((d) => d.khoa)).toEqual([
      'skincare', 'makeup', 'essentials', 'shopping', 'places', 'food'
    ])
  })

  it('mọi khoá đều có mặt trong kho mặc định', () => {
    const k = khoMacDinh()
    for (const d of DANH_SACH) expect(Array.isArray(k[d.khoa])).toBe(true)
  })

  it('mỗi danh sách có cách gọi «xong» riêng, giữ nguyên chữ của v9.6', () => {
    expect(moTa('skincare').xong).toBe('đã cho vào vali')
    expect(moTa('shopping').xong).toBe('đã mua')
    expect(moTa('places').xong).toBe('đã đến')
    expect(moTa('food').xong).toBe('đã ăn thử')
  })

  it('bộ gợi ý bê đủ như v9.6', () => {
    expect(GOI_Y.skincare).toHaveLength(9)
    expect(GOI_Y.makeup).toHaveLength(12)
    expect(GOI_Y.essentials).toHaveLength(14)
    expect(GOI_Y.shopping).toHaveLength(24)
    expect(GOI_Y.places).toHaveLength(10)
    expect(GOI_Y.food).toHaveLength(14)
  })
})

describe('tienDo', () => {
  it('đếm đúng và làm tròn phần trăm', () => {
    expect(tienDo([{ packed: true }, { packed: false }, { packed: true }]))
      .toEqual({ xong: 2, tong: 3, phanTram: 67 })
  })
  it('danh sách rỗng không chia cho 0', () => {
    expect(tienDo([])).toEqual({ xong: 0, tong: 0, phanTram: 0 })
  })
})

describe('goiYConLai · không gợi ý món đã có', () => {
  it('bỏ món trùng tên', () => {
    const con = goiYConLai('food', [{ name: 'Pad Thái' }])
    expect(con).toHaveLength(GOI_Y.food.length - 1)
    expect(con).not.toContain('Pad Thái')
  })

  it('so không phân biệt hoa thường và bỏ khoảng trắng thừa', () => {
    /* Người dùng gõ tay «  pad thái » thì đừng gợi ý lại lần nữa. */
    expect(goiYConLai('food', [{ name: '  pad thái ' }])).not.toContain('Pad Thái')
  })

  it('danh sách rỗng thì gợi ý còn nguyên', () => {
    expect(goiYConLai('places', [])).toHaveLength(10)
  })
})

describe('themMon / xoaMon', () => {
  it('thêm món mới với cờ chưa xong', () => {
    const m = themMon('food', 'Bún bò')
    expect(kho.food).toHaveLength(1)
    expect(m).toMatchObject({ name: 'Bún bò', packed: false, note: '' })
  })

  it('tên rỗng thì không thêm — không đẻ dòng trắng', () => {
    expect(themMon('food', '   ')).toBe(null)
    expect(themMon('food', '')).toBe(null)
    expect(kho.food).toHaveLength(0)
  })

  it('cắt khoảng trắng thừa hai đầu', () => {
    expect(themMon('food', '  Phở  ').name).toBe('Phở')
  })

  it('xoá đúng món theo id', () => {
    const a = themMon('food', 'A'); themMon('food', 'B')
    xoaMon('food', a.id)
    expect(kho.food.map((m) => m.name)).toEqual(['B'])
  })
})
