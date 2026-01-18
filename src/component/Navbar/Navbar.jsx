import React, { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div className='navbar' >
        <img className='logo' src='images/logo.png' alt="Adamant HR" />
        <div className='navbar-right'>
          <img className='profile' src='images/admin.png' alt="admin👨‍💼" />
          <button className='logout-btn' onClick={logout}>Logout</button>
        </div>
    </div>
  )
}

export default Navbar
