<script setup lang="ts">
import { computed } from 'vue'
import type Konva from 'konva'
import type { MeasureLine } from '../types'
import { useScale } from '../composables/useScale'
import { useMeasureStore } from '../stores/measure'

const props = defineProps<{
  line: MeasureLine
  worldScale: number
  worldRotation: number
  selected: boolean
}>()

const { formatLength } = useScale()
const measure = useMeasureStore()

const points = computed(() => [props.line.a.x, props.line.a.y, props.line.b.x, props.line.b.y])
const mid = computed(() => ({
  x: (props.line.a.x + props.line.b.x) / 2,
  y: (props.line.a.y + props.line.b.y) / 2,
}))
const label = computed(() => formatLength(props.line))
const fontSize = computed(() => 16 / props.worldScale)
const strokeWidth = computed(() => (props.selected ? 4 : 3) / props.worldScale)
const hitWidth = computed(() => 28 / props.worldScale)
const handleRadius = computed(() => 9 / props.worldScale)
const labelOffset = computed(() => 12 / props.worldScale)
// Center the label horizontally around the midpoint and counter-rotate it
const labelBox = computed(() => 220 / props.worldScale)

function select(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  e.cancelBubble = true
  measure.select(props.line.id)
}

function dragEndpoint(key: 'a' | 'b', e: Konva.KonvaEventObject<DragEvent>) {
  const p = e.target.position()
  measure.updateLine(props.line.id, { [key]: { x: p.x, y: p.y } })
}

function dragBody(e: Konva.KonvaEventObject<DragEvent>) {
  const d = e.target.position()
  if (d.x === 0 && d.y === 0) return
  measure.updateLine(props.line.id, {
    a: { x: props.line.a.x + d.x, y: props.line.a.y + d.y },
    b: { x: props.line.b.x + d.x, y: props.line.b.y + d.y },
  })
  e.target.position({ x: 0, y: 0 })
}
</script>

<template>
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
    @dragmove="dragBody"
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
        strokeWidth: 2 / worldScale,
        strokeScaleEnabled: false,
        draggable: true,
      }"
      @dragmove="dragEndpoint(key, $event)"
    />
  </template>
  <v-text
    :config="{
      x: mid.x,
      y: mid.y - labelOffset,
      width: labelBox,
      offsetX: labelBox / 2,
      text: label,
      fontSize,
      fontStyle: 'bold',
      fill: selected ? '#ffffff' : line.color,
      rotation: -worldRotation,
      align: 'center',
      listening: false,
    }"
  />
</template>
