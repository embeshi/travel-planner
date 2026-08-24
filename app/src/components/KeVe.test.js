// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
vi.mock('../lib/backup.js', () => ({ taiXuong: vi.fn(() => 'x.json') }))
import KeVe from './KeVe.vue'
import { kho, applyData, khoMacDinh } from '../lib/kho.js'
import { soMau } from '../lib/du-lieu-mau.js'
import { catChuyenLenKe } from '../lib/ke-ve.js'

beforeEach(() => {
  applyData(khoMacDinh(), kho)
  kho.chuyenDaCat = []
})

describe('🎫 Kệ vé', () => {
  it('kệ trống nói đúng câu của bảng thiết kế M9', () => {
    const w = mount(KeVe)
    expect(w.text()).toContain('Kệ còn trống')
    expect(w.text()).toContain('Tấm vé đầu tiên sẽ xuất hiện khi bạn cất chuyến đang đi')
  })

  it('mỗi vé một con dấu, header pane KHÔNG mang dấu (luật M9)', () => {
    applyData(soMau(), kho)
    catChuyenLenKe(kho)
    kho.title = 'Chuyến B'
    catChuyenLenKe(kho)
    const w = mount(KeVe)
    expect(w.findAllComponents({ name: 'ConDau' })).toHaveLength(2)
    expect(w.find('.ke__dau').findComponent({ name: 'ConDau' }).exists()).toBe(false)
    expect(w.find('.ke__dem').text()).toBe('2')
  })

  it('Xem lại: vé xuống sổ, chuyến đang mở tự lên kệ — không mất ai', async () => {
    applyData(soMau(), kho)
    const ve = catChuyenLenKe(kho)
    applyData(khoMacDinh(), kho)
    kho.chuyenDaCat = [ve]
    applyData({ title: 'Chuyến B', rows: [{ id: 'b', date: '2026-09-01', tripCost: '5', pay: '' }] }, kho)
    const w = mount(KeVe)
    await w.findAll('.nut--vien').at(0).trigger('click')
    expect(kho.title).toBe('Chuyến mẫu')
    expect(kho.rows).toHaveLength(61)
    expect(kho.chuyenDaCat[0].ten).toBe('Chuyến B')
    expect(w.emitted('doi')).toBeTruthy()
  })

  it('xoá vé phải bấm HAI lần — lần đầu chỉ đổi chữ cảnh báo', async () => {
    applyData(soMau(), kho)
    catChuyenLenKe(kho)
    const w = mount(KeVe)
    const nutXoa = w.find('.veo__xoa')
    await nutXoa.trigger('click')
    expect(kho.chuyenDaCat).toHaveLength(1)          /* lần 1: chưa xoá */
    expect(nutXoa.text()).toContain('lần nữa')
    await nutXoa.trigger('click')
    expect(kho.chuyenDaCat).toHaveLength(0)          /* lần 2: xoá thật */
  })
})
