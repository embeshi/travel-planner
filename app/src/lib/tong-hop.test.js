import { describe, it, expect } from 'vitest'
import { tongChiPhiCaChuyen, tongDaDoi, baConSoVanTay, daChiHomNay, dongCuaHomNay } from './tong-hop.js'
import { khoMacDinh, applyData } from './kho.js'
import { soMau } from './du-lieu-mau.js'

const kho = (obj) => applyData(obj, khoMacDinh())

describe('tongChiPhiCaChuyen · thiếu tỷ giá thì phải BÁO, không cộng 0', () => {
  it('có tiền mà thiếu tỷ giá → không cộng vào tổng, và báo thiếu', () => {
    /* Nếu lặng lẽ cộng 0 thì người dùng nhìn tổng tưởng đã đủ.
       Đây là lỗi nguy hiểm hơn hiện sai số, vì nó không có dấu hiệu gì. */
    const k = kho({ rows: [{ id: 'a', tripCost: '1000' }], currency: 'THB', rate: null })
    const r = tongChiPhiCaChuyen(k)
    expect(r.tong).toBe(0)
    expect(r.thieuTyGia).toEqual(['THB'])
  })

  it('không có tiền thì không báo thiếu tỷ giá', () => {
    const k = kho({ rows: [], rate: null })
    expect(tongChiPhiCaChuyen(k).thieuTyGia).toEqual([])
  })

  it('cộng cả hai khối khi đủ tỷ giá', () => {
    const k = kho({
      rows: [{ id: 'a', tripCost: '100' }], rate: 700, currency: 'THB',
      bookings: [{ id: 'b', name: 'Vé', cost: '10' }], bkRate: 30000, bkCurrency: 'GBP'
    })
    const r = tongChiPhiCaChuyen(k)
    expect(r.tong).toBe(100 * 700 + 10 * 30000)
    expect(r.thieuTyGia).toEqual([])
  })

  it('thiếu cả hai tỷ giá thì báo cả hai', () => {
    const k = kho({
      rows: [{ id: 'a', tripCost: '100' }], rate: null, currency: 'THB',
      bookings: [{ id: 'b', name: 'Vé', cost: '10' }], bkRate: null, bkCurrency: 'GBP'
    })
    expect(tongChiPhiCaChuyen(k).thieuTyGia).toEqual(['THB', 'GBP'])
  })

  it('ô tiền rỗng tính là 0, không thành NaN kéo hỏng cả tổng', () => {
    const k = kho({ rows: [{ id: 'a', tripCost: '' }, { id: 'b', tripCost: '100' }], rate: 700 })
    expect(tongChiPhiCaChuyen(k).tong).toBe(70000)
  })
})

describe('tongDaDoi', () => {
  it('cộng cột fx của mọi lần đổi tiền', () => {
    const k = kho({ cash: [{ id: '1', fx: '1000' }, { id: '2', fx: '2000' }, { id: '3', fx: '' }] })
    expect(tongDaDoi(k)).toBe(3000)
  })
})

describe('baConSoVanTay · tiêu chí nghiệm thu của nghi thức', () => {
  it('cho đúng ba con số trên bộ dữ liệu mẫu', () => {
    const v = baConSoVanTay(kho(soMau()))
    expect(v.soDongLichTrinh).toBe(61)
    expect(v.tongChiPhiVnd).toBeCloseTo(38121045.600, 2)
    expect(v.viTienMatConLai).toBeCloseTo(2259.71, 2)
    expect(v.donViVi).toBe('THB')
    expect(v.thieuTyGia).toEqual([])
  })

  it('sổ trống cho ba số 0 — và đây là dấu hiệu phải DỪNG TAY', () => {
    /* Nghi thức mục 03: mở v10 thấy trống trơn thì không gõ gì cả.
       Ba con số bằng 0 chính là cái phải nhận ra ngay. */
    const v = baConSoVanTay(khoMacDinh())
    expect(v.soDongLichTrinh).toBe(0)
    expect(v.tongChiPhiVnd).toBe(0)
    expect(v.viTienMatConLai).toBe(0)
  })
})

describe('daChiHomNay · chỉ số sống còn của màn Hôm nay', () => {
  const k = () => kho({
    rows: [
      { id: 'a', date: '2026-08-04', tripCost: '120' },
      { id: 'b', date: '2026-08-04', tripCost: '85' },
      { id: 'c', date: '2026-08-05', tripCost: '900' },
      { id: 'd', date: '', tripCost: '500' }
    ]
  })

  it('chỉ cộng dòng đúng ngày hôm nay', () => {
    expect(daChiHomNay(k(), '2026-08-04')).toBe(205)
  })

  it('dòng chưa ghi ngày KHÔNG được cộng vào', () => {
    /* Đang gõ dở một dòng trống không có nghĩa là hôm nay đã tiêu thêm. */
    expect(daChiHomNay(k(), '')).toBe(0)
  })

  it('ngày không có dòng nào thì bằng 0', () => {
    expect(daChiHomNay(k(), '2026-08-09')).toBe(0)
  })

  it('dongCuaHomNay lấy đúng những dòng của ngày đó', () => {
    expect(dongCuaHomNay(k(), '2026-08-04').map((r) => r.id)).toEqual(['a', 'b'])
  })
})
