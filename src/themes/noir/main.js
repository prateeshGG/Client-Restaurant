import '@fontsource/bodoni-moda/400';
import '@fontsource/bodoni-moda/400-italic';
import '@fontsource/bodoni-moda/500';
import '@fontsource-variable/inter';
import '../../core/base.css';
import '../../core/layouts.css';
import './theme.css';
import './pages.css';
import './flows.css';
import { createApp } from '../../core/app.js';
import views from './views.js';

createApp({ id: 'noir', views });
