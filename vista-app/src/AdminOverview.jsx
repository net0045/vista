import React, { useState, useEffect } from 'react';
import './Admin.css';
import { useNavigate } from 'react-router-dom';
import { getOverviewData, removeOrderAndFoodsInOrderByOrderId, setOrderPaidById } from './api/adminApi';

function AdminOverview() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  const SortableHeader = ({ label, sortKey, sortConfig, onSort }) => {
    const isSorted = sortConfig.key === sortKey;
    const directionIcon = isSorted
      ? sortConfig.direction === 'asc'
        ? '↑'
        : '↓'
      : '⇅';

    return (
      <th onClick={() => onSort(sortKey)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        {label} {directionIcon}
      </th>
    );  
  };

  const isDeleteButtonVisible = () => {
    const now = new Date();
    const day = now.getDay(); 
    const hour = now.getHours();
    const minutes = now.getMinutes();

    if (day === 5 && (hour > 20 || (hour === 16 && minutes >= 0))) {
      return true;
    }

    if (day === 6) {
      return true;
    }

    if (day === 0 && (hour < 16 || (hour === 16 && minutes <= 59))) {
      return true;
    }

    return false;
  };


    const handleDeleteAllOrders = async () => {
    if (!window.confirm("Opravdu chcete smazat všechny objednávky?")) {
      return;
    }

    try {
      // smažeme každou objednávku z databáze
      for (const order of orders) {
        await removeOrderAndFoodsInOrderByOrderId(order.id);
      }

      // vyprázdníme stav
      setOrders([]);
      setFilteredOrders([]);

      alert("Všechny objednávky byly úspěšně smazány.");
    } catch (error) {
      console.error("Chyba při mazání všech objednávek:", error);
      alert("Chyba: nepodařilo se smazat všechny objednávky!");
    }
  };



  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOverviewData();

        const formattedOrders = data.map(order => {
          const [first, second] = order.FoodsInOrder.sort((a, b) => a.mealNumber - b.mealNumber);

          return {
            id: order.id,
            date: order.date,
            surname: order.user?.surname || '',
            email: order.user?.email || '',
            food1: first?.mealNumber || '',
            food2: second?.mealNumber || '',
            pickedFood1: first?.picked || false,
            pickedFood2: second?.picked || false,
            totalPrice: `${(first?.food?.cost || 0) + (second?.food?.cost || 0)} Kč`,
            ispaid: order.ispaid || false
          };
        });

        setOrders(formattedOrders);
        setFilteredOrders(formattedOrders);
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(order =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredOrders].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredOrders(sorted);
  };

  //${id}
  const handleStorno = async (id) => {
    if (!window.confirm(`Opravdu chcete stornovat objednávku?`)) {
      return;
    }

    try {
      await removeOrderAndFoodsInOrderByOrderId(id);
      const updated = filteredOrders.filter(order => order.id !== id);
      setFilteredOrders(updated);
      setOrders(orders.filter(order => order.id !== id));
      alert(`Objednávka byla úspěšně stornována.`);
    } catch (error) {
      console.error('Chyba při stornu:', error);
      alert(`Chyba: objednávku se nepodařilo zrušit!`);
    }
  };

  const handleZaplatit = async (id) => {
    if (!window.confirm(`Opravdu označit objednávku jako zaplacenou?`)) {
      return;
    }

    try {
      await setOrderPaidById(id);

      const updated = filteredOrders.map(order =>
        order.id === id ? { ...order, ispaid: true } : order
      );

      setFilteredOrders(updated);
      setOrders(updated);
      alert(`Objednávka byla označena jako zaplacená.`);
    } catch (error) {
      console.error('Chyba při označování jako zaplacené:', error);
      alert(`Chyba: nepodařilo se označit objednávku jako zaplacenou.`);
    }
  };

  const goImport = () => navigate('/admin/import');
  const goExport = () => navigate('/admin/export');
  const goOverview = () => navigate('/admin/overview');
  const goStorno = () => navigate('/admin/storno');

  return (
    <div className="admin-container-users">
      <div className='admin-navigation'>
        <div>
          <button className='admin-backToAccButton' onClick={() => navigate('/account')}>ZPĚT NA ÚČET</button>
        </div>
        <div className="top-bar">
          <button  onClick={goImport}>NAHRÁT EXCEL</button>
          <button  onClick={goExport}>VYGENEROVAT EXCEL</button>
          
          <button  onClick={goOverview}>SEZNAM OBJEDNÁVEK</button>
        </div>
      </div>

      <div className="filter">
        <input
          type="text"
          placeholder="Hledat podle ID, emailu nebo příjmení..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            width: '100%',
            maxWidth: '400px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            fontSize: '14px'
          }}
        />

        {isDeleteButtonVisible() && (
          <button className='delete-orders' onClick={handleDeleteAllOrders}>
            SMAZAT VŠECHNY OBJEDNÁVKY
          </button>
        )}
      </div>

      <table className="orders-table">
        <thead>
          <tr>
            <SortableHeader label="ID objednávky" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader label="Datum" sortKey="date" sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader label="Příjmení" sortKey="surname" sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader label="Email" sortKey="email" sortConfig={sortConfig} onSort={handleSort} />
            <th>Menu 1</th>
            <th>Vyzvednuto 1</th>
            <th>Menu 2</th>
            <th>Vyzvednuto 2</th>
            <SortableHeader label="Cena" sortKey="totalPrice" sortConfig={sortConfig} onSort={handleSort} />
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.date}</td>
              <td>{order.surname}</td>
              <td>{order.email}</td>
              <td>{order.food1}</td>
              <td>{order.pickedFood1 ? '✔️' : ''}</td>
              <td>{order.food2}</td>
              <td>{order.pickedFood2 ? '✔️' : ''}</td>
              <td>{order.totalPrice}</td>
              <td className="action-cell">
                <button className="btn-action btn-storno" onClick={() => handleStorno(order.id)}>STORNO</button>

                {order.ispaid ? (
                  <span className="status-zaplaceno">ZAPLACENO</span>
                ) : (
                  <button className="btn-action btn-zaplatit" onClick={() => handleZaplatit(order.id)}>ZAPLATIT</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminOverview;
