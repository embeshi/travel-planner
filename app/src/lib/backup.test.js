// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { stampName, goiBackup } from './backup.js'
import { khoMacDinh, applyData, ruotCuaBackup } from './kho.js'
import { soMau } from './du-lieu-mau.js'

describe('stampName · đúng khuôn tên mà .gitignore đang chặn', () => {
  it('du-lich-backup-YYYY-MM-DD-HHMM.json, có đệm số 0', () => {
    expect(stampName(new Date(2026, 7, 4, 9, 5))).toBe('du-lich-backup-2026-08-04-0905.json')
    expect(stampName(new Date(2026, 11, 31, 23, 59))).toBe('du-lich-backup-2026-12-31-2359.json')
  })
})

describe('goiBackup · vỏ file khớp từng chữ với v9.6', () => {
  it('đúng bốn khoá vỏ ngoài như file backup thật', () => {
    const { json } = goiBackup(khoMacDinh(), new Date(2026, 7, 20, 12, 0))
    const vo = JSON.parse(json)
    expect(Object.keys(vo).sort()).toEqual(['app', 'data', 'exportedAt', 'kind'])
    expect(vo.app).toBe('ke-hoach-du-lich')
    expect(vo.kind).toBe('backup')
  })

  it('vòng tròn khép kín: xuất từ v10 → nhập lại → sổ y nguyên', () => {
    /* Đây là điều làm đường lui hai chiều: file v10 xuất ra phải nhập
       ngược được — vào chính v10, và vào cả v9.6 (cùng một vỏ). */
    const goc = applyData(soMau(), khoMacDinh())
    const { json } = goiBackup(goc)
    const doc = applyData(ruotCuaBackup(JSON.parse(json)), khoMacDinh())
    expect(doc.rows).toHaveLength(61)
    expect(doc.title).toBe(goc.title)
    expect(JSON.stringify(doc.rows)).toBe(JSON.stringify(goc.rows))
    expect(doc.budget).toBe(goc.budget)
  })

  it('tên file sinh ra bị .gitignore chặn — kiểm khuôn chứ không kiểm git', () => {
    expect(goiBackup(khoMacDinh()).ten).toMatch(/^du-lich-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/)
  })
})
