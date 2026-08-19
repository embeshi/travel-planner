import { describe, it, expect } from 'vitest'
import { nhomTheoNgay, nhomCaoNhat, traiPhang } from './nhom-ngay.js'
import { soMau } from './du-lieu-mau.js'

const d = (id, date, tripCost = '0') => ({ id, date, tripCost })

describe('nhomTheoNgay · thứ tự nhóm', () => {
  it('ngày lịch → số trần → chữ tự do → chưa ghi ngày', () => {
    const ds = nhomTheoNgay([
      d('a', ''), d('b', 'Ngày cuối'), d('c', '3'), d('d', '2026-08-04')
    ])
    expect(ds.map((g) => g.cls)).toEqual([0, 1, 2, 3])
    expect(ds.at(-1).none).toBe(true)
  })

  it('nhóm chưa ghi ngày luôn nằm cuối, để dòng đang gõ dở không bị đẩy lên giữa', () => {
    const ds = nhomTheoNgay([d('trong', ''), d('sau', '2026-08-09'), d('truoc', '2026-08-01')])
    expect(ds.map((g) => g.key)).toEqual(['d:2026-8-1', 'd:2026-8-9', '__none__'])
  })

  it('nhóm chữ tự do giữ thứ tự xuất hiện, không xếp theo bảng chữ cái', () => {
    const ds = nhomTheoNgay([d('a', 'Zulu'), d('b', 'Alpha')])
    expect(ds.map((g) => g.nhan)).toEqual(['Zulu', 'Alpha'])
  })
})

describe('nhomTheoNgay · nhãn ngày', () => {
  it('một năm thì nhãn gọn dd/mm', () => {
    const ds = nhomTheoNgay([d('a', '2026-08-04'), d('b', '2026-08-05')])
    expect(ds.map((g) => g.nhan)).toEqual(['04/08', '05/08'])
  })

  it('vắt qua hai năm thì mới kèm năm', () => {
    const ds = nhomTheoNgay([d('a', '2026-12-31'), d('b', '2027-01-01')])
    expect(ds.map((g) => g.nhan)).toEqual(['31/12/2026', '01/01/2027'])
  })

  it('kèm thứ trong tuần kiểu Việt', () => {
    expect(nhomTheoNgay([d('a', '2026-08-04')])[0].thu).toBe('T3')
  })
})

describe('nhomTheoNgay · cộng tiền và lọc', () => {
  it('cộng đúng tổng từng ngày, ô rỗng tính 0', () => {
    const ds = nhomTheoNgay([
      d('a', '2026-08-04', '120'), d('b', '2026-08-04', ''), d('c', '2026-08-04', '85')
    ])
    expect(ds[0].tong).toBe(205)
    expect(ds[0].dong).toHaveLength(3)
  })

  it('lọc dòng không có tiền khi được yêu cầu', () => {
    const ds = nhomTheoNgay([d('a', '2026-08-04', '120'), d('b', '2026-08-04', '0')],
      { chiDongCoTien: true })
    expect(ds[0].dong).toHaveLength(1)
  })

  it('giữ nguyên thứ tự dòng bên trong một ngày', () => {
    const ds = nhomTheoNgay([d('x', '2026-08-04'), d('y', '2026-08-04'), d('z', '2026-08-04')])
    expect(ds[0].dong.map((r) => r.id)).toEqual(['x', 'y', 'z'])
  })
})

describe('nhomCaoNhat · ngày được đánh dấu 🔥', () => {
  it('chọn ngày tiêu nhiều nhất', () => {
    const ds = nhomTheoNgay([
      d('a', '2026-08-04', '100'), d('b', '2026-08-05', '900'), d('c', '2026-08-06', '50')
    ])
    expect(nhomCaoNhat(ds)).toBe('d:2026-8-5')
  })
  it('chưa ngày nào có tiền thì không đánh dấu ai', () => {
    expect(nhomCaoNhat(nhomTheoNgay([d('a', '2026-08-04', '0')]))).toBe(null)
  })
})

describe('traiPhang · thứ tự NHÌN THẤY', () => {
  it('trải đúng thứ tự đang hiển thị, không phải thứ tự mảng gốc', () => {
    const rows = [d('sau', '2026-08-09'), d('trong', ''), d('truoc', '2026-08-01')]
    expect(traiPhang(nhomTheoNgay(rows)).map((r) => r.id)).toEqual(['truoc', 'sau', 'trong'])
  })

  it('không mất dòng nào trên sổ thật 61 dòng', () => {
    const rows = soMau().rows
    const ds = nhomTheoNgay(rows)
    expect(ds).toHaveLength(6)
    expect(traiPhang(ds)).toHaveLength(61)
    expect(Math.max(...ds.map((g) => g.dong.length))).toBe(21)
  })
})
