<template>
  <div class="landing-root">
    <!-- Hero / CTA Section -->
    <section class="landing-section hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <h1 class="app-title">cooked<span class="bang">!</span></h1>
          <p class="lead">
            Reduce food waste and turn leftovers into delicious meals. Share
            recipes, save favorites, and discover creative ways to use what you
            already have.
          </p>

          <div class="cta-row">
            <button class="btn primary" @click="onCreateAccount">Create account</button>
            <button class="btn" @click="onSignIn">Sign in</button>
            <button class="btn link" @click="onContinue">Continue without signing in</button>
          </div>
        </div>
        <div class="hero-visual" aria-hidden>
          <!-- Placeholder visual; can be replaced with an illustration -->
          <div class="visual-plate">🍽️</div>
        </div>
      </div>
    </section>

    <!-- Content card wrapping info + how sections -->
    <div class="landing-content-card">
      <!-- Food waste information section -->
      <section class="landing-section info">
        <div class="section-inner">
          <h2>Why food waste matters</h2>
          <p>
            Every year, millions of tons of edible food are thrown away — from
            households, restaurants, and grocery stores. Food waste contributes
            to greenhouse gas emissions, wastes water and energy, and increases
            household expenses.
          </p>

          <div class="stats-grid">
            <div class="stat">
              <div class="stat-number">1.3B+</div>
              <div class="stat-desc">tons of food wasted globally each year</div>
            </div>
            <div class="stat">
              <div class="stat-number">25%</div>
              <div class="stat-desc">of household food is wasted</div>
            </div>
            <div class="stat">
              <div class="stat-number">$1200</div>
              <div class="stat-desc">average annual household food waste cost (est.)</div>
            </div>
          </div>
        </div>
      </section>

      <!-- How Cooked helps section -->
      <section class="landing-section how">
        <div class="section-inner">
          <h2>How Cooked reduces food waste</h2>
          <div class="how-grid">
            <div class="how-card">
              <h3>Use what you have</h3>
              <p>Search recipes by the ingredients you already own to avoid buying more.</p>
            </div>
            <div class="how-card">
              <h3>Save & organize</h3>
              <p>Save favorite recipes into collections for quick meal planning.</p>
            </div>
            <div class="how-card">
              <h3>Discover ideas</h3>
              <p>Browse community recipes for creative ways to use leftovers.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

function onCreateAccount() {
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
  display: block;
  width: 100%;
  color: var(--text-color, #0f172a);
}

.landing-section {
  padding: 2rem 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 12px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  /* background: linear-gradient(180deg, rgba(239,122,95,0.06), transparent 60%); */
  background: transparent;
  border-bottom: 1px solid rgba(15,23,42,0.04);
}

.hero-inner {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.hero-copy {
  flex: 1 1 560px;
}

.hero-visual {
  width: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-plate {
  width: 180px;
  height: 180px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  background: white;
  box-shadow: 0 8px 24px rgba(15,23,42,0.06);
}

.app-title {
  font-size: 3rem;
  margin: 0 0 0.5rem 0;
}
.bang { color: var(--color-accent, #ff6b6b); }
.lead { color: #334155; font-size: 1.05rem; margin-bottom: 1rem; }

.cta-row { display:flex; gap: 0.75rem; flex-wrap:wrap; }
.btn { padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid rgba(15,23,42,0.06); background: transparent; cursor: pointer; }
.btn.primary { background: var(--color-accent, #ef7a5f); color: white; border: none; }
.btn.link { background: transparent; border: none; color: #475569; }

.info { background: #fff; }
.info h2 { margin-top: 0; }
.stats-grid { display:flex; gap: 1rem; margin-top: 1rem; flex-wrap:wrap; }
.stat { background: #f8fafc; padding: 1rem; border-radius: 8px; flex: 1 1 180px; }
.stat-number { font-weight:700; font-size:1.25rem; }
.stat-desc { color:#475569; margin-top:0.25rem; }

.how { background: linear-gradient(180deg, #fff, #f9fafb); }
.how-grid { display:flex; gap:1rem; margin-top:1rem; flex-wrap:wrap; }
.how-card { background: white; padding:1rem; border-radius:8px; box-shadow: 0 6px 18px rgba(15,23,42,0.04); flex: 1 1 260px; }

.landing-content-card {
  max-width: 1100px;
  margin: 1.5rem auto 0;
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 10px 30px rgba(15,23,42,0.06);
  overflow: hidden;
}

.landing-content-card .landing-section {
  padding: 1.25rem 0;
  margin: 0;
  background: transparent;
  border-bottom: 1px solid rgba(15,23,42,0.04);
}

.landing-content-card .landing-section:last-child {
  border-bottom: none;
}

@media (max-width: 800px) {
  .hero-inner { flex-direction: column-reverse; align-items: center; }
  .hero-visual { width: auto; }
  .visual-plate { width: 140px; height: 140px; font-size:2.25rem; }
  .landing-section { padding: 2.5rem 1rem; }
}

</style>