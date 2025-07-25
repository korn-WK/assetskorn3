import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/user/Sidebar';
import Layout from '../../components/common/Layout';
import Navbar from '../../components/common/Navbar';
import AssetVerificationTable from '../../components/user/AssetVerificationTable';

const AssetVerificationUserPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role?.toLowerCase() !== 'admin' && user.role?.toLowerCase() !== 'superadmin')) {
        router.replace('/user/asset-browser');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role?.toLowerCase() !== 'admin' && user.role?.toLowerCase() !== 'superadmin')) {
    return null;
  }

  return (
    <Layout sidebar={<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}>
      <Navbar
        title="Asset Verification"
        isAdmin={user.role?.toLowerCase() === 'superadmin' || user.role?.toLowerCase() === 'admin'}
        onMenuClick={() => setSidebarOpen(true)}
        onSearch={setSearchTerm}
      />
      <div style={{
        padding: '2rem',
        backgroundColor: 'var(--card-bg)',
        borderRadius: '15px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h1></h1>
        <AssetVerificationTable searchTerm={searchTerm} />
      </div>
    </Layout>
  );
};

export default AssetVerificationUserPage; 