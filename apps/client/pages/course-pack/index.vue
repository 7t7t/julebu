<template>
  <div class="flex w-full flex-col">
    <div class="pack-list-header">
      <h2 class="pack-list-title">课程包列表</h2>
      <p class="pack-list-subtitle">选择课程包开始学习</p>
    </div>
    <template v-if="isLoading">
      <Loading></Loading>
    </template>
    <template v-else>
      <div class="h-[79vh] overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div
          class="grid auto-rows-fr grid-cols-1 gap-5 px-4 sm:grid-cols-2 sm:px-0 md:grid-cols-3 lg:grid-cols-4"
        >
          <template v-for="coursePack in coursePackStore.coursePacks">
            <CoursePackCard
              :coursePack="{
                id: coursePack.id,
                title: coursePack.title,
                description: coursePack.description,
                cover: coursePack.cover,
                isFree: coursePack.isFree,
              }"
              @cardClick="handleGoToCoursePack"
            ></CoursePackCard>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import type { CoursePack } from "~/types";
import CoursePackCard from "~/components/courses/CoursePackCard.vue";
import { useNavigation } from "~/composables/useNavigation";
import { useCoursePackStore } from "~/store/coursePack";

const coursePackStore = useCoursePackStore();
const { gotoCourseList } = useNavigation();
const isLoading = ref(false);

setup();

async function setup() {
  // 课程包不会更新 所以初始化的时候只拉取一次数据就好了
  if (coursePackStore.coursePacks.length === 0) {
    isLoading.value = true;
    await coursePackStore.setupCoursePacks();
    isLoading.value = false;
  }
}

function handleGoToCoursePack(coursePack: CoursePack) {
  if (coursePack.isFree) {
    gotoCourseList(coursePack.id);
  } else {
    // 看看是不是会员 不是的话 直接弹出消息告知 需要是会员
    // TODO 还没有检测是不是会员的功能函数
    console.log("需要是会员");
  }
}
</script>

<style scoped>
.pack-list-header {
  @apply mb-6 text-center;
}

.pack-list-title {
  @apply text-2xl font-bold text-gray-800 dark:text-gray-100;
}

.pack-list-subtitle {
  @apply mt-1 text-sm text-gray-400 dark:text-gray-500;
}
</style>
