import { describe, it, expect } from 'vitest'
import { khoMacDinh, applyData, ruotCuaBackup, dongMoi, danhMucCua, CHUA_PHAN_LOAI, DANH_MUC, danhMucKeTiep, KENH_THANH_TOAN } from './kho.js'
import { STORAGE_KEY } from './luu-tru.js'
import { soMau, backupMau } from './du-lieu-mau.js'

/* ============================================================
   TEST CANH CỬA — bảo vệ «bốn thứ giữ cho dữ liệu cũ tự hiện ra».
   Hai test này đỏ nghĩa là dữ liệu cũ sắp thành vô hình.
   ============================================================ */
describe('CANH CỬA · bốn thứ không được đổi', () => {
  it('khoá lưu trên máy phải đúng y nguyên chuỗi của v9.6', () => {
    /* Đổi một ký tự — kể cả đổi thành -v10 cho hợp phiên bản — là bản
       offline trên máy chủ dự án thành vô hình. CLAUDE.md luật 2b. */
    expect(STORAGE_KEY).toBe('ke-hoach-du-lich-v1')
  })

  it('hình dạng sổ: 20 khối của v9.6, cộng đúng MỘT khối mới của v10', () => {
    /* Danh sách này cố tình khó sửa. Thêm bớt một tên ở đây phải là quyết định
       có ý thức, không được trôi vào lúc nào không biết.
       `budget` là khối MỚI của v10 — xem cảnh báo bất đối xứng trong CLAUDE.md. */
    expect(Object.keys(khoMacDinh()).sort()).toEqual([
      '_updatedAt', 'activeNote', 'activePack', 'bkCurrency', 'bkRate', 'bookings',
      'budget', 'cash', 'currency', 'essentials', 'food', 'hotel', 'makeup',
      'packSeed1', 'packSeed2', 'places', 'rate', 'rows', 'shopping', 'skincare', 'title'
    ])
  })

  it('budget nhận cả chuỗi lẫn số, sai kiểu thì về rỗng', () => {
    const k = khoMacDinh()
    applyData({ budget: 31900000 }, k); expect(k.budget).toBe('31900000')
    applyData({ budget: '31900000' }, k); expect(k.budget).toBe('31900000')
    applyData({ budget: {} }, k); expect(k.budget).toBe('')
    applyData({}, k); expect(k.budget).toBe('')
  })

  it('khối hotel giữ đúng bốn cột', () => {
    expect(Object.keys(khoMacDinh().hotel).sort())
      .toEqual(['address', 'checkin', 'checkout', 'name'])
  })
})

describe('applyData · nâng cấp dữ liệu bản cũ', () => {
  it('cộng preCost của bản rất cũ vào tripCost rồi gỡ bỏ', () => {
    const k = khoMacDinh()
    applyData({ rows: [{ id: 'a', tripCost: '100', preCost: '50' }] }, k)
    expect(k.rows[0].tripCost).toBe('150')
    expect('preCost' in k.rows[0]).toBe(false)
  })

  it('bỏ dòng gói bay trống của bản cũ', () => {
    const k = khoMacDinh()
    applyData({ bookings: [{ id: 'a' }, { id: 'b', name: 'Vé' }] }, k)
    expect(k.bookings).toHaveLength(1)
    expect(k.bookings[0].name).toBe('Vé')
  })

  it('dòng cũ chỉ có type thì đặt tên tiếng Việt', () => {
    const k = khoMacDinh()
    applyData({ bookings: [
      { id: 'a', type: 'flight', cost: '100' },
      { id: 'b', type: 'hotel', cost: '200' }
    ] }, k)
    expect(k.bookings.map((b) => b.name)).toEqual(['Vé máy bay', 'Khách sạn'])
  })
})

describe('applyData · sổ méo cũng phải mở được', () => {
  it('đầu vào rác không ném lỗi, không làm hỏng kho', () => {
    const k = khoMacDinh()
    for (const rac of [null, undefined, 0, '', 'abc', [], true]) {
      expect(() => applyData(rac, k)).not.toThrow()
    }
    expect(k.rows).toEqual([])
    expect(k.title).toBe('Chuyến đi của mình')
  })

  it('sai kiểu thì rơi về mặc định, không nhận bừa', () => {
    const k = khoMacDinh()
    applyData({ title: 123, rate: 'abc', rows: 'không phải mảng', hotel: 'sai' }, k)
    expect(k.title).toBe('Chuyến đi của mình')
    expect(k.rate).toBe(null)
    expect(k.rows).toEqual([])
    expect(k.hotel.name).toBe('')
  })

  it('rate vô cực hoặc NaN bị từ chối', () => {
    const k = khoMacDinh()
    applyData({ rate: Infinity }, k); expect(k.rate).toBe(null)
    applyData({ rate: NaN }, k); expect(k.rate).toBe(null)
    applyData({ rate: 720 }, k); expect(k.rate).toBe(720)
  })
})

describe('applyData · giữ đường lui 60 giây', () => {
  it('trường mới cat và done đi qua applyData vẫn còn nguyên', () => {
    /* Đã kiểm: applyData của v9.6 cũng trả về nguyên object dòng, nên
       cat/done sống sót cả hai chiều. Đó là điều kiện để lùi về v9.6
       mà không mất dữ liệu v10 đã ghi. CLAUDE.md luật 3 và 8. */
    const k = khoMacDinh()
    applyData({ rows: [{ id: 'a', tripCost: '200', cat: '🎟 Vé', done: true }] }, k)
    expect(k.rows[0].cat).toBe('🎟 Vé')
    expect(k.rows[0].done).toBe(true)
  })

  it('dòng cũ không có cat thì hiện «Chưa phân loại», không tự điền bừa', () => {
    const k = khoMacDinh()
    applyData({ rows: [{ id: 'a', tripCost: '200' }] }, k)
    expect('cat' in k.rows[0]).toBe(false)
    expect(danhMucCua(k.rows[0])).toBe(CHUA_PHAN_LOAI)
    expect(danhMucCua({ cat: '  ' })).toBe(CHUA_PHAN_LOAI)
    expect(danhMucCua({ cat: '🍜 Ăn uống' })).toBe('🍜 Ăn uống')
  })

  it('dòng mới của v10 có cat rỗng, không phải cat đoán bừa', () => {
    expect(dongMoi().cat).toBe('')
  })
})

describe('ruotCuaBackup', () => {
  it('gỡ được vỏ ngoài của file backup', () => {
    expect(ruotCuaBackup(backupMau()).rows).toHaveLength(61)
  })
  it('đưa thẳng state vào cũng nhận', () => {
    expect(ruotCuaBackup(soMau()).rows).toHaveLength(61)
  })
})

describe('danhMucKeTiep · chip xoay vòng (F3)', () => {
  it('chưa có danh mục thì bấm lần đầu ra món đầu tiên', () => {
    expect(danhMucKeTiep('')).toBe('🍜 Ăn uống')
    expect(danhMucKeTiep(undefined)).toBe('🍜 Ăn uống')
  })
  it('xoay đúng thứ tự sáu danh mục', () => {
    let c = ''
    const vong = []
    for (let i = 0; i < 6; i++) { c = danhMucKeTiep(c); vong.push(c) }
    expect(vong).toEqual(DANH_MUC.map((d) => d.ma))
  })
  it('hết vòng thì quay về rỗng — không có ngõ cụt', () => {
    expect(danhMucKeTiep('📦 Khác')).toBe('')
  })
})

describe('KENH_THANH_TOAN · không được đổi chữ', () => {
  it('giữ đúng bốn kênh mà dữ liệu thật đang dùng', () => {
    /* Đổi một chữ là 61 dòng cũ rơi khỏi phép đối chiếu ví tiền mặt,
       vì viTienMatConLai lọc theo đúng chuỗi «Tiền mặt». */
    expect(KENH_THANH_TOAN).toContain('Tiền mặt')
    expect(KENH_THANH_TOAN).toContain('Momo')
    expect(KENH_THANH_TOAN).toContain('Zalo')
    expect(KENH_THANH_TOAN).toContain('Thẻ ngân hàng')
  })
})
