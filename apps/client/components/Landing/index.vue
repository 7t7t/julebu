<template>
  <div class="font-customFont">
    <LandingBanner @start-alrahim="startAlrahim" />
    <LandingFeatures />
    <LandingComments />
    <LandingQuestions />
    <LandingContact />
    <CommonBackTop class="sticky bottom-28 ml-auto flex justify-end sm:block" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

import { isAuthenticated } from "~/services/auth";
import { cancelShortcut, registerShortcut } from "~/utils/keyboardShortcuts";

const { startAlrahim } = useShortcutToGame();

function useShortcutToGame() {
  const router = useRouter();

  async function startAlrahim() {
    if (!isAuthenticated()) {
      router.push(`/course-pack`);
    }
  }

  onMounted(() => {
    registerShortcut("enter", startAlrahim);
  });

  onUnmounted(() => {
    cancelShortcut("enter", startAlrahim);
  });

  return {
    startAlrahim,
  };
}
</script>
