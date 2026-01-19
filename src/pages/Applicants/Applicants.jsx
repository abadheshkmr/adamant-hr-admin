import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "./Applicants.css";
import { toast } from "react-toastify";
import { AuthContext } from '../../context/AuthContext';

const Applicants = ({ url }) => {
  const { auth } = useContext(AuthContext);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [vacancies, setVacancies] = useState([]);
  const [jobMap, setJobMap] = useState({});

  // Fetch all vacancies
  const fetchVacancies = async () => {
    try {
      const res = await axios.get(`${url}/api/vacancy/list`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.data.success) {
        setVacancies(res.data.data || []);
        const map = {};
        res.data.data.forEach(vacancy => {
          map[vacancy.jobId] = vacancy.jobTitle;
        });
        setJobMap(map);
      } else {
        console.error("Failed to fetch vacancies");
        toast.error("Failed to fetch vacancies");
      }
    } catch (error) {
      console.error("Error fetching vacancies:", error);
      toast.error("Error fetching vacancies");
    }
  };

  // Fetch all applicants
  const fetchApplicants = async (jobIdFilter = "") => {
    try {
      
      const query = jobIdFilter ? `?jobId=${jobIdFilter}` : "";
      const res = await axios.get(`${url}/api/cv/list${query}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.data.success) {
        setApplicants(res.data.data || []);
      } else {
        console.error("Failed to fetch applicants");
        toast.error("failed to fetch applicants")
      }
    } catch (error) {
      console.error("Error fetching applicants:", error);
      toast.error("Error fetching applicants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete applicant
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this applicant?");
    if (!confirmDelete) return;

    try {
      const res = await axios.post(`${url}/api/cv/remove`, { id }, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.data.success) {
        toast.success("Applicant removed successfully ✅");
        fetchApplicants(filter); // Refresh list with current filter
      } else {
        toast.error("Failed to remove applicant ❌");
      }
    } catch (error) {
      console.error("Error deleting applicant:", error);
      toast.error("Error deleting applicant ❌");
    }
  };

  useEffect(() => {
    fetchVacancies();
    fetchApplicants();
  }, []);

  if (loading) return <p className="loading">Loading applicants...</p>;

  return (
    <div className="applicants-page scrollable-div">
      <h2>All Applicants</h2>

      <div className="filter-section">
        <label htmlFor="jobFilter">Filter by Job: </label>
        <select
          id="jobFilter"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setLoading(true);
            fetchApplicants(e.target.value);
          }}
        >
          <option value="">All</option>
          {vacancies.map((vacancy) => (
            <option key={vacancy.jobId} value={vacancy.jobId}>
              {vacancy.jobId} - {vacancy.jobTitle}
            </option>
          ))}
        </select>
      </div>

      {applicants.length === 0 ? (
        <p>No applicants found.</p>
      ) : (
        <div className="applicant-list">
          {applicants.map((applicant) => (
            <div key={applicant._id} className="applicant-card">
              <div className="applicant-info">
                <h3>{applicant.firstName + " " + applicant.lastName}</h3>
                <p><strong>Email:</strong> {applicant.email}</p>
                <p><strong>Address:</strong> {applicant.address || "N/A"}</p>
                <p><strong>Mobile:</strong> {applicant.mobileNo}</p>
                <p><strong>City:</strong> {applicant.city || "N/A"}</p>
                <p><strong>State:</strong> {applicant.state || "N/A"}</p>
                <p><strong>10th Percentage:</strong> {applicant.tenthPercentage !== undefined ? applicant.tenthPercentage + "%" : "N/A"}</p>
                <p><strong>12th Percentage:</strong> {applicant.twelfthPercentage !== undefined ? applicant.twelfthPercentage + "%" : "N/A"}</p>
                <p><strong>Degree:</strong> {applicant.degree || "N/A"}</p>
                <p><strong>Degree CGPA:</strong> {applicant.degreeCgpa !== undefined ? applicant.degreeCgpa : "N/A"}</p>
                <p><strong>Applied for:</strong> {applicant.jobId} - {jobMap[applicant.jobId] || "Unknown"}</p>
              </div>

              <div className="applicant-buttons">
                {applicant.resume?.url ? (
                  <a
                    href={`${url}/${applicant.resume.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-btn"
                  >
                    View Resume
                  </a>
                ) : (
                  <button className="disabled-btn" disabled>
                    No Resume
                  </button>
                )}

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(applicant._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applicants;
