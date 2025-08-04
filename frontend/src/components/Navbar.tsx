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
        <div className="logo-square" />
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
