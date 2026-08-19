import { describe, it, expect } from 'vitest'
import { bam, deLuu, deHien, PHIM } from './ban-phim-so.js'

const go = (chuoi) => chuoi.split('|').reduce((s, p) => bam(s, p), '')

describe('bam · gõ số cơ bản', () => {
  it('nối chữ số', () => expect(go('1|2|0')).toBe('120'))
  it('xoá lùi', () => expect(go('1|2|0|⌫')).toBe('12'))
  it('xoá hết vẫn an toàn', () => expect(go('1|⌫|⌫|⌫')).toBe(''))
  it('không để số 0 dính đầu', () => expect(go('0|5')).toBe('5'))
  it('phím 000 thêm ba số 0', () => expect(go('1|2|000')).toBe('12000'))
  it('000 ở đầu là vô nghĩa, không làm gì', () => {
    expect(go('000')).toBe('')
    expect(go('0|000')).toBe('0')
  })
})

describe('bam · dấu thập phân — chỗ v9.6 được trình duyệt gác hộ', () => {
  it('thêm được dấu, và chỉ một lần', () => {
    expect(go('1|2|,')).toBe('12.')
    expect(go('1|2|,|,')).toBe('12.')
  })
  it('gõ dấu trước số thì thành 0,', () => expect(go(',')).toBe('0.'))
  it('giữ tối đa hai chữ số lẻ', () => {
    expect(go('1|2|,|5|0')).toBe('12.50')
    expect(go('1|2|,|5|0|7')).toBe('12.50')
  })
  it('000 sau dấu cũng bị cắt đúng hạn mức', () => expect(go('1|,|000')).toBe('1.00'))
})

describe('deLuu · chuỗi ghi xuống dữ liệu phải dùng DẤU CHẤM', () => {
  it('giữ khuôn giống 61 dòng đang có trong sổ thật', () => {
    expect(deLuu('236.17')).toBe('236.17')
    expect(deLuu('546')).toBe('546')
  })
  it('gỡ dấu thừa ở đuôi — «12,» là chưa gõ xong, không phải 12,0', () => {
    expect(deLuu('12.')).toBe('12')
  })
  it('rỗng vẫn là rỗng, không hoá thành 0', () => {
    /* Ô rỗng và số 0 là hai chuyện khác nhau: một cái là chưa điền,
       một cái là miễn phí. Nhập nhèm chỗ này là sai số liệu. */
    expect(deLuu('')).toBe('')
    expect(deLuu('.')).toBe('')
  })
})

describe('deHien · chuỗi cho người đọc phải dùng DẤU PHẨY', () => {
  it('đổi dấu chấm thành phẩy, thêm chấm phân cách nghìn', () => {
    expect(deHien('12.50')).toBe('12,50')
    expect(deHien('1200')).toBe('1.200')
    expect(deHien('1234567')).toBe('1.234.567')
    expect(deHien('1234.5')).toBe('1.234,5')
  })
  it('rỗng hiện số 0 cho ô số tiền không trống trơn', () => {
    expect(deHien('')).toBe('0')
  })
})

describe('bàn phím có đủ phím cần thiết', () => {
  it('có phím thập phân — nửa số dòng thật của chủ dự án có phần lẻ', () => {
    expect(PHIM).toContain(',')
    expect(PHIM).toContain('⌫')
    expect(PHIM).toContain('0')
    expect(PHIM.filter((p) => /^[1-9]$/.test(p))).toHaveLength(9)
  })
})
