// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from './App.vue'
import { thongBaoDongBo, datHanNap, datClientThu } from './lib/khoi-dong.js'
import { datLaiCongDoc } from './lib/dong-bo.js'
import { datBeNgang } from './test-setup.js'

/* Bài kiểm cấp App đầu tiên: chỉ soi phần nối dây mà không mò được trong
   trình duyệt (module bị Vite cấp bản sao riêng khi import từ trang). */
beforeEach(() => {
  window.localStorage.clear()
  datLaiCongDoc()
  datClientThu(null)
  datHanNap(5)                       /* jsdom không nạp CDN — đừng đợi 8 giây */
  datBeNgang(1280)
  HTMLDialogElement.prototype.showModal ||= function () { this.open = true }
  HTMLDialogElement.prototype.close ||= function () { this.open = false }
  vi.stubGlobal('scrollTo', () => {})
})

describe('App · v10.7 báo cất bản trên máy', () => {
  it('thongBaoDongBo có chữ → toast kiểu tin báo hiện ra, không nút Hoàn tác, rồi tín hiệu được xoá', async () => {
    const w = mount(App, { attachTo: document.body })
    await new Promise((r) => setTimeout(r, 40))       /* qua khởi động (hạn nạp CDN 5ms) */
    await nextTick()
    expect(w.find('.toast').exists()).toBe(false)

    thongBaoDongBo.value = 'đã được cất thành vé «Bản trên máy · 30/09 19:20»'
    await nextTick(); await nextTick()
    const t = w.find('.toast')
    expect(t.exists()).toBe(true)
    expect(t.text()).toContain('Đã cất bản trên máy ✓')
    expect(t.text()).toContain('Bản trên máy · 30/09 19:20')
    expect(t.find('.toast__hoan-tac').exists()).toBe(false)
    expect(thongBaoDongBo.value).toBe('')
    w.unmount()
  })
})
