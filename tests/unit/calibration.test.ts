import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import CalibrationDialog from '../../src/components/CalibrationDialog.vue'
import MeasureLineShape from '../../src/components/MeasureLineShape.vue'
import SelectionBar from '../../src/components/SelectionBar.vue'
import { LINE_DASH, REFERENCE_COLOR, useMeasureStore } from '../../src/stores/measure'
import { useSettingsStore } from '../../src/stores/settings'
import { useUiStore } from '../../src/stores/ui'
import en from '../../src/i18n/en.json'

const wrappers: VueWrapper[] = []
const i18n = () => createI18n({ legacy: false, locale: 'en', messages: { en } })
const LineStub = defineComponent({ props: ['config'], template: '<div />' })
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
})

function dialog() {
  const wrapper = mount(CalibrationDialog, { global: { plugins: [i18n()] } })
  wrappers.push(wrapper)
  return wrapper
}

function addLine(length = 100) {
  return useMeasureStore().addLine({ x: 0, y: 0 }, { x: length, y: 0 })
}

describe('calibration dialog', () => {
  it('prefills the precise current value, switches immediately, and rolls back on dismissal', async () => {
    const measure = useMeasureStore()
    const ui = useUiStore()
    const first = addLine()
    const second = addLine(33)
    measure.calibration = { lineId: first.id, realLength: 7, unit: 'cm' }
    const wrapper = dialog()
    ui.calibrationLineId = second.id
    await nextTick()
    expect(Number(wrapper.get('input').element.value)).toBeCloseTo(2.31, 12)
    expect(measure.referenceLineId).toBe(second.id)
    expect(measure.scaleFactor).toBeCloseTo(0.07, 12)
    await wrapper.get('input').setValue('99')
    expect(measure.scaleFactor).toBeCloseTo(0.07, 12)
    await wrapper.get('div').trigger('click')
    expect(measure.calibration).toEqual({ lineId: first.id, realLength: 7, unit: 'cm' })
    expect(ui.calibrationLineId).toBeNull()
  })

  it('starts with an empty real length and pixel hint, then commits the entered calibration', async () => {
    const measure = useMeasureStore()
    const ui = useUiStore()
    const line = addLine()
    const wrapper = dialog()
    ui.calibrationLineId = line.id
    await nextTick()
    expect(wrapper.get('input').element.value).toBe('')
    expect(wrapper.text()).toContain('100.0 px')
    expect(measure.scaleFactor).toBeNull()
    await wrapper.get('input').setValue('12')
    await wrapper.get('select').setValue('in')
    await wrapper.get('form').trigger('submit')
    expect(measure.calibration).toEqual({ lineId: line.id, realLength: 12, unit: 'in' })
    expect(useSettingsStore().unit).toBe('in')
    expect(ui.calibrationLineId).toBeNull()
  })

  it('closes on reset and cannot restore a reference from the previous image', async () => {
    const measure = useMeasureStore()
    const ui = useUiStore()
    const line = addLine()
    const wrapper = dialog()
    ui.calibrationLineId = line.id
    await nextTick()
    measure.reset()
    await nextTick()
    expect(ui.calibrationLineId).toBeNull()
    expect(measure.pendingCalibration).toBeNull()
    expect(wrapper.find('input').exists()).toBe(false)
  })
})

describe('reference presentation', () => {
  it('uses red continuous reference strokes and matching short-dashed ordinary outlines', async () => {
    const measure = useMeasureStore()
    const line = addLine()
    const wrapper = mount(MeasureLineShape, {
      props: { line, worldScale: 0.25, worldRotation: 45, selected: false },
      global: { stubs: { 'v-line': LineStub, 'v-circle': true, 'v-text': true } },
    })
    wrappers.push(wrapper)
    let strokes = wrapper.findAllComponents(LineStub)
    expect(strokes[0]!.props('config').dash).toEqual(LINE_DASH)
    expect(strokes[1]!.props('config').dash).toEqual(LINE_DASH)
    expect(strokes[1]!.props('config').hitStrokeWidth).toBeGreaterThan(20)
    measure.calibration = { lineId: line.id, realLength: 5, unit: 'cm' }
    await nextTick()
    strokes = wrapper.findAllComponents(LineStub)
    expect(strokes[0]!.props('config').dash).toEqual([])
    expect(strokes[1]!.props('config').dash).toEqual([])
    expect(strokes[1]!.props('config').stroke).toBe(REFERENCE_COLOR)
  })

  it('warns on reference selection and hides ordinary color controls', async () => {
    const measure = useMeasureStore()
    const line = addLine()
    measure.calibration = { lineId: line.id, realLength: 5, unit: 'cm' }
    const wrapper = mount(SelectionBar, { global: { plugins: [i18n()] } })
    wrappers.push(wrapper)
    expect(wrapper.text()).toContain('changing its length updates all other measurements')
    expect(wrapper.text()).toContain('before deleting the reference')
    expect(wrapper.findAll('[aria-label="Line color"]')).toHaveLength(0)
    measure.select(null)
    await nextTick()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })
})
