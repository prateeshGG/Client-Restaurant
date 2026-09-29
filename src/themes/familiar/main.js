import '@fontsource/poppins/400';
import '@fontsource/poppins/500';
import '@fontsource/poppins/600';
import '@fontsource/poppins/700';
import '../../core/base.css';
import '../../core/layouts.css';
import './theme.css';
import { createApp } from '../../core/app.js';
import views from './views.js';
import { setupChrome } from './chrome.js';

createApp({ id: 'familiar', views });
setupChrome();
