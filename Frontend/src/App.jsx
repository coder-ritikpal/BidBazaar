import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom' // Import Routes and Route
import Navbar from './components/Navbar.jsx'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import Home from './components/Home.jsx' // Import Home component
import useTheme from './utils/useTheme.js'; // Corrected path for useTheme

const App = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-linear-to-br from-gray-900 to-purple-900 text-white' : 'bg-white text-gray-900'}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <Routes>
        <Route path="/" element={<Home />} /> {/* Home page route */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  )
}

export default App