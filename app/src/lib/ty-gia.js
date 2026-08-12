/* ============================================================
   Lấy tỷ giá thị trường (mid-market, loại wise.com hiển thị).
   Bê từ index.html v9.6 (dòng 2354–2394).

   Một thay đổi duy nhất so với bản cũ, và nó không đổi hành vi:
   phần đọc câu trả lời của Claude được tách ra thành `docTyGiaTuTraLoi`
   để test được mà không cần gọi mạng. Logic bên trong y hệt.
   ============================================================ */

/* Đọc số tỷ giá ra khỏi câu trả lời của Claude.
   Câu trả lời hay bọc trong ```json … ``` hoặc kèm chữ thừa hai đầu,
   nên phải gỡ rào rồi mới bắt cặp ngoặc nhọn đầu tiên. */
export function docTyGiaTuTraLoi (data) {
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text || '')
    .join('\n')
  const clean = text.replace(/```json|```/g, '').trim()
  const match = clean.match(/\{[\s\S]*?\}/)
  const parsed = JSON.parse(match ? match[0] : clean)
  const r = parseFloat(parsed.rate)
  if (!isFinite(r) || r <= 0) throw new Error('invalid rate')
  return r
}

/* Đọc tỷ giá ra khỏi câu trả lời của open.er-api.com.
   Trả null khi câu trả lời không dùng được, để bên gọi thử cách 2. */
export function docTyGiaTuApiCongKhai (pub) {
  if (pub && pub.result === 'success' && pub.rates &&
      isFinite(pub.rates.VND) && pub.rates.VND > 0) {
    return pub.rates.VND
  }
  return null
}

export async function layTyGiaThiTruong (cur) {
  /* Cách 1: API tỷ giá công khai, miễn phí (chạy khi host trên web như GitHub Pages) */
  try {
    const pubRes = await fetch('https://open.er-api.com/v6/latest/' + encodeURIComponent(cur))
    if (pubRes.ok) {
      const r = docTyGiaTuApiCongKhai(await pubRes.json())
      if (r !== null) return r
    }
  } catch (e) { /* thử cách 2 */ }

  /* Cách 2: hỏi Claude kèm tìm kiếm web.
     CHÚ Ý: đường này chỉ chạy khi app được mở BÊN TRONG Claude.ai — ở đó
     lời gọi được thay khoá hộ. Bản phát trên GitHub Pages không có khoá
     nên nhánh này sẽ luôn hỏng. Bê nguyên sang để không đổi hành vi ở lô
     này; quyết định giữ hay bỏ để dành cho lô 11 (tầng AI). */
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: 'Search the web for the CURRENT mid-market exchange rate from ' + cur +
          ' to Vietnamese dong (VND). This is the mid-market rate, the same type of rate wise.com displays. ' +
          'Respond with ONLY a raw JSON object, no markdown fences, no explanation: ' +
          '{"rate": <number of VND per 1 ' + cur + '>}'
      }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }]
    })
  })
  return docTyGiaTuTraLoi(await response.json())
}
