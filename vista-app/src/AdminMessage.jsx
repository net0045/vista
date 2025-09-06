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

  const createMessage = async () => {
    setInfo('');
    const t = title.trim();
    const c = content.trim();

    if (!t || !c) { setInfo('❌ Vyplňte prosím nadpis i text zprávy.'); return; }
    if (t.length > TITLE_MAX) { setInfo(`❌ Nadpis je příliš dlouhý (max ${TITLE_MAX} znaků).`); return; }
    if (c.length > CONTENT_MAX) { setInfo(`❌ Text je příliš dlouhý (max ${CONTENT_MAX} znaků).`); return; }

    setSaving(true);
    try {
      const token = document.cookie.split('; ')
        .find(x => x.startsWith('authToken='))?.split('=')[1];

      const res = await fetch('/.netlify/functions/createMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {}),
        },
        body: JSON.stringify({ title: t, content: c }),
      });

      const out = await res.json();
      if (!res.ok || !out.ok) throw new Error(out.error || 'Request failed');

      setInfo('✅ Zpráva byla úspěšně vytvořena.');
      resetForm();
    } catch (e) {
      console.error('[CreateMessage] failed:', e);
      setInfo(`❌ Nepodařilo se vytvořit zprávu. ${e?.message ?? ''}`.trim());
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
                placeholder={'Např. V pátek 20. 9. bude jídelna mimo provoz z důvodu plánované údržby.\nDěkujeme za pochopení.'}
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
              <button className="stornoBtn" style={{ width: 180 }} onClick={createMessage} disabled={saving}>
                {saving ? 'Ukládám…' : 'Odeslat zprávu'}
              </button>
              <button className="stornoBtn" style={{ width: 140, background: '#ccc', borderColor: '#bbb', color: '#222' }} onClick={resetForm} disabled={saving}>
                Vyčistit
              </button>
            </div>
            {info && <p style={{ marginTop: 6 }}>{info}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMessage;
