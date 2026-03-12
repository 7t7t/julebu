<template>
  <div class="answer-container">
    <div class="answer-english">
      <span
        v-for="word in words"
        :key="word"
        class="answer-word"
        @click="handlePlayWordSound(word)"
        >{{ word }}</span
      >
      <UIcon
        name="i-ph-speaker-simple-high"
        class="ml-2 inline-block h-6 w-6 cursor-pointer text-gray-400 transition-colors hover:text-purple-500"
        @click="handlePlayEnglishSound"
      ></UIcon>
    </div>
    <div class="answer-soundmark">
      {{ courseStore.currentStatement?.soundmark }}
    </div>
    <div class="answer-chinese">
      {{ courseStore.currentStatement?.chinese }}
    </div>
    <div class="answer-actions">
      <div class="flex items-center gap-3">
        <button
          class="answer-btn"
          @click="showQuestion"
        >
          再来一次
        </button>
        <button
          class="answer-btn answer-btn-primary"
          @click="goToNextQuestion"
        >
          下一题
        </button>
      </div>
      <div class="md:hidden">
        <MainMasteredBtn></MainMasteredBtn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";

import { useCurrentStatementEnglishSound } from "~/composables/main/englishSound";
import { usePlayWordSound } from "~/composables/main/englishSound/audio";
import { useGameMode } from "~/composables/main/game";
import { useAutoPronunciation } from "~/composables/user/sound";
import { useCourseStore } from "~/store/course";
import { cancelShortcut, registerShortcut } from "~/utils/keyboardShortcuts";
import { useAnswer } from "./QuestionInput/useAnswer";

const courseStore = useCourseStore();
const { handlePlayWordSound } = usePlayWordSound();
const { handlePlayEnglishSound } = usePlayEnglishSound();
const { showQuestion } = useGameMode();
const { isAutoPlaySound } = useAutoPronunciation();
const { goToNextQuestion } = useAnswer();

const words = computed(() => courseStore.currentStatement?.english.split(" "));

registerShortcutKeyForNextQuestion();

function usePlayEnglishSound() {
  const { playSound } = useCurrentStatementEnglishSound();

  onMounted(() => {
    if (isAutoPlaySound()) {
      playSound();
    }
  });

  function handlePlayEnglishSound() {
    playSound();
  }

  return {
    handlePlayEnglishSound,
  };
}

function registerShortcutKeyForNextQuestion() {
  function handleKeydown(e: KeyboardEvent) {
    e.preventDefault(); // 阻止到下一个页面的默认按键动作
    goToNextQuestion();
  }
  onMounted(() => {
    registerShortcut(" ", handleKeydown);
    registerShortcut("enter", handleKeydown);
  });

  onUnmounted(() => {
    cancelShortcut(" ", handleKeydown);
    cancelShortcut("enter", handleKeydown);
  });
}
</script>

<style scoped>
.answer-container {
  @apply flex flex-col items-center gap-5 text-center;
}

.answer-english {
  @apply inline-flex flex-wrap items-center justify-center gap-1.5;
  font-size: 2.8rem;
  line-height: 1.2;
}

.answer-word {
  @apply cursor-pointer rounded-md px-1 py-0.5 transition-all duration-200
         hover:bg-purple-50 hover:text-purple-500
         dark:hover:bg-purple-900/20 dark:hover:text-purple-400;
}

.answer-soundmark {
  @apply text-lg text-gray-400 dark:text-gray-500;
  letter-spacing: 0.5px;
}

.answer-chinese {
  @apply text-xl font-medium text-gray-500 dark:text-gray-400;
}

.answer-actions {
  @apply mt-2 space-y-3;
}

.answer-btn {
  @apply cursor-pointer rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium
         text-gray-600 transition-all duration-200
         hover:border-purple-400 hover:text-purple-500
         dark:border-gray-600 dark:text-gray-400 dark:hover:border-purple-500 dark:hover:text-purple-400;
}

.answer-btn-primary {
  @apply border-purple-500 bg-purple-500 text-white
         hover:border-purple-600 hover:bg-purple-600 hover:text-white;
}
</style>
