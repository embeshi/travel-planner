// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

/* jsdom không có URL.createObjectURL, và bài kiểm này chỉ soi PHANH của
   hộp thoại — việc xuất file đã có bài kiểm riêng ở backup.test.js. */
vi.mock('../lib/backup.js', () => ({
  taiXuong: vi.fn(() => 'du-lich-backup-2026-08-20-1600.json')
}))
import { taiXuong } from '../lib/backup.js'
import ChuyenMoi from './ChuyenMoi.vue'
import { kho, applyData, khoMacDinh } from '../lib/kho.js'
import { soMau } from '../lib/du-lieu-mau.js'

beforeEach(() => {
  vi.clearAllMocks()
  taiXuong.mockReturnValue('du-lich-backup-2026-08-20-1600.json')
  applyData(khoMacDinh(), kho)
  applyData(soMau(), kho)
})

/* jsdom chưa có showModal — vá nhẹ để dialog mở được trong bài kiểm */
const dung = () => {
  HTMLDialogElement.prototype.showModal ||= function () { this.open = true }
  HTMLDialogElement.prototype.close ||= function () { this.open = false }
  return mount(ChuyenMoi, { props: { mo: true }, attachTo: document.body })
}
const nutDon = (w) => w.find('.nut--pha-huy')

describe('phanh hai nấc của «Bắt đầu chuyến mới»', () => {
  it('nút dọn sổ bị KHOÁ khi chưa xuất backup — không có đường tắt', async () => {
    const w = dung()
    expect(nutDon(w).attributes('disabled')).toBeDefined()
    await nutDon(w).trigger('click')
    expect(kho.rows).toHaveLength(61)          /* chưa mất gì */
    expect(w.emitted('xong')).toBeUndefined()
    w.unmount()
  })

  it('hộp thoại nói rõ tên chuyến và số dòng sắp được cất', () => {
    const w = dung()
    expect(w.text()).toContain('Chuyến mẫu')
    expect(w.text()).toContain('61 dòng')
    w.unmount()
  })

  it('xuất backup xong thì nấc 2 mở, và dọn đúng luật', async () => {
    const w = dung()
    await w.find('.nut--phu').trigger('click')          /* nấc 1 */
    expect(taiXuong).toHaveBeenCalledTimes(1)
    expect(w.text()).toContain('du-lich-backup-2026-08-20-1600.json')
    expect(nutDon(w).attributes('disabled')).toBeUndefined()

    await nutDon(w).trigger('click')                     /* nấc 2 */
    expect(kho.rows).toHaveLength(0)
    expect(kho.title).toBe('Chuyến đi của mình')
    expect(kho.skincare).toHaveLength(12)                /* hành lý còn nguyên món */
    expect(kho.skincare.every((m) => !m.packed)).toBe(true)
    expect(w.emitted('xong')).toHaveLength(1)
    w.unmount()
  })

  it('xuất backup HỎNG thì nấc 2 vẫn khoá — không dọn sổ khi chưa chắc đã cất', async () => {
    taiXuong.mockImplementation(() => { throw new Error('đĩa đầy') })
    const w = dung()
    await w.find('.nut--phu').trigger('click')
    expect(w.text()).toContain('đĩa đầy')
    expect(nutDon(w).attributes('disabled')).toBeDefined()
    expect(kho.rows).toHaveLength(61)
    w.unmount()
  })

  it('bấm Hủy thì không mất một dòng nào', async () => {
    const w = dung()
    await w.find('.nut--vien').trigger('click')
    expect(kho.rows).toHaveLength(61)
    expect(w.emitted('dong')).toHaveLength(1)
    expect(w.emitted('xong')).toBeUndefined()
    w.unmount()
  })
})
