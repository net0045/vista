import React, { useState, useEffect } from 'react';
import './Admin.css';
import { useNavigate } from 'react-router-dom';
import { getOverviewData } from './api/adminApi';

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
            totalPrice: `${(first?.food?.cost || 0) + (second?.food?.cost || 0)} Kč`
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

  const goImport = () => navigate('/admin/import');
  const goExport = () => navigate('/admin/export');
  const goOverview = () => navigate('/admin/overview');
  const goStorno = () => navigate('/admin/storno');

  return (
    <div className="admin-container-users">
      <div className="top-bar">
        <button onClick={goImport}>NAHRÁT EXCEL</button>
        <button onClick={goExport}>VYGENEROVAT EXCEL</button>
        <button onClick={goStorno}>STORNO OBJEDNÁVEK</button>
        <button onClick={goOverview}>SEZNAM OBJEDNÁVEK</button>
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
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr key={index}>
                <td>{order.id}</td>
                <td>{order.date}</td>
                <td>{order.surname}</td>
                <td>{order.email}</td>
                <td>{order.food1}</td>
                <td>{order.pickedFood1 ? '✔️' : ''}</td>
                <td>{order.food2}</td>
                <td>{order.pickedFood2 ? '✔️' : ''}</td>
                <td>{order.totalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}

export default AdminOverview;
