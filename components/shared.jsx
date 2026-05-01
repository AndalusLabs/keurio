// Shared helpers, icons, and data for Keurio dashboards

const KeurioLogo = ({ style = {} }) => (
  <div style={{ display: 'flex', alignItems: 'center', ...style }}>
    <img
      src="/keurio_logo_new.jpg"
      alt="Keurio"
      style={{ height: 32, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
    />
  </div>
);

// Tiny line icons
const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.7 }) => {
  const paths = {
    dashboard: 'M3 12L12 4l9 8v8a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-8z',
    clipboard: 'M9 4h6a1 1 0 011 1v1h3a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h3V5a1 1 0 011-1zM9 11h6M9 15h4',
    template: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
    users: 'M9 11a4 4 0 100-8 4 4 0 000 8zM3 21v-1a6 6 0 0112 0v1M17 11a3 3 0 100-6M21 21v-1a5 5 0 00-4-4.9',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
    bell: 'M18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2zM9 20a3 3 0 006 0',
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
    plus: 'M12 5v14M5 12h14',
    filter: 'M4 5h16M7 12h10M10 19h4',
    calendar: 'M8 3v4M16 3v4M3 9h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
    chevron: 'M6 9l6 6 6-6',
    chevronRight: 'M9 6l6 6-6 6',
    arrowUp: 'M12 19V5M5 12l7-7 7 7',
    arrowDown: 'M12 5v14M19 12l-7 7-7-7',
    check: 'M5 12l5 5L20 7',
    x: 'M6 6l12 12M6 18L18 6',
    dots: 'M5 12h.01M12 12h.01M19 12h.01',
    download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
    eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
    play: 'M7 4l14 8-14 8V4z',
    pdf: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M9 15h1M12 15h1M9 18h6',
    alert: 'M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01',
    trending: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
    clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
    location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
    building: 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 13v.01M9 17v.01',
    sparkle: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z',
    flag: 'M4 21V4m0 0h13l-2 4 2 4H4',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={paths[name]} />
    </svg>
  );
};

// Sample data
const INSPECTIONS = [
  { id: 'INS-2841', name: 'Quarterly Fire Safety Audit', client: 'Meridian Retail Group', location: 'Store #214 · Rotterdam', template: 'Fire Safety v4.2', status: 'In progress', progress: 68, date: 'Today · 2:14 PM', assignee: 'L. van Dijk', priority: 'high' },
  { id: 'INS-2840', name: 'HVAC Monthly Check', client: 'Northwind Logistics', location: 'DC-02 · Utrecht', template: 'HVAC Standard', status: 'Completed', progress: 100, date: 'Today · 11:02 AM', assignee: 'M. Okafor', priority: 'normal', result: 'Pass' },
  { id: 'INS-2839', name: 'Food Safety — Cold Storage', client: 'Bakker & Zoon', location: 'Plant A · Eindhoven', template: 'HACCP Cold', status: 'Completed', progress: 100, date: 'Today · 9:48 AM', assignee: 'S. Prasad', priority: 'normal', result: 'Fail' },
  { id: 'INS-2838', name: 'Electrical Panel Inspection', client: 'Harbor Works BV', location: 'Warehouse 7 · Amsterdam', template: 'NEN 3140', status: 'In progress', progress: 42, date: 'Today · 8:30 AM', assignee: 'J. Hartman', priority: 'high' },
  { id: 'INS-2837', name: 'Elevator Maintenance — B Tower', client: 'Cascade Property', location: 'HQ · Den Haag', template: 'Lift & Elevator', status: 'Draft', progress: 0, date: 'Yesterday', assignee: 'E. Rossi', priority: 'normal' },
  { id: 'INS-2836', name: 'Pre-opening Kitchen Check', client: 'Noord Hospitality', location: 'Café Central · Amsterdam', template: 'Kitchen Open', status: 'Completed', progress: 100, date: 'Yesterday', assignee: 'M. Okafor', priority: 'normal', result: 'Pass' },
  { id: 'INS-2835', name: 'Forklift Operator Safety', client: 'Northwind Logistics', location: 'DC-05 · Tilburg', template: 'Forklift Daily', status: 'Completed', progress: 100, date: 'Yesterday', assignee: 'L. van Dijk', priority: 'normal', result: 'Pass' },
  { id: 'INS-2834', name: 'Site Handover — Phase 2', client: 'BuildRight NV', location: 'Tower East · Rotterdam', template: 'Construction Handover', status: 'Draft', progress: 0, date: '2 days ago', assignee: 'J. Hartman', priority: 'normal' },
];

// Chart data: 14 days, current vs previous period
const CHART_DATA = [
  { label: 'M', prev: 42, curr: 38 },
  { label: 'T', prev: 51, curr: 56 },
  { label: 'W', prev: 48, curr: 62 },
  { label: 'T', prev: 55, curr: 71 },
  { label: 'F', prev: 63, curr: 74 },
  { label: 'S', prev: 22, curr: 29 },
  { label: 'S', prev: 18, curr: 21 },
  { label: 'M', prev: 47, curr: 58 },
  { label: 'T', prev: 54, curr: 66 },
  { label: 'W', prev: 59, curr: 78 },
  { label: 'T', prev: 61, curr: 84 },
  { label: 'F', prev: 68, curr: 91 },
  { label: 'S', prev: 24, curr: 33 },
  { label: 'S', prev: 19, curr: 26 },
];

Object.assign(window, { KeurioLogo, Icon, INSPECTIONS, CHART_DATA });
