import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter';
import '../../core/base.css';
import '../../core/layouts.css';
import './theme.css';
import './pages.css';
import './flows.css';
import { createApp } from '../../core/app.js';
import views from './views.js';

createApp({ id: 'atelier', views });
