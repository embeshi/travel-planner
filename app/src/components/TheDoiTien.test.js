// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TheDoiTien from './TheDoiTien.vue'
import { kho, applyData, khoMacDinh } from '../lib/kho.js'

beforeEach(() => { applyData(khoMacDinh(), kho); kho.chuyenDaCat = []; kho.currency = 'THB' })
const hang = (w, i) => w.findAll('[data-dong]')[i]

describe('💵 TheDoiTien', () => {
  it('thêm lần đổi: đúng hình dạng v9.6; gõ VNĐ + nhận được → tỷ giá thực tế tự tính', async () => {
    const w = mount(TheDoiTien)
    await w.find('.them').trigger('click')
    expect(Object.keys(kho.cash[0]).sort()).toEqual(['date', 'fx', 'id', 'place', 'vnd'])
    await hang(w, 0).find('.o-vnd input').setValue('7200000')
    await hang(w, 0).find('.o-fx input').setValue('10000')
    expect(w.find('.dong__tg').text()).toContain('720 ₫/1 THB')
    expect(w.findAll('.the__so')[0].text()).toBe('7.200.000 ₫')
    expect(w.findAll('.the__so')[1].text()).toBe('10.000 THB')
    expect(w.findAll('.the__so')[2].text()).toBe('720 ₫/1 THB')
  })

  it('lời nhắc chỉ so với dòng «Tiền mặt»: đủ → xanh, vượt → đỏ', async () => {
    kho.cash = [{ id: 'c', date: '', vnd: '720000', fx: '1000', place: '' }]
    kho.rows = [{ id: 'r', date: '', tripCost: '300', pay: 'Tiền mặt' }, { id: 't', date: '', tripCost: '9999', pay: 'Thẻ ngân hàng' }]
    const w = mount(TheDoiTien)
    expect(w.find('.dt__nhac--du').text()).toContain('còn dư khoảng 700 THB')
    kho.rows[0].tripCost = '1300'
    await w.vm.$nextTick()
    expect(w.find('.dt__nhac--vuot').text()).toContain('vượt số tiền mặt đã đổi khoảng 300 THB')
  })

  it('tự xếp theo ngày đổi', async () => {
    kho.cash = [
      { id: 'a', date: '2026-08-05', vnd: '', fx: '', place: '' },
      { id: 'b', date: '2026-08-01', vnd: '', fx: '', place: '' }
    ]
    mount(TheDoiTien)
    expect(kho.cash.map((r) => r.id)).toEqual(['b', 'a'])
  })
})
