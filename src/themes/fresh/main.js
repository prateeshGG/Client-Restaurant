import '@fontsource-variable/plus-jakarta-sans';
import '../../core/base.css';
import '../../core/layouts.css';
import './theme.css';
import { createApp } from '../../core/app.js';
import views from './views.js';

createApp({ id: 'fresh', views });
