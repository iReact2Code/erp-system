import {
  isFlagEnabled,
  setRuntimeFlag,
  clearRuntimeFlag,
  listFlags,
  whenFlag,
} from '../feature-flags'

// Note: process.env mutations are visible to same test file; restore after.
const ORIGINAL_ENV = { ...process.env }

describe('feature-flags', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    clearRuntimeFlag('experimentalCaching')
    clearRuntimeFlag('newDashboardWidgets')
  })

  it('resolves default flags', () => {
    expect(isFlagEnabled('optimizedApiClient')).toBe(true)
    expect(isFlagEnabled('newDashboardWidgets')).toBe(false)
  })

  it('env overrides default', () => {
    process.env.FLAG_NEW_DASHBOARD_WIDGETS = 'true'
    expect(isFlagEnabled('new-dashboard-widgets')).toBe(true)
  })

  it('runtime override supersedes default', () => {
    setRuntimeFlag('newDashboardWidgets', true)
    expect(isFlagEnabled('newDashboardWidgets')).toBe(true)
  })

  it('supports whenFlag helper', () => {
    setRuntimeFlag('experimentalCaching', true)
    const value = whenFlag(
      'experimentalCaching',
      () => 'ON',
      () => 'OFF'
    )
    expect(value).toBe('ON')
  })

  it('lists combined flags with sources', () => {
    process.env.FLAG_EXPERIMENTAL_CACHING = 'on'
    setRuntimeFlag('newDashboardWidgets', true)
    const summary = listFlags()
    expect(summary.optimizedapiclient.value).toBe(true)
    expect(summary.newdashboardwidgets.source).toBe('runtime')
    expect(summary.experimentalcaching.source).toBe('env')
  })
})
