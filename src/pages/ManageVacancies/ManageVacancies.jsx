import React, { useState, useEffect, useContext } from "react";
import "./ManageVacancies.css";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from '../../context/AuthContext';

const ManageVacancies = ({ url }) => {
  const { auth } = useContext(AuthContext);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [vacancies, setVacancies] = useState([]);

  const toggleDescription = (id) => {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchlist = async () => {
    try {
      const response = await axios.get(`${url}/api/vacancy/list`, {
        headers: {
          'Authtoken': auth.token
        }
      });
      if (response.data.success) {
        setVacancies(response.data.data);
      } else {
        toast.error("Error fetching vacancies");
      }
    } catch (error) {
      console.error("Axios error:", error);
      toast.error("Network or server error");
    }
  };

  const handleDelete = async(id) => {
    try{
    const response = await axios.post(`${url}/api/vacancy/remove`, { id }, {
      headers: {
        'Authtoken': auth.token
      }
    });
    if(response.data.success) {
        toast.success("Vacancy deleted successfully");
        fetchlist(); // Refresh the list after deletion
      } else {
        toast.error("Error deleting vacancy");
      }
    } catch (error) {
      console.error("Axios error:", error);
      toast.error("Network or server error");
    }
  };

  useEffect(() => {
    fetchlist();
  }, []);

  return (
    <section className="vacancies-section scrollable-div">
      <h2 className="vacancies-title">Manage Vacancies</h2>
      <div className="vacancies-list">
        {vacancies.map((vacancy) => (
          <div className="vacancy-card" key={vacancy._id}>
            <div className="vacancy-content">
              
                <h3>{vacancy.jobTitle}</h3>

                <h4>Job Id : {vacancy.jobId}</h4>

              {/* Description with Read more */}
              <p className="vacancy-description">
                <strong>Description:</strong>{" "}
                {expandedDesc[vacancy._id] || vacancy.description.length <= 100
                  ? vacancy.description
                  : vacancy.description.slice(0, 100) + "..."}
              </p>
              {vacancy.description.length > 100 && (
                <button
                  className="toggle-btn"
                  onClick={() => toggleDescription(vacancy._id)}
                >
                  {expandedDesc[vacancy._id] ? "Read less" : "Read more"}
                </button>
              )}

              {/* Qualification */}
              <p className="vacancy-qualification">
                <strong>Qualification:</strong> {vacancy.qualification}
              </p>

                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(vacancy._id)}
                >
                  Delete
                </button>
                <p className="dateofpost">
                {new Date(vacancy.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              {/* Action Buttons */}
              {/* <div className="vacancy-actions">
              </div> */}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ManageVacancies;
