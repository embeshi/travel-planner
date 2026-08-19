// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

/* Giả cả module khởi động: bài kiểm này chỉ soi HÀNH VI CỦA MÀN HÌNH —
   luồng đăng ký thật đã có bài kiểm riêng ở dang-ky.test.js. */
vi.mock('../lib/khoi-dong.js', () => ({
  dangNhap: vi.fn(),
  dangKy: vi.fn()
}))
import { dangNhap, dangKy } from '../lib/khoi-dong.js'
import ManDangNhap from './ManDangNhap.vue'

beforeEach(() => {
  vi.clearAllMocks()
  dangNhap.mockResolvedValue({})
  dangKy.mockResolvedValue({ xong: true })
})

const oNhap = (w) => w.findAll('input')          /* [email, mật khẩu] */
const nutChinh = (w) => w.find('.nut--chinh')

describe('màn đăng nhập · hai chế độ trên một form', () => {
  it('mặc định là đăng nhập — nút ghi «Lên máy bay»', () => {
    const w = mount(ManDangNhap)
    expect(nutChinh(w).text()).toContain('Lên máy bay')
  })

  it('bấm «Chưa có tài khoản? Tạo mới» thì nút đổi thành «Tạo tài khoản»', async () => {
    const w = mount(ManDangNhap)
    await w.findAll('.dn__lien-ket')[0].trigger('click')
    expect(nutChinh(w).text()).toContain('Tạo tài khoản')
    expect(w.find('.dn__che').text()).toBe('Tạo tài khoản mới')
  })

  it('chế độ tạo mới gọi ĐÚNG dangKy, không gọi nhầm dangNhap', async () => {
    const w = mount(ManDangNhap)
    await w.findAll('.dn__lien-ket')[0].trigger('click')
    await oNhap(w)[0].setValue('phu@vidu.com')
    await oNhap(w)[1].setValue('mk-du-manh')
    await nutChinh(w).trigger('click')
    expect(dangKy).toHaveBeenCalledWith('phu@vidu.com', 'mk-du-manh')
    expect(dangNhap).not.toHaveBeenCalled()
    expect(w.emitted('xong')).toHaveLength(1)
  })

  it('tạo xong nhưng chờ xác nhận email → hiện lời dặn và TỰ quay về chế độ đăng nhập', async () => {
    dangKy.mockResolvedValue({ xong: false, chu: 'Còn chờ xác nhận email.' })
    const w = mount(ManDangNhap)
    await w.findAll('.dn__lien-ket')[0].trigger('click')
    await oNhap(w)[0].setValue('phu@vidu.com')
    await oNhap(w)[1].setValue('mk')
    await nutChinh(w).trigger('click')
    await vi.waitFor(() => expect(w.find('.dn__bao').exists()).toBe(true))
    expect(w.find('.dn__bao').text()).toContain('xác nhận')
    expect(nutChinh(w).text()).toContain('Lên máy bay')
    expect(w.emitted('xong')).toBeUndefined()
  })

  it('lỗi từ máy chủ hiện ra nguyên văn, mật khẩu bị xoá để gõ lại', async () => {
    dangNhap.mockRejectedValue(new Error('Sai mật khẩu rồi.'))
    const w = mount(ManDangNhap)
    await oNhap(w)[0].setValue('a@b.c')
    await oNhap(w)[1].setValue('sai')
    await nutChinh(w).trigger('click')
    await vi.waitFor(() => expect(w.find('.dn__loi').exists()).toBe(true))
    expect(w.find('.dn__loi').text()).toBe('Sai mật khẩu rồi.')
    expect(oNhap(w)[1].element.value).toBe('')
  })

  it('ô trống thì bấm nút không làm gì — không gửi form rỗng lên máy chủ', async () => {
    const w = mount(ManDangNhap)
    await nutChinh(w).trigger('click')
    expect(dangNhap).not.toHaveBeenCalled()
    expect(dangKy).not.toHaveBeenCalled()
  })

  it('lối «Dùng không cần tài khoản» luôn có, và thoát được', async () => {
    const w = mount(ManDangNhap)
    await w.findAll('.dn__lien-ket')[1].trigger('click')
    expect(w.emitted('bo-qua')).toHaveLength(1)
  })

  it('ô nhập đi qua ONhap — Enter lúc đang nặn chữ không gửi form', async () => {
    const w = mount(ManDangNhap)
    await oNhap(w)[0].setValue('a@b.c')
    await oNhap(w)[1].setValue('mk')
    await oNhap(w)[1].trigger('keydown', { key: 'Enter', isComposing: true })
    expect(dangNhap).not.toHaveBeenCalled()
    await oNhap(w)[1].trigger('keydown', { key: 'Enter' })
    expect(dangNhap).toHaveBeenCalledTimes(1)
  })
})
