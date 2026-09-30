// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TheTyGia from './TheTyGia.vue'
import { kho, applyData, khoMacDinh } from '../lib/kho.js'

const fetchCu = globalThis.fetch
beforeEach(() => { applyData(khoMacDinh(), kho); kho.chuyenDaCat = [] })
afterEach(() => { globalThis.fetch = fetchCu })

describe('💱 TheTyGia', () => {
  it('menu có đủ 12 loại tiền v9.6, đang chọn đúng tiền của sổ', () => {
    kho.currency = 'JPY'
    const w = mount(TheTyGia)
    const chon = w.find('select')
    expect(chon.findAll('option')).toHaveLength(12)
    expect(chon.element.value).toBe('JPY')
  })

  it('gõ tỷ giá → sổ nhận SỐ; xoá trắng → null chứ không phải 0', async () => {
    const w = mount(TheTyGia)
    const o = w.find('input')
    await o.setValue('784.28')
    expect(kho.rate).toBe(784.28)
    expect(w.emitted('doi')).toBeTruthy()
    await o.setValue('')
    expect(kho.rate).toBe(null)
  })

  it('đổi tiền tệ ghi thẳng vào sổ, hai prop khoá trỏ đúng cặp gói bay', async () => {
    const w = mount(TheTyGia, { props: { khoaTien: 'bkCurrency', khoaTyGia: 'bkRate', gon: true } })
    await w.find('select').setValue('USD')
    expect(kho.bkCurrency).toBe('USD')
    await w.find('input').setValue('26000')
    expect(kho.bkRate).toBe(26000)
    expect(kho.rate).toBe(null)                 /* không đụng cặp của chuyến */
  })

  it('⟳ lấy tự động: thành công thì điền số + báo giờ; hỏng thì chỉ wise.com, không ghi bậy', async () => {
    kho.currency = 'THB'
    globalThis.fetch = async (url) => ({ ok: true, json: async () => ({ result: 'success', rates: { VND: 720 } }) })
    const w = mount(TheTyGia)
    await w.find('.nut--phu').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(kho.rate).toBe(720)
    expect(w.find('input').element.value).toBe('720')
    expect(w.find('.tg__tt--ok').text()).toContain('Đã cập nhật lúc')

    globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
    await w.find('.nut--phu').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(w.find('.tg__tt--err').text()).toContain('wise.com')
    expect(kho.rate).toBe(720)                  /* giữ số cũ */
  })

  it('tỷ giá đổi từ nơi khác (nạp backup) thì ô hiện theo', async () => {
    const w = mount(TheTyGia)
    kho.rate = 700
    await w.vm.$nextTick()
    expect(w.find('input').element.value).toBe('700')
    expect(w.text()).toContain('1 THB = 700 ₫')
  })
})
