import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Profile from "../views/Profile.vue";
import Collection from "../views/Collection.vue";
import Recipe from "../views/Recipe.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/profile", name: "Profile", component: Profile },
  { path: "/collection/:id", name: "Collection", component: Collection },
  { path: "/recipe/:id", name: "Recipe", component: Recipe },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
