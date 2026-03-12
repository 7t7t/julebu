<template>
  <div class="flex h-full items-center justify-center">
    <div
      v-if="!isStart"
      class="start-prompt"
    >
      <button
        v-if="isMobile"
        class="start-btn"
        @click="startGame"
      >
        <UIcon
          name="i-ph-play-fill"
          class="mr-2 h-5 w-5"
        />
        准备好了吗？点我开始
      </button>
      <div
        v-else
        class="start-hint"
      >
        <div class="start-hint-icon">
          <UIcon
            name="i-ph-keyboard"
            class="h-8 w-8 text-purple-400"
          />
        </div>
        <p class="start-hint-text">准备好了吗？</p>
        <p class="start-hint-sub">按任意键开启游戏</p>
      </div>
    </div>
    <div v-else>
      <template v-if="isQuestion()">
        <ModeDictationQuestion />
        <MainAnswerTip v-show="isAnswerTip()" />
      </template>
      <template v-else-if="isAnswer()">
        <MainAnswer />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { useAnswerTip } from "~/composables/main/answerTip";
import { useGameMode } from "~/composables/main/game";
import { useDevice } from "~/utils/detectDevice";
import { cancelShortcut, registerShortcut } from "~/utils/keyboardShortcuts";

const { isMobile } = useDevice();
const { isAnswer, isQuestion } = useGameMode();
const { isAnswerTip } = useAnswerTip();
const { isStart, startGame } = useStartGame();

function useStartGame() {
  const isStart = ref(false);

  function handleKeyup(e: KeyboardEvent) {
    e.preventDefault();
    startGame();
    cancelShortcut("*", handleKeyup);
  }

  onMounted(() => {
    registerShortcut("*", handleKeyup);
  });

  function startGame() {
    isStart.value = true;
  }

  return {
    isStart,
    startGame,
  };
}
</script>

<style scoped>
.start-prompt {
  animation: fadeIn 0.5s ease-out;
}

.start-btn {
  @apply flex cursor-pointer items-center rounded-xl border-none bg-purple-500 px-8 py-4 text-lg font-medium
         text-white shadow-lg transition-all duration-300
         hover:bg-purple-600 hover:shadow-xl;
}

.start-hint {
  @apply flex flex-col items-center gap-3;
}

.start-hint-icon {
  @apply flex h-16 w-16 items-center justify-center rounded-2xl;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(139, 92, 246, 0.15));
  animation: pulse 2s ease-in-out infinite;
}

.start-hint-text {
  @apply text-2xl font-semibold text-gray-700 dark:text-gray-200;
}

.start-hint-sub {
  @apply text-base text-gray-400 dark:text-gray-500;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>
