import { describe, it, expect } from 'vitest'
import { docTyGiaTuApiCongKhai, docTyGiaTuTraLoi } from './ty-gia.js'

const traLoi = (text) => ({ content: [{ type: 'text', text }] })

describe('docTyGiaTuApiCongKhai', () => {
  it('đọc được câu trả lời hợp lệ', () => {
    expect(docTyGiaTuApiCongKhai({
      result: 'success', rates: { VND: 784.283273 }
    })).toBe(784.283273)
  })

  it('trả null khi câu trả lời không dùng được, để bên gọi thử cách 2', () => {
    expect(docTyGiaTuApiCongKhai(null)).toBe(null)
    expect(docTyGiaTuApiCongKhai({})).toBe(null)
    expect(docTyGiaTuApiCongKhai({ result: 'error' })).toBe(null)
    expect(docTyGiaTuApiCongKhai({ result: 'success', rates: {} })).toBe(null)
    expect(docTyGiaTuApiCongKhai({ result: 'success', rates: { VND: 0 } })).toBe(null)
    expect(docTyGiaTuApiCongKhai({ result: 'success', rates: { VND: -5 } })).toBe(null)
  })
})

describe('docTyGiaTuTraLoi', () => {
  it('đọc JSON trần', () => {
    expect(docTyGiaTuTraLoi(traLoi('{"rate": 34902.96}'))).toBe(34902.96)
  })

  it('gỡ được rào ```json quanh câu trả lời', () => {
    expect(docTyGiaTuTraLoi(traLoi('```json\n{"rate": 720}\n```'))).toBe(720)
  })

  it('bỏ qua chữ thừa hai đầu', () => {
    expect(docTyGiaTuTraLoi(traLoi(
      'Theo tỷ giá thị trường hiện tại:\n{"rate": 784.28}\nHy vọng giúp được bạn.'
    ))).toBe(784.28)
  })

  it('bỏ qua khối không phải chữ trong câu trả lời', () => {
    expect(docTyGiaTuTraLoi({
      content: [
        { type: 'server_tool_use', name: 'web_search' },
        { type: 'text', text: '{"rate": 26000}' }
      ]
    })).toBe(26000)
  })

  it('ném lỗi khi số không dùng được — thà hỏng rõ còn hơn ghi bậy vào ô tỷ giá', () => {
    expect(() => docTyGiaTuTraLoi(traLoi('{"rate": 0}'))).toThrow('invalid rate')
    expect(() => docTyGiaTuTraLoi(traLoi('{"rate": -5}'))).toThrow('invalid rate')
    expect(() => docTyGiaTuTraLoi(traLoi('{"rate": "không biết"}'))).toThrow('invalid rate')
  })

  it('ném lỗi khi không có JSON nào trong câu trả lời', () => {
    expect(() => docTyGiaTuTraLoi(traLoi('Xin lỗi, tôi không tìm được tỷ giá.'))).toThrow()
    expect(() => docTyGiaTuTraLoi({ content: [] })).toThrow()
  })
})
