import { createApp } from "vue";
import App from "./App.vue";

// Import global styles (includes theme)
import "./styles/global.scss";

// Router is optional but App.vue uses <router-view />; create a minimal router
import router from "./router";

const app = createApp(App);
app.use(router);
app.mount("#app");
