// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BangLichTrinh from './BangLichTrinh.vue'
import { kho, applyData, khoMacDinh } from '../lib/kho.js'
import { datBeNgang } from '../test-setup.js'

/* PHẢI là hàm sinh mới, không được dùng chung một object literal.
   `applyData` cố tình trả về CHÍNH object dòng (để trường lạ như cat/done
   sống sót — đó là điều kiện của đường lui 60 giây). Hệ quả: bài kiểm nào
   sửa row.date là sửa luôn dữ liệu mẫu cho mọi bài kiểm sau. Đã dính thật
   một lần khi viết file này. */
const soMoi = () => ({
  currency: 'THB',
  rate: 700,
  rows: [
    { id: 'a', date: '2026-08-01', activity: 'Một', tripCost: '10', pay: '' },
    { id: 'b', date: '2026-08-01', activity: 'Hai', tripCost: '20', pay: '' },
    { id: 'c', date: '2026-08-02', activity: 'Ba', tripCost: '30', pay: '' }
  ]
})

let w
const dung = () => mount(BangLichTrinh, { attachTo: document.body })
/* Thứ tự ô trong một hàng: [Tên hoạt động, Chi phí, (ngày)] + select Thanh toán */
const hang = (i) => w.findAll('[data-dong]')[i]
const oTen = (i) => hang(i).findAll('input')[0]
const oTien = (i) => hang(i).findAll('input')[1]
const oKenh = (i) => hang(i).find('select')

beforeEach(() => {
  applyData(khoMacDinh(), kho)
  applyData(soMoi(), kho)
  datBeNgang(1280)
})
afterEach(() => { if (w) w.unmount() })

describe('VẾT SẸO 1 · Enter thông minh — tư thế LAPTOP', () => {
  beforeEach(() => { datBeNgang(1280); w = dung() })

  it('Enter nhảy xuống ĐÚNG CỘT ở dòng dưới', async () => {
    oTien(0).element.focus()
    await oTien(0).trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(document.activeElement).toBe(oTien(1).element)
  })

  it('không nhảy sang cột khác', async () => {
    oTen(0).element.focus()
    await oTen(0).trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(document.activeElement).toBe(oTen(1).element)
    expect(document.activeElement).not.toBe(oTien(1).element)
  })

  it('Enter ở dòng cuối đẻ dòng mới, nhận NGÀY của dòng vừa bấm', async () => {
    /* v10 gom theo ngày nên dòng trống ngày sẽ tuột xuống đáy — bấm Enter
       mà con trỏ biến mất khỏi tầm mắt thì hỏng nhịp nhập liệu. */
    const truoc = kho.rows.length
    oTen(2).element.focus()
    await oTen(2).trigger('keydown', { key: 'Enter' })
    await nextTick(); await nextTick()
    expect(kho.rows).toHaveLength(truoc + 1)
    expect(kho.rows.at(-1).date).toBe('2026-08-02')
  })
})

describe('VẾT SẸO 1 · Enter thông minh — tư thế ĐIỆN THOẠI', () => {
  beforeEach(() => { datBeNgang(375); w = dung() })

  it('đi TUẦN TỰ trong thẻ: tên → chi phí', async () => {
    oTen(0).element.focus()
    await oTen(0).trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(document.activeElement).toBe(oTien(0).element)
  })

  it('đi QUA CẢ menu Thanh toán, không nhảy cóc', async () => {
    /* PRD mục 03A ghi rõ: «mobile tuần tự trong thẻ, đi qua cả menu Thanh toán» */
    oTien(0).element.focus()
    await oTien(0).trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(document.activeElement).toBe(oKenh(0).element)
  })

  it('hết thẻ mới sang thẻ dưới, vào ô đầu tiên', async () => {
    oKenh(0).element.focus()
    await oKenh(0).trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(document.activeElement).toBe(oTen(1).element)
  })
})

describe('VẾT SẸO 2 · giáp bộ gõ hoạt động ngay trong bảng', () => {
  beforeEach(() => { datBeNgang(1280); w = dung() })

  it('Enter lúc đang nặn chữ thì con trỏ ĐỨNG YÊN', async () => {
    oTen(0).element.focus()
    await oTen(0).trigger('keydown', { key: 'Enter', isComposing: true })
    await nextTick()
    expect(document.activeElement).toBe(oTen(0).element)
  })

  it('keyCode 229 cũng không làm con trỏ chạy', async () => {
    oTen(0).element.focus()
    await oTen(0).trigger('keydown', { key: 'Enter', keyCode: 229 })
    await nextTick()
    expect(document.activeElement).toBe(oTen(0).element)
  })
})

describe('VẾT SẸO 3 · dòng bay về cụm ngày, con trỏ bay theo', () => {
  beforeEach(() => { datBeNgang(1280); w = dung() })

  it('đổi ngày thì dòng sang cụm mới và con trỏ đi theo nó', async () => {
    const oNgay = hang(0).find('input[type=date]')
    oNgay.element.value = '2026-08-02'
    await oNgay.trigger('change')
    await nextTick(); await nextTick()

    /* Dòng 'a' phải nằm trong cụm 02/08, và con trỏ ở đúng dòng đó */
    const idTheoThuTu = w.findAll('[data-dong]').map((e) => e.attributes('data-dong'))
    expect(idTheoThuTu.indexOf('a')).toBeGreaterThan(0)
    const dongA = w.find('[data-dong="a"]')
    expect(dongA.element.contains(document.activeElement)).toBe(true)
  })

  it('thứ tự KHÔNG đổi thì đứng yên, không vẽ lại vô cớ', async () => {
    const oNgay = hang(0).find('input[type=date]')
    oTen(0).element.focus()
    oNgay.element.value = '2026-08-01'     /* vẫn là ngày cũ */
    await oNgay.trigger('change')
    await nextTick()
    expect(document.activeElement).toBe(oTen(0).element)
  })

  it('không mất dòng nào sau khi bay', async () => {
    const oNgay = hang(0).find('input[type=date]')
    oNgay.element.value = '2026-08-02'
    await oNgay.trigger('change')
    await nextTick()
    expect(kho.rows).toHaveLength(3)
  })
})

describe('bảng · gom nhóm và xoá dòng', () => {
  beforeEach(() => { datBeNgang(1280); w = dung() })

  it('gom đúng hai cụm ngày với tổng riêng', () => {
    const dau = w.findAll('.nhom__dau').map((e) => e.text())
    expect(dau).toHaveLength(2)
    expect(dau[0]).toContain('01/08')
    expect(dau[0]).toContain('30')      /* 10 + 20 */
  })

  it('nút × xoá đúng dòng đó', async () => {
    await hang(1).find('.dong__xoa').trigger('click')
    expect(kho.rows.map((r) => r.id)).toEqual(['a', 'c'])
  })
})
