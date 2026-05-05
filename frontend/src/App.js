import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Consultants from './pages/Consultants';
import Projects from './pages/Projects';
import Allocations from './pages/Allocations';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/consultants" element={<Consultants />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/allocations" element={<Allocations />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
