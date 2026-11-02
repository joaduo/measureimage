<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Point } from '../types'

const props = defineProps<{
  image: HTMLImageElement
  target: Point
  scale: number
  rotation: number
  size: number
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let frame = 0

function draw() {
  const element = canvas.value
  if (!element) return
  const context = element.getContext('2d')
  if (!context) return
  const ratio = window.devicePixelRatio || 1
  const pixels = Math.round(props.size * ratio)
  if (element.width !== pixels || element.height !== pixels) {
    element.width = pixels
    element.height = pixels
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.fillStyle = '#374151'
  context.fillRect(0, 0, props.size, props.size)
  context.save()
  context.translate(props.size / 2, props.size / 2)
  context.rotate(props.rotation * Math.PI / 180)
  context.scale(props.scale, props.scale)
  context.translate(-props.target.x, -props.target.y)
  context.drawImage(props.image, 0, 0)
  context.restore()
  const center = props.size / 2
  context.beginPath()
  context.moveTo(center - 18, center)
  context.lineTo(center + 18, center)
  context.moveTo(center, center - 18)
  context.lineTo(center, center + 18)
  context.strokeStyle = '#000000'
  context.lineWidth = 5
  context.stroke()
  context.strokeStyle = '#ffffff'
  context.lineWidth = 2
  context.stroke()
}

function scheduleDraw() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(draw)
}

watch(() => [props.image, props.target.x, props.target.y, props.scale, props.rotation, props.size], scheduleDraw)
onMounted(() => {
  scheduleDraw()
  window.addEventListener('resize', scheduleDraw)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('resize', scheduleDraw)
})
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute z-10 overflow-hidden rounded-xl border-2 border-white/80 bg-gray-700 shadow-xl"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      boxSizing: 'content-box',
      top: 'max(env(safe-area-inset-top), 0.75rem)',
      right: 'max(env(safe-area-inset-right), 0.75rem)',
    }"
  >
    <canvas ref="canvas" class="block h-full w-full" />
  </div>
</template>
