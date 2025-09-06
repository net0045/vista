// src/AdminMessage.jsx
import React, { useState } from 'react';
import './Admin.css';
import { useNavigate } from 'react-router-dom';

function AdminMessage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState('');

  const TITLE_MAX = 120;
  const CONTENT_MAX = 5000;

  const goImport = () => navigate('/admin/import');
  const goExport = () => navigate('/admin/export');
  const goOverview = () => navigate('/admin/overview');
  const goSpecialDates = () => navigate('/admin/specialdates');
  const goMessage = () => navigate('/admin/message');

  const resetForm = () => {
    setTitle('');
    setContent('');
  };

  // Pomocná: bezpečně přečte text/JSON chyby z fetch
  const readErrorText = async (res) => {
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = await res.json();
        // j může být string/objekt
        if (typeof j === 'string') return j;
        if (j?.error) return j.error;
        if (j?.message) return j.message;
        return JSON.stringify(j);
      }
      return await res.text();
    } catch {
      return `HTTP ${res.status}`;
    }
  };

  const createMessage = async () => {
    setInfo('');
    const t = title.trim();
    const c = content.trim();

    if (!t || !c) {
      setInfo('❌ Vyplňte prosím nadpis i text zprávy.');
      return;
    }
    if (t.length > TITLE_MAX) {
      setInfo(`❌ Nadpis je příliš dlouhý (max ${TITLE_MAX} znaků).`);
      return;
    }
    if (c.length > CONTENT_MAX) {
      setInfo(`❌ Text je příliš dlouhý (max ${CONTENT_MAX} znaků).`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/.netlify/functions/create-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // pošli cookie s authToken
        body: JSON.stringify({ title: t, content: c }),
      });

      if (!res.ok) {
        const msg = await readErrorText(res);
        if (res.status === 401) {
          throw new Error('Nejste přihlášen nebo je token neplatný.');
        }
        if (res.status === 403) {
          throw new Error('Nemáte oprávnění (nejste admin).');
        }
        throw new Error(msg || `HTTP ${res.status}`);
      }

      // úspěch
      setInfo('✅ Zpráva byla úspěšně vytvořena.');
      resetForm();
      // případně: navigate('/messages');
    } catch (e) {
      setInfo(`❌ Nepodařilo se vytvořit zprávu. ${e.message || ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      createMessage();
    }
  };

  return (
    <div className="admin-container-storno">
      <div className="admin-navigation">
        <div>
          <button className="admin-backToAccButton" onClick={() => navigate('/account')}>
            ZPĚT NA ÚČET
          </button>
        </div>
        <div className="top-bar">
          <button onClick={goImport}>NAHRÁT EXCEL</button>
          <button onClick={goExport}>VYGENEROVAT EXCEL</button>
          <button onClick={goOverview}>SEZNAM OBJEDNÁVEK</button>
          <button onClick={goSpecialDates}>SPECIÁLNÍ DNY</button>
          <button onClick={goMessage}>ZPRÁVA</button>
        </div>
      </div>

      <div className="content-row">
        <div className="storno-order-div" style={{ width: '100%', maxWidth: 900 }}>
          <h1>Vytvořit zprávu pro studenty</h1>
          <p>
            Zde můžeš odeslat hromadnou zprávu, která se zobrazí v sekci <b>Zprávy</b> u všech uživatelů.
            <br />
            Nadpis max {TITLE_MAX} znaků, text max {CONTENT_MAX} znaků.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Nadpis</div>
              <input
                className="stornoInput"
                placeholder="Např. Údržba jídelny v pátek"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={TITLE_MAX}
              />
              <div style={{ textAlign: 'right', fontSize: 12, opacity: 0.7 }}>
                {title.length}/{TITLE_MAX}
              </div>
            </label>

            <label>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Text zprávy</div>
              <textarea
                className="stornoInput"
                style={{ minHeight: 160, resize: 'vertical', lineHeight: '1.4' }}
                placeholder={
                  'Např. V pátek 20. 9. bude jídelna mimo provoz z důvodu plánované údržby.\nDěkujeme za pochopení.'
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={CONTENT_MAX}
              />
              <div style={{ textAlign: 'right', fontSize: 12, opacity: 0.7 }}>
                {content.length}/{CONTENT_MAX}
              </div>
            </label>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                className="stornoBtn"
                style={{ width: 180 }}
                onClick={createMessage}
                disabled={saving}
              >
                {saving ? 'Ukládám…' : 'Odeslat zprávu'}
              </button>
              <button
                className="stornoBtn"
                style={{ width: 140, background: '#ccc', borderColor: '#bbb', color: '#222' }}
                onClick={resetForm}
                disabled={saving}
              >
                Vyčistit
              </button>
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                Tip: <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Enter</kbd> pro odeslání
              </span>
            </div>

            {info && <p style={{ marginTop: 6 }}>{info}</p>}

            {(title.trim() || content.trim()) && (
              <div style={{ marginTop: 16 }}>
                <h2>Náhled</h2>
                <article className="message-card">
                  <header className="message-header">
                    <h3 className="message-title">{title.trim() || 'Bez názvu'}</h3>
                    <div className="message-meta">
                      <time className="message-date">
                        {new Date().toLocaleString('cs-CZ', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                  </header>
                  <div className="message-body">
                    {(content.trim() || '').split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </article>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMessage;
