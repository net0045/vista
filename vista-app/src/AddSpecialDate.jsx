import React, { useEffect, useState } from 'react';
import './Admin.css'; 
import { useNavigate } from 'react-router-dom';
import { addSpecialDate, listSpecialDates, deleteSpecialDate } from './api/adminApi';

function AddSpecialDate() {
  const navigate = useNavigate();

  // CZ vstup a seznam ISO dat (z DB/API)
  const [dayCz, setDayCz] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState([]); 
  const [listLoading, setListLoading] = useState(false);

  // převod "DD.MM.RRRR" -> "YYYY-MM-DD"
  const parseCzToIso = (input) => {
    const m = input.trim().match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
    if (!m) return null;
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);

    const dt = new Date(y, mo - 1, d);
    if (
      dt.getFullYear() !== y ||
      dt.getMonth() !== mo - 1 ||
      dt.getDate() !== d
    ) return null;

    const mm = String(mo).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // převod "YYYY-MM-DD" -> "D. M. RRRR"
  const formatIsoToCz = (iso) => {
    const m = iso?.match?.(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso || '';
    const [_, y, mm, dd] = m;
    return `${parseInt(dd, 10)}. ${parseInt(mm, 10)}. ${y}`;
  };

  const loadDates = async () => {
    setListLoading(true);
    try {
      const rows = await listSpecialDates();
      setDates(rows.map(r => r.date)); // ukládáme ISO datum
    } catch (e) {
      setMessage('❌ Nepodařilo se načíst speciální dny.');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadDates();
  }, []);

  const handleSpecialDay = async () => {
    const iso = parseCzToIso(dayCz);
    if (!iso) {
      setMessage('❌ Zadej den ve formátu DD.MM.RRRR (např. 25.2.2025).');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await addSpecialDate(iso);
      setMessage('✅ Speciální den byl úspěšně přidán.');
      setDayCz('');
      await loadDates();
    } catch (error) {
      setMessage('❌ Chyba: den se nepodařilo uložit!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (d) => {
    if (!confirm(`Opravdu smazat speciální den ${formatIsoToCz(d)}?`)) return;
    try {
      await deleteSpecialDate(d); // d je ISO z DB
      setMessage('✅ Den byl smazán.');
      await loadDates();
    } catch {
      setMessage('❌ Chyba: den se nepodařilo smazat.');
    }
  };

  const goImport = () => navigate('/admin/import');
  const goExport = () => navigate('/admin/export');
  const goOverview = () => navigate('/admin/overview');
  const goSpecialDates = () => navigate('/admin/specialdates');
  const goMessage = () => navigate('/admin/message');

  return (
    <div className="admin-container-storno">
      <div className='admin-navigation'>
        <div>
          <button className='admin-backToAccButton' onClick={() => navigate('/account')}>ZPĚT NA ÚČET</button>
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
        <div className="storno-order-div">
          <h1>Dny, kdy se nepodává jídlo pro studenty.</h1>
          <p>Do inputu zadejte den ve formátu <b>DD.MM.RRRR</b> (např. <i>25.2.2025</i>), kdy víte, že se nebude podávat jídlo.</p>

          <div style={{ display: 'flex', alignItems: 'center', flexDirection:'column', width:'50%', 
           }}>
            <input
              className="stornoInput"
              placeholder="Zadejte datum (DD.MM.RRRR)"
              value={dayCz}
              onChange={(e) => setDayCz(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSpecialDay(); }}
              inputMode="numeric"
            />
            <button
            style={{width:'150px'}}
              className="stornoBtn"
              onClick={handleSpecialDay}
              disabled={loading}
            >
              {loading ? 'Přidávám...' : 'Přidat den'}
            </button>
          </div>

          {message && <p style={{ marginTop: 10 }}>{message}</p>}

          <h2 style={{ marginTop: 24 }}>Seznam speciálních dnů</h2>
          {listLoading ? (
            <p>Načítám…</p>
          ) : dates.length === 0 ? (
            <p>Žádné speciální dny zatím nejsou.</p>
          ) : (
            <table className="admin-table" style={{ marginTop: 8, width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #ddd' }}>Datum</th>
                  <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #ddd' }}>Akce</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((d) => (
                  <tr key={d}>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #eee' }}>{formatIsoToCz(d)}</td>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #eee' }}>
                      <button className="stornoBtn" onClick={() => handleDelete(d)}>Smazat</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddSpecialDate;
