import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useImageStore = defineStore('image', () => {
  const element = ref<HTMLImageElement | null>(null)
  const url = ref<string | null>(null)

  function setImage(file: File) {
    if (url.value) URL.revokeObjectURL(url.value)
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      element.value = img
      url.value = objectUrl
    }
    img.src = objectUrl
  }

  function clear() {
    if (url.value) URL.revokeObjectURL(url.value)
    element.value = null
    url.value = null
  }

  return { element, url, setImage, clear }
})
