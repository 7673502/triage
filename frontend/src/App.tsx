import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Complaints from './pages/Complaints';
import MapPage from './pages/Map';
import Insights from './pages/Insights';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/insights" element={<Insights />} />
      </Route>   
    </Routes>
  );
}