import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';
import './Messages.css';
import './Account.css';

function Messages() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // rozbalené karty (accordion)
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  // lokální „přečteno“ per uživatel
  const readKey = useMemo(() => (email ? `readMessages:${email}` : null), [email]);
  const [readIds, setReadIds] = useState(() => new Set());

  // 1) ověření JWT → e-mail
  useEffect(() => {
    const init = async () => {
      try {
        const token = getCookie('authToken');
        if (!token) return navigate('/login');

        const payload = await verifyToken(token, getSecretKey());
        if (!payload?.email) return navigate('/login');

        setEmail(payload.email);
      } catch {
        return navigate('/login');
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) načíst lokální přečtené IDčka
  useEffect(() => {
    if (!readKey) return;
    try {
      const raw = localStorage.getItem(readKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setReadIds(new Set(parsed));
    } catch {
      setReadIds(new Set());
    }
  }, [readKey]);

  // 3) načíst zprávy + realtime INSERT
  useEffect(() => {
    if (!email) return;

    const fetchMessages = async () => {
      setLoading(true);
      setErr('');
      try {
        const { data, error } = await supabase
          .from('Messages')
          .select('id, title, content, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMessages(data || []);
      } catch (e) {
        console.error('[Supabase] Chyba při načítání zpráv:', e);
        setErr('Nepodařilo se načíst zprávy. Zkuste to prosím znovu.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Messages' },
        (payload) => {
          const row = payload.new;
          setMessages((prev) => [
            {
              id: row.id,
              title: row.title,
              content: row.content,
              created_at: row.created_at,
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [email]);

  // helpers – local „read“ stav
  const persistReadIds = (nextSet) => {
    if (!readKey) return;
    try {
      localStorage.setItem(readKey, JSON.stringify(Array.from(nextSet)));
    } catch {}
  };

  const markAsRead = (id) => {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    persistReadIds(next);
  };

  const isUnread = (id) => !readIds.has(id);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // při otevření rovnou označíme jako přečtené
    markAsRead(id);
  };

  const fmtDate = (iso) =>
    new Date(iso).toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="content messages-page">
      <div className="messages-header">
        <button className="back-button" onClick={() => navigate('/account')}>ZPĚT / BACK</button>
      </div>

      {loading && <p>Načítám zprávy…</p>}
      {!loading && err && <p className="error">{err}</p>}
      {!loading && !err && messages.length === 0 && <p>Žádné zprávy k zobrazení.</p>}

      <div className="messages-list">
        {messages.map((m) => {
          const expanded = expandedIds.has(m.id);
          const unread = isUnread(m.id);

          return (
            <article
              key={m.id}
              className={`message-card ${unread ? 'unread' : ''} ${expanded ? 'expanded' : ''}`}
            >
              <header
                className="message-header accordion-header"
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={() => toggleExpand(m.id)}
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') ? (e.preventDefault(), toggleExpand(m.id)) : null
                }
              >
                <div className="message-title-row">
                  <h2 className="message-title">{m.title || 'Bez názvu'}</h2>
                </div>
                <div className="message-meta">
                  <time className="message-date">{fmtDate(m.created_at)}</time>
                  {unread && <span className="badge">Nové</span>}
                </div>
              </header>

              {expanded && (
                <div className="message-body">
                  {(m.content || '').split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default Messages;
