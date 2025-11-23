<template>
  <div id="app" class="app-root">
    <header class="app-header">
      <h1 class="app-title">My App</h1>
    </header>

    <main class="app-main">
      <!-- routed pages will render here -->
      <router-view />
    </main>

    <footer class="app-footer">
      <small>© {{ new Date().getFullYear() }}</small>
    </footer>
  </div>
</template>

<script setup>
import "./utils/app.css";
</script>
