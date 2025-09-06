// src/Messages.jsx
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

  // pro banner "Máte nové zprávy"
  const [latestCreatedAt, setLatestCreatedAt] = useState(null); // Date | null
  const [lastSeenAt, setLastSeenAt] = useState(null); // Date | null
  const [showNewBanner, setShowNewBanner] = useState(false);
  const [bannerLocked, setBannerLocked] = useState(false); // ochrana proti duplicitnímu zápisu

  // Klíč pro localStorage per uživatel (lokální "přečteno")
  const readKey = useMemo(() => (email ? `readMessages:${email}` : null), [email]);
  const [readIds, setReadIds] = useState(() => new Set());

  // 1) Ověření uživatele z JWT
  useEffect(() => {
    const init = async () => {
      try {
        const token = getCookie('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const payload = await verifyToken(token, getSecretKey());
        if (!payload?.email) {
          navigate('/login');
          return;
        }

        setEmail(payload.email);
      } catch (e) {
        console.warn('[JWT] Chyba při ověření:', e);
        navigate('/login');
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Načíst lokální "přečteno" po tom, co známe email
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

  // 3) Načíst zprávy a současně připravit latestCreatedAt
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

        const rows = data || [];
        setMessages(rows);

        // nastavíme nejnovější čas zprávy
        if (rows.length > 0 && rows[0].created_at) {
          setLatestCreatedAt(new Date(rows[0].created_at));
        } else {
          setLatestCreatedAt(null);
        }
      } catch (e) {
        console.error('[Supabase] Chyba při načítání zpráv:', e);
        setErr('Nepodařilo se načíst zprávy. Zkuste to prosím znovu.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Realtime – posloucháme nové zprávy
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

          // při nové zprávě aktualizuj latestCreatedAt a případně ukaž banner
          const created = row.created_at ? new Date(row.created_at) : null;
          if (created) {
            setLatestCreatedAt((prevLatest) => {
              if (!prevLatest || created > prevLatest) {
                return created;
              }
              return prevLatest;
            });
            // Porovnáme až v dalším efektu, kde sledujeme latestCreatedAt & lastSeenAt
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [email]);

  // 4) Načti z tabulky User hodnotu messages_last_seen_at
  useEffect(() => {
    if (!email) return;

    const fetchLastSeen = async () => {
      try {
        const { data, error } = await supabase
          .from('User')
          .select('messages_last_seen_at')
          .eq('email', email)
          .single();

        if (error) throw error;

        const seen = data?.messages_last_seen_at
          ? new Date(data.messages_last_seen_at)
          : new Date(0);

        setLastSeenAt(seen);
      } catch (e) {
        console.warn('[Supabase] Nepodařilo se načíst messages_last_seen_at:', e);
        // fallback – nebrzdíme UI
        setLastSeenAt(new Date(0));
      }
    };

    fetchLastSeen();
  }, [email]);

  // 5) Jakmile známe latestCreatedAt a lastSeenAt, rozhodneme o banneru
  useEffect(() => {
    if (!bannerLocked && latestCreatedAt && lastSeenAt) {
      if (latestCreatedAt > lastSeenAt) {
        setShowNewBanner(true);
      }
    }
  }, [bannerLocked, latestCreatedAt, lastSeenAt]);

  // Pomocné funkce pro lokální "přečteno"
  const persistReadIds = (nextSet) => {
    if (!readKey) return;
    try {
      localStorage.setItem(readKey, JSON.stringify(Array.from(nextSet)));
    } catch {
      // ignore
    }
  };

  const markAsRead = (id) => {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    persistReadIds(next);
  };

  const markAllAsRead = () => {
    const next = new Set(messages.map((m) => m.id));
    setReadIds(next);
    persistReadIds(next);
  };

  const isUnread = (id) => !readIds.has(id);

  const fmtDate = (iso) =>
    new Date(iso).toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  // klik na banner → zapíšeme last_seen = latestCreatedAt a banner schováme
  const acknowledgeNewMessages = async () => {
    if (!email || !latestCreatedAt || bannerLocked) {
      setShowNewBanner(false);
      return;
    }
    try {
      setBannerLocked(true);
      await supabase
        .from('User')
        .update({ messages_last_seen_at: latestCreatedAt.toISOString() })
        .eq('email', email);

      setLastSeenAt(latestCreatedAt);
    } catch (e) {
      console.warn('[Supabase] Nepodařilo se zapsat messages_last_seen_at:', e);
      // i když zápis selže, banner schováme – nechceme zacyklení
    } finally {
      setShowNewBanner(false);
      setBannerLocked(false);
    }
  };

  return (
    <div className="content messages-page">
      {/* Jednorázové upozornění na nové zprávy */}
      {showNewBanner && (
        <div className="info-banner">
          <div className="info-banner__text">
            Máte nové zprávy. Otevřete je níže.
          </div>
          <div className="info-banner__actions">
            <button className="btn" onClick={acknowledgeNewMessages}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="messages-header">
        <button className="btn" onClick={() => navigate('/account')}>← Zpět</button>
        <h1>Zprávy</h1>
        <div className="spacer" />
        {messages.length > 0 && (
          <button className="btn outline" onClick={markAllAsRead}>
            Označit vše jako přečtené
          </button>
        )}
      </div>

      {loading && <p>Načítám zprávy…</p>}
      {!loading && err && <p className="error">{err}</p>}
      {!loading && !err && messages.length === 0 && (
        <p>Žádné zprávy k zobrazení.</p>
      )}

      <div className="messages-list">
        {messages.map((m) => (
          <article
            key={m.id}
            className={`message-card ${isUnread(m.id) ? 'unread' : ''}`}
            onClick={() => markAsRead(m.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' ? markAsRead(m.id) : null)}
          >
            <header className="message-header">
              <h2 className="message-title">
                {m.title || 'Bez názvu'}
              </h2>
              <div className="message-meta">
                <time className="message-date">{fmtDate(m.created_at)}</time>
                {isUnread(m.id) && <span className="badge">Nové</span>}
              </div>
            </header>
            <div className="message-body">
              {(m.content || '').split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Messages;
