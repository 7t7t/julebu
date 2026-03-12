<template>
  <div class="answer-tip-overlay">
    <div class="answer-tip-card">
      <div class="answer-tip-body">
        <button
          class="answer-tip-close"
          @click="hiddenAnswerTip"
          tabindex="-1"
        >
          <UIcon
            name="i-heroicons-x-mark-20-solid"
            class="h-4 w-4"
          />
        </button>
        <div class="answer-tip-text">{{ courseStore.currentStatement?.english }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAnswerTip } from "~/composables/main/answerTip";
import { useCourseStore } from "~/store/course";

const courseStore = useCourseStore();
const { hiddenAnswerTip } = useAnswerTip();
</script>

<style scoped>
.answer-tip-overlay {
  @apply absolute left-1/2 top-32 z-10 flex w-3/4 max-w-xl -translate-x-1/2 items-center justify-center;
  animation: tipSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.answer-tip-card {
  @apply w-full overflow-hidden rounded-2xl;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(168, 85, 247, 0.15);
}

:root.dark .answer-tip-card,
.dark .answer-tip-card {
  background: rgba(30, 30, 50, 0.95);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.answer-tip-body {
  @apply relative px-8 py-6;
}

.answer-tip-close {
  @apply absolute right-3 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full
         text-gray-400 transition-all duration-200
         hover:bg-gray-100 hover:text-gray-600
         dark:hover:bg-gray-700 dark:hover:text-gray-300;
  border: none;
  background: transparent;
}

.answer-tip-text {
  @apply text-center text-2xl font-medium text-gray-800 dark:text-gray-100;
  letter-spacing: 0.3px;
}

@keyframes tipSlideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -8px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
