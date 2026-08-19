import { describe, it, expect } from 'vitest'
import { tachCau, duDeGhi, doiSoKieuViet } from './tach-cau.js'
import { KENH_THANH_TOAN, DANH_MUC } from './kho.js'

describe('doiSoKieuViet · SAI CHỖ NÀY LÀ SAI GẤP NGHÌN LẦN', () => {
  it('dấu chấm + đúng ba chữ số là phân cách nghìn', () => {
    /* Người Việt gõ «1.200» là một nghìn hai. Đọc thẳng bằng parseFloat
       ra 1,2 — sai gấp một nghìn lần, mà không có dấu hiệu gì trên màn hình. */
    expect(doiSoKieuViet('1.200')).toBe('1200')
    expect(doiSoKieuViet('12.500')).toBe('12500')
    expect(doiSoKieuViet('1.200.000')).toBe('1200000')
  })

  it('dấu phẩy luôn là dấu thập phân', () => {
    expect(doiSoKieuViet('45,5')).toBe('45.5')
    expect(doiSoKieuViet('1.234,56')).toBe('1234.56')
  })

  it('dấu chấm + một hoặc hai chữ số là thập phân, giữ nguyên', () => {
    expect(doiSoKieuViet('45.5')).toBe('45.5')
    expect(doiSoKieuViet('45.50')).toBe('45.50')
    expect(doiSoKieuViet('0.99')).toBe('0.99')
  })

  it('số trần giữ nguyên', () => {
    expect(doiSoKieuViet('200')).toBe('200')
  })
})

describe('tachCau · câu quen thuộc', () => {
  it('tách đủ bốn ô từ câu mẫu trong PRD', () => {
    expect(tachCau('bolt về khách sạn 120 baht tiền mặt')).toMatchObject({
      activity: 'Bolt về khách sạn', tripCost: '120',
      pay: 'Tiền mặt', cat: '🚕 Di chuyển'
    })
  })

  it('bỏ đơn vị tiền ra khỏi tên hoạt động', () => {
    expect(tachCau('ăn phở 85 baht').activity).toBe('Ăn phở')
    expect(tachCau('vé 200 thb').activity).toBe('Vé')
  })

  it('hiểu hậu tố nghìn', () => {
    expect(tachCau('grab ra sân bay 350k tiền mặt').tripCost).toBe('350000')
    expect(tachCau('ăn 25 nghìn').tripCost).toBe('25000')
  })

  it('viết hoa chữ đầu tên hoạt động', () => {
    expect(tachCau('cà phê 45 zalo').activity).toBe('Cà phê')
  })
})

describe('tachCau · kênh thanh toán trả đúng chuỗi của v9.6', () => {
  it('mọi kênh đọc ra đều nằm trong danh sách chuẩn', () => {
    /* Trả sai chuỗi là dòng đó rơi khỏi phép đối chiếu ví tiền mặt. */
    for (const cau of ['x 10 tiền mặt', 'x 10 momo', 'x 10 zalo', 'x 10 thẻ', 'x 10 visa']) {
      const p = tachCau(cau).pay
      expect(KENH_THANH_TOAN).toContain(p)
    }
  })
  it('«thẻ» ra đúng «Thẻ ngân hàng», không phải «Thẻ»', () => {
    expect(tachCau('mua quà 500 thẻ').pay).toBe('Thẻ ngân hàng')
  })
})

describe('tachCau · ĐOÁN SAI THÌ IM LẶNG', () => {
  it('không đoán được danh mục thì để TRỐNG, không nhét bừa «Khác»', () => {
    /* Ô trống thì người dùng thấy ngay mà sửa. Ô điền bừa thì trôi qua mắt. */
    expect(tachCau('abc xyz 100').cat).toBe('')
  })

  it('không có số tiền thì để trống, không bịa 0', () => {
    expect(tachCau('linh tinh').tripCost).toBe('')
    expect(tachCau('linh tinh').pay).toBe('')
  })

  it('câu rỗng không làm vỡ', () => {
    expect(tachCau('')).toMatchObject({ activity: '', tripCost: '', pay: '', cat: '' })
    expect(tachCau(null).activity).toBe('')
  })

  it('kể lại đọc được những gì, để người dùng biết mà soi', () => {
    expect(tachCau('bolt 120 tiền mặt').doc).toEqual(['số tiền', 'nguồn tiền', 'danh mục'])
    expect(tachCau('linh tinh').doc).toEqual([])
  })
})

describe('tachCau · mọi danh mục đoán ra đều hợp lệ', () => {
  it('không sinh ra danh mục lạ ngoài sáu cái đã chốt', () => {
    const hopLe = DANH_MUC.map((d) => d.ma)
    for (const cau of ['grab 10', 'ăn 10', 'vé 10', 'mua 10', 'khách sạn 10', 'abc 10']) {
      const c = tachCau(cau).cat
      if (c) expect(hopLe).toContain(c)
    }
  })
})

describe('duDeGhi · chặn ghi khi chưa đủ', () => {
  it('thiếu số tiền thì chưa cho ghi', () => {
    expect(duDeGhi(tachCau('linh tinh'))).toBe(false)
    expect(duDeGhi(tachCau('ăn phở'))).toBe(false)
  })
  it('có số tiền dương thì cho', () => {
    expect(duDeGhi(tachCau('ăn phở 85'))).toBe(true)
  })
  it('số 0 không tính là đủ', () => {
    expect(duDeGhi({ tripCost: '0' })).toBe(false)
  })
})
