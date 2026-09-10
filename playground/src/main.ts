import { createApp } from 'vue';
import router from '@/router';
import { hamiVuex } from '@/store';
import App from './App.vue';
import 'animate.css';
import 'uno.css';

createApp(App).use(hamiVuex).use(router).mount('#app');
