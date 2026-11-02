<script setup lang="ts">
import { computed, ref } from 'vue'
import type Konva from 'konva'
import type { MeasureLine } from '../types'
import { useScale } from '../composables/useScale'
import { useMeasureStore } from '../stores/measure'
import { useSettingsStore } from '../stores/settings'

const props = defineProps<{
  line: MeasureLine
  worldScale: number
  worldRotation: number
  selected: boolean
}>()

const { formatLength } = useScale()
const measure = useMeasureStore()

const settings = useSettingsStore()
const dragOrigin = ref<Pick<MeasureLine, 'a' | 'b'> | null>(null)
const points = computed(() => {
  const { a, b } = dragOrigin.value ?? props.line
  return [a.x, a.y, b.x, b.y]
})
const mid = computed(() => ({
  x: (props.line.a.x + props.line.b.x) / 2,
  y: (props.line.a.y + props.line.b.y) / 2,
}))
const label = computed(() => formatLength(props.line))
const fontSize = computed(() => settings.labelSize / props.worldScale)
const strokeWidth = computed(() => settings.lineThickness + (props.selected ? 1 : 0))
const hitWidth = computed(() => Math.max(28, strokeWidth.value + 10))
const handleRadius = computed(() => 9 / props.worldScale)
const labelOffset = computed(() => 12 / props.worldScale)
// Center the label horizontally around the midpoint and counter-rotate it
const labelBox = computed(() => Math.max(220, label.value.length * settings.labelSize) / props.worldScale)

function select(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  e.cancelBubble = true
  measure.select(props.line.id)
}

function pressEndpoint(key: 'a' | 'b', e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  if ('touches' in e.evt && e.evt.touches.length > 1) return
  measure.selectEndpoint(props.line.id, key)
}

function dragEndpoint(key: 'a' | 'b', e: Konva.KonvaEventObject<DragEvent>) {
  const p = e.target.position()
  measure.updateLine(props.line.id, { [key]: { x: p.x, y: p.y } })
}

function startBodyDrag() {
  measure.selectedEndpoint = null
  dragOrigin.value = { a: { ...props.line.a }, b: { ...props.line.b } }
}

function dragBody(e: Konva.KonvaEventObject<DragEvent>) {
  const origin = dragOrigin.value
  if (!origin) return
  const d = e.target.position()
  measure.updateLine(props.line.id, {
    a: { x: origin.a.x + d.x, y: origin.a.y + d.y },
    b: { x: origin.b.x + d.x, y: origin.b.y + d.y },
  })
}

function endBodyDrag(e: Konva.KonvaEventObject<DragEvent>) {
  dragBody(e)
  e.target.position({ x: 0, y: 0 })
  dragOrigin.value = null
}
</script>

<template>
  <v-line
    :config="{
      points: [line.a.x, line.a.y, line.b.x, line.b.y],
      stroke: '#111827',
      strokeWidth: strokeWidth + 4,
      strokeScaleEnabled: false,
      lineCap: 'round',
      listening: false,
    }"
  />
  <v-line
    :config="{
      points,
      stroke: line.color,
      strokeWidth,
      hitStrokeWidth: hitWidth,
      strokeScaleEnabled: false,
      lineCap: 'round',
      draggable: selected,
      shadowColor: '#000',
      shadowBlur: selected ? 6 / worldScale : 0,
      shadowOpacity: 0.6,
    }"
    @click="select"
    @tap="select"
    @dragstart="startBodyDrag"
    @dragmove="dragBody"
    @dragend="endBodyDrag"
  />
  <template v-if="selected">
    <v-circle
      v-for="key in (['a', 'b'] as const)"
      :key="key"
      :config="{
        x: line[key].x,
        y: line[key].y,
        radius: handleRadius,
        fill: '#ffffff',
        stroke: line.color,
        strokeWidth: 2,
        strokeScaleEnabled: false,
        draggable: true,
      }"
      @mousedown="pressEndpoint(key, $event)"
      @touchstart="pressEndpoint(key, $event)"
      @click="$event.cancelBubble = true"
      @tap="$event.cancelBubble = true"
      @dragmove="dragEndpoint(key, $event)"
    />
  </template>
  <v-text
    v-if="!settings.selectedLabelOnly || selected"
    :config="{
      x: mid.x,
      y: mid.y - labelOffset,
      width: labelBox,
      offsetX: labelBox / 2,
      text: label,
      fontSize,
      fontStyle: 'bold',
      fill: selected ? '#ffffff' : line.color,
      stroke: '#111827',
      strokeWidth: 4 / worldScale,
      fillAfterStrokeEnabled: true,
      lineJoin: 'round',
      padding: 4 / worldScale,
      rotation: -worldRotation,
      align: 'center',
      listening: false,
    }"
  />
</template>
