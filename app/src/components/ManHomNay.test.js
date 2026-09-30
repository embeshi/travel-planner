// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ManHomNay from './ManHomNay.vue'
import { kho, applyData, khoMacDinh } from '../lib/kho.js'
import { soMau } from '../lib/du-lieu-mau.js'

beforeEach(() => { applyData(khoMacDinh(), kho); kho.chuyenDaCat = []; applyData(soMau(), kho) })

describe('🏠 Hôm nay · bố cục L1', () => {
  it('ba khối: KPI · lịch trình (+ đích Teleport cho thẻ ghi nhanh) · phần dưới có ✦ nhịp chi', () => {
    const w = mount(ManHomNay, { props: { homNay: '2026-08-04' } })
    expect(w.find('.hn__kpi-khu .hn__kpi').exists()).toBe(true)
    expect(w.find('.hn__trai #hn-ghi-nhanh').exists()).toBe(true)
    expect(w.find('.hn__duoi .nhip').exists()).toBe(true)
    expect(w.find('.nhip__ten').text()).toBe('✦ Nhịp chi')
    expect(w.findAll('.viec__o')).toHaveLength(8)          /* 04/08 có 8 việc */
  })
  it('nhịp chi nói thật khi thiếu dữ liệu, và có câu khi đủ', async () => {
    const w = mount(ManHomNay, { props: { homNay: '2026-08-04' } })
    expect(w.find('.nhip').text()).toContain('ví tiền mặt')      /* sổ mẫu có đổi tiền → có câu ví */
    kho.cash = []; kho.budget = ''
    await w.vm.$nextTick()
    expect(w.find('.nhip--thieu').exists()).toBe(true)
  })
})
