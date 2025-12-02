<template>
  <div class="landing-root">
    <div class="landing-card">
      <h1 class="app-title">cooked<span class="bang">!</span></h1>

      <p class="lead">
        Reduce food waste and turn leftovers into delicious meals. Share recipes,
        save favorites, and discover creative ways to use what you already have.
      </p>

      <ul class="benefits">
        <li>Save money by using ingredients you already own</li>
        <li>Discover community recipes and ideas</li>
        <li>Quickly save & organize recipes into collections</li>
      </ul>

      <div class="cta-row">
        <button class="btn primary" @click="onCreateAccount">Create account</button>
        <button class="btn" @click="onSignIn">Sign in</button>
      </div>

      <div class="secondary">
        <button class="btn link" @click="onContinue">Continue without signing in</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

function onCreateAccount() {
  // If there's a dedicated sign-up page later, navigate there.
  // For now open the login popup via route query (App.vue watches this)
  router.push({ name: 'Landing', query: { showLogin: '1', action: 'signup' } });
}

function onSignIn() {
  router.push({ name: 'Landing', query: { showLogin: '1' } });
}

function onContinue() {
  router.push({ name: 'Home' });
}
</script>

<style scoped>
.landing-root {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 75vh;
  padding: 3rem 1rem;
}
.landing-card {
  max-width: 760px;
  text-align: center;
  background: white;
  padding: 2.25rem;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(15,23,42,0.08);
}
.app-title {
  font-size: 3rem;
  margin: 0;
  color: var(--color-primary, #0f172a);
}
.bang { color: var(--color-accent, #ff6b6b); }
.lead {
  margin-top: 1rem;
  color: #334155;
  font-size: 1.05rem;
}
.benefits { margin: 1rem 0 1.5rem; padding-left: 1.2rem; text-align: left; }
.benefits li { margin: 0.4rem 0; color: #475569; }
.cta-row { display:flex; gap: 1rem; justify-content:center; margin-top: 0.5rem; }
.btn { padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid rgba(15,23,42,0.06); background: transparent; cursor: pointer; }
.btn.primary { background: var(--color-accent, #ef7a5f); color: white; border: none; }
.btn.link { background: transparent; border: none; color: #475569; margin-top: 0.75rem; }
.secondary { margin-top: 1rem; }
</style>