<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type Konva from 'konva'
import { useImageStore } from '../stores/image'
import { useMeasureStore, pixelLength } from '../stores/measure'
import { useUiStore } from '../stores/ui'
import { useSettingsStore } from '../stores/settings'
import MeasureLineShape from './MeasureLineShape.vue'
import type { Point } from '../types'

const imageStore = useImageStore()
const measure = useMeasureStore()
const ui = useUiStore()
const settings = useSettingsStore()

const container = ref<HTMLDivElement | null>(null)
const stageRef = ref<{ getNode: () => Konva.Stage } | null>(null)
const size = reactive({ width: 0, height: 0 })

// World transform (image space → screen space): translate · rotate · scale
const world = reactive({ x: 0, y: 0, scale: 1, rotation: 0 })

const MIN_LINE_PX = 8

// --- coordinate helpers -------------------------------------------------

function screenToWorld(p: Point): Point {
  const rad = (world.rotation * Math.PI) / 180
  const dx = p.x - world.x
  const dy = p.y - world.y
  return {
    x: (dx * Math.cos(rad) + dy * Math.sin(rad)) / world.scale,
    y: (-dx * Math.sin(rad) + dy * Math.cos(rad)) / world.scale,
  }
}

function fitToScreen() {
  const img = imageStore.element
  if (!img || !size.width || !size.height) return
  const scale = Math.min(size.width / img.naturalWidth, size.height / img.naturalHeight) * 0.95
  world.scale = scale
  world.rotation = 0
  world.x = (size.width - img.naturalWidth * scale) / 2
  world.y = (size.height - img.naturalHeight * scale) / 2
}

watch(() => imageStore.element, (el) => el && fitToScreen(), { flush: 'post' })
watch(() => ui.fitRequestCount, fitToScreen)

// --- pointer tracking ----------------------------------------------------

function getStage(): Konva.Stage | null {
  return stageRef.value?.getNode() ?? null
}

function pointers(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): Point[] {
  const stage = getStage()
  if (!stage) return []
  if (e.evt instanceof TouchEvent) {
    stage.setPointersPositions(e.evt)
    return stage.getPointersPositions()
  }
  const p = stage.getPointerPosition()
  return p ? [p] : []
}

// --- navigation gestures -------------------------------------------------

let prevPointers: Point[] = []
let drawing = false
let editing = false
const draftA = ref<Point | null>(null)
const draftB = ref<Point | null>(null)

function centroid(pts: Point[]): Point {
  const n = pts.length || 1
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / n,
    y: pts.reduce((s, p) => s + p.y, 0) / n,
  }
}

function applyTwoPointer(prev: Point[], cur: Point[]) {
  const c1 = centroid(prev)
  const c2 = centroid(cur)
  const d1 = Math.hypot(prev[1]!.x - prev[0]!.x, prev[1]!.y - prev[0]!.y)
  const d2 = Math.hypot(cur[1]!.x - cur[0]!.x, cur[1]!.y - cur[0]!.y)
  const a1 = Math.atan2(prev[1]!.y - prev[0]!.y, prev[1]!.x - prev[0]!.x)
  const a2 = Math.atan2(cur[1]!.y - cur[0]!.y, cur[1]!.x - cur[0]!.x)

  const newScale = d1 > 0 ? world.scale * (d2 / d1) : world.scale
  const newRotation = world.rotation + ((a2 - a1) * 180) / Math.PI

  // World point that was under the previous center must end under the new center
  const pw = screenToWorld(c1)
  const rad = (newRotation * Math.PI) / 180
  world.scale = newScale
  world.rotation = newRotation
  world.x = c2.x - newScale * (Math.cos(rad) * pw.x - Math.sin(rad) * pw.y)
  world.y = c2.y - newScale * (Math.sin(rad) * pw.x + Math.cos(rad) * pw.y)
}

function cancelDraft() {
  drawing = false
  draftA.value = null
  draftB.value = null
}

// --- event handlers ------------------------------------------------------

function onPointerStart(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  if (e.evt instanceof TouchEvent) e.evt.preventDefault()
  const pts = pointers(e)
  if (editing) return
  if (pts.length === 1 && e.target !== getStage()) {
    editing = true
    prevPointers = []
    return
  }
  if (drawing && pts.length > 1) cancelDraft()

  if (!drawing && pts.length === 1 && ui.activeTool === 'measure') {
    drawing = true
    draftA.value = screenToWorld(pts[0]!)
    draftB.value = draftA.value
  }
  prevPointers = pts
}

function onPointerMove(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  if (editing) return
  if (e.evt instanceof TouchEvent) {
    e.evt.preventDefault()
  } else if (!(e.evt.buttons & 1)) {
    // Mouse move without a pressed button is not a gesture
    prevPointers = []
    if (drawing) cancelDraft()
    return
  }
  const pts = pointers(e)
  if (drawing && pts.length === 1) {
    draftB.value = screenToWorld(pts[0]!)
    prevPointers = pts
    return
  }
  if (drawing && pts.length > 1) cancelDraft()

  if (prevPointers.length === 1 && pts.length === 1) {
    world.x += pts[0]!.x - prevPointers[0]!.x
    world.y += pts[0]!.y - prevPointers[0]!.y
  } else if (prevPointers.length >= 2 && pts.length >= 2) {
    applyTwoPointer(prevPointers, pts)
  }
  prevPointers = pts
}

function onPointerEnd(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  // For mouse, the gesture ends on mouseup/mouseleave; for touch, when no
  // fingers remain on screen
  const ended = !(e.evt instanceof TouchEvent) || e.evt.touches.length === 0
  if (editing) {
    if (ended) editing = false
    prevPointers = []
    return
  }
  const pts = ended ? [] : pointers(e)
  if (drawing && ended && draftA.value && draftB.value) {
    if (pixelLength({ a: draftA.value, b: draftB.value }) >= MIN_LINE_PX / world.scale) {
      const line = measure.addLine(draftA.value, draftB.value)
      // The first committed line proposes itself as the reference
      if (!measure.calibration) ui.calibrationLineId = line.id
    }
    cancelDraft()
  }
  prevPointers = pts
}

function onStageTap(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
  // Tapping empty canvas (not a line) clears the selection
  const stage = getStage()
  if (stage && e.target === stage) measure.select(null)
}

function onWheel(e: Konva.KonvaEventObject<WheelEvent>) {
  e.evt.preventDefault()
  const stage = getStage()
  const pointer = stage?.getPointerPosition()
  if (!pointer) return
  const factor = e.evt.deltaY < 0 ? 1.1 : 1 / 1.1
  const pw = screenToWorld(pointer)
  world.scale *= factor
  const rad = (world.rotation * Math.PI) / 180
  world.x = pointer.x - world.scale * (Math.cos(rad) * pw.x - Math.sin(rad) * pw.y)
  world.y = pointer.y - world.scale * (Math.sin(rad) * pw.x + Math.cos(rad) * pw.y)
}

// --- lifecycle -----------------------------------------------------------

let observer: ResizeObserver | null = null

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    size.width = entry!.contentRect.width
    size.height = entry!.contentRect.height
    if (imageStore.element) fitToScreen()
  })
  if (container.value) observer.observe(container.value)
})

onBeforeUnmount(() => observer?.disconnect())

const worldConfig = computed(() => ({
  x: world.x,
  y: world.y,
  scaleX: world.scale,
  scaleY: world.scale,
  rotation: world.rotation,
}))

const draftPoints = computed(() =>
  draftA.value && draftB.value
    ? [draftA.value.x, draftA.value.y, draftB.value.x, draftB.value.y]
    : [],
)
</script>

<template>
  <div ref="container" class="absolute inset-0 overflow-hidden">
    <v-stage
      v-if="size.width > 0"
      ref="stageRef"
      :config="{ width: size.width, height: size.height }"
      @touchstart="onPointerStart"
      @touchmove="onPointerMove"
      @touchend="onPointerEnd"
      @touchcancel="onPointerEnd"
      @mousedown="onPointerStart"
      @mousemove="onPointerMove"
      @mouseup="onPointerEnd"
      @mouseleave="onPointerEnd"
      @wheel="onWheel"
      @click="onStageTap"
      @tap="onStageTap"
    >
      <v-layer>
        <v-group :config="worldConfig">
          <v-image
            v-if="imageStore.element"
            :config="{ image: imageStore.element, listening: false }"
          />
          <MeasureLineShape
            v-for="line in measure.lines"
            :key="line.id"
            :line="line"
            :world-scale="world.scale"
            :world-rotation="world.rotation"
            :selected="line.id === measure.selectedLineId"
          />
          <v-line
            v-if="draftPoints.length"
            :config="{
              points: draftPoints,
              stroke: '#f59e0b',
              strokeWidth: settings.lineThickness,
              strokeScaleEnabled: false,
              dash: [8 / world.scale, 6 / world.scale],
              lineCap: 'round',
              listening: false,
            }"
          />
        </v-group>
      </v-layer>
    </v-stage>
  </div>
</template>
