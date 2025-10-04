import { reportConfigDrift } from '../config-drift'
import fs from 'node:fs'
import path from 'node:path'

const TMP = path.join(process.cwd(), '.tmp-tests')

function write(file: string, content: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

describe('config drift detector', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true })
    fs.mkdirSync(TMP, { recursive: true })
  })

  afterAll(() => {
    process.env = originalEnv
    if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true })
  })

  it('logs drift when keys are missing', () => {
    const example = path.join(TMP, '.env.example.full')
    write(example, 'FOO=\nBAR=\n')
    delete process.env.FOO
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    reportConfigDrift({ examplePath: example, ignoreExtra: true })
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('is quiet when no drift', () => {
    const example = path.join(TMP, '.env.example.full')
    write(example, 'FOO=\nBAR=\n')
    process.env.FOO = 'x'
    process.env.BAR = 'y'
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    reportConfigDrift({ examplePath: example })
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
