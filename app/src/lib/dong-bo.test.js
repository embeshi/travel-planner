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

/* ============================================================
   v10.7 · LƯỚI AN TOÀN — hoà giải không còn «ai mới hơn thắng» mù quáng
   ============================================================ */
import { hoaGiaiVoiMayChu, hopNhatKe } from './dong-bo.js'
import { khoMacDinh, applyData } from './kho.js'

const sbGiaDoc = (row) => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }) }) })
const soThat = () => { const k = applyData(soMau(), khoMacDinh()); k._updatedAt = 1000; return k }
const hoaGiai = (row, state) => {
  const daApDung = []
  return hoaGiaiVoiMayChu(sbGiaDoc(row), { id: 'u1' }, state, {
    apDung: (d) => { daApDung.push(d); applyData(d, state) }, ghiXuong: async () => {}
  }).then((kq) => ({ kq, daApDung }))
}

describe('v10.7 · chặn ghi đè lúc đăng nhập', () => {
  beforeEach(datLaiCongDoc)

  it('KỊCH BẢN THẬT: máy mới gõ 1 dòng «mới hơn» sổ thật → mây thắng, bản máy lên kệ, không mất gì', async () => {
    const cucBo = applyData({ title: 'Nháp', rows: [{ id: 'x1', date: '2026-09-01', tripCost: '5', pay: '' }] }, khoMacDinh())
    cucBo._updatedAt = Date.now()                       /* mới hơn mây rất nhiều */
    const mayChu = soThat()
    const { kq, daApDung } = await hoaGiai({ data: JSON.parse(JSON.stringify(mayChu)), updated_at: '2026-08-20T00:00:00Z' }, cucBo)

    expect(kq.viec).toBe('xung-dot-cat-ban-may')
    expect(daApDung).toHaveLength(1)                    /* sổ tài khoản được đưa vào */
    expect(cucBo.rows).toHaveLength(61)
    expect(cucBo.chuyenDaCat).toHaveLength(1)
    expect(cucBo.chuyenDaCat[0].ten).toMatch(/^Bản trên máy · \d\d\/\d\d \d\d:\d\d$/)
    expect(cucBo.chuyenDaCat[0].data.rows).toHaveLength(1)
    expect(cucBo.chuyenDaCat[0].data.title).toBe('Nháp')
    expect(coDuocGhiChua()).toBe(true)
  })

  it('cùng một sổ sửa ở hai nơi (chung id) → luật cũ: ai mới hơn thắng', async () => {
    const cucBo = soThat(); cucBo._updatedAt = 5000; cucBo.rows[0].activity = 'SỬA Ở MÁY'
    const mayChu = soThat()
    const { kq } = await hoaGiai({ data: JSON.parse(JSON.stringify(mayChu)), updated_at: new Date(1000).toISOString() }, cucBo)
    expect(kq.viec).toBe('ban-cuc-bo-moi-hon')
    expect(cucBo.rows[0].activity).toBe('SỬA Ở MÁY')
    expect(cucBo.chuyenDaCat).toHaveLength(0)           /* không đẻ vé thừa */
  })

  it('chỉ một bên có dữ liệu → bên đó thắng bất kể giờ (máy mới trống, mây có sổ)', async () => {
    const cucBo = khoMacDinh(); cucBo._updatedAt = Date.now()
    const { kq } = await hoaGiai({ data: JSON.parse(JSON.stringify(soThat())), updated_at: '2020-01-01T00:00:00Z' }, cucBo)
    expect(kq.viec).toBe('lay-ban-may-chu')
    expect(cucBo.rows).toHaveLength(61)
  })

  it('KỆ HỢP NHẤT theo id trong mọi trường hợp — bên thua không làm bay kệ bên thắng', async () => {
    const cucBo = soThat(); cucBo._updatedAt = 5000
    cucBo.chuyenDaCat = [{ id: 'v-may', ten: 'Vé chỉ có ở máy' }, { id: 'v-chung', ten: 'Chung' }]
    const mayChu = soThat()
    mayChu.chuyenDaCat = [{ id: 'v-chung', ten: 'Chung' }, { id: 'v-may-chu', ten: 'Vé chỉ có trên mây' }]
    const { kq } = await hoaGiai({ data: JSON.parse(JSON.stringify(mayChu)), updated_at: new Date(1000).toISOString() }, cucBo)
    expect(kq.viec).toBe('ban-cuc-bo-moi-hon')
    expect(cucBo.chuyenDaCat.map((v) => v.id).sort()).toEqual(['v-chung', 'v-may', 'v-may-chu'])
  })

  it('hopNhatKe: giữ thứ tự bên A, thêm bên B chưa có, không nhân đôi', () => {
    expect(hopNhatKe([{ id: 1 }, { id: 2 }], [{ id: 2 }, { id: 3 }]).map((v) => v.id)).toEqual([1, 2, 3])
    expect(hopNhatKe(undefined, [{ id: 9 }]).map((v) => v.id)).toEqual([9])
  })
})
