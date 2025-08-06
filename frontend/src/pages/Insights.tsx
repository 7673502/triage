import { useEffect, useMemo, useState } from 'react';
import { useCity } from '../CityContext';
import useCityRequests from '../hooks/useCityRequests';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer
} from 'recharts';
//import Heatmap from "./HeatMap"; // make in future
import SiteFooter from '../components/SiteFooter';

type Point = { lat: number; lng: number };
export default function Insights() {
  const { city } = useCity();
  const { items, loading, error } = useCityRequests();

  const [hourlyCounts, setHourlyCounts] = useState<{ hour: number; count: number }[]>([]);

  const [priorityBuckets, setPriorityBuckets] = useState<{ bucket: string; count: number }[]>([]);
  const [serviceCounts, setServiceCounts] = useState<{ name: string; count: number }[]>([]);
  const [geoPoints, setGeoPoints] = useState<Point[]>([]);
  
  useEffect(() => {
    if (!items || items.length === 0) return;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    //complaints per hour 
    const hourly = new Array(24).fill(0);
    items.forEach((req) => {
      if (!req.requested_datetime) return;
      const dt = new Date(req.requested_datetime);
      if (dt >= oneDayAgo) {
        const hour = dt.getHours();
        hourly[hour]++;
      }
    });
    setHourlyCounts(hourly.map((count, hour) => ({ hour, count })));

    // priority histogram buckets
    const buckets = [0, 0, 0, 0, 0];
    items.forEach((req) => {
      const p = req.priority ?? 0;
      if (p <= 1) buckets[0]++;
      else if (p <= 40) buckets[1]++;
      else if (p <= 60) buckets[2]++;
      else if (p <= 80) buckets[3]++;
      else buckets[4]++;
    });
    setPriorityBuckets([
      { bucket: '0–20', count: buckets[0] },
      { bucket: '21–40', count: buckets[1] },
      { bucket: '41–60', count: buckets[2] },
      { bucket: '61–80', count: buckets[3] },
      { bucket: '81-100', count: buckets[4] },
    ]);

    // service type counts
    const counts: Record<string, number> = {};
    items.forEach((req) => {
      const key = req.service_name || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    const serviceData = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // only top 10
    setServiceCounts(serviceData);
    

    // Heatmap points
    // setGeoPoints(
    //   items
    //     .filter((r): r is { lat: number; long: number } =>
    //       typeof r.lat === 'number' && typeof r.long === 'number'
    //     )
    //     .map((r) => ({ lat: r.lat, lng: r.long }))
    //);
  }, [items]);

  if (!city) return <p style={{ textAlign: 'center', paddingTop: 80 }}>Pick a city to view insights</p>;
  if (loading) return <p style={{ textAlign: 'center', paddingTop: 80 }}>Loading…</p>;
  if (error) return <p style={{ textAlign: 'center', paddingTop: 80 }}>{error}</p>;

  return (
    <>
    <div style={{maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>Insights for {city}</h2>

      <section style={{ marginTop: 30 }}>
        <h2>Requests per Hour (Last 24h)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hourlyCounts}>
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <CartesianGrid stroke="#ccc" />
            <Line type="monotone" dataKey="count" stroke="#007bff" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2>Request Priority Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={priorityBuckets}>
            <XAxis dataKey="bucket" />
            <YAxis />
            <Tooltip />
            <CartesianGrid stroke="#ccc" />
            <Bar dataKey="count" fill="#28a745" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2>Requests by Service Type</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={serviceCounts}>
            <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={120} tickFormatter={(name) =>
    name.length > 20 ? name.slice(0, 18) + '…' : name
  } />
            <YAxis />
            <Tooltip />
            <CartesianGrid stroke="#ccc" />
            <Bar dataKey="count" fill="#ffc107" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* <section style={{ marginTop: 48 }}>
        <h2>Complaint Heatmap</h2>
        <Heatmap points={geoPoints} />
      </section> */}
    </div>
    <SiteFooter />
    </>
  );
}
