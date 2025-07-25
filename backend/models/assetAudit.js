const pool = require('../lib/db.js');

// เพิ่ม log การตรวจนับ
async function createAssetAudit({ asset_id, user_id, department_id, status, note }) {
  const query = `
    INSERT INTO asset_audits (asset_id, user_id, department_id, status, note)
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [asset_id, user_id, department_id, status, note || null];
  const [result] = await pool.query(query, params);
  return result.insertId;
}

// ดึง log การตรวจนับ (optionally filter by department_id, asset_id, confirmed)
async function getAssetAudits({ department_id = null, asset_id = null, confirmed = null, limit = 100, offset = 0 } = {}) {
  let query = `
    SELECT aa.*, a.asset_code, a.inventory_number, a.name as asset_name, a.department_id as asset_department_id, d.name_th as department_name, u.name as user_name
    FROM asset_audits aa
    JOIN assets a ON aa.asset_id = a.id
    JOIN users u ON aa.user_id = u.id
    JOIN departments d ON aa.department_id = d.id
    WHERE 1=1
  `;
  const params = [];
  if (department_id) {
    query += ' AND aa.department_id = ?';
    params.push(department_id);
  }
  if (asset_id) {
    query += ' AND aa.asset_id = ?';
    params.push(asset_id);
  }
  if (confirmed !== null) {
    query += ' AND aa.confirmed = ?';
    params.push(confirmed);
  }
  query += ' ORDER BY aa.checked_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const [rows] = await pool.query(query, params);
  return rows;
}

module.exports = {
  createAssetAudit,
  getAssetAudits,
}; 