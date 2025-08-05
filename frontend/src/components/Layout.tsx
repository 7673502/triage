import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <>
      <Navbar />
      <main       style={{
        maxWidth: 'clamp(960px, 80vw, 1280px)',
        margin: '0 auto',
        padding: '0',
        boxSizing: 'border-box',
      }}>
        <Outlet />
      </main>
    </>
  );
}
