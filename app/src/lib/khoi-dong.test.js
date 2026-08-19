// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { trangThai, khoiDong, luuNgay, datHanNap } from './khoi-dong.js'
import { coDuocGhiChua, datLaiCongDoc } from './dong-bo.js'
import { kho, applyData, khoMacDinh } from './kho.js'
import { STORAGE_KEY } from './luu-tru.js'

beforeEach(() => {
  datHanNap(40)          /* thật là 8000ms; hạ xuống cho bài kiểm chạy nhanh */
  window.localStorage.clear()
  datLaiCongDoc()
  applyData(khoMacDinh(), kho)
})

describe('LUẬT VÀNG · trình tự khởi động không được đảo', () => {
  it('trước khi khởi động thì cổng ghi ĐÓNG', () => {
    expect(coDuocGhiChua()).toBe(false)
  })

  it('luuNgay() gọi trước khi đọc xong thì KHÔNG ghi gì', async () => {
    /* Đây chính là kịch bản duy nhất xoá được dữ liệu: dựng sổ trắng
       rồi tự lưu đè trước khi kịp đọc sổ cũ. */
    const kq = await luuNgay()
    expect(kq.viec).toBe('chua-doc-xong')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(null)
  })

  it('đọc xong sổ cũ rồi mới mở cổng ghi', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      title: 'Chuyến cũ', rows: [{ id: 'a', tripCost: '100' }]
    }))
    await khoiDong()
    expect(kho.title).toBe('Chuyến cũ')
    expect(kho.rows).toHaveLength(1)
    expect(coDuocGhiChua()).toBe(true)
    expect(trangThai.value).toBe('san-sang')
  })

  it('máy chưa có gì thì vẫn mở cổng ghi — sổ trống hợp lệ khi thật sự trống', async () => {
    await khoiDong()
    expect(trangThai.value).toBe('san-sang')
    expect(kho.rows).toHaveLength(0)
  })

  it('sau khi khởi động thì luuNgay() ghi được xuống máy', async () => {
    await khoiDong()
    applyData({ title: 'Bangkok', rows: [{ id: 'x', tripCost: '5' }] }, kho)
    const kq = await luuNgay()
    expect(kq.viec).toBe('da-luu')
    const luu = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    expect(luu.title).toBe('Bangkok')
    expect(luu.rows).toHaveLength(1)
  })

  it('KHÔNG tự đăng nhập, không tự nối máy chủ khi chưa có phiên', async () => {
    await khoiDong()
    /* supabase-js không tải được trong jsdom → app vẫn phải chạy bình thường */
    expect(trangThai.value).toBe('san-sang')
  })

  it('CDN treo im lặng thì không được kéo app treo theo', async () => {
    /* jsdom không tải script ngoài, nên onload/onerror đều không nổ —
       đúng bằng tình huống mạng chặn im lặng ngoài đời. Hẹn giờ phải cứu.
       Không có hẹn giờ thì bài kiểm này treo tới hết giờ. */
    const batDau = Date.now()
    await khoiDong()
    expect(trangThai.value).toBe('san-sang')
    expect(Date.now() - batDau).toBeLessThan(1000)
  })
})

describe('khoá lưu vẫn là khoá của v9.6', () => {
  it('ghi đúng vào ke-hoach-du-lich-v1', async () => {
    await khoiDong()
    applyData({ title: 'X' }, kho)
    await luuNgay()
    expect(window.localStorage.getItem('ke-hoach-du-lich-v1')).toBeTruthy()
  })
})
