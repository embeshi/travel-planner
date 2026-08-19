// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ONhap from './ONhap.vue'

/* ============================================================
   GIÁP BỘ GÕ TIẾNG VIỆT — vết sẹo, giờ có test canh cửa.

   Trước lô này, ba vết sẹo nhập liệu chỉ được kiểm bằng tay trong trình
   duyệt. Nghĩa là sáu tháng nữa ai đó làm rơi mất giáp bộ gõ thì không
   có màu đỏ nào báo — chỉ tới lúc đang gõ tiếng Việt giữa Bangkok mới
   phát hiện. Đây là tấm lưới cho đúng chuyện đó.
   ============================================================ */
describe('ONhap · giáp bộ gõ tiếng Việt', () => {
  const go = () => mount(ONhap, { props: { modelValue: '' } })

  it('Enter lúc ĐANG NẶN CHỮ thì KHÔNG báo lên trên', async () => {
    /* Bộ gõ tiếng Việt dùng Enter để CHỐT chữ (phowr → phở).
       App mà cướp phím đó thì chữ nằm lại dở dang. */
    const w = go()
    await w.find('input').trigger('keydown', { key: 'Enter', isComposing: true })
    expect(w.emitted('enter')).toBeUndefined()
  })

  it('keyCode 229 — tín hiệu cũ của bộ gõ Android — cũng bị chặn', async () => {
    const w = go()
    await w.find('input').trigger('keydown', { key: 'Enter', keyCode: 229 })
    expect(w.emitted('enter')).toBeUndefined()
  })

  it('Enter THẬT thì báo lên đúng một lần', async () => {
    const w = go()
    await w.find('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('enter')).toHaveLength(1)
  })

  it('phím khác Enter không bị nhầm thành Enter', async () => {
    const w = go()
    await w.find('input').trigger('keydown', { key: 'a' })
    await w.find('input').trigger('keydown', { key: 'Tab' })
    expect(w.emitted('enter')).toBeUndefined()
  })

  it('mọi ô nhập đều đi qua đây, nên không màn nào quên được giáp', () => {
    /* Luật trong CLAUDE.md: cấm dùng <input> trần trong app. */
    const w = go()
    expect(w.find('input').exists()).toBe(true)
  })
})

describe('ONhap · các trạng thái', () => {
  it('báo lỗi kèm chữ giải thích và cờ aria-invalid', () => {
    const w = mount(ONhap, {
      props: { modelValue: '1', trangThai: 'loi', thongBao: 'Số quá lớn' }
    })
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    expect(w.text()).toContain('Số quá lớn')
  })

  it('ô khoá thì không gõ được', () => {
    const w = mount(ONhap, { props: { modelValue: 'x', khoa: true } })
    expect(w.find('input').attributes('disabled')).toBeDefined()
  })

  it('cho phép bên ngoài dời con trỏ vào đây', () => {
    const w = mount(ONhap, { props: { modelValue: '' }, attachTo: document.body })
    w.vm.focus()
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })
})
