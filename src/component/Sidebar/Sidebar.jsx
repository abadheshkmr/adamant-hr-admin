import React from 'react'
import './Sidebar.css'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='sidebar' >
      <div className="sidebar-options">
        <NavLink to={'/add-service'} className="sidebar-option">
          <img src= '/images/add_icon.png' alt="" />
          <p>Add Service</p>
        </NavLink>
        <NavLink to={'/list-services'} className="sidebar-option">
          <img src='images/list_icon.png' alt="" />
          <p>List Services</p>
        </NavLink>
        <NavLink to={'/add-industry'} className="sidebar-option">
          <img src= '/images/add_icon.png' alt="" />
          <p>Add Industry</p>
        </NavLink>
        <NavLink to={'/list-industries'} className="sidebar-option">
          <img src= '/images/list_icon.png' alt="" />
          <p>List Industries</p>
        </NavLink>
        <NavLink to={'/cvs'} className="sidebar-option">
          <img src='images/career_icon.png' alt="" />
          <p>Applicants</p>
        </NavLink>
        <NavLink to={'/post-vacancy'} className="sidebar-option">
          <img src= '/images/add_icon.png' alt="" />
          <p>Post Vacancy</p>
        </NavLink>
        <NavLink to={'/manage-vacancies'} className="sidebar-option">
          <img src='images/list_icon.png' alt="" />
          <p>Manage Vacancies</p>
        </NavLink>
        <NavLink to={'/manage-clients'} className="sidebar-option">
          <img src='images/list_icon.png' alt="" />
          <p>Manage Clients</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar