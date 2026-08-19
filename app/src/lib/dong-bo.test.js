import { describe, it, expect, beforeEach } from 'vitest'
import { ghiLenMayChu, danhDauDaDocXong, datLaiCongDoc, coDuocGhiChua } from './dong-bo.js'
import { soMau } from './du-lieu-mau.js'

describe('LUẬT VÀNG · đọc trước — ghi sau', () => {
  beforeEach(datLaiCongDoc)

  it('chưa đọc xong thì CHẶN ghi lên máy chủ', async () => {
    /* Đây là kịch bản DUY NHẤT thật sự xoá được dữ liệu: app khởi động,
       chưa kịp đọc sổ cũ, dựng sổ trắng rồi tự lưu đè.
       docs/nghi-thuc-giu-du-lieu-v10.html mục 03. */
    expect(coDuocGhiChua()).toBe(false)
    const sbGia = { from: () => { throw new Error('KHÔNG ĐƯỢC GỌI TỚI ĐÂY') } }
    await expect(ghiLenMayChu(sbGia, { id: 'u1' }, soMau()))
      .rejects.toThrow('CHẶN GHI')
  })

  it('cổng chặn NÉM LỖI chứ không im lặng bỏ qua', async () => {
    /* Im lặng bỏ qua thì lỗi trôi đi không ai biết. Thà hỏng ồn ào. */
    let daGoiMayChu = false
    const sbGia = { from: () => { daGoiMayChu = true; return {} } }
    await expect(ghiLenMayChu(sbGia, { id: 'u1' }, soMau())).rejects.toThrow()
    expect(daGoiMayChu).toBe(false)
  })

  it('đọc xong rồi mới cho ghi', async () => {
    danhDauDaDocXong()
    expect(coDuocGhiChua()).toBe(true)
    let daGui = null
    const sbGia = { from: () => ({ upsert: async (hang) => { daGui = hang; return { error: null } } }) }
    await expect(ghiLenMayChu(sbGia, { id: 'u1' }, soMau())).resolves.toBe(true)
    expect(daGui.user_id).toBe('u1')
    expect(daGui.data.rows).toHaveLength(61)
  })

  it('máy chủ báo lỗi thì ném ra, không nuốt', async () => {
    danhDauDaDocXong()
    const sbGia = { from: () => ({ upsert: async () => ({ error: new Error('mạng hỏng') }) }) }
    await expect(ghiLenMayChu(sbGia, { id: 'u1' }, soMau())).rejects.toThrow('mạng hỏng')
  })
})
