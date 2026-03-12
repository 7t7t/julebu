<template>
  <div
    :ref="isActiveCourse ? 'activeCourseRef' : undefined"
    class="course-card"
    :class="{
      'course-card--finished': hasFinished,
      'course-card--active': isActiveCourse,
    }"
  >
    <!-- 顶部类别标签 -->
    <div class="course-card__header">
      <span
        class="course-card__badge"
        :class="badgeClass"
      >
        {{ categoryLabel }}
      </span>
      <div
        v-if="hasFinished"
        class="course-card__count"
      >
        <UTooltip :text="dataTip">
          <UIcon
            name="i-ph-check-circle-fill"
            class="mr-0.5 h-3.5 w-3.5"
          />
          {{ count }}次
        </UTooltip>
      </div>
    </div>

    <!-- 标题 -->
    <h3 class="course-card__title">{{ title }}</h3>

    <!-- 摘要内容 -->
    <p
      class="course-card__summary"
      v-if="description"
    >
      {{ description }}
    </p>
    <div
      class="course-card__preview"
      v-else
    >
      <span
        v-for="(word, i) in previewWords"
        :key="i"
        class="course-card__word"
        >{{ word }}</span
      >
    </div>

    <!-- 底部信息 -->
    <div class="course-card__footer">
      <span class="course-card__icon">
        <UIcon
          :name="categoryIcon"
          class="h-3.5 w-3.5"
        />
        {{ categoryType }}
      </span>
      <span
        v-if="isActiveCourse"
        class="course-card__status"
      >
        <span class="course-card__dot"></span>
        学习中
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useActiveCourseMap } from "~/composables/courses/activeCourse";

const props = defineProps<{
  title: string;
  id: string;
  count: number | undefined;
  coursePackId: string;
  description: string;
}>();

const { activeCourseMap } = useActiveCourseMap();
const activeCourseRef = ref<HTMLDivElement>();
const hasFinished = computed(() => !!props.count);
const isActiveCourse = computed(() => activeCourseMap.value[props.coursePackId] == props.id);
const dataTip = computed(() => `恭喜您，当前课程已完成 ${props.count} 次`);

// 从标题解析课程类别
const categoryInfo = computed(() => {
  const t = props.title;
  if (t.includes("高频词汇"))
    return { label: "高频", type: "词汇", icon: "i-ph-star-fill", color: "orange" };
  if (t.includes("核心词汇"))
    return { label: "核心", type: "词汇", icon: "i-ph-target", color: "blue" };
  if (t.includes("进阶词汇"))
    return { label: "进阶", type: "词汇", icon: "i-ph-trend-up", color: "purple" };
  if (t.includes("词汇进阶"))
    return { label: "拓展", type: "词汇", icon: "i-ph-lightning", color: "indigo" };
  if (t.includes("阅读理解"))
    return { label: "阅读", type: "句型", icon: "i-ph-book-open-text", color: "emerald" };
  if (t.includes("写作"))
    return { label: "写作", type: "句型", icon: "i-ph-pencil-line", color: "sky" };
  if (t.includes("翻译"))
    return { label: "翻译", type: "练习", icon: "i-ph-translate", color: "amber" };
  if (t.includes("听力"))
    return { label: "听力", type: "表达", icon: "i-ph-headphones", color: "rose" };
  return { label: "CET-6", type: "课程", icon: "i-ph-graduation-cap", color: "gray" };
});

const categoryLabel = computed(() => categoryInfo.value.label);
const categoryType = computed(() => categoryInfo.value.type);
const categoryIcon = computed(() => categoryInfo.value.icon);

const badgeClass = computed(() => {
  const c = categoryInfo.value.color;
  return `course-card__badge--${c}`;
});

// 从标题中生成预览词汇
const previewWords = computed(() => {
  const t = props.title;
  const wordMap: Record<string, string[]> = {
    "高频词汇(1)": ["abandon", "abstract", "accelerate", "accommodate"],
    "高频词汇(2)": ["adapt", "adequate", "advocate", "affect"],
    "高频词汇(3)": ["agenda", "allege", "allocate", "alternative"],
    "高频词汇(4)": ["ambiguous", "ample", "anticipate", "appetite"],
    "高频词汇(5)": ["approach", "appropriate", "approve", "arbitrary"],
    "核心词汇(1)": ["cling", "cognitive", "coherent", "coincide"],
    阅读理解高频句型: ["长难句", "推理判断", "主旨大意", "细节理解"],
    写作高分句型: ["开头段", "论证段", "结尾段", "过渡句"],
    "翻译练习：中国文化": ["传统节日", "饮食文化", "哲学思想"],
    "翻译练习：经济与社会": ["经济增长", "城市化", "社会保障"],
    "翻译练习：教育与科技": ["高等教育", "人工智能", "创新驱动"],
    "听力常用表达：校园生活": ["选课", "考试", "社团", "宿舍"],
    "听力常用表达：职场与新闻": ["面试", "升职", "时事", "报道"],
    "听力常用表达：观点与建议": ["赞同", "反对", "建议", "看法"],
  };

  for (const [key, words] of Object.entries(wordMap)) {
    if (t.includes(key)) return words;
  }

  // 默认：从类别生成
  const cat = categoryInfo.value.label;
  if (cat === "高频") return ["核心大纲词汇", "高频考点"];
  if (cat === "核心") return ["六级必备词汇", "重点记忆"];
  if (cat === "进阶") return ["扩展词汇量", "深度掌握"];
  if (cat === "拓展") return ["综合提升", "冲刺备考"];
  return ["CET-6", "备考"];
});

onMounted(() => {
  activeCourseRef.value?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});
</script>

<style scoped>
.course-card {
  @apply relative flex cursor-pointer flex-col overflow-hidden rounded-2xl p-5 transition-all duration-300;
  background: linear-gradient(135deg, #ffffff 0%, #fafafe 100%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 180px;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.08),
    0 4px 10px rgba(0, 0, 0, 0.04);
}

:root.dark .course-card,
.dark .course-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-color: rgba(255, 255, 255, 0.06);
}

.dark .course-card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
}

/* 完成状态 */
.course-card--finished {
  border-color: rgba(16, 185, 129, 0.3);
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.dark .course-card--finished {
  border-color: rgba(16, 185, 129, 0.2);
  background: linear-gradient(135deg, #1a1a2e 0%, #0d2818 100%);
}

/* 激活状态 */
.course-card--active {
  border-color: rgba(168, 85, 247, 0.4);
  background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.1);
}

.dark .course-card--active {
  border-color: rgba(168, 85, 247, 0.3);
  background: linear-gradient(135deg, #1a1a2e 0%, #1e0a3c 100%);
}

/* Header */
.course-card__header {
  @apply mb-3 flex items-center justify-between;
}

.course-card__badge {
  @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold;
}

.course-card__badge--orange {
  @apply bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400;
}
.course-card__badge--blue {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400;
}
.course-card__badge--purple {
  @apply bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400;
}
.course-card__badge--indigo {
  @apply bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400;
}
.course-card__badge--emerald {
  @apply bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400;
}
.course-card__badge--sky {
  @apply bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400;
}
.course-card__badge--amber {
  @apply bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400;
}
.course-card__badge--rose {
  @apply bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400;
}
.course-card__badge--gray {
  @apply bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400;
}

.course-card__count {
  @apply flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400;
}

/* Title */
.course-card__title {
  @apply text-base font-bold leading-snug text-gray-800 dark:text-gray-100;
  margin-bottom: 8px;
}

/* Summary / Preview */
.course-card__summary {
  @apply flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-card__preview {
  @apply flex flex-1 flex-wrap gap-1.5;
}

.course-card__word {
  @apply inline-block rounded-md px-2 py-0.5 text-xs;
  background: rgba(168, 85, 247, 0.06);
  color: rgba(107, 70, 193, 0.8);
  border: 1px solid rgba(168, 85, 247, 0.1);
}

.dark .course-card__word {
  background: rgba(168, 85, 247, 0.1);
  color: rgba(196, 167, 231, 0.9);
  border-color: rgba(168, 85, 247, 0.15);
}

/* Footer */
.course-card__footer {
  @apply mt-auto flex items-center justify-between pt-3 text-xs text-gray-400 dark:text-gray-500;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.dark .course-card__footer {
  border-top-color: rgba(255, 255, 255, 0.04);
}

.course-card__icon {
  @apply flex items-center gap-1;
}

.course-card__status {
  @apply flex items-center gap-1 font-medium text-purple-500 dark:text-purple-400;
}

.course-card__dot {
  @apply inline-block h-1.5 w-1.5 rounded-full bg-purple-500;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
