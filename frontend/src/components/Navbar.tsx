import { NavLink } from 'react-router-dom';
import './Navbar.css';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/complaints', label: 'Complaints' },
  { to: '/map', label: 'Map' },
  { to: '/insights', label: 'Insights' },
];

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav__brand">
        <div className="logo-square" />
        <span className="brand-text">triage</span>
      </div>

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
    </nav>
  );
}
