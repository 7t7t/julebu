<template>
  <div class="flex w-full flex-col">
    <template v-if="isLoading">
      <Loading></Loading>
    </template>

    <template v-else>
      <div class="course-list-header">
        <h2 class="course-list-title">
          {{ coursePackStore.currentCoursePack?.title }}
        </h2>
        <p class="course-list-subtitle">
          {{ coursePackStore.currentCoursePack?.courses?.length || 0 }} 节课程
        </p>
      </div>
      <div class="h-full scrollbar-hide">
        <div
          class="grid h-[79vh] grid-cols-1 justify-start gap-4 overflow-y-auto overflow-x-hidden pb-96 pl-0 pr-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <template
            v-for="course in coursePackStore.currentCoursePack?.courses"
            :key="course.id"
          >
            <CoursesCourseCard
              :title="course.title"
              :description="course.description"
              :id="course.id"
              :count="course.completionCount"
              :coursePackId="course.coursePackId"
              @click="handleChangeCourse(course.id)"
            />
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from "#app";
import { ref } from "vue";
import { useRoute } from "vue-router";

import { useActiveCourseMap } from "~/composables/courses/activeCourse";
import { useCoursePackStore } from "~/store/coursePack";

const isLoading = ref(false);
const route = useRoute();
const coursePackStore = useCoursePackStore();
const coursePackId = route.params.id as string;
const { updateActiveCourseMap } = useActiveCourseMap();

setup();

async function setup() {
  isLoading.value = true;
  await coursePackStore.setupCoursePack(coursePackId);
  isLoading.value = false;
}

function handleChangeCourse(courseId: string) {
  updateActiveCourseMap(coursePackId, courseId);
  navigateTo(`/game/${coursePackId}/${courseId}`);
}
</script>

<style scoped>
.course-list-header {
  @apply mb-6 text-center;
}

.course-list-title {
  @apply text-2xl font-bold text-gray-800 dark:text-gray-100;
}

.course-list-subtitle {
  @apply mt-1 text-sm text-gray-400 dark:text-gray-500;
}
</style>
