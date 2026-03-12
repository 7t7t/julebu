<template>
  <div class="tool-bar">
    <!-- 左侧 -->
    <div class="flex items-center gap-1">
      <NuxtLink
        class="tool-icon-btn"
        :href="`/course-pack/${courseStore.currentCourse?.coursePackId}`"
      >
        <UTooltip text="课程列表">
          <IconsExpand class="h-5 w-5" />
        </UTooltip>
      </NuxtLink>
      <div
        class="tool-course-title"
        @click="openCourseContents"
      >
        <UTooltip text="课程题目列表">
          <span class="tool-course-name">{{ courseStore.currentCourse?.title }}</span>
          <span class="tool-course-progress"
            >{{ currentSchedule }}/{{ courseStore.visibleStatementsCount }}</span
          >
        </UTooltip>
      </div>
      <MainStudyVideoLink :video="courseStore.currentCourse?.video" />
    </div>

    <!-- 右侧 -->
    <div class="flex items-center gap-1">
      <div
        @click="openGameSettingModal"
        v-if="isDictationMode()"
      >
        <UTooltip text="游戏设置">
          <UIcon
            name="i-ph-gear"
            class="tool-icon-btn h-5 w-5"
          />
        </UTooltip>
      </div>

      <div
        v-if="isAuthenticated()"
        @click="pauseGame"
      >
        <UTooltip
          text="暂停游戏"
          :shortcuts="parseShortcut(shortcutKeys.pause)"
        >
          <UIcon
            name="i-ph-pause"
            class="tool-icon-btn h-5 w-5"
          />
        </UTooltip>
      </div>

      <div @click="handleDoAgain">
        <UTooltip text="重置当前课程进度">
          <UIcon
            name="i-ph-arrow-counter-clockwise"
            class="tool-icon-btn h-5 w-5"
          />
        </UTooltip>
      </div>
      <div @click="rankingStore.showRankModal">
        <UTooltip text="排行榜">
          <UIcon
            name="i-ph-ranking"
            class="tool-icon-btn h-5 w-5"
          />
        </UTooltip>
      </div>
    </div>

    <MainCourseContents v-model:isOpen="isOpenCourseContents"></MainCourseContents>
  </div>

  <CommonProgressBar
    class="h-3"
    :percentage="currentPercentage"
    :show-label="false"
  />
  <RankRankingBoard />
</template>

<script setup lang="ts">
import { useModal } from "#imports";
import { computed, ref } from "vue";

import Dialog from "~/components/common/Dialog.vue";
import { useQuestionInput } from "~/components/main/QuestionInput/questionInputHelper";
import { courseTimer } from "~/composables/courses/courseTimer";
import { useGameMode } from "~/composables/main/game";
import { clearQuestionInput } from "~/composables/main/question";
import { useCourseContents } from "~/composables/main/useCourseContents";
import { useGamePause } from "~/composables/main/useGamePause";
import { useGameSetting } from "~/composables/main/useGameSetting";
import { useRanking } from "~/composables/rank/rankingList";
import { useGamePlayMode } from "~/composables/user/gamePlayMode";
import { parseShortcut, useShortcutKeyMode } from "~/composables/user/shortcutKey";
import { isAuthenticated } from "~/services/auth";
import { useCourseStore } from "~/store/course";

const { shortcutKeys } = useShortcutKeyMode();
const { isDictationMode } = useGamePlayMode();
const rankingStore = useRanking();
const courseStore = useCourseStore();
const { focusInput } = useQuestionInput();
const { openCourseContents } = useCourseContents();
const { handleDoAgain } = useDoAgain();
const { pauseGame } = useGamePause();
const { openGameSettingModal } = useGameSetting();
const modal = useModal();

const currentSchedule = computed(() => {
  return courseStore.visibleStatementIndex + 1;
});

const currentPercentage = computed(() => {
  if (courseStore.isAllDone()) {
    return 100;
  }
  return ((courseStore.visibleStatementIndex / courseStore.visibleStatementsCount) * 100).toFixed(
    2,
  );
});

const isOpenCourseContents = ref(false);

function useDoAgain() {
  const { showQuestion } = useGameMode();

  function handleDoAgain() {
    modal.open(Dialog, {
      title: "重置进度",
      content: "是否确认重置当前课程进度？",
      showCancel: true,
      showConfirm: true,
      async onCancel() {
        setTimeout(() => {
          focusInput();
        }, 300);
      },
      async onConfirm() {
        handleTipConfirm();
      },
    });
  }

  function handleTipConfirm() {
    courseStore.doAgain();
    clearQuestionInput();
    showQuestion();
    courseTimer.reset();
    // dialog 关闭后 自动聚焦 因为关闭有个 200 毫秒的动画 所以需要延迟聚焦 input
    setTimeout(() => {
      focusInput();
    }, 300);
  }

  return {
    handleDoAgain,
    handleTipConfirm,
  };
}
</script>

<style scoped>
.tool-bar {
  @apply relative flex items-center justify-between pb-2 pt-3 text-sm;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

.tool-icon-btn {
  @apply flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg
         text-gray-500 transition-all duration-200
         hover:bg-purple-50 hover:text-purple-500
         dark:text-gray-400 dark:hover:bg-purple-900/20 dark:hover:text-purple-400;
}

.tool-course-title {
  @apply flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5
         text-gray-700 transition-all duration-200
         hover:bg-purple-50 hover:text-purple-600
         dark:text-gray-300 dark:hover:bg-purple-900/20 dark:hover:text-purple-400;
}

.tool-course-name {
  @apply text-sm font-medium;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-course-progress {
  @apply rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-600
         dark:bg-purple-900/30 dark:text-purple-400;
}
</style>
