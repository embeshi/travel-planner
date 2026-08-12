import { describe, it, expect } from 'vitest'
import { dayKeyInfo, pad2, weekdayOf, soNgayLuuTru } from './ngay.js'

describe('dayKeyInfo', () => {
  it('đọc dạng ô chọn lịch yyyy-mm-dd', () => {
    expect(dayKeyInfo('2026-08-04')).toEqual({
      key: 'd:2026-8-4', none: false, cls: 0, sortNum: 20260804, y: 2026, mo: 8, d: 4
    })
  })

  it('đọc dạng gõ tay 29/10 — không năm', () => {
    const r = dayKeyInfo('29/10')
    expect(r.cls).toBe(0)
    expect(r.d).toBe(29)
    expect(r.mo).toBe(10)
    expect(r.y).toBe(0)
    expect(r.sortNum).toBe(1029)
  })

  it('năm hai chữ số thành 20xx', () => {
    expect(dayKeyInfo('29/10/26').y).toBe(2026)
    expect(dayKeyInfo('29/10/26').sortNum).toBe(20261029)
  })

  it('chấm và gạch cũng là dấu ngăn hợp lệ', () => {
    expect(dayKeyInfo('29.10.2026').sortNum).toBe(20261029)
    expect(dayKeyInfo('29-10-2026').sortNum).toBe(20261029)
  })

  it('một con số trần là «ngày thứ mấy của chuyến»', () => {
    const r = dayKeyInfo('3')
    expect(r.cls).toBe(1)
    expect(r.sortNum).toBe(3)
    expect(r.label).toBe('Ngày 3')
  })

  it('chữ tự do vẫn xếp được, không làm vỡ bảng', () => {
    const r = dayKeyInfo('Ngày cuối')
    expect(r.cls).toBe(2)
    expect(r.key).toBe('ngày cuối')
    expect(r.label).toBe('Ngày cuối')
  })

  it('rỗng thì gom vào nhóm «chưa ghi ngày»', () => {
    expect(dayKeyInfo('')).toEqual({
      key: '__none__', none: true, cls: 3, sortNum: 0, label: 'Chưa ghi ngày'
    })
    expect(dayKeyInfo(null).none).toBe(true)
    expect(dayKeyInfo('   ').none).toBe(true)
  })

  it('bốn hạng cls xếp đúng thứ tự ưu tiên: ngày thật → số → chữ → rỗng', () => {
    expect(dayKeyInfo('2026-08-04').cls).toBeLessThan(dayKeyInfo('3').cls)
    expect(dayKeyInfo('3').cls).toBeLessThan(dayKeyInfo('Ngày cuối').cls)
    expect(dayKeyInfo('Ngày cuối').cls).toBeLessThan(dayKeyInfo('').cls)
  })
})

describe('weekdayOf', () => {
  it('trả thứ viết tắt kiểu Việt', () => {
    expect(weekdayOf(2026, 8, 4)).toBe('T3')
    expect(weekdayOf(2026, 9, 11)).toBe('T6')
  })
  it('thiếu thành phần thì trả chuỗi rỗng, không trả «Invalid Date»', () => {
    expect(weekdayOf(0, 10, 29)).toBe('')
    expect(weekdayOf(2026, 0, 29)).toBe('')
    expect(weekdayOf(2026, 10, 0)).toBe('')
  })
})

describe('pad2', () => {
  it('đệm số 0 cho số một chữ số', () => {
    expect(pad2(4)).toBe('04')
    expect(pad2(12)).toBe('12')
  })
})

describe('soNgayLuuTru', () => {
  it('khớp con số app v9.6 hiện lên khi chạy thật', () => {
    /* Lúc chạy thử v9.6: check-in 10/09/2026, check-out 13/09/2026
       → màn hình hiện «4 ngày 3 đêm». */
    expect(soNgayLuuTru('2026-09-10', '2026-09-13')).toEqual({
      nhan: '4 ngày 3 đêm', loi: false, dem: 3
    })
  })
  it('cùng ngày là đi trong ngày', () => {
    expect(soNgayLuuTru('2026-09-10', '2026-09-10').nhan).toBe('Trong ngày')
  })
  it('check-out trước check-in thì báo lỗi', () => {
    const r = soNgayLuuTru('2026-09-13', '2026-09-10')
    expect(r.loi).toBe(true)
    expect(r.nhan).toBe('Check-out cần sau check-in')
  })
  it('thiếu một đầu thì hiện dấu —', () => {
    expect(soNgayLuuTru('', '2026-09-13').nhan).toBe('—')
    expect(soNgayLuuTru('2026-09-10', '').nhan).toBe('—')
  })
})
