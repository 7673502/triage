import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <>
      <Navbar />
      <main style={{ padding: '24px' }}>
        <Outlet />
      </main>
    </>
  );
}
