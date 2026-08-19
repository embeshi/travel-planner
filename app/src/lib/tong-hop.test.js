import { describe, it, expect } from 'vitest'
import { tongChiPhiCaChuyen, tongDaDoi, baConSoVanTay, daChiHomNay, dongCuaHomNay,
  coCauTheoDanhMuc, coCauTheoKenh, trungBinhMoiNgay, soVoiDuTru } from './tong-hop.js'
import { CHUA_PHAN_LOAI } from './kho.js'
import { khoMacDinh, applyData } from './kho.js'
import { soMau } from './du-lieu-mau.js'

const kho = (obj) => applyData(obj, khoMacDinh())

describe('tongChiPhiCaChuyen · thiếu tỷ giá thì phải BÁO, không cộng 0', () => {
  it('có tiền mà thiếu tỷ giá → không cộng vào tổng, và báo thiếu', () => {
    /* Nếu lặng lẽ cộng 0 thì người dùng nhìn tổng tưởng đã đủ.
       Đây là lỗi nguy hiểm hơn hiện sai số, vì nó không có dấu hiệu gì. */
    const k = kho({ rows: [{ id: 'a', tripCost: '1000' }], currency: 'THB', rate: null })
    const r = tongChiPhiCaChuyen(k)
    expect(r.tong).toBe(0)
    expect(r.thieuTyGia).toEqual(['THB'])
  })

  it('không có tiền thì không báo thiếu tỷ giá', () => {
    const k = kho({ rows: [], rate: null })
    expect(tongChiPhiCaChuyen(k).thieuTyGia).toEqual([])
  })

  it('cộng cả hai khối khi đủ tỷ giá', () => {
    const k = kho({
      rows: [{ id: 'a', tripCost: '100' }], rate: 700, currency: 'THB',
      bookings: [{ id: 'b', name: 'Vé', cost: '10' }], bkRate: 30000, bkCurrency: 'GBP'
    })
    const r = tongChiPhiCaChuyen(k)
    expect(r.tong).toBe(100 * 700 + 10 * 30000)
    expect(r.thieuTyGia).toEqual([])
  })

  it('thiếu cả hai tỷ giá thì báo cả hai', () => {
    const k = kho({
      rows: [{ id: 'a', tripCost: '100' }], rate: null, currency: 'THB',
      bookings: [{ id: 'b', name: 'Vé', cost: '10' }], bkRate: null, bkCurrency: 'GBP'
    })
    expect(tongChiPhiCaChuyen(k).thieuTyGia).toEqual(['THB', 'GBP'])
  })

  it('ô tiền rỗng tính là 0, không thành NaN kéo hỏng cả tổng', () => {
    const k = kho({ rows: [{ id: 'a', tripCost: '' }, { id: 'b', tripCost: '100' }], rate: 700 })
    expect(tongChiPhiCaChuyen(k).tong).toBe(70000)
  })
})

describe('tongDaDoi', () => {
  it('cộng cột fx của mọi lần đổi tiền', () => {
    const k = kho({ cash: [{ id: '1', fx: '1000' }, { id: '2', fx: '2000' }, { id: '3', fx: '' }] })
    expect(tongDaDoi(k)).toBe(3000)
  })
})

describe('baConSoVanTay · tiêu chí nghiệm thu của nghi thức', () => {
  it('cho đúng ba con số trên bộ dữ liệu mẫu', () => {
    const v = baConSoVanTay(kho(soMau()))
    expect(v.soDongLichTrinh).toBe(61)
    expect(v.tongChiPhiVnd).toBeCloseTo(38121045.600, 2)
    expect(v.viTienMatConLai).toBeCloseTo(2259.71, 2)
    expect(v.donViVi).toBe('THB')
    expect(v.thieuTyGia).toEqual([])
  })

  it('sổ trống cho ba số 0 — và đây là dấu hiệu phải DỪNG TAY', () => {
    /* Nghi thức mục 03: mở v10 thấy trống trơn thì không gõ gì cả.
       Ba con số bằng 0 chính là cái phải nhận ra ngay. */
    const v = baConSoVanTay(khoMacDinh())
    expect(v.soDongLichTrinh).toBe(0)
    expect(v.tongChiPhiVnd).toBe(0)
    expect(v.viTienMatConLai).toBe(0)
  })
})

describe('daChiHomNay · chỉ số sống còn của màn Hôm nay', () => {
  const k = () => kho({
    rows: [
      { id: 'a', date: '2026-08-04', tripCost: '120' },
      { id: 'b', date: '2026-08-04', tripCost: '85' },
      { id: 'c', date: '2026-08-05', tripCost: '900' },
      { id: 'd', date: '', tripCost: '500' }
    ]
  })

  it('chỉ cộng dòng đúng ngày hôm nay', () => {
    expect(daChiHomNay(k(), '2026-08-04')).toBe(205)
  })

  it('dòng chưa ghi ngày KHÔNG được cộng vào', () => {
    /* Đang gõ dở một dòng trống không có nghĩa là hôm nay đã tiêu thêm. */
    expect(daChiHomNay(k(), '')).toBe(0)
  })

  it('ngày không có dòng nào thì bằng 0', () => {
    expect(daChiHomNay(k(), '2026-08-09')).toBe(0)
  })

  it('dongCuaHomNay lấy đúng những dòng của ngày đó', () => {
    expect(dongCuaHomNay(k(), '2026-08-04').map((r) => r.id)).toEqual(['a', 'b'])
  })
})

describe('cơ cấu chi tiêu · màn Tổng kết', () => {
  const k = () => kho({
    rate: 700, currency: 'THB',
    rows: [
      { id: 'a', date: '2026-08-01', tripCost: '400', cat: '🍜 Ăn uống', pay: 'Tiền mặt' },
      { id: 'b', date: '2026-08-01', tripCost: '300', cat: '🚕 Di chuyển', pay: 'Momo' },
      { id: 'c', date: '2026-08-02', tripCost: '200', cat: '🍜 Ăn uống', pay: 'Tiền mặt' },
      { id: 'd', date: '2026-08-02', tripCost: '100', pay: '' },
      { id: 'e', date: '2026-08-02', tripCost: '0', cat: '🎟 Vé', pay: 'Zalo' }
    ],
    hotel: { checkin: '2026-08-01', checkout: '2026-08-04', name: '', address: '' }
  })

  it('gom đúng theo danh mục, xếp tiền giảm dần', () => {
    const { ds, tong } = coCauTheoDanhMuc(k())
    expect(tong).toBe(1000)
    expect(ds[0]).toMatchObject({ ten: '🍜 Ăn uống', tien: 600 })
    expect(ds[0].phanTram).toBeCloseTo(60, 5)
    expect(ds[1]).toMatchObject({ ten: '🚕 Di chuyển', tien: 300 })
  })

  it('dòng chưa phân loại vẫn được đếm, không bị bỏ quên', () => {
    const ten = coCauTheoDanhMuc(k()).ds.map((x) => x.ten)
    expect(ten).toContain(CHUA_PHAN_LOAI)
  })

  it('dòng 0 đồng không tạo ra một lát bánh rỗng', () => {
    expect(coCauTheoDanhMuc(k()).ds.map((x) => x.ten)).not.toContain('🎟 Vé')
  })

  it('gom theo kênh thanh toán, dòng chưa chọn gom riêng', () => {
    const { ds } = coCauTheoKenh(k())
    expect(ds.find((x) => x.ten === 'Tiền mặt').tien).toBe(600)
    expect(ds.find((x) => x.ten === 'Chưa chọn').tien).toBe(100)
  })

  it('tổng các phần trăm bằng 100', () => {
    const t = coCauTheoDanhMuc(k()).ds.reduce((s, x) => s + x.phanTram, 0)
    expect(t).toBeCloseTo(100, 5)
  })
})

describe('trungBinhMoiNgay · chia cho SỐ NGÀY CỦA CHUYẾN', () => {
  it('ngày không tiêu đồng nào vẫn tính là một ngày', () => {
    /* Bỏ ngày rỗng ra khỏi mẫu số là thổi trung bình cao lên — sai kiểu
       «so sai phạm trù» mà mục 05 PRD cấm. */
    const k2 = kho({
      rate: 1, rows: [{ id: 'a', date: '2026-08-01', tripCost: '400' }],
      hotel: { checkin: '2026-08-01', checkout: '2026-08-04', name: '', address: '' }
    })
    const r = trungBinhMoiNgay(k2)
    expect(r.songay).toBe(4)
    expect(r.moiNgay).toBe(100)
  })

  it('chưa có mốc chuyến thì không đoán bừa', () => {
    expect(trungBinhMoiNgay(khoMacDinh())).toBe(null)
  })
})

describe('soVoiDuTru', () => {
  it('tính đúng chênh lệch và phần trăm', () => {
    const k2 = kho({ rate: 1, budget: '1000', rows: [{ id: 'a', tripCost: '960' }] })
    expect(soVoiDuTru(k2)).toMatchObject({ duTru: 1000, thucTe: 960, chenh: -40 })
    expect(soVoiDuTru(k2).phanTram).toBeCloseTo(-4, 5)
  })

  it('chưa đặt ngân sách thì trả null, KHÔNG báo «vượt 100%»', () => {
    const k2 = kho({ rate: 1, rows: [{ id: 'a', tripCost: '500' }] })
    expect(soVoiDuTru(k2)).toBe(null)
  })
})
