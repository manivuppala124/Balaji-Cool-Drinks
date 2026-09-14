import { Outlet } from 'react-router-dom';
import CustomerShell from './CustomerShell';
import Footer from '../components/Footer';

export default function CustomerLayout() {
  return (
    <CustomerShell>
      <Outlet />
      <Footer />
    </CustomerShell>
  );
}
