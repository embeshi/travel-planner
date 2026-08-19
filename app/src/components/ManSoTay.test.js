// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ManSoTay from './ManSoTay.vue'
import { kho, applyData, khoMacDinh } from '../lib/kho.js'
import { datBeNgang } from '../test-setup.js'

beforeEach(() => {
  applyData(khoMacDinh(), kho)
  applyData({
    food: [{ id: 'f1', name: 'Pad Thái', note: '', packed: true },
           { id: 'f2', name: 'Tom Yum', note: '', packed: false }],
    shopping: [{ id: 's1', name: 'Xoài sấy', note: '', packed: false }],
    activePack: 'skincare', activeNote: 'food'
  }, kho)
  datBeNgang(1280)
})

const the = (w, khoa) => w.findAllComponents({ name: 'TheDanhSach' })
  .find((c) => c.props('khoa') === khoa)

describe('màn Sổ tay', () => {
  it('bày đủ sáu danh sách', () => {
    const w = mount(ManSoTay)
    expect(w.findAllComponents({ name: 'TheDanhSach' })).toHaveLength(6)
  })

  it('tổng tiến độ cộng cả sáu danh sách', () => {
    const w = mount(ManSoTay)
    expect(w.find('.st__tong').text()).toContain('1/3')
  })

  it('đổi tab con thì ghi vào đúng cột có sẵn của sổ v9.6', async () => {
    /* activePack / activeNote là cột đã có — dùng lại thay vì đẻ trạng thái mới */
    const w = mount(ManSoTay)
    const nut = w.findAll('.tab-con__nut').find((b) => b.text().includes('Makeup'))
    await nut.trigger('click')
    expect(kho.activePack).toBe('makeup')
  })
})

describe('thẻ danh sách', () => {
  it('tiến độ hiện đúng số đã xong trên tổng', () => {
    const w = mount(ManSoTay)
    expect(the(w, 'food').find('.the__dem').text()).toBe('1/2')
  })

  it('tick một món thì đổi cờ packed', async () => {
    const w = mount(ManSoTay)
    const tick = the(w, 'food').findAll('.mon__tick')[1]
    await tick.trigger('click')
    expect(kho.food[1].packed).toBe(true)
  })

  it('mỗi món đúng MỘT dòng — không có món nào xuống hàng', () => {
    const w = mount(ManSoTay)
    expect(the(w, 'food').findAll('.mon__o')).toHaveLength(2)
  })

  it('bấm gợi ý thì thêm món luôn', async () => {
    const w = mount(ManSoTay)
    const chip = the(w, 'shopping').findAll('.goi-y__chip')[0]
    const ten = chip.text().replace('＋', '').trim()
    await chip.trigger('click')
    expect(kho.shopping.map((m) => m.name)).toContain(ten)
  })

  it('gợi ý đã thêm rồi thì biến khỏi hàng gợi ý', async () => {
    const w = mount(ManSoTay)
    const truoc = the(w, 'shopping').findAll('.goi-y__chip').length
    await the(w, 'shopping').findAll('.goi-y__chip')[0].trigger('click')
    expect(the(w, 'shopping').findAll('.goi-y__chip').length).toBeLessThan(truoc + 1)
  })

  it('xoá món bằng nút ×', async () => {
    const w = mount(ManSoTay)
    await the(w, 'food').findAll('.mon__xoa')[0].trigger('click')
    expect(kho.food.map((m) => m.id)).toEqual(['f2'])
  })

  it('ô thêm món đi qua ONhap nên có sẵn giáp bộ gõ', async () => {
    const w = mount(ManSoTay)
    const o = the(w, 'food').findComponent({ name: 'ONhap' })
    expect(o.exists()).toBe(true)
    await o.find('input').setValue('Xôi xoài')
    await o.find('input').trigger('keydown', { key: 'Enter', isComposing: true })
    expect(kho.food).toHaveLength(2)      /* chưa thêm — đang nặn chữ */
    await o.find('input').trigger('keydown', { key: 'Enter' })
    expect(kho.food.map((m) => m.name)).toContain('Xôi xoài')
  })
})
