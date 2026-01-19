import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import "./ManageVacancies.css";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from '../../context/AuthContext';

const ManageVacancies = ({ url }) => {
  const { auth } = useContext(AuthContext);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const toggleDescription = useCallback((id) => {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const fetchlist = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/vacancy/list?page=${currentPage}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (response.data.success) {
        setVacancies(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error("Error fetching vacancies");
      }
    } catch (error) {
      console.error("Axios error:", error);
      toast.error("Network or server error");
    } finally {
      setLoading(false);
    }
  }, [url, auth.token, currentPage]);

  const handleDelete = async(id) => {
    try{
      const response = await axios.post(`${url}/api/vacancy/remove`, { id }, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
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
    if (auth.token) {
      fetchlist();
    }
  }, [fetchlist, auth.token]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Memoize vacancy cards
  const vacancyCards = useMemo(() => {
    return vacancies.map((vacancy) => (
      <div className="vacancy-card" key={vacancy._id}>
        <div className="vacancy-content">
          <h3>{vacancy.jobTitle}</h3>
          <h4>Job Id : {vacancy.jobId}</h4>
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
        </div>
      </div>
    ));
  }, [vacancies, expandedDesc, toggleDescription]);

  if (loading) {
    return <div className="vacancy-loading" style={{ padding: '20px', textAlign: 'center' }}>Loading vacancies...</div>;
  }

  return (
    <section className="vacancies-section scrollable-div">
      <h2 className="vacancies-title">Manage Vacancies</h2>
      <div className="vacancies-list">
        {vacancyCards}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <button
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage(prev => prev - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ padding: '8px 16px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            disabled={currentPage === pagination.totalPages}
            onClick={() => {
              setCurrentPage(prev => prev + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ padding: '8px 16px', cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default ManageVacancies;
