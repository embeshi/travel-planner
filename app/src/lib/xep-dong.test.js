import { describe, it, expect } from 'vitest'
import { sortByDate, rowTotal, tongLichTrinh, viTienMatConLai, chuyenDong } from './xep-dong.js'

const dong = (id, date, tripCost = 0, pay = '') => ({ id, date, tripCost, pay })
const thuTu = (list) => list.map((r) => r.id).join('|')

describe('sortByDate — vết sẹo', () => {
  it('xếp ổn định: hai dòng cùng ngày giữ nguyên thứ tự người dùng đặt', () => {
    /* Đây là tính chất người dùng cảm nhận rõ nhất: gõ xong ba việc
       trong cùng một ngày mà chúng tự đảo chỗ là hỏng cả trải nghiệm. */
    const list = [
      dong('a', '2026-08-04'),
      dong('b', '2026-08-04'),
      dong('c', '2026-08-04')
    ]
    sortByDate(list)
    expect(thuTu(list)).toBe('a|b|c')
  })

  it('dòng chưa có ngày chìm xuống đáy để nhập tiếp', () => {
    const list = [
      dong('trong', ''),
      dong('sau', '2026-08-05'),
      dong('truoc', '2026-08-04')
    ]
    sortByDate(list)
    expect(thuTu(list)).toBe('truoc|sau|trong')
  })

  it('nhiều dòng trống thì tất cả nằm đáy, vẫn giữ thứ tự với nhau', () => {
    const list = [dong('t1', ''), dong('co', '2026-08-04'), dong('t2', '')]
    sortByDate(list)
    expect(thuTu(list)).toBe('co|t1|t2')
  })

  it('báo TRUE khi thứ tự thật sự đổi', () => {
    /* Bảng dùng tín hiệu này để biết khi nào phải cho con trỏ bay theo
       dòng. Báo sai là người dùng mất chỗ đang gõ. */
    const list = [dong('sau', '2026-08-05'), dong('truoc', '2026-08-04')]
    expect(sortByDate(list)).toBe(true)
  })

  it('báo FALSE khi vốn đã đúng thứ tự — không dời con trỏ vô cớ', () => {
    const list = [dong('truoc', '2026-08-04'), dong('sau', '2026-08-05')]
    expect(sortByDate(list)).toBe(false)
  })

  it('danh sách rỗng và một phần tử không làm vỡ', () => {
    expect(sortByDate([])).toBe(false)
    expect(sortByDate([dong('a', '2026-08-04')])).toBe(false)
  })

  it('so chuỗi yyyy-mm-dd đúng thứ tự thời gian qua mốc năm', () => {
    const list = [dong('sau', '2027-01-01'), dong('truoc', '2026-12-31')]
    sortByDate(list)
    expect(thuTu(list)).toBe('truoc|sau')
  })
})

describe('rowTotal & tongLichTrinh', () => {
  it('ô rỗng tính là 0, không kéo cả tổng thành NaN', () => {
    expect(rowTotal(dong('a', '', ''))).toBe(0)
    const list = [dong('a', '', 120), dong('b', '', ''), dong('c', '', 85)]
    expect(tongLichTrinh(list)).toBe(205)
  })
  it('bảng rỗng có tổng bằng 0', () => {
    expect(tongLichTrinh([])).toBe(0)
  })
})

describe('viTienMatConLai — không so sai phạm trù', () => {
  it('CHỈ trừ những dòng chọn «Tiền mặt»', () => {
    /* Mục 05 PRD: không đem cả lịch trình so với riêng ví tiền mặt.
       Dòng trả bằng Momo hay Thẻ không được đụng vào ví. */
    const rows = [
      dong('a', '2026-08-04', 120, 'Tiền mặt'),
      dong('b', '2026-08-04', 1800, 'Thẻ ngân hàng'),
      dong('c', '2026-08-04', 85, 'Momo'),
      dong('d', '2026-08-04', 200, 'Tiền mặt'),
      dong('e', '2026-08-04', 500, '')
    ]
    expect(viTienMatConLai(rows, 10000)).toBe(10000 - 320)
  })

  it('tiêu quá thì ra số âm để thẻ KPI đổi sang trạng thái cảnh báo', () => {
    const rows = [dong('a', '2026-08-04', 1500, 'Tiền mặt')]
    expect(viTienMatConLai(rows, 1190)).toBe(-310)
  })

  it('chưa đổi đồng nào mà chưa tiêu gì thì bằng 0', () => {
    expect(viTienMatConLai([], '')).toBe(0)
  })
})

describe('chuyenDong · luật nhận ngày của hàng xóm', () => {
  const ds = () => [
    dong('a', '2026-08-04'), dong('b', '2026-08-04'),
    dong('c', '2026-08-05'), dong('d', '2026-08-05')
  ]

  it('kéo trong cùng một ngày thì chỉ đổi thứ tự, KHÔNG đổi ngày', () => {
    const l = ds()
    expect(chuyenDong(l, 1, 0)).toBe(false)
    expect(thuTu(l)).toBe('b|a|c|d')
    expect(l[0].date).toBe('2026-08-04')
  })

  it('thả sang cụm ngày khác thì nhận luôn ngày của cụm đó', () => {
    /* Không có luật này, cú sắp xếp kế tiếp sẽ ném dòng ngược về chỗ cũ
       và người dùng tưởng kéo thả bị hỏng. */
    const l = ds()
    expect(chuyenDong(l, 0, 3)).toBe(true)
    expect(l[3].id).toBe('a')
    expect(l[3].date).toBe('2026-08-05')
  })

  it('nhìn hàng xóm PHÍA TRÊN trước', () => {
    const l = ds()
    chuyenDong(l, 3, 1)          /* d (05) chen vào giữa a và b (04) */
    expect(l[1].id).toBe('d')
    expect(l[1].date).toBe('2026-08-04')
  })

  it('thả lên đầu bảng thì nhìn hàng xóm phía dưới', () => {
    const l = ds()
    chuyenDong(l, 2, 0)          /* c (05) lên đầu, dưới nó là a (04) */
    expect(l[0].id).toBe('c')
    expect(l[0].date).toBe('2026-08-04')
  })

  it('kéo về đúng chỗ cũ thì không làm gì', () => {
    const l = ds()
    expect(chuyenDong(l, 1, 1)).toBe(false)
    expect(thuTu(l)).toBe('a|b|c|d')
  })

  it('danh sách một phần tử không vỡ', () => {
    const l = [dong('a', '2026-08-04')]
    expect(chuyenDong(l, 0, 0)).toBe(false)
    expect(l).toHaveLength(1)
  })
})
