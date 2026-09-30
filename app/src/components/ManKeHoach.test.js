// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ManKeHoach from './ManKeHoach.vue'
import { kho, applyData, khoMacDinh } from '../lib/kho.js'
import { soMau } from '../lib/du-lieu-mau.js'

beforeEach(() => { applyData(khoMacDinh(), kho); kho.chuyenDaCat = []; applyData(soMau(), kho) })

describe('🗓 Kế hoạch · ba khu v9.6 quay lại', () => {
  it('có đủ lịch trình + 💱 + ✈️🏨 + 💵, và thẻ tỷ giá mang id để nhảy tới', () => {
    const w = mount(ManKeHoach)
    expect(w.findComponent({ name: 'BangLichTrinh' }).exists()).toBe(true)
    expect(w.find('#the-ty-gia').exists()).toBe(true)
    expect(w.text()).toContain('Gói bay & khách sạn')
    expect(w.text()).toContain('Đổi tiền · VNĐ → THB')
  })
  it('dữ liệu mẫu (có cash, bookings, hotel) hiện đủ trong ba thẻ — không còn khu nào «mù»', () => {
    const w = mount(ManKeHoach)
    expect(w.findAll('.dt [data-dong]').length).toBe(kho.cash.length)
    expect(w.findAll('.gb [data-dong]').length).toBe(kho.bookings.length)
    expect(w.find('.gb__ks input').element.value).toBe(kho.hotel.name)
  })
})
