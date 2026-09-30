import { createApp } from 'vue'
import './assets/tokens.css'
import App from './App.vue'
import { batDauCheDo } from './lib/che-do.js'

batDauCheDo()
createApp(App).mount('#app')
