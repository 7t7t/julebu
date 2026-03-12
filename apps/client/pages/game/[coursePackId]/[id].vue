<template>
  <div class="game-page">
    <template v-if="isLoading">
      <Loading></Loading>
    </template>
    <template v-else>
      <MainTool />
      <div class="game-content">
        <MainGame />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";

import { useGameMode } from "~/composables/main/game";
import { useNavigation } from "~/composables/useNavigation";
import { isAuthenticated } from "~/services/auth";
import { useCourseStore } from "~/store/course";
import { useCoursePackStore } from "~/store/coursePack";
import { useMasteredElementsStore } from "~/store/masteredElements";

const isLoading = ref(true);
const route = useRoute();
const coursePackStore = useCoursePackStore();
const courseStore = useCourseStore();
const masteredElementsStore = useMasteredElementsStore();
const { gotoCourseList } = useNavigation();
const { showQuestion } = useGameMode();

showQuestion();

onMounted(async () => {
  const { coursePackId, id } = route.params;
  if (isAuthenticated()) {
    await masteredElementsStore.setup();
  }
  await courseStore.setup(coursePackId as string, id as string);
  await coursePackStore.setupCoursePack(coursePackId as string);

  if (courseStore.isAllMastered()) {
    toast.info("你已经全部都掌握 自动帮你跳转到课程列表啦", {
      duration: 1500,
      onAutoClose: () => {
        gotoCourseList(coursePackId as string);
      },
    });
    return;
  }
  isLoading.value = false;
});
</script>

<style scoped>
.game-page {
  @apply flex w-full flex-col pt-2;
}

.game-content {
  @apply mt-6 flex-1;
  min-height: 50vh;
}
</style>
