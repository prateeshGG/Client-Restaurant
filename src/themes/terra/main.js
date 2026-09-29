import '@fontsource/big-shoulders-display/700';
import '@fontsource/big-shoulders-display/800';
import '@fontsource/dm-mono/400';
import '@fontsource/dm-mono/500';
import '@fontsource/instrument-serif/400-italic';
import '../../core/base.css';
import '../../core/layouts.css';
import './theme.css';
import './pages.css';
import './flows.css';
import { createApp } from '../../core/app.js';
import views from './views.js';

createApp({ id: 'terra', views });
