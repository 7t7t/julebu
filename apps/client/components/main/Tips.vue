<template>
  <div
    class="relative flex items-center justify-center"
    :class="isTipsCollapsed ? 'h-10' : 'h-32'"
  >
    <template v-if="!isTipsCollapsed">
      <div class="z-10 hidden items-center justify-center min-[780px]:flex">
        <button
          v-for="keybinding in keybindings"
          @click="keybinding.eventFn"
          class="btn btn-ghost"
        >
          <div class="flex items-center gap-0.5">
            <UKbd v-for="keyStr in parseShortcutKeys(keybinding.keys)">
              {{ keyStr }}
            </UKbd>
          </div>
          <span>{{ keybinding.text }}</span>
        </button>
      </div>
      <MainPrevAndNextBtn />
    </template>
    <!-- 收起/展开按钮 -->
    <div
      class="tips-toggle"
      @click="toggleTips"
    >
      <UTooltip :text="isTipsCollapsed ? '展开快捷键' : '收起快捷键'">
        <UIcon
          :name="isTipsCollapsed ? 'i-ph-caret-up' : 'i-ph-caret-down'"
          class="h-4 w-4 text-gray-400 transition-colors hover:text-purple-500"
        />
      </UTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";

import { useAnswerTip } from "~/composables/main/answerTip";
import { useCurrentStatementEnglishSound } from "~/composables/main/englishSound";
import { useGameMode } from "~/composables/main/game";
import { useSummary } from "~/composables/main/summary";
import { useLayoutCollapse } from "~/composables/main/useLayoutCollapse";
import { useMastered } from "~/composables/main/useMastered";
import { useShortcutKeyMode } from "~/composables/user/shortcutKey";
import { cancelShortcut, parseShortcutKeys, registerShortcut } from "~/utils/keyboardShortcuts";
import { useAnswer } from "./QuestionInput/useAnswer";
import { useWrapperQuestionInput } from "./QuestionInput/useWrapperQuestionInput";

const { isTipsCollapsed, toggleTips } = useLayoutCollapse();
const { toggleAnswerTip, isAnswerTip } = useAnswerTip();
const { shortcutKeys } = useShortcutKeyMode();
const { playSound } = usePlaySound(shortcutKeys.value.sound);
const { goToNextQuestion } = useAnswer();
const { showQuestion, isQuestion } = useGameMode();
const { submitAnswer } = useWrapperQuestionInput();
const { handleMastered } = useMasteredShortcut();
useShowAnswer(shortcutKeys.value.answer);

const keybindings = computed(() => {
  const questionItems = [
    {
      keys: "Enter",
      text: "提交",
      eventFn: () => {
        submitAnswer();
      },
    },
    {
      keys: shortcutKeys.value.answer,
      text: isAnswerTip() ? "隐藏答案" : "显示答案",
      eventFn: () => {
        toggleAnswerTip();
      },
    },
  ];

  const answerItems = [
    {
      keys: "Enter",
      text: "下一题",
      eventFn: () => {
        goToNextQuestion();
      },
    },
    {
      keys: shortcutKeys.value.answer,
      text: "再来一次",
      eventFn: () => {
        showQuestion();
      },
    },
  ];

  const normalItems = [
    {
      keys: shortcutKeys.value.sound,
      text: "播放发音",
      eventFn: playSound,
    },
    {
      keys: shortcutKeys.value.mastered,
      text: "掌握",
      eventFn: handleMastered,
    },
  ];

  const resultItems: any = [...normalItems];

  if (isQuestion()) {
    resultItems.push(...questionItems);
  } else {
    resultItems.push(...answerItems);
  }

  return resultItems;
});

function useMasteredShortcut() {
  const { markStatementAsMastered } = useMastered();

  function handleMastered() {
    markStatementAsMastered();
  }

  onMounted(() => {
    registerShortcut(shortcutKeys.value.mastered, handleMastered);
  });

  onUnmounted(() => {
    cancelShortcut(shortcutKeys.value.mastered, handleMastered);
  });

  return {
    handleMastered,
  };
}

function usePlaySound(key: string) {
  const { playSound } = useCurrentStatementEnglishSound();

  onMounted(() => {
    registerShortcut(key, playSoundCommand);
  });

  onUnmounted(() => {
    cancelShortcut(key, playSoundCommand);
  });

  function playSoundCommand(e: KeyboardEvent) {
    e.preventDefault();
    playSound();
  }

  return {
    playSound,
  };
}

function useShowAnswer(key: string) {
  onMounted(() => {
    registerShortcut(key, handleShowAnswer);
  });

  onUnmounted(() => {
    cancelShortcut(key, handleShowAnswer);
  });

  function handleShowAnswer(e: KeyboardEvent) {
    e.preventDefault();
    // NOTE: registerShortcut 事件会记住注册时的面板状态，所以这里要重新获取下面板信息
    const { showModal } = useSummary();
    if (showModal.value) return;

    const { isAnswer } = useGameMode();
    if (isAnswer()) {
      showQuestion();
    } else {
      toggleAnswerTip();
    }
  }
}
</script>

<style scoped>
.tips-toggle {
  @apply absolute right-0 top-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg
         transition-all duration-200 hover:bg-purple-50
         dark:hover:bg-purple-900/20;
}
</style>
