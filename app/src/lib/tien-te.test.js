import { describe, it, expect } from 'vitest'
import { TIEN_TE, nhanTienTe, docTyGia, tongDoiTien, loiNhacTienMat, tongGoiBay } from './tien-te.js'
import { khoMacDinh } from './kho.js'

describe('TIEN_TE · đúng 12 loại, đúng mã và thứ tự v9.6', () => {
  it('mã tiền là thứ nằm trong sổ — khớp từng chữ với menu v9.6', () => {
    expect(TIEN_TE.map((t) => t.ma)).toEqual(
      ['USD', 'GBP', 'EUR', 'JPY', 'KRW', 'CNY', 'THB', 'SGD', 'TWD', 'MYR', 'AUD', 'HKD'])
  })
  it('nhãn hiện đúng kiểu «THB – Baht Thái (฿)»', () => {
    expect(nhanTienTe('THB')).toBe('THB – Baht Thái (฿)')
    expect(nhanTienTe('XYZ')).toBe('XYZ')          /* mã lạ trong sổ cũ vẫn hiện, không nổ */
  })
})

describe('docTyGia · như v9.6: hữu hạn và > 0 mới là tỷ giá', () => {
  it('số thường đọc được', () => {
    expect(docTyGia('784.28')).toBe(784.28)
    expect(docTyGia('34000')).toBe(34000)
  })
  it('rỗng, rác, 0, âm → null chứ KHÔNG phải 0 (0 nhân vào tổng là ra 0 ₫ im lặng)', () => {
    expect(docTyGia('')).toBe(null)
    expect(docTyGia('abc')).toBe(null)
    expect(docTyGia('0')).toBe(null)
    expect(docTyGia('-5')).toBe(null)
  })
})

describe('tongDoiTien · tỷ giá trung bình thực tế', () => {
  it('cộng đúng và chia đúng', () => {
    const k = khoMacDinh()
    k.cash = [{ vnd: '7200000', fx: '10000' }, { vnd: '3600000', fx: '5000' }]
    expect(tongDoiTien(k)).toEqual({ vnd: 10800000, fx: 15000, tyGiaTB: 720 })
  })
  it('chưa đổi gì thì trung bình là null, không chia cho 0', () => {
    expect(tongDoiTien(khoMacDinh()).tyGiaTB).toBe(null)
  })
})

describe('loiNhacTienMat · ba lời nhắc nguyên văn v9.6, chỉ so với dòng «Tiền mặt»', () => {
  const dung = (cash, rows) => {
    const k = khoMacDinh(); k.currency = 'THB'; k.cash = cash; k.rows = rows; return k
  }
  it('đủ → ✓ kèm số dư', () => {
    const n = loiNhacTienMat(dung([{ fx: '1000' }], [
      { tripCost: '300', pay: 'Tiền mặt' }, { tripCost: '5000', pay: 'Thẻ ngân hàng' }]))
    expect(n.kieu).toBe('du')
    expect(n.chu).toContain('✓ Đủ')
    expect(n.chu).toContain('còn dư khoảng 700 THB')
  })
  it('vượt → nhắc đổi thêm, KHÔNG tính dòng trả thẻ vào', () => {
    const n = loiNhacTienMat(dung([{ fx: '1000' }], [{ tripCost: '1300', pay: 'Tiền mặt' }]))
    expect(n.kieu).toBe('vuot')
    expect(n.chu).toContain('vượt số tiền mặt đã đổi khoảng 300 THB')
  })
  it('đã đổi mà chưa dòng nào chọn Tiền mặt → mẹo', () => {
    const n = loiNhacTienMat(dung([{ fx: '1000' }], [{ tripCost: '99', pay: 'Momo' }]))
    expect(n.kieu).toBe('meo')
    expect(n.chu).toContain('Mẹo: chọn «Tiền mặt»')
  })
  it('chưa đổi tiền → im lặng', () => {
    expect(loiNhacTienMat(dung([], [{ tripCost: '99', pay: 'Tiền mặt' }]))).toEqual({ kieu: '', chu: '' })
  })
})

describe('tongGoiBay', () => {
  it('có tỷ giá thì ra VNĐ, thiếu thì null — không ra 0 ₫ giả', () => {
    const k = khoMacDinh(); k.bookings = [{ cost: '520' }]
    expect(tongGoiBay(k)).toEqual({ fx: 520, vnd: null })
    k.bkRate = 34000
    expect(tongGoiBay(k).vnd).toBe(520 * 34000)
  })
})
