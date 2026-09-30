// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TheGoiBay from './TheGoiBay.vue'
import { kho, applyData, khoMacDinh } from '../lib/kho.js'
import { datBeNgang } from '../test-setup.js'

beforeEach(() => { applyData(khoMacDinh(), kho); kho.chuyenDaCat = []; datBeNgang(1280) })
const hang = (w, i) => w.findAll('[data-dong]')[i]

describe('✈️🏨 TheGoiBay', () => {
  it('khách sạn: số đêm tự tính như v9.6, check-out trước check-in thì báo lỗi', async () => {
    const w = mount(TheGoiBay)
    const [ci, co] = w.findAll('.gb__ngay input')
    await ci.setValue('2026-08-01'); await co.setValue('2026-08-04')
    expect(w.find('.gb__dem').text()).toBe('4 ngày 3 đêm')
    await co.setValue('2026-07-30')
    expect(w.find('.gb__dem').text()).toBe('Check-out cần sau check-in')
    expect(w.find('.gb__dem--loi').exists()).toBe(true)
    expect(kho.hotel.checkin).toBe('2026-08-01')
  })

  it('thêm khoản trả trước: dòng mới ĐÚNG hình dạng v9.6, quy đổi đòi tỷ giá', async () => {
    const w = mount(TheGoiBay)
    await w.find('.them').trigger('click')
    expect(kho.bookings).toHaveLength(1)
    expect(Object.keys(kho.bookings[0]).sort()).toEqual(['cost', 'date', 'id', 'name', 'note', 'vendor'])
    await hang(w, 0).find('.o-tien input').setValue('520')
    expect(w.find('.dong__vnd').text()).toContain('nhập tỷ giá')
    expect(w.find('.the__vnd').text()).toContain('thiếu tỷ giá GBP')
    kho.bkRate = 34000
    await w.vm.$nextTick()
    expect(w.find('.the__vnd').text()).toBe('17.680.000 ₫')
  })

  it('tự xếp theo ngày khi đổi ngày, xoá thì đi thật', async () => {
    kho.bookings = [
      { id: 'a', name: 'Sau', vendor: '', date: '2026-08-05', cost: '1', note: '' },
      { id: 'b', name: 'Trước', vendor: '', date: '2026-08-01', cost: '2', note: '' }
    ]
    const w = mount(TheGoiBay)
    expect(kho.bookings.map((r) => r.id)).toEqual(['b', 'a'])      /* xếp ngay khi dựng */
    await w.vm.$nextTick()                                          /* DOM vẽ lại theo thứ tự mới */
    await hang(w, 0).find('.o-ngay input').setValue('2026-08-09')
    expect(kho.bookings.map((r) => r.id)).toEqual(['a', 'b'])
    await hang(w, 0).find('.dong__xoa').trigger('click')
    expect(kho.bookings.map((r) => r.id)).toEqual(['b'])
  })

  it('Enter ở dòng cuối (laptop) đẻ dòng mới cùng ngày', async () => {
    kho.bookings = [{ id: 'a', name: 'X', vendor: '', date: '2026-08-02', cost: '', note: '' }]
    const w = mount(TheGoiBay, { attachTo: document.body })
    await hang(w, 0).find('.o-ten input').trigger('keydown', { key: 'Enter' })
    await w.vm.$nextTick()
    expect(kho.bookings).toHaveLength(2)
    expect(kho.bookings[1].date).toBe('2026-08-02')
    w.unmount()
  })
})
