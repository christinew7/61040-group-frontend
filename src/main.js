import { createApp } from "vue";
import App from "./App.vue";

// Import theme system
import "./styles/theme.css";

// Router is optional but App.vue uses <router-view />; create a minimal router
import router from "./router";

const app = createApp(App);
app.use(router);
app.mount("#app");
