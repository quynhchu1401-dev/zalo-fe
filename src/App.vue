<template>
  <div class="on_page">
    <Toast />

    <TopNavBar :isLoggedIn="isLoggedIn" />

    <div class="layout-main">
      <div class="main-content">
        <router-view />
      </div>
    </div>
  </div>
</template>


<style lang="scss">
.on_page {
  width: 100%;
  min-height: 100vh;
}

/* CSS variables to control sidebar widths so inner pages adjust naturally */
.on_page {
  --sidebar-left: 220px;
  --sidebar-collapsed-left: 60px;
  --detail-width: 360px;

  /* derived vars used to compute main content area */
  --current-sidebar-left: var(--sidebar-left);
  --current-detail-width: 0;
}

.layout-main {
  margin-left: var(--current-sidebar-left);
  margin-top: 56px;
  margin-bottom: 44px;
  padding: 16px;
  min-height: calc(100vh - 56px - 44px);
  background: #f9fafb;
  transition: margin-left 0.2s ease, margin-right 0.2s ease;
}

/* When sidebar is collapsed (controlled by TopNavBar toggling class on root .on_page) */
.on_page.sidebar-collapsed {
  --current-sidebar-left: var(--sidebar-collapsed-left);
}

/* When a right detail panel is open on a page, allow layout to shrink from the right */
.on_page .layout-main.detail-open {
  margin-right: var(--detail-width);
  --current-detail-width: var(--detail-width);
}

/* small screens: right sidebar overlays, do not adjust layout spacing */
@media (max-width: 900px) {
  .on_page .layout-main.detail-open {
    margin-right: 0;
    --current-detail-width: 0;
  }
}

.main-content {
  /* Compute available width between left sidebar and optional right detail panel */
  width: calc(100vw - var(--current-sidebar-left) - var(--current-detail-width) - 32px);
  background: #fff;
  border-radius: 8px;
  min-height: 100%;
  transition: width 0.18s ease, padding 0.18s ease;
  box-sizing: border-box;
  margin: 0 auto;
  max-width: calc(100% - 16px);
}

.app-container {
  margin: 0 auto;
  max-width: 1200px;
  width: 100%;
  height: inherit;
  background: #F7F8F9;

  .app-content {
    margin: 8px;
  }
}
</style>
<script>
import TopNavBar from "@/components/TopNavBar";
import { useStore } from "vuex";
import { computed } from "vue";

export default {
  components: { TopNavBar },
  setup() {
    const store = useStore();
    const isLoggedIn = computed(() => !!store.state.token);

    return {
      isLoggedIn
    }
  }
}
</script>
