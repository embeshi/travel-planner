import { describe, it, expect } from 'vitest'
import { giaiDoan, tabMoDau, mocChuyenDi, ngayThuMay, homNayISO } from './giai-doan.js'
import { khoMacDinh, applyData } from './kho.js'
import { soMau } from './du-lieu-mau.js'

const kho = (obj) => applyData(obj, khoMacDinh())
const chuyen = kho(soMau())   /* 01/08 → 06/08/2026 */

describe('mocChuyenDi', () => {
  it('ưu tiên ngày khách sạn', () => {
    expect(mocChuyenDi(chuyen)).toEqual({ di: '2026-08-01', ve: '2026-08-06', tu: 'khach-san' })
  })

  it('chưa có khách sạn thì suy từ lịch trình', () => {
    const k = kho({ rows: [{ id: 'a', date: '2026-08-05' }, { id: 'b', date: '2026-08-02' }] })
    expect(mocChuyenDi(k)).toEqual({ di: '2026-08-02', ve: '2026-08-05', tu: 'lich-trinh' })
  })

  it('bỏ qua ngày gõ tay không phải ngày lịch', () => {
    const k = kho({ rows: [{ id: 'a', date: 'Ngày cuối' }, { id: 'b', date: '2026-08-02' }] })
    expect(mocChuyenDi(k).di).toBe('2026-08-02')
  })

  it('chỉ có một đầu thì lấy đầu đó cho cả hai', () => {
    const k = kho({ hotel: { checkin: '2026-08-01', checkout: '', name: '', address: '' } })
    expect(mocChuyenDi(k)).toEqual({ di: '2026-08-01', ve: '2026-08-01', tu: 'khach-san' })
  })

  it('sổ trống thì không có mốc nào', () => {
    expect(mocChuyenDi(khoMacDinh()).tu).toBe('chua-co')
  })
})

describe('giaiDoan · app tự mở đúng tab', () => {
  it('trước ngày đi → đang lên kế hoạch', () => {
    expect(giaiDoan(chuyen, '2026-07-20')).toBe('truoc')
    expect(tabMoDau(chuyen, '2026-07-20')).toBe('ke-hoach')
  })

  it('đúng ngày đi đã tính là trong chuyến', () => {
    expect(giaiDoan(chuyen, '2026-08-01')).toBe('trong')
    expect(tabMoDau(chuyen, '2026-08-01')).toBe('hom-nay')
  })

  it('giữa chuyến → màn Hôm nay', () => {
    expect(tabMoDau(chuyen, '2026-08-04')).toBe('hom-nay')
  })

  it('đúng ngày về vẫn là trong chuyến — chưa đá sang tổng kết sớm', () => {
    /* Ngày về vẫn còn tiêu tiền: taxi ra sân bay, ăn sáng, mua quà phút chót. */
    expect(giaiDoan(chuyen, '2026-08-06')).toBe('trong')
  })

  it('qua ngày về → tổng kết', () => {
    expect(giaiDoan(chuyen, '2026-08-07')).toBe('sau')
    expect(tabMoDau(chuyen, '2026-08-07')).toBe('tong-ket')
  })

  it('sổ trống thì mở Kế hoạch — chỗ duy nhất làm được việc gì đó', () => {
    expect(giaiDoan(khoMacDinh())).toBe('chua-co')
    expect(tabMoDau(khoMacDinh())).toBe('ke-hoach')
  })
})

describe('ngayThuMay', () => {
  it('đếm đúng ngày thứ mấy trên tổng số', () => {
    expect(ngayThuMay(chuyen, '2026-08-04')).toEqual({ thu: 4, tong: 6 })
    expect(ngayThuMay(chuyen, '2026-08-01')).toEqual({ thu: 1, tong: 6 })
    expect(ngayThuMay(chuyen, '2026-08-06')).toEqual({ thu: 6, tong: 6 })
  })
  it('chưa đủ mốc thì không đếm bừa', () => {
    expect(ngayThuMay(khoMacDinh())).toBe(null)
  })
})

describe('homNayISO', () => {
  it('trả đúng khuôn yyyy-mm-dd, có đệm số 0', () => {
    expect(homNayISO(new Date(2026, 7, 4))).toBe('2026-08-04')
    expect(homNayISO(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})
