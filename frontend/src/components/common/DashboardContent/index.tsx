// src/components/DashboardContent/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';
import styles from './DashboardContent.module.css';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { FaRegCalendarAlt } from 'react-icons/fa';

const CARD_COLORS = [
  '#28a745', // ฟ้า
  '#b35f00', // เขียว
  '#6f42c1', // ส้ม
  '#adb5bd', // แดง
  '#dc3545', // ม่วง
  '#b02a37', // เหลือง
  '#795548', // น้ำเงิน
  '#218838', // แดงเข้ม
  '#6c757d', // ฟ้าอมเขียว
  '#17a2b8',
  '#fd7e14', 
  '#e0a800', 
  '#007bff', 
  '#6c757d', 
  '#5bc0de', 
  '#ffc107', 
  '#6cb2eb',
  '#20c997 ',
  '#c82333', 
  '#bd2130', // เหลืองเข้ม
];

const LINE_COLORS = ['#06b6d4', '#facc15', '#6366f1', '#f43f5e', '#10b981', '#f59e42', '#a78bfa', '#ef4444', '#14b8a6', '#eab308'];

const DashboardContent: React.FC = () => {
  const { stats, loading, error, fetchStatsByYear } = useDashboard();
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [departments, setDepartments] = useState<{ id: number; name_th: string }[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ทุกหน่วยงาน');
  const ALL_STATUSES = [
    'พร้อมใช้งาน',
    'รอใช้งาน',
    'รอตัดจำหน่าย',
    'ชำรุด',
    'รอซ่อม',
    'ระหว่างการปรับปรุง',
    'ไม่มีความจำเป็นต้องใช้',
    'สูญหาย',
    'รอแลกเปลี่ยน',
    'แลกเปลี่ยน',
    'มีกรรมสิทธิ์ภายใต้สัญญาเช่า',
    'รอโอนย้าย',
    'รอโอนกรรมสิทธิ์',
    'ชั่วคราว',
    'ขาย',
    'แปรสภาพ',
    'ทำลาย',
    'สอบข้อเท็จจริง',
    'เงินชดเชยที่ดินและอาสิน',
    'ระหว่างทาง'
  ];

  // ใช้ข้อมูลจริงจาก backend
  const backendStatusMap = new Map((stats?.statuses || []).map(s => [s.status, s.count]));
  const mergedStatuses = ALL_STATUSES.map(status => ({
    status,
    count: backendStatusMap.get(status) || 0
  }));
  const sortedStatuses = mergedStatuses.slice().sort((a, b) => a.status.localeCompare(b.status, 'th'));
  const readyCardTop = sortedStatuses.find(c => c.status === 'พร้อมใช้งาน');
  const otherCards = sortedStatuses.filter(c => c.status !== 'พร้อมใช้งาน');
  const allCards = readyCardTop ? [readyCardTop, ...otherCards] : sortedStatuses;

  // เตรียมข้อมูลสำหรับกราฟเส้น: ทุก status ตามลำดับ card
  const statusChartData = allCards.map(c => ({ status: c.status, count: c.count }));

  // สำหรับกราฟเส้นแบบ multi-line ใช้ข้อมูลจริงจาก graphData.bar
  let lineKeys: string[] = [];
  let multiLineData: any[] = [];
  if (graphData && graphData.bar && graphData.bar.series && graphData.bar.labels) {
    lineKeys = graphData.bar.series.map((s: { name: string }) => s.name);
    multiLineData = graphData.bar.labels.map((month: string, i: number) => {
      const obj: any = { month };
      graphData.bar.series.forEach((s: { name: string; data: number[] }) => {
        obj[s.name] = s.data[i];
      });
      return obj;
    });
  }
  const [visibleLines, setVisibleLines] = useState<{ [key: string]: boolean }>(() => {
    const initial: { [key: string]: boolean } = {};
    lineKeys.forEach((k: string) => { initial[k] = true; });
    return initial;
  });

  // สำหรับ bar chart: state สำหรับ checkbox
  const [visibleBarStatuses, setVisibleBarStatuses] = useState<{ [key: string]: boolean }>(() => {
    const initial: { [key: string]: boolean } = {};
    allCards.forEach(c => { initial[c.status] = true; });
    return initial;
  });
  const filteredBarChartData = statusChartData.filter(d => visibleBarStatuses[d.status]);

  // สร้าง mapping status → สี (คงที่)
  const statusColorMap: { [status: string]: string } = {};
  allCards.forEach((c, idx) => {
    statusColorMap[c.status] = CARD_COLORS[idx % CARD_COLORS.length];
  });

  // หาจำนวนทั้งหมดและจำนวนพร้อมใช้งาน
  const totalCount = allCards.reduce((sum, c) => sum + c.count, 0);
  const readyCount = allCards.find(c => c.status === 'พร้อมใช้งาน')?.count || 0;

  // ดึงรายชื่อหน่วยงาน
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await axios.get('/api/assets/departments');
        setDepartments(res.data || []);
      } catch (e) {
        setDepartments([]);
      }
    }
    fetchDepartments();
  }, []);

  // ดึงข้อมูล assets ตาม department ที่เลือก
  useEffect(() => {
    fetchStatsByYear(selectedYear, selectedDepartment);
    // eslint-disable-next-line
  }, [selectedYear, selectedDepartment]);

  useEffect(() => {
    async function fetchGraphs() {
      try {
        const res = await axios.get('/api/assets/dashboard-graphs');
        setGraphData(res.data);
      } catch (e) {
        setGraphData(null);
      }
    }
    fetchGraphs();
  }, []);

  if (loading) {
    return <div className={styles.dashboardContent}><div style={{ textAlign: 'center', padding: '50px' }}>Loading dashboard data...</div></div>;
  }
  if (error) {
    return <div className={styles.dashboardContent}><div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Error: {error}</div></div>;
  }

  // ฟังก์ชันเลือกสี border
  const getCardColor = (idx: number) => CARD_COLORS[idx % CARD_COLORS.length];

  // จำกัดให้แสดงแค่ 7 card แรก (แต่ scroll ดูที่เหลือได้)
  const VISIBLE_CARDS = 7;

  return (
    <div className={styles.dashboardContent} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Sidebar Cards */}
      <div style={{
        flex: '0 0 340px',
        marginTop: 80,
        maxHeight: `${VISIBLE_CARDS * 100 + 40}px`, // ปรับ maxHeight ให้เหมาะกับ card ที่สูงขึ้นและ padding ใหม่
        overflowY: 'auto', // scroll mouse อยู่ใน container นี้เท่านั้น
        display: 'flex',
        flexDirection: 'column',
        gap: 20, // ระยะห่างระหว่าง card มากขึ้น
        background: '#f8fafc',
        borderRadius: 20,
        padding: 20, // padding container มากขึ้น
        boxShadow: '0 2px 8px #0001',
        minHeight: 200
      }}>
        {/* หัวข้อครุภัณฑ์ทั้งหมด */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#222' }}>ครุภัณฑ์ทั้งหมด</div>
          <div style={{ fontWeight: 400, fontSize: 15, color: '#555', marginTop: 2 }}>
            รวม {totalCount} รายการ
          </div>
        </div>
        {allCards.map((card, idx) => (
          <div
            key={card.status}
            style={{
              border: 'none',
              borderRadius: 10, // ให้เหลี่ยมขึ้นและพอดีกับแถบสี
              padding: '18px 20px', // ใหญ่ขึ้น
              background: '#fff',
              marginBottom: 0,
              boxShadow: '0 1px 4px #0001',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              minHeight: 80, // ใหญ่ขึ้น
              fontSize: 15,
              width: '100%',
              boxSizing: 'border-box',
              transition: 'box-shadow 0.2s',
              position: 'relative',
              overflow: 'hidden', // ให้แถบสีโค้งมนไปกับขอบ
            }}
          >
            {/* แถบสีโค้งซ้ายบน */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: 8,
              borderRadius: 10, // โค้งมนเท่ากับ card
              background: getCardColor(idx),
            }} />
            <div style={{ fontSize: 15, color: '#444', fontWeight: 500, marginLeft: 16 }}>{card.status}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#222', marginTop: 2, marginLeft: 16 }}>{card.count}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          <select
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 15 }}
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
          >
            <option value="ทุกหน่วยงาน">ทุกหน่วยงาน</option>
            {departments.map(dep => (
              <option key={dep.id} value={dep.name_th}>{dep.name_th}</option>
            ))}
          </select>
        </div>

        {/* Graph: จำนวนแต่ละ status (Line Chart) */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #0001', minHeight: 320 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 17 }}>จำนวนครุภัณฑ์แต่ละสถานะ</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" interval={0} angle={-30} textAnchor="end" height={80} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* กราฟด้านล่าง (Bar Chart) */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #0001', minHeight: 320 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 17 }}>bar chart</div>
          {/* Checkbox filter สำหรับ bar chart */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {allCards.map((c, idx) => (
              <label key={c.status} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 15 }}>
                <input
                  type="checkbox"
                  checked={visibleBarStatuses[c.status]}
                  onChange={() => setVisibleBarStatuses({ ...visibleBarStatuses, [c.status]: !visibleBarStatuses[c.status] })}
                />
                <span style={{ color: CARD_COLORS[idx % CARD_COLORS.length], fontWeight: 500 }}>{c.status}</span>
              </label>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={filteredBarChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" interval={0} angle={-30} textAnchor="end" height={80} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" barSize={32}>
                {filteredBarChartData.map((entry) => (
                  <Cell key={entry.status} fill={statusColorMap[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* สามารถเพิ่มกราฟอื่น ๆ ต่อด้านล่างนี้ได้ */}
      </div>
    </div>
  );
};

export default DashboardContent;