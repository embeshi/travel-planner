import { describe, it, expect } from 'vitest'
import { kho, applyData, khoMacDinh, dongMoi, dongTienMatMoi } from './kho.js'
import { soMau } from './du-lieu-mau.js'
import { catChuyenLenKe } from './ke-ve.js'
import { donSoChoChuyenMoi } from './chuyen-moi.js'
import { tongChiPhiCaChuyen, baConSoVanTay, tongDaDoi } from './tong-hop.js'
import { viTienMatConLai } from './xep-dong.js'
import { tongDoiTien } from './tien-te.js'

/* Nghiệm thu v10.6 theo đúng đề bài: Thái → dọn sổ → chuyến Nhật (JPY, có
   tỷ giá) → tổng > 0, ví tính bằng JPY, vé khoá đúng số. Chuyến Thái: ba con
   số vân tay y nguyên trên vé. */
describe('Nghiệm thu v10.6 · Thái → Nhật', () => {
  it('trọn vòng', () => {
    applyData(khoMacDinh(), kho); kho.chuyenDaCat = []
    applyData(soMau(), kho)
    const thai = baConSoVanTay(kho)
    expect(thai.soDongLichTrinh).toBe(61)
    expect(thai.tongChiPhiVnd).toBeCloseTo(38121045.6, 1)
    expect(thai.viTienMatConLai).toBeCloseTo(2259.71, 2)

    /* cất vé + dọn sổ (như ChuyenMoi nấc 2) */
    const veThai = catChuyenLenKe(kho)
    donSoChoChuyenMoi(kho)
    expect(kho.rate).toBe(null)                       /* tỷ giá cũ KHÔNG lây sang chuyến mới */
    expect(tongChiPhiCaChuyen(kho).tong).toBe(0)

    /* chuyến Nhật: chọn JPY, có tỷ giá (như ManRong + TheTyGia) */
    kho.title = 'Tokyo 2026'; kho.currency = 'JPY'; kho.rate = 170
    const a = dongMoi(); a.date = '2026-11-01'; a.tripCost = '1200'; a.pay = 'Tiền mặt'
    const b = dongMoi(); b.date = '2026-11-02'; b.tripCost = '800'; b.pay = 'Thẻ ngân hàng'
    kho.rows.push(a, b)
    const c = dongTienMatMoi(); c.vnd = '3400000'; c.fx = '20000'; kho.cash.push(c)

    const t = tongChiPhiCaChuyen(kho)
    expect(t.thieuTyGia).toEqual([])
    expect(t.tong).toBe(2000 * 170)                   /* > 0, đúng số */
    expect(viTienMatConLai(kho.rows, tongDaDoi(kho))).toBe(20000 - 1200)   /* ví bằng JPY */
    expect(tongDoiTien(kho).tyGiaTB).toBe(170)

    const veNhat = catChuyenLenKe(kho)
    expect(veNhat).toMatchObject({ ten: 'Tokyo 2026', currency: 'JPY', soDong: 2, tongVnd: 340000, viFx: 18800 })

    /* vé Thái trên kệ vẫn y nguyên ba con số */
    const vt = kho.chuyenDaCat.find((v) => v.id === veThai.id)
    expect(vt.soDong).toBe(61)
    expect(vt.tongVnd).toBeCloseTo(38121045.6, 1)
    expect(vt.viFx).toBeCloseTo(2259.71, 2)
    expect(vt.currency).toBe('THB')
  })
})
