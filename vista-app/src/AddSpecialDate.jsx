import React, { useEffect, useState } from 'react';
import './Admin.css'; 
import { useNavigate } from 'react-router-dom';
import { addSpecialDate, listSpecialDates, deleteSpecialDate } from './api/adminApi';

function AddSpecialDate() {
  const navigate = useNavigate();
  const [day, setDay] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState([]); 
  const [listLoading, setListLoading] = useState(false);

  const loadDates = async () => {
    setListLoading(true);
    try {
      const rows = await listSpecialDates();
      setDates(rows.map(r => r.date)); // pokud máš 'date', pak r.date
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
    if (!day.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setMessage('❌ Zadej den ve formátu RRRR-MM-DD! (Např. 2024-12-25)');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await addSpecialDate(day);
      setMessage('✅ Speciální den byl úspěšně přidán.');
      setDay('');
      await loadDates();
    } catch (error) {
      setMessage('❌ Chyba: den se nepodařilo uložit!');
    } finally {
      setLoading(false);
    }
  };

 const handleDelete = async (d) => {
  if (!confirm(`Opravdu smazat speciální den ${d}?`)) return;
  try {
    await deleteSpecialDate(d);
    setMessage('✅ Den byl smazán.');
    await loadDates();
  } catch {
    setMessage('❌ Chyba: den se nepodařilo smazat.');
  }
};

  const goImport = () => {
    navigate('/admin/import');
  };

  const goExport = () => {
    navigate('/admin/export');
  };

  const goOverview = () => {
    navigate('/admin/overview');
  };

  const goSpecialDates = () => {
    navigate('/admin/specialdates');
  };

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
        </div>
      </div>

      <div className="content-row">
        <div className="storno-order-div">
          <h1>Speciální dny, kdy se nepodává jídlo pro studenty.</h1>
          <p>Do inputu zadejte den, kdy víte, že se nebude podávat jídlo</p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="stornoInput"
              placeholder="Zadejte datum (RRRR-MM-DD)"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
            <button
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
                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #ddd' }}>Datum</th>
                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #ddd' }}>Akce</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((d) => (
                  <tr key={d}>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #eee' }}>{d}</td>
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
