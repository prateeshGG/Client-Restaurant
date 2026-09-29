import { listMessages, updateMessage, deleteMessage, saveMessage, listSubscribers } from '../../core/store.js';
import { getContent } from '../../core/cms.js';
import { icon, esc, stamp, ago, longDate, plural, download, columbus, $, $$ } from '../lib.js';
import { pageHead, empty, toast, confirmDialog, tabs } from '../ui.js';
import { loadSampleData } from '../sample.js';

const TOPIC = { general: ['General', 'grey'], event: ['Event enquiry', 'violet'], press: ['Press', 'blue'] };
const topicChip = (t) => {
  const [l, c] = TOPIC[t] || TOPIC.general;
  return `<span class="a-chip a-chip--${c}">${l}</span>`;
};

export default function messages(el, ctx) {
  let tab = ctx.route.query.tab === 'subscribers' ? 'subscribers' : 'inbox';
  const openId = ctx.route.parts[1] || '';
  let show = 'all';

  el.innerHTML = `
    ${pageHead({
      title: 'Messages',
      lede: 'Notes sent through the website’s contact form, and people who joined your newsletter.',
    })}
    <div class="a-tabs-inline a-tabs-inline--page" role="tablist" aria-label="Messages" data-tablist>
      <button class="a-tab-inline" role="tab" id="mtab-inbox" data-value="inbox" aria-controls="mpanel">Inbox <span class="a-tab-inline__n" data-n="inbox"></span></button>
      <button class="a-tab-inline" role="tab" id="mtab-subscribers" data-value="subscribers" aria-controls="mpanel">Newsletter subscribers <span class="a-tab-inline__n" data-n="subscribers"></span></button>
    </div>
    <div role="tabpanel" id="mpanel" data-panel></div>`;
  const panel = $('[data-panel]', el);
  const tl = $('[data-tablist]', el);

  const paintTabs = () => {
    $$('[role=tab]', tl).forEach((t) => {
      const on = t.dataset.value === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    const unread = listMessages().filter((m) => !m.read).length;
    $('[data-n="inbox"]', tl).textContent = unread ? `${unread} new` : listMessages().length;
    $('[data-n="subscribers"]', tl).textContent = listSubscribers().length;
    panel.setAttribute('aria-labelledby', `mtab-${tab}`);
  };
  tabs(tl, (v) => {
    tab = v;
    history.replaceState(null, '', v === 'subscribers' ? '#/messages?tab=subscribers' : '#/messages');
    paint();
  });

  const paint = () => {
    paintTabs();
    tab === 'inbox' ? inbox() : subscribers();
  };

  /* ── Inbox ── */
  function inbox() {
    const all = listMessages();
    if (!all.length) {
      panel.innerHTML = empty({
        icon: 'inbox',
        title: 'No messages yet',
        text: 'When someone uses the contact form on the website — a question, an event enquiry or a press request — it lands here. You can reply straight from your email.',
        actions: `<button class="a-btn a-btn--primary" type="button" data-action="load-sample">${icon('sparkle', 18)} Load sample messages</button>`,
      });
      $('[data-action="load-sample"]', panel).addEventListener('click', () => {
        loadSampleData();
        ctx.refreshBadges();
        toast('Sample bookings and messages added.', { kind: 'success' });
        paint();
      });
      return;
    }
    const list = all.filter((m) => show === 'all' || !m.read);
    const current = all.find((m) => m.id === openId);
    if (current && !current.read) {
      updateMessage(current.id, { read: true });
      current.read = true;
      ctx.refreshBadges();
      paintTabs();
    }
    panel.innerHTML = `
      <div class="a-inbox ${current ? 'has-open' : ''}">
        <div class="a-inbox__list">
          <div class="a-seg a-seg--sm" role="radiogroup" aria-label="Show">
            <label class="a-seg__opt"><input type="radio" name="m-show" value="all" ${show === 'all' ? 'checked' : ''}><span>All <span class="a-seg__n">${all.length}</span></span></label>
            <label class="a-seg__opt"><input type="radio" name="m-show" value="unread" ${show === 'unread' ? 'checked' : ''}><span>Unread <span class="a-seg__n">${all.filter((m) => !m.read).length}</span></span></label>
          </div>
          ${
            list.length
              ? `<ul class="a-msgs">${list
                  .map(
                    (m) => `<li><a class="a-msg ${m.read ? '' : 'is-unread'}" href="#/messages/${esc(m.id)}" ${m.id === openId ? 'aria-current="true"' : ''}>
                    <span class="a-msg__top"><strong class="a-msg__name">${m.read ? '' : '<span class="a-unread-dot" aria-hidden="true"></span><span class="sr-only">Unread: </span>'}${esc(m.name)}</strong><span class="a-msg__time">${ago(m.at)}</span></span>
                    <span class="a-msg__mid">${topicChip(m.topic)}</span>
                    <span class="a-msg__preview">${esc(m.message)}</span>
                  </a></li>`
                  )
                  .join('')}</ul>`
              : `<p class="a-card__empty">${icon('check', 18)} You’ve read everything. Nice.</p>`
          }
        </div>
        <div class="a-inbox__detail" data-detail>${current ? detail(current) : `<div class="a-inbox__placeholder">${icon('mail', 28)}<p>Choose a message to read it here.</p></div>`}</div>
      </div>`;
    $$('input[name="m-show"]', panel).forEach((r) =>
      r.addEventListener('change', () => {
        show = r.value;
        inbox();
        $(`input[name="m-show"][value="${show}"]`, panel)?.focus();
      })
    );
    if (current) bindDetail(current);
  }

  function detail(m) {
    const site = getContent().site;
    const subject = `Re: your message to ${site.name}`;
    const quoted = `\n\n—\nOn ${stamp(m.at)}, ${m.name} wrote:\n> ${String(m.message).replace(/\n/g, '\n> ')}`;
    return `
      <article class="a-read" aria-labelledby="msg-title">
        <a class="a-back" href="#/messages">${icon('left', 18)} All messages</a>
        <header class="a-read__head">
          <span class="a-avatar a-avatar--lg" aria-hidden="true">${esc((m.name || '?')[0].toUpperCase())}</span>
          <div class="a-read__who">
            <h2 class="a-h2" id="msg-title" tabindex="-1">${esc(m.name)}</h2>
            <p><a class="a-link" href="mailto:${esc(m.email)}">${esc(m.email)}</a></p>
          </div>
          <div class="a-read__meta">${topicChip(m.topic)}<time datetime="${esc(m.at)}">${stamp(m.at)}</time></div>
        </header>
        ${
          m.topic === 'event'
            ? `<dl class="a-read__event">
                <div><dt>Event date</dt><dd>${m.eventDate ? longDate(m.eventDate) : '—'}</dd></div>
                <div><dt>Guests</dt><dd>${esc(m.eventGuests || '—')}</dd></div>
              </dl>`
            : ''
        }
        <div class="a-read__body">${esc(m.message).replace(/\n/g, '<br>')}</div>
        <footer class="a-read__actions">
          <a class="a-btn a-btn--primary" href="mailto:${esc(m.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(quoted)}">${icon('reply', 18)} Reply by email</a>
          <button class="a-btn a-btn--secondary" type="button" data-unread>${icon('dot', 18)} Mark as unread</button>
          <button class="a-btn a-btn--ghost a-btn--danger-text" type="button" data-delete>${icon('trash', 18)} Delete</button>
        </footer>
      </article>`;
  }
  function bindDetail(m) {
    $('[data-unread]', panel).addEventListener('click', () => {
      updateMessage(m.id, { read: false });
      ctx.refreshBadges();
      toast(`Marked as unread.`, { kind: 'info', duration: 3000 });
      location.hash = '#/messages';
    });
    $('[data-delete]', panel).addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Delete this message?', text: `From <strong>${esc(m.name)}</strong>, ${stamp(m.at)}. If you might need it later, reply first — your email keeps a copy.`, confirmLabel: 'Delete message', cancelLabel: 'Keep it', danger: true });
      if (!ok) return;
      const copy = { ...m };
      deleteMessage(m.id);
      ctx.refreshBadges();
      toast(`Message from ${m.name} deleted.`, {
        kind: 'success',
        action: {
          label: 'Undo',
          onClick: () => {
            saveMessage(copy);
            ctx.refreshBadges();
            location.hash === `#/messages/${copy.id}` ? ctx.rerender() : (location.hash = `#/messages/${copy.id}`);
          },
        },
      });
      location.hash = '#/messages';
    });
  }

  /* ── Subscribers ── */
  function subscribers() {
    const subs = [...listSubscribers()].sort((a, b) => (a.at < b.at ? 1 : -1));
    if (!subs.length) {
      panel.innerHTML = empty({ icon: 'mail', title: 'No subscribers yet', text: 'People who sign up with the newsletter form in the website footer appear here. You can download the list for your email tool.' });
      return;
    }
    panel.innerHTML = `
      <div class="a-card a-card--flush">
        <div class="a-card__head a-card__head--pad">
          <div><h2 class="a-card__title">${plural(subs.length, 'subscriber')}</h2><p class="a-card__sub">Import the CSV file into Mailchimp, Klaviyo or any email tool.</p></div>
          <div class="a-btnrow">
            <button class="a-btn a-btn--secondary" type="button" data-copy>${icon('copy', 18)} Copy emails</button>
            <button class="a-btn a-btn--primary" type="button" data-csv>${icon('download', 18)} Download CSV</button>
          </div>
        </div>
        <table class="a-table">
          <caption class="sr-only">Newsletter subscribers</caption>
          <thead><tr><th scope="col">Email</th><th scope="col">Joined</th></tr></thead>
          <tbody>${subs.map((s) => `<tr><td data-label="Email"><a class="a-link" href="mailto:${esc(s.email)}">${esc(s.email)}</a></td><td data-label="Joined">${stamp(s.at)}</td></tr>`).join('')}</tbody>
        </table>
      </div>`;
    $('[data-csv]', panel).addEventListener('click', () => {
      const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const csv = 'email,joined\n' + subs.map((s) => `${q(s.email)},${q(s.at)}`).join('\n') + '\n';
      download(`scioto-house-subscribers-${columbus().iso}.csv`, URL.createObjectURL(new Blob([csv], { type: 'text/csv' })));
      toast('Subscriber list downloaded.', { kind: 'success', duration: 3500 });
    });
    $('[data-copy]', panel).addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(subs.map((s) => s.email).join(', '));
        toast(`${plural(subs.length, 'email')} copied — paste them into your email’s BCC field.`, { kind: 'success' });
      } catch {
        toast('Couldn’t copy automatically — use Download CSV instead.', { kind: 'error' });
      }
    });
  }

  paint();
  if (openId && tab === 'inbox') {
    const h = $('#msg-title', panel);
    if (h && matchMedia('(max-width: 1023px)').matches) setTimeout(() => h.focus(), 0);
  }
  return {};
}
