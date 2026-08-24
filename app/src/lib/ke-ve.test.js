import { describe, it, expect, beforeEach } from 'vitest'
import { catChuyenLenKe, xemLaiVe, xoaVe, chupSo, coGiDeCat, nhanVe, ngayGon } from './ke-ve.js'
import { kho, applyData, khoMacDinh } from './kho.js'
import { soMau } from './du-lieu-mau.js'

beforeEach(() => {
  applyData(khoMacDinh(), kho)
  kho.chuyenDaCat = []
  applyData(soMau(), kho)
})

describe('chupSo · bản chụp không được chứa kệ', () => {
  it('đủ mọi khối chuyến, KHÔNG có chuyenDaCat — tránh kệ lồng kệ', () => {
    kho.chuyenDaCat.push({ id: 'v0', ten: 'cũ' })
    const chup = chupSo(kho)
    expect('chuyenDaCat' in chup).toBe(false)
    expect(chup.rows).toHaveLength(61)
    expect(chup.title).toBe('Chuyến mẫu')
  })

  it('là bản SAO — sửa sổ sau đó không làm méo vé đã cất', () => {
    const chup = chupSo(kho)
    kho.rows[0].activity = 'ĐÃ SỬA SAU KHI CHỤP'
    expect(chup.rows[0].activity).not.toBe('ĐÃ SỬA SAU KHI CHỤP')
  })
})

describe('catChuyenLenKe · số liệu chốt trên vé', () => {
  it('vé mang đúng số liệu lúc chốt và nằm ĐẦU kệ', () => {
    const ve = catChuyenLenKe(kho)
    expect(kho.chuyenDaCat[0].id).toBe(ve.id)
    expect(ve).toMatchObject({ ten: 'Chuyến mẫu', di: '2026-08-01', ve: '2026-08-06', soDong: 61 })
    expect(ve.tongVnd).toBeCloseTo(38121045.6, 1)
    expect(ve.viFx).toBeCloseTo(2259.71, 2)
    expect(ve.data.rows).toHaveLength(61)
  })

  it('cất hai chuyến thì chuyến mới hơn nằm trên', () => {
    catChuyenLenKe(kho)
    kho.title = 'Chuyến sau'
    const v2 = catChuyenLenKe(kho)
    expect(kho.chuyenDaCat.map((v) => v.id)[0]).toBe(v2.id)
    expect(kho.chuyenDaCat).toHaveLength(2)
  })
})

describe('xemLaiVe · hoán đổi không nhánh nào mất chuyến', () => {
  it('sổ đang có chuyến → chuyến hiện tại tự lên kệ, vé cũ xuống sổ', () => {
    const veCu = catChuyenLenKe(kho)          /* kệ: [Chuyến mẫu] */
    applyData(khoMacDinh(), kho)
    kho.chuyenDaCat = [veCu]
    applyData({ title: 'Chuyến B', rows: [{ id: 'b1', date: '2026-09-01', tripCost: '10', pay: '' }] }, kho)

    const ten = xemLaiVe(kho, veCu.id)
    expect(ten).toBe('Chuyến mẫu')
    expect(kho.title).toBe('Chuyến mẫu')
    expect(kho.rows).toHaveLength(61)
    /* Chuyến B không biến mất — nó lên kệ */
    expect(kho.chuyenDaCat).toHaveLength(1)
    expect(kho.chuyenDaCat[0].ten).toBe('Chuyến B')
    expect(kho.chuyenDaCat[0].data.rows).toHaveLength(1)
  })

  it('sổ đang trống → chỉ tải vé xuống, kệ bớt một', () => {
    const ve = catChuyenLenKe(kho)
    applyData(khoMacDinh(), kho)
    kho.chuyenDaCat = [ve]
    xemLaiVe(kho, ve.id)
    expect(kho.rows).toHaveLength(61)
    expect(kho.chuyenDaCat).toHaveLength(0)
  })

  it('vé không tồn tại → không đụng gì cả', () => {
    catChuyenLenKe(kho)
    expect(xemLaiVe(kho, 'khong-co')).toBe(null)
    expect(kho.rows).toHaveLength(61)
    expect(kho.chuyenDaCat).toHaveLength(1)
  })

  it('xem lại KHÔNG làm bay kệ — bản chụp vắng khối kệ và applyData giữ nó', () => {
    const v1 = catChuyenLenKe(kho)
    kho.title = 'Chuyến B'
    const v2 = catChuyenLenKe(kho)
    xemLaiVe(kho, v1.id)
    /* kệ còn: v2 + (chuyến B hiện tại vừa tự cất) — không rỗng */
    expect(kho.chuyenDaCat.length).toBeGreaterThan(0)
    expect(kho.chuyenDaCat.some((v) => v.id === v2.id)).toBe(true)
  })
})

describe('xoaVe & nhãn', () => {
  it('xoá đúng vé theo id', () => {
    const ve = catChuyenLenKe(kho)
    expect(xoaVe(kho, ve.id)).toBe(true)
    expect(kho.chuyenDaCat).toHaveLength(0)
    expect(xoaVe(kho, ve.id)).toBe(false)
  })

  it('nhãn vé đúng ba dòng số liệu của M9', () => {
    const n = nhanVe(catChuyenLenKe(kho))
    expect(n.tuyen).toBe('Chuyến mẫu')
    expect(n.ngay).toBe('01/08 – 06/08')
    expect(n.soDong).toBe('61')
    expect(n.tong).toContain('₫')
    expect(n.vi).toContain('THB')
  })

  it('coGiDeCat: sổ trống thì không có gì để cất', () => {
    expect(coGiDeCat(kho)).toBe(true)
    applyData(khoMacDinh(), kho)
    kho.chuyenDaCat = []
    expect(coGiDeCat(kho)).toBe(false)
  })

  it('ngayGon: iso → dd/mm, rác giữ nguyên', () => {
    expect(ngayGon('2026-08-01')).toBe('01/08')
    expect(ngayGon('Ngày cuối')).toBe('Ngày cuối')
  })
})
