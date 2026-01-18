import React, { useState, useEffect } from "react";
import "./ListServices.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ListServices = ({ url }) => {
  const [expandedDesc, setExpandedDesc] = useState({});
  const [services, setServices] = useState([]);

  const toggleDescription = (id) => {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchlist = async () => {
    try {
      const response = await axios.get(`${url}/api/service/list`);
      if (response.data.success) {
        setServices(response.data.data);
      } else {
        toast.error("Error fetching services");
      }
    } catch (error) {
      console.error("Axios error:", error);
      toast.error("Network or server error");
    }
  };

  const handleView = (id) => {
    // navigate to edit page
    navigate(`/edit-service/${id}`);
  };

  const handleDelete = async(id) => {
    try{
    const response = await axios.post(`${url}/api/service/remove`, { id });
    if(response.data.success) {
        toast.success("service deleted successfully");
        fetchlist(); // Refresh the list after deletion
      } else {
        toast.error("Error deleting service");
      }
    } catch (error) {
      console.error("Axios error:", error);
      toast.error("Network or server error");
    }
  };

  useEffect(() => {
    fetchlist();
  }, []);

    const navigate = useNavigate();

  return (
    <section className="services-section scrollable-div">
      <h2 className="services-title">Services We Provide</h2>
      <div className="services-list">
        {services.map((service) => (
          <div className="service-card" key={service._id}>
            <div className="service-image">
              <img src={`${url}/images/${service.icon}`} alt={service.title} />
            </div>
            <div className="service-content">
              <h3>{service.title}</h3>

              {/* Description with Read more */}
              <p className="service-description">
                {expandedDesc[service._id] || service.description.length <= 100
                  ? service.description
                  : service.description.slice(0, 100) + "..."}
              </p>
              {service.description.length > 100 && (
                <button
                  className="toggle-btn"
                  onClick={() => toggleDescription(service._id)}
                >
                  {expandedDesc[service._id] ? "Read less" : "Read more"}
                </button>
              )}

              {/* Action Buttons */}
              <div className="service-actions">
                <button
                  className="action-btn view-btn"
                  onClick={() => handleView(service._id)}
                >
                  Edit
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(service._id)}
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

export default ListServices;
