<template>
  <div class="flex min-h-[350px]">
    <!-- Loading -->
    <div
      v-if="isLoading"
      class="flex flex-1 items-center justify-center"
    >
      <span class="loading loading-dots loading-md"></span>
    </div>
    <div
      v-else
      class="w-full"
    >
      <div
        v-if="coursePacks.length"
        class="grid w-full grid-cols-1 gap-4 min-[500px]:grid-cols-2 md:grid-cols-1 min-[850px]:grid-cols-2 xl:grid-cols-3"
      >
        <template v-for="coursePack in coursePacks">
          <CoursePackCard
            :coursePack="{
              id: coursePack.coursePackId,
              title: coursePack.title,
              description: coursePack.description,
              cover: coursePack.cover,
              isFree: coursePack.isFree,
            }"
          >
            <template #actions>
              <div class="mt-3 flex gap-2">
                <button
                  class="recent-btn recent-btn--outline"
                  @click.stop="gotoCourseList(coursePack.coursePackId)"
                >
                  课程列表
                </button>
                <button
                  class="recent-btn recent-btn--primary"
                  @click.stop="gotoGame(coursePack.coursePackId, coursePack.courseId)"
                >
                  继续学习
                </button>
              </div>
            </template>
          </CoursePackCard>
        </template>
      </div>
      <template v-else>
        <div class="flex h-full w-full flex-1 items-center justify-center text-slate-500">
          暂无记录，<NuxtLink
            href="/course-pack"
            class="link text-blue-500 no-underline hover:opacity-75"
            >先学习一课， </NuxtLink
          >再来看看吧~
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from "#app";
import { ref } from "vue";

import CoursePackCard from "~/components/courses/CoursePackCard.vue";
import { useNavigation } from "~/composables/useNavigation";
import { useRecentCoursePack } from "./helper";

const { gotoCourseList, gotoGame } = useNavigation();
const { coursePacks, fetchCoursePacks } = useRecentCoursePack();
const isLoading = ref(false);

setup();

async function setup() {
  if (coursePacks.value.length === 0) {
    isLoading.value = true;
    await fetchCoursePacks();
    isLoading.value = false;
  } else {
    await fetchCoursePacks();
  }
}
</script>

<style scoped>
.recent-btn {
  @apply flex-1 cursor-pointer rounded-lg px-3 py-2 text-center text-xs font-medium transition-all duration-200;
}

.recent-btn--outline {
  @apply border border-gray-200 text-gray-600
         hover:border-purple-300 hover:text-purple-600
         dark:border-gray-700 dark:text-gray-400
         dark:hover:border-purple-500 dark:hover:text-purple-400;
}

.recent-btn--primary {
  @apply border-none text-white;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
}

.recent-btn--primary:hover {
  background: linear-gradient(135deg, #6d28d9, #9333ea);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}
</style>
