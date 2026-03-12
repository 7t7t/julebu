<template>
  <div
    class="pack-card"
    @click="$emit('cardClick', coursePack)"
  >
    <!-- 封面区域 -->
    <div class="pack-card__cover">
      <div
        v-if="coursePack.cover"
        class="pack-card__img-wrap"
      >
        <NuxtImg
          :src="coursePack.cover"
          :placeholder="[288, 180]"
          width="288"
          height="180"
          class="h-full w-full object-cover"
        />
      </div>
      <div
        v-else
        class="pack-card__placeholder"
      >
        <div class="pack-card__placeholder-icon">
          <UIcon
            name="i-ph-graduation-cap"
            class="h-10 w-10"
          />
        </div>
        <span class="pack-card__placeholder-label">CET-6</span>
      </div>
      <!-- 免费标签 -->
      <span
        v-if="coursePack.isFree"
        class="pack-card__free-tag"
      >
        免费
      </span>
    </div>

    <!-- 内容区域 -->
    <div class="pack-card__body">
      <h2 class="pack-card__title">{{ coursePack.title }}</h2>
      <p
        class="pack-card__desc"
        :title="coursePack.description"
      >
        {{ coursePack.description }}
      </p>

      <!-- 摘要标签 -->
      <div class="pack-card__tags">
        <span class="pack-card__tag pack-card__tag--purple">
          <UIcon
            name="i-ph-book-open"
            class="h-3 w-3"
          />
          词汇
        </span>
        <span class="pack-card__tag pack-card__tag--emerald">
          <UIcon
            name="i-ph-book-open-text"
            class="h-3 w-3"
          />
          阅读
        </span>
        <span class="pack-card__tag pack-card__tag--sky">
          <UIcon
            name="i-ph-pencil-line"
            class="h-3 w-3"
          />
          写作
        </span>
        <span class="pack-card__tag pack-card__tag--amber">
          <UIcon
            name="i-ph-translate"
            class="h-3 w-3"
          />
          翻译
        </span>
        <span class="pack-card__tag pack-card__tag--rose">
          <UIcon
            name="i-ph-headphones"
            class="h-3 w-3"
          />
          听力
        </span>
      </div>

      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  coursePack: {
    id: string;
    title: string;
    description: string;
    cover: string;
    isFree: boolean;
  };
}

defineProps<Props>();

defineEmits<{
  (e: "cardClick", coursePack: any): void;
}>();
</script>

<style scoped>
.pack-card {
  @apply flex cursor-pointer flex-col overflow-hidden rounded-2xl transition-all duration-300;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  width: 100%;
  height: 100%;
}

.pack-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.04);
}

.dark .pack-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-color: rgba(255, 255, 255, 0.06);
}

.dark .pack-card:hover {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

/* 封面 */
.pack-card__cover {
  @apply relative overflow-hidden;
  aspect-ratio: 16 / 9;
}

.pack-card__img-wrap {
  @apply h-full w-full;
}

.pack-card__placeholder {
  @apply flex h-full w-full flex-col items-center justify-center gap-2;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%);
}

.pack-card__placeholder-icon {
  @apply flex h-16 w-16 items-center justify-center rounded-2xl text-white;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
}

.pack-card__placeholder-label {
  @apply text-sm font-bold tracking-widest text-white/80;
}

.pack-card__free-tag {
  @apply absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-white;
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

/* 内容 */
.pack-card__body {
  @apply flex flex-1 flex-col p-4;
}

.pack-card__title {
  @apply truncate text-lg font-bold text-gray-800 transition-colors dark:text-gray-100;
}

.pack-card:hover .pack-card__title {
  @apply text-purple-600 dark:text-purple-400;
}

.pack-card__desc {
  @apply mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

/* 标签 */
.pack-card__tags {
  @apply mt-3 flex flex-wrap gap-1.5;
}

.pack-card__tag {
  @apply inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium;
}

.pack-card__tag--purple {
  @apply bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400;
}
.pack-card__tag--emerald {
  @apply bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400;
}
.pack-card__tag--sky {
  @apply bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400;
}
.pack-card__tag--amber {
  @apply bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400;
}
.pack-card__tag--rose {
  @apply bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400;
}

/* 移动端 */
@media (max-width: 640px) {
  .pack-card__body {
    @apply p-3;
  }

  .pack-card__title {
    @apply text-base;
  }

  .pack-card__desc {
    @apply text-xs;
  }
}
</style>
