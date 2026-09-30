import { describe, it, expect } from 'vitest'
import { nhipChi } from './nhip-chi.js'
import { khoMacDinh } from './kho.js'

const dung = (them = {}) => {
  const k = khoMacDinh()
  k.currency = 'THB'; k.rate = 700
  k.hotel.checkin = '2026-08-01'; k.hotel.checkout = '2026-08-06'
  /* mỗi ngày 100 THB tiền mặt, ghi tới hôm nay 04/08 (4 ngày). Ví còn lại
     trừ MỌI dòng Tiền mặt đã ghi — kể cả ngày tương lai — cùng định nghĩa
     với thẻ KPI, nên fixture không ghi trước ngày mai. */
  k.rows = ['01', '02', '03', '04'].map((d, i) => ({ id: 'r' + i, date: '2026-08-' + d, tripCost: '100', pay: 'Tiền mặt' }))
  return Object.assign(k, them)
}

describe('✦ nhịp chi · tính từ số liệu thật, thiếu thì nói thẳng', () => {
  it('so dự trù: 4 ngày đầu tiêu 280.000 ₫ trên quỹ 1.000.000 ₫/6 ngày → chậm 58%', () => {
    const n = nhipChi(dung({ budget: '1000000' }), '2026-08-04')
    expect(n.du).toBe(true)
    expect(n.chu).toContain('4 ngày đầu bạn tiêu chậm hơn dự trù 58%')
  })
  it('tiêu nhanh hơn thì nói «nhanh», và gói bay trả trước không tính vào quỹ lịch trình', () => {
    const k = dung({ budget: '500000', bkRate: 1000, bookings: [{ cost: '200' }] })   /* quỹ = 300.000 */
    const n = nhipChi(k, '2026-08-04')            /* dự trù tới nay 200.000 · thực 280.000 → +40% */
    expect(n.chu).toContain('nhanh hơn dự trù 40%')
  })
  it('ví đủ tới cuối chuyến: đổi 1.000, tiêu 100/ngày, còn 2 ngày → dư 400', () => {
    const n = nhipChi(dung({ cash: [{ vnd: '700000', fx: '1000' }] }), '2026-08-04')
    expect(n.chu).toContain('đủ tới cuối chuyến (còn dư khoảng 400 THB)')
  })
  it('ví sắp hết: đổi 450 → còn 50, nhịp 100/ngày → hết ngay hôm nay (ngày thứ 4/6)', () => {
    const n = nhipChi(dung({ cash: [{ vnd: '315000', fx: '450' }] }), '2026-08-04')
    expect(n.chu).toContain('sẽ hết vào ngày 04/08 (ngày thứ 4/6)')
  })
  it('ví đã âm → nhắc đổi thêm', () => {
    const n = nhipChi(dung({ cash: [{ vnd: '70000', fx: '100' }] }), '2026-08-04')
    expect(n.chu).toContain('đã cạn')
  })
  it('ngày đầu tiên → chưa có nhịp; không dự trù không tiền mặt → nói thiếu dữ liệu', () => {
    expect(nhipChi(dung({ budget: '1000000' }), '2026-08-01').du).toBe(false)
    const k = dung(); k.rows.forEach((r) => { r.pay = 'Thẻ ngân hàng' })
    const n = nhipChi(k, '2026-08-04')
    expect(n.du).toBe(false)
    expect(n.chu).toContain('Chưa đủ dữ liệu')
  })
  it('chưa có ngày đi → không đoán', () => {
    expect(nhipChi(khoMacDinh(), '2026-08-04').du).toBe(false)
  })
})
