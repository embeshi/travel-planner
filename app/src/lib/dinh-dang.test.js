import { describe, it, expect } from 'vitest'
import { uid, fmtVND, fmtFx, num, tyGiaThucTe } from './dinh-dang.js'

describe('fmtVND', () => {
  it('làm tròn và chấm phân cách nghìn kiểu Việt', () => {
    expect(fmtVND(1234567.6)).toBe('1.234.568 ₫')
    expect(fmtVND(0)).toBe('0 ₫')
  })
  it('khớp con số app v9.6 hiện lên khi chạy thật', () => {
    /* 520 GBP × 34.902,959956 = 18.149.539 ₫ — đúng số trên màn hình v9.6 */
    expect(fmtVND(520 * 34902.959956)).toBe('18.149.539 ₫')
    /* 200 THB × 784,283273 = 156.857 ₫ */
    expect(fmtVND(200 * 784.283273)).toBe('156.857 ₫')
  })
})

describe('fmtFx', () => {
  it('giữ tối đa hai chữ số lẻ, phẩy là dấu thập phân', () => {
    expect(fmtFx(784.283273)).toBe('784,28')
    expect(fmtFx(520)).toBe('520')
  })
})

describe('num', () => {
  it('rác thì trả 0, không bao giờ trả NaN', () => {
    /* Một NaN lọt vào phép cộng là cả bảng tổng hỏng theo. */
    expect(num('')).toBe(0)
    expect(num(null)).toBe(0)
    expect(num(undefined)).toBe(0)
    expect(num('abc')).toBe(0)
    expect(num({})).toBe(0)
    expect(Number.isNaN(num('xyz'))).toBe(false)
  })
  it('đọc được số thường', () => {
    expect(num('1.5')).toBe(1.5)
    expect(num('120')).toBe(120)
    expect(num(0)).toBe(0)
  })
  it('CHỐT hành vi đã có từ v9.6: dấu phẩy thập phân bị cắt', () => {
    /* Không phải test mong muốn, mà là test canh cửa: nếu ai đó sửa `num`
       để hiểu dấu phẩy thì test này đỏ, và người sửa phải chủ động đổi nó
       cùng một lô có nghiệm thu riêng — chứ không để nó đổi lén. */
    expect(num('12,5')).toBe(12)
  })
})

describe('tyGiaThucTe', () => {
  it('tính đúng đồng trên một ngoại tệ', () => {
    expect(tyGiaThucTe(7200000, 10000)).toBe(720)
  })
  it('thiếu dữ liệu thì trả null để giao diện hiện dấu —', () => {
    expect(tyGiaThucTe(0, 10000)).toBe(null)
    expect(tyGiaThucTe(7200000, 0)).toBe(null)
    expect(tyGiaThucTe('', '')).toBe(null)
  })
})

describe('uid', () => {
  /* KHÔNG test kiểu «sinh N cái rồi đếm xem có trùng không» — đó là test
     nhấp nháy, có ngày đỏ vô cớ rồi làm người ta mất tin vào cả bộ test.

     Đã đo thật: phần ngẫu nhiên luôn đủ 5 ký tự base36 (36⁵ ≈ 60 triệu).
     Sinh 14 id liên tiếp — trùng 0/300 lượt. Sinh 100 — trùng 0/300 lượt.
     Phải ép sinh 2.000 id trong vài mili-giây mới thấy trùng 1,7% lượt.
     App thêm dòng theo nhịp người gõ nên không bao giờ chạm ngưỡng đó.

     Nên ở đây test phần XÁC ĐỊNH ĐƯỢC: id ghép từ mốc thời gian và phần
     ngẫu nhiên, và mốc thời gian đứng trước để id thô cũng xếp theo thời gian. */

  it('ghép mốc thời gian với năm ký tự ngẫu nhiên', () => {
    const u = uid()
    expect(typeof u).toBe('string')
    expect(u).toMatch(/^[0-9a-z]+$/)
    expect(u.startsWith(Date.now().toString(36).slice(0, 6))).toBe(true)
    expect(u.length).toBe(Date.now().toString(36).length + 5)
  })

  it('hai id cách nhau về thời gian thì khác nhau chắc chắn', async () => {
    const a = uid()
    await new Promise((r) => setTimeout(r, 2))
    const b = uid()
    expect(a).not.toBe(b)
  })
})
