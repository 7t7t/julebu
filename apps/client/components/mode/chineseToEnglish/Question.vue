<template>
  <div class="text-center">
    <div class="chinese-hint">
      {{ courseStore.currentStatement?.chinese || "生存还是毁灭，这是一个问题" }}
    </div>
    <MainQuestionInput />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";

import { useCurrentStatementEnglishSound } from "~/composables/main/englishSound";
import { useAutoPlayEnglish } from "~/composables/user/sound";
import { useCourseStore } from "~/store/course";

const courseStore = useCourseStore();
const { playSound } = useCurrentStatementEnglishSound();
const { isAutoPlayEnglish } = useAutoPlayEnglish();

onMounted(() => {
  handleAutoPlayEnglish();
});

watch(
  () => courseStore.currentStatement,
  () => {
    handleAutoPlayEnglish();
  },
);

function handleAutoPlayEnglish() {
  if (isAutoPlayEnglish()) {
    playSound();
  }
}
</script>

<style scoped>
.chinese-hint {
  @apply mb-6 mt-8 text-center text-2xl font-medium dark:text-gray-100;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
