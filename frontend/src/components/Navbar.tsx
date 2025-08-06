import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import CitySwitcher from './CitySwitcher';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/complaints', label: 'Complaints' },
  { to: '/map', label: 'Map' },
  { to: '/insights', label: 'Insights' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav">
      {/* brand + city */}
      <div className="nav__brand">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 96 88" width="40" height="40">  
  <line x1="40" y1="0" x2="0" y2="69.28" stroke="#aaa" strokeWidth="2" />
  <line x1="40" y1="0" x2="80" y2="69.28" stroke="#aaa" strokeWidth="2" />
  <line x1="0" y1="69.28" x2="80" y2="69.28" stroke="#aaa" strokeWidth="2" />

  <circle cx="40" cy="0" r="7" fill="#22c55e" />
  <circle cx="0" cy="69.28" r="7" fill="#facc15" />
  <circle cx="80" cy="69.28" r="7" fill="#ef4444" />
</svg>


        <span className="brand-text">triage</span>

        <div style={{ marginLeft: 16, width: 160 }}>
          <CitySwitcher />
        </div>
      </div>

      {/* desktop link row */}
      <ul className="nav__links">
        {links.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end as boolean | undefined}
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' nav-link--active' : '')
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* hamburger (mobile only) */}
      <button
        aria-label="Toggle navigation"
        className="nav__hamburger"
        onClick={() => setOpen(!open)}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      {/* mobile slide-down menu */}
      <ul className={`nav__drawer ${open ? 'show' : ''}`}>
        {links.map(({ to, label, end }) => (
          <li key={to} onClick={() => setOpen(false)}>
            <NavLink
              to={to}
              end={end as boolean | undefined}
              className={({ isActive }) =>
                'drawer-link' + (isActive ? ' drawer-link--active' : '')
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
