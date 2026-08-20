// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GhiChiNhanh from './GhiChiNhanh.vue'
import { kho, applyData, khoMacDinh } from '../lib/kho.js'

beforeEach(() => {
  applyData(khoMacDinh(), kho)
  applyData({ currency: 'THB', rate: 700, rows: [] }, kho)
})

const dungSheet = () => mount(GhiChiNhanh, {
  props: { kieu: 'sheet', mo: false, homNay: '2026-08-04' }
})
const phim = (w, k) => w.findAll('.phim__o').find((b) => b.text().trim() === k)
const chip = (w, t) => w.findAll('.chip').find((b) => b.text().includes(t))
/* KHÔNG tìm nút theo chữ «Lưu» — chip danh mục «🏨 Lưu trú» cũng chứa chữ đó
   và đứng trước trong DOM. Bẫy rất tiếng Việt, đã dính một lần.
   Nút chính của linh kiện NutBam luôn mang class .nut--chinh. */
const nutLuu = (w) => w.find('.nut--chinh')

describe('bàn phím số · DẤU PHẨY để hiện, DẤU CHẤM để lưu', () => {
  it('gõ 236,17 thì màn hình hiện dấu phẩy', async () => {
    const w = dungSheet()
    for (const k of ['2', '3', '6', ',', '1', '7']) await phim(w, k).trigger('click')
    expect(w.find('.tien__so').text()).toBe('236,17')
  })

  it('nhưng dữ liệu lưu xuống phải là DẤU CHẤM — đúng khuôn 61 dòng thật', async () => {
    /* Ở bảng lịch trình, <input type="number"> được trình duyệt dịch hộ.
       Bàn phím tự vẽ không có người gác đó, phải tự lo. Lẫn lộn hai thứ
       này là mất tiền lẻ mà không ai thấy. */
    const w = dungSheet()
    for (const k of ['2', '3', '6', ',', '1', '7']) await phim(w, k).trigger('click')
    await nutLuu(w).trigger('click')
    expect(kho.rows).toHaveLength(1)
    expect(kho.rows[0].tripCost).toBe('236.17')
    expect(kho.rows[0].tripCost).toMatch(/^\d+\.\d{2}$/)
  })

  it('có phím thập phân — nửa số dòng thật của chủ dự án có phần lẻ', () => {
    const w = dungSheet()
    expect(phim(w, ',')).toBeTruthy()
    expect(w.findAll('.phim__o')).toHaveLength(12)
  })
})

describe('ghi chi ba chạm', () => {
  it('danh mục → nguồn tiền → Lưu, đúng ba chạm', async () => {
    const w = dungSheet()
    for (const k of ['1', '2', '0']) await phim(w, k).trigger('click')

    await chip(w, 'Ăn uống').trigger('click')      /* chạm 1 */
    await chip(w, 'Tiền mặt').trigger('click')     /* chạm 2 */
    await nutLuu(w).trigger('click')               /* chạm 3 */

    expect(kho.rows).toHaveLength(1)
    expect(kho.rows[0]).toMatchObject({
      date: '2026-08-04', tripCost: '120', cat: '🍜 Ăn uống', pay: 'Tiền mặt', done: false
    })
  })

  it('ngày tự điền bằng hôm nay, không bắt người dùng gõ', async () => {
    const w = dungSheet()
    for (const k of ['5', '0']) await phim(w, k).trigger('click')
    await nutLuu(w).trigger('click')
    expect(kho.rows[0].date).toBe('2026-08-04')
  })

  it('chưa gõ số tiền thì nút Lưu bị khoá — không ghi dòng rỗng', async () => {
    const w = dungSheet()
    expect(nutLuu(w).attributes('disabled')).toBeDefined()
    await nutLuu(w).trigger('click')
    expect(kho.rows).toHaveLength(0)
  })

  it('ghi xong thì dọn sạch ô, lần sau mở ra không dính số cũ', async () => {
    const w = dungSheet()
    for (const k of ['9', '9']) await phim(w, k).trigger('click')
    await chip(w, 'Vé').trigger('click')
    await nutLuu(w).trigger('click')
    expect(w.find('.tien__so').text()).toBe('0')
    expect(w.findAll('.chip--chon')).toHaveLength(0)
  })
})

describe('panel laptop', () => {
  const dungPanel = () => mount(GhiChiNhanh, {
    props: { kieu: 'panel', homNay: '2026-08-04' }
  })

  it('mở sẵn, không phải hộp thoại che nội dung', () => {
    const w = dungPanel()
    expect(w.find('.panel').exists()).toBe(true)
    expect(w.find('dialog').exists()).toBe(false)
  })

  it('Enter ở ô số tiền thì lưu luôn', async () => {
    const w = dungPanel()
    const o = w.findAll('input')
    await o[0].setValue('Cà phê')
    await o[1].setValue('85')
    await o[1].trigger('keydown', { key: 'Enter' })
    expect(kho.rows).toHaveLength(1)
    expect(kho.rows[0].activity).toBe('Cà phê')
    expect(kho.rows[0].tripCost).toBe('85')
  })

  it('Enter lúc đang nặn chữ thì KHÔNG lưu nửa chừng', async () => {
    /* Người dùng gõ tên món tiếng Việt, bấm Enter để chốt dấu — mà app
       lưu luôn thì được một dòng dở dang không ai muốn. */
    const w = dungPanel()
    const o = w.findAll('input')
    await o[0].setValue('Phở')
    await o[1].setValue('85')
    await o[0].trigger('keydown', { key: 'Enter', isComposing: true })
    expect(kho.rows).toHaveLength(0)
  })
})

describe('ô ✦ gõ tự nhiên · KHÔNG BAO GIỜ ghi thẳng', () => {
  const oCau = (w) => w.findAllComponents({ name: 'ONhap' }).at(-1)

  it('đọc câu xong chỉ HIỆN BẢN XEM TRƯỚC, chưa ghi dòng nào', async () => {
    /* PRD mục 05: không tự ghi dữ liệu từ AI khi chưa xác nhận. */
    const w = dungSheet()
    await oCau(w).find('input').setValue('bolt về khách sạn 120 baht tiền mặt')
    await oCau(w).find('input').trigger('keydown', { key: 'Enter' })
    expect(w.find('.ai__xem').exists()).toBe(true)
    expect(kho.rows).toHaveLength(0)
  })

  it('bản xem trước bày đủ bốn ô', async () => {
    const w = dungSheet()
    await oCau(w).find('input').setValue('bolt về khách sạn 120 baht tiền mặt')
    await oCau(w).find('input').trigger('keydown', { key: 'Enter' })
    const chu = w.find('.ai__bang').text()
    expect(chu).toContain('Bolt về khách sạn')
    expect(chu).toContain('120')
    expect(chu).toContain('Tiền mặt')
    expect(chu).toContain('Di chuyển')
  })

  it('bấm «Xác nhận ghi» mới thật sự ghi', async () => {
    const w = dungSheet()
    await oCau(w).find('input').setValue('ăn phở 85 momo')
    await oCau(w).find('input').trigger('keydown', { key: 'Enter' })
    await w.findAll('.ai__nut .nut--chinh')[0].trigger('click')
    expect(kho.rows).toHaveLength(1)
    expect(kho.rows[0]).toMatchObject({ tripCost: '85', pay: 'Momo', cat: '🍜 Ăn uống' })
  })

  it('«Sửa tay» đổ vào ô thường mà KHÔNG ghi', async () => {
    const w = dungSheet()
    await oCau(w).find('input').setValue('taxi 1.200 thẻ')
    await oCau(w).find('input').trigger('keydown', { key: 'Enter' })
    await w.findAll('.ai__nut .nut--vien')[0].trigger('click')
    expect(kho.rows).toHaveLength(0)
    expect(w.find('.tien__so').text()).toBe('1.200')   /* 1200 hiện kiểu Việt */
    expect(w.find('.ai__xem').exists()).toBe(false)
  })

  it('câu không đọc ra số tiền thì KHÓA nút xác nhận', async () => {
    const w = dungSheet()
    await oCau(w).find('input').setValue('linh tinh gì đó')
    await oCau(w).find('input').trigger('keydown', { key: 'Enter' })
    expect(w.findAll('.ai__nut .nut--chinh')[0].attributes('disabled')).toBeDefined()
    expect(kho.rows).toHaveLength(0)
  })

  it('đường làm tay vẫn còn nguyên bên cạnh — không ai bị ép qua cửa ✦', () => {
    const w = dungSheet()
    expect(w.findAll('.phim__o')).toHaveLength(12)
    expect(w.findAll('.chip').length).toBeGreaterThan(0)
  })
})

describe('✦ câu khó · AI chỉ ra tay khi bộ tách offline chịu thua', () => {
  const oCau = (w) => w.findAllComponents({ name: 'ONhap' }).at(-1)
  const docThu = async (w, cau) => {
    await oCau(w).find('input').setValue(cau)
    await oCau(w).find('input').trigger('keydown', { key: 'Enter' })
  }

  it('câu dễ đọc đủ rồi thì KHÔNG hiện nút hỏi AI — không mời gọi tiêu tiền vô cớ', async () => {
    const { luuKhoaAI } = await import('../lib/ai.js')
    luuKhoaAI('sk-thu')
    const w = dungSheet()
    await docThu(w, 'ăn phở 85 momo')
    expect(w.text()).not.toContain('Hỏi AI câu này')
    luuKhoaAI('')
  })

  it('câu khó + CHƯA có khoá → chỉ đường dán khoá, không hiện nút gọi', async () => {
    const { xoaKhoaAI } = await import('../lib/ai.js')
    xoaKhoaAI()
    const w = dungSheet()
    await docThu(w, 'hôm nay lỡ tiêu hơi nhiều linh tinh')
    expect(w.text()).toContain('Dán khoá API ở tab Tổng kết')
    expect(w.text()).not.toContain('Hỏi AI câu này')
  })

  it('câu khó + có khoá → hỏi AI, kết quả vẫn phải qua XÁC NHẬN, chưa ghi gì', async () => {
    const { luuKhoaAI } = await import('../lib/ai.js')
    luuKhoaAI('sk-thu')
    globalThis.fetch = async () => ({
      ok: true, status: 200,
      json: async () => ({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: '{"activity":"Mua linh tinh ở chợ","tripCost":"250","pay":"","cat":"🛍 Mua sắm"}' }]
      })
    })
    const w = dungSheet()
    await docThu(w, 'lỡ tiêu tầm hai trăm rưỡi linh tinh ở chợ')
    const nutAI = w.findAll('button').find((b) => b.text().includes('Hỏi AI câu này'))
    expect(nutAI).toBeTruthy()
    await nutAI.trigger('click')
    await vi.waitFor(() => expect(w.find('.ai__bang').text()).toContain('Mua linh tinh ở chợ'))
    expect(w.find('.ai__bang').text()).toContain('250')
    expect(kho.rows).toHaveLength(0)          /* AI KHÔNG tự ghi */
    luuKhoaAI('')
  })
})
