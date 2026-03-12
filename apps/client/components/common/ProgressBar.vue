<template>
  <div class="progress-bar-track">
    <div
      class="progress-bar-fill"
      :style="{ width: `${percentage}%` }"
    >
      <div class="progress-bar-shine"></div>
    </div>
    <div
      class="progress-bar-label"
      v-if="showLabel"
    >
      {{ Math.round(Number(percentage)) }}%
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    percentage: number | string;
    showLabel?: boolean;
  }>(),
  {
    showLabel: false,
  },
);
</script>

<style scoped>
.progress-bar-track {
  @apply relative overflow-hidden rounded-full;
  background: linear-gradient(135deg, #f0f0f5 0%, #e8e8f0 100%);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

:root.dark .progress-bar-track,
.dark .progress-bar-track {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
}

.progress-bar-fill {
  @apply relative h-full rounded-full;
  background: linear-gradient(90deg, #7c3aed 0%, #a855f7 40%, #c084fc 70%, #a855f7 100%);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
  transition: width 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-width: 4px;
}

.progress-bar-shine {
  @apply absolute inset-0 rounded-full;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 50%,
    transparent 100%
  );
}

.progress-bar-label {
  @apply absolute inset-0 flex items-center justify-center;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
