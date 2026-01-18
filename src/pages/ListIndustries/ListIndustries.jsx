import React, { useState , useEffect } from "react";
import "./ListIndustries.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ListIndustries = ({url}) => {
  const [expandedDesc, setExpandedDesc] = useState({});
  const [expandedRoles, setExpandedRoles] = useState({});
  const [industries,setIndustries] = useState([]);

  const toggleDescription = (id) => {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRoles = (id) => {
    setExpandedRoles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchlist = async () =>{
    try {
      const response = await axios.get(`${url}/api/industry/list`);
      if(response.data.success) {
        setIndustries(response.data.data);
      } else {
        toast.error("Error fetching industries");
      }
    } catch (error) {
      console.error("Axios error:", error);
      toast.error("Network or server error");
    }
  }

  const handleView = (id) => {
    navigate(`/edit-industry/${id}`);
  };

  const handleDelete = async(id) => {
    try{
    const response = await axios.post(`${url}/api/industry/remove`, { id });
    if(response.data.success) {
        toast.success("Industry deleted successfully");
        fetchlist(); // Refresh the list after deletion
      } else {
        toast.error("Error deleting industry");
      }
    } catch (error) {
      console.error("Axios error:", error);
      toast.error("Network or server error");
    }
  };

  useEffect(()=>{
    fetchlist();
  },[])

  const navigate = useNavigate();

  return (
    <section className="industries-section scrollable-div">
      <h2 className="industries-title">Industries We Work With</h2>
      <div className="industries-list">
        {industries.map((industry) => (
          <div className="industry-card" key={industry._id}>
            <div className="industry-image">
              <img src={`${url}/images/${industry.image}`} alt={industry.name} />
            </div>
            <div className="industry-content">
              <h3>{industry.name}</h3>

              {/* Description with Read more */}
              <p className="industry-description">
                {expandedDesc[industry._id] || industry.description.length <= 100
                  ? industry.description
                  : industry.description.slice(0, 100) + "..."}
              </p>
              {industry.description.length > 100 && (
                <button
                  className="toggle-btn"
                  onClick={() => toggleDescription(industry._id)}
                >
                  {expandedDesc[industry._id] ? "Read less" : "Read more"}
                </button>
              )}

              {/* Job Roles with Show more */}
              <div className="industry-roles">
                <h4>Job Roles:</h4>
                <ul>
                  {(expandedRoles[industry._id]
                    ? industry.list
                    : industry.list.slice(0, 3)
                  ).map((role, index) => (
                    <li key={index}>{role}</li>
                  ))}
                </ul>
                {industry.list.length > 3 && (
                  <button
                    className="toggle-btn"
                    onClick={() => toggleRoles(industry._id)}
                  >
                    {expandedRoles[industry._id] ? "Show less" : "Show more"}
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="industry-actions">
                <button
                  className="action-btn view-btn"
                  onClick={() => handleView(industry._id)}
                >
                  Edit
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(industry._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ListIndustries;
