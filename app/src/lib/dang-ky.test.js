// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { dangKy, dichLoiDangKy, datClientThu, nguoiDung, dongBoOk, datHanNap } from './khoi-dong.js'

/* Máy chủ giả: signUp trả gì thì mình quyết, from() trả căn phòng trống
   để keoVeTuMayChu chạy trót lọt mà không chạm mạng. */
const fromTrong = () => ({
  select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) })
})
const sbGia = (signUp) => ({ auth: { signUp }, from: fromTrong })

beforeEach(() => {
  datHanNap(30)
  nguoiDung.value = null
  dongBoOk.value = false
})

describe('dangKy · cái cửa của «thử bằng tài khoản phụ»', () => {
  it('tạo xong có phiên → đăng nhập luôn, đúng như v9.6', async () => {
    datClientThu(sbGia(async () => ({
      data: { user: { id: 'u-phu', email: 'phu@vidu.com' }, session: {} },
      error: null
    })))
    const kq = await dangKy('phu@vidu.com', 'mat-khau-du-manh')
    expect(kq.xong).toBe(true)
    expect(nguoiDung.value.email).toBe('phu@vidu.com')
  })

  it('Supabase bật «Confirm email» → nói rõ việc phải làm, KHÔNG đăng nhập', async () => {
    datClientThu(sbGia(async () => ({
      data: { user: { id: 'u-phu' }, session: null },
      error: null
    })))
    const kq = await dangKy('phu@vidu.com', 'mk')
    expect(kq.xong).toBe(false)
    expect(kq.chu).toContain('Confirm email')
    expect(nguoiDung.value).toBe(null)
  })

  it('signUp trả error trong data cũng bị bắt, không lọt', async () => {
    datClientThu(sbGia(async () => ({ data: null, error: new Error('User already registered') })))
    await expect(dangKy('phu@vidu.com', 'mk')).rejects.toThrow('đã có tài khoản')
  })
})

describe('dichLoiDangKy · bộ câu báo lỗi có hướng dẫn của v9.6', () => {
  const loi = (m) => new Error(m)

  it('email đã tồn tại → chỉ đường đăng nhập, và đường xoá user nếu quên mật khẩu', () => {
    const c = dichLoiDangKy(loi('User already registered'))
    expect(c).toContain('đã có tài khoản')
    expect(c).toContain('Authentication → Users')
  })

  it('Supabase tắt đăng ký → chỉ đúng công tắc phải bật', () => {
    expect(dichLoiDangKy(loi('Signups not allowed for this instance')))
      .toContain('Allow new users to sign up')
  })

  it('đụng giới hạn thao tác → bảo đợi', () => {
    expect(dichLoiDangKy(loi('email rate limit exceeded'))).toContain('giới hạn')
  })

  it('mật khẩu yếu → nêu nguyên văn yêu cầu của Supabase', () => {
    const c = dichLoiDangKy(loi('Password should be at least 6 characters'))
    expect(c).toContain('Mật khẩu')
    expect(c).toContain('at least 6 characters')
  })

  it('lỗi lạ → không nuốt, chép nguyên văn ra cho người dùng thấy', () => {
    expect(dichLoiDangKy(loi('something odd'))).toContain('something odd')
    expect(dichLoiDangKy(null)).toContain('không rõ')
  })
})
