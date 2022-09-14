<script lang="ts" setup>
import './assets/css/main.css'

const isDark = ref(false)

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  if (isDark.value)
    document.documentElement.setAttribute('data-theme', 'dark')
  else
    document.documentElement.setAttribute('data-theme', 'light')
}

const buttonLabel = computed(() => {
  return isDark.value ? 'Sun' : 'Dark'
})
</script>

<template>
  <div class="text-fg-default bg-bg-default">
    <button
      class="h-10 px-6 font-semibold rounded-md bg-bg-default text-fg-default border-solid border-fg-default border-2"
      @click="toggleDarkMode"
    >
      {{ buttonLabel }}
    </button>
  </div>
  <div>
    <div class="flex justify-center items-center h-screen bg-bg-default">
      <div class="grid gap-4 grid-cols-2 grid-rows-2">
        <button
          class="h-10 px-6 font-semibold rounded-md bg-bg-default text-fg-default border-solid border-fg-default border-2"
        >
          Primary
        </button>

        <button
          class="h-10 px-6 font-semibold rounded-md bg-bg-muted text-fg-muted border-solid border-fg-muted border-2"
        >
          Secondary
        </button>
      </div>
    </div>
  </div>
</template>
