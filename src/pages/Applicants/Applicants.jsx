import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "./Applicants.css";
import { toast } from "react-toastify";
import { AuthContext } from '../../context/AuthContext';

/**
 * Redesigned Applicants Page - Takes advantage of normalized structure
 * 
 * Features:
 * 1. Two views: Candidates (unique) and Applications (all)
 * 2. Candidate profile view showing all their applications
 * 3. Status management (pending, shortlisted, rejected, hired)
 * 4. Better filtering and search
 * 5. Analytics dashboard
 */
const Applicants = ({ url }) => {
  const { auth } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState('applications'); // 'candidates' or 'applications'
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    jobId: "",
    status: "",
    search: "",
    city: "",
    state: "",
    degree: "",
    minCgpa: "",
    appliedDateFrom: "",
    appliedDateTo: "",
    sortBy: "appliedAt",
    sortOrder: "desc"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [vacancies, setVacancies] = useState([]);
  const [jobMap, setJobMap] = useState({});
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalApplications: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0
  });

  // Fetch all vacancies (public endpoint - no token needed)
  const fetchVacancies = async () => {
    try {
      const res = await axios.get(`${url}/api/vacancy/list`);
      if (res.data.success) {
        setVacancies(res.data.data || []);
        const map = {};
        res.data.data.forEach(vacancy => {
          map[vacancy.jobId] = vacancy.jobTitle;
        });
        setJobMap(map);
      }
    } catch (error) {
      console.error("Error fetching vacancies:", error);
      // Don't show error toast for public endpoint failures
    }
  };

  // Fetch all applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      let query = "";
      const params = [];
      
      // Add pagination params
      params.push(`page=${pagination.currentPage}`);
      params.push(`limit=${pagination.itemsPerPage}`);
      
      // Add filter params
      if (filter.jobId) params.push(`jobId=${filter.jobId}`);
      if (filter.status) params.push(`status=${filter.status}`);
      if (filter.city) params.push(`city=${encodeURIComponent(filter.city)}`);
      if (filter.state) params.push(`state=${encodeURIComponent(filter.state)}`);
      if (filter.degree) params.push(`degree=${encodeURIComponent(filter.degree)}`);
      if (filter.minCgpa) params.push(`minCgpa=${filter.minCgpa}`);
      if (filter.appliedDateFrom) params.push(`appliedDateFrom=${filter.appliedDateFrom}`);
      if (filter.appliedDateTo) params.push(`appliedDateTo=${filter.appliedDateTo}`);
      if (filter.sortBy) params.push(`sortBy=${filter.sortBy}`);
      if (filter.sortOrder) params.push(`sortOrder=${filter.sortOrder}`);
      
      if (params.length > 0) query = "?" + params.join("&");
      
      const res = await axios.get(`${url}/api/cv/list${query}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.data.success) {
        let apps = res.data.data || [];
        
        // Apply search filter (client-side for now, can be moved to backend later)
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          apps = apps.filter(app => {
            const candidate = app.candidateId || app;
            const name = `${candidate.firstName || ''} ${candidate.lastName || ''}`.toLowerCase();
            const email = (candidate.email || '').toLowerCase();
            const jobTitle = (jobMap[app.jobId] || '').toLowerCase();
            return name.includes(searchLower) || email.includes(searchLower) || jobTitle.includes(searchLower);
          });
        }
        
        setApplications(apps);
        
        // Update pagination from response
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
        
        updateStats(apps);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Error fetching applications");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all candidates
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      let query = "";
      const params = [];
      
      // Add pagination params
      params.push(`page=${pagination.currentPage}`);
      params.push(`limit=${pagination.itemsPerPage}`);
      
      // Add filter params
      if (filter.city) params.push(`city=${encodeURIComponent(filter.city)}`);
      if (filter.state) params.push(`state=${encodeURIComponent(filter.state)}`);
      if (filter.degree) params.push(`degree=${encodeURIComponent(filter.degree)}`);
      if (filter.minCgpa) params.push(`minCgpa=${filter.minCgpa}`);
      if (filter.sortBy) params.push(`sortBy=${filter.sortBy}`);
      if (filter.sortOrder) params.push(`sortOrder=${filter.sortOrder}`);
      
      if (params.length > 0) query = "?" + params.join("&");
      
      const res = await axios.get(`${url}/api/cv/candidates${query}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.data.success) {
        let cands = res.data.data || [];
        
        // Apply search filter (client-side for now, can be moved to backend later)
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          cands = cands.filter(cand => {
            const name = `${cand.firstName || ''} ${cand.lastName || ''}`.toLowerCase();
            const email = (cand.email || '').toLowerCase();
            return name.includes(searchLower) || email.includes(searchLower);
          });
        }
        
        setCandidates(cands);
        
        // Update pagination from response
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Error fetching candidates");
    } finally {
      setLoading(false);
    }
  };

  // Fetch candidate details with all applications
  const fetchCandidateDetails = async (candidateId) => {
    try {
      const res = await axios.get(`${url}/api/cv/candidate/${candidateId}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.data.success) {
        setSelectedCandidate(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching candidate details:", error);
      toast.error("Error fetching candidate details");
    }
  };

  // Update application status
  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const res = await axios.post(`${url}/api/cv/update-status`, {
        id: applicationId,
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (res.data.success) {
        toast.success(`Application status updated to ${newStatus} ✅`);
        if (viewMode === 'applications') {
          fetchApplications();
        } else if (selectedCandidate) {
          fetchCandidateDetails(selectedCandidate.candidate._id);
        }
      } else {
        toast.error("Failed to update status ❌");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status ❌");
    }
  };

  // Delete application
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this application?");
    if (!confirmDelete) return;

    try {
      const res = await axios.post(`${url}/api/cv/remove`, { id }, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.data.success) {
        toast.success("Application removed successfully ✅");
        if (viewMode === 'applications') {
          fetchApplications();
        } else if (selectedCandidate) {
          fetchCandidateDetails(selectedCandidate.candidate._id);
        }
      } else {
        toast.error("Failed to remove application ❌");
      }
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Error deleting application ❌");
    }
  };

  // Calculate stats
  const updateStats = (apps) => {
    const stats = {
      totalCandidates: candidates.length,
      totalApplications: apps.length,
      pending: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0
    };
    
    apps.forEach(app => {
      const status = app.status || 'pending';
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      }
    });
    
    setStats(stats);
  };

  useEffect(() => {
    fetchVacancies();
  }, []);

  // Clear all filters
  const clearFilters = () => {
    setFilter({
      jobId: "",
      status: "",
      search: "",
      city: "",
      state: "",
      degree: "",
      minCgpa: "",
      appliedDateFrom: "",
      appliedDateTo: "",
      sortBy: viewMode === 'applications' ? "appliedAt" : "createdAt",
      sortOrder: "desc"
    });
  };

  // Reset to page 1 when filters or view mode change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // Update sortBy default when switching views
    if (viewMode === 'applications' && filter.sortBy === 'createdAt') {
      setFilter(prev => ({ ...prev, sortBy: 'appliedAt' }));
    } else if (viewMode === 'candidates' && filter.sortBy === 'appliedAt') {
      setFilter(prev => ({ ...prev, sortBy: 'createdAt' }));
    }
  }, [filter.jobId, filter.status, filter.search, filter.city, filter.state, filter.degree, filter.minCgpa, filter.appliedDateFrom, filter.appliedDateTo, viewMode]);

  // Fetch data when pagination or filters change
  useEffect(() => {
    if (viewMode === 'applications') {
      fetchApplications();
    } else {
      fetchCandidates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, filter.jobId, filter.status, filter.city, filter.state, filter.degree, filter.minCgpa, filter.appliedDateFrom, filter.appliedDateTo, filter.sortBy, filter.sortOrder, pagination.currentPage]);

  if (loading && viewMode === 'applications') {
    return <p className="loading">Loading applications...</p>;
  }

  // Candidate Profile View
  if (selectedCandidate) {
    return (
      <div className="applicants-page scrollable-div">
        <div className="page-header">
          <button 
            className="back-btn"
            onClick={() => setSelectedCandidate(null)}
          >
            ← Back to {viewMode === 'candidates' ? 'Candidates' : 'Applications'}
          </button>
          <h2>Candidate Profile</h2>
        </div>

        <div className="candidate-profile">
          <div className="candidate-info-card">
            <h3>{selectedCandidate.candidate.firstName} {selectedCandidate.candidate.lastName}</h3>
            <div className="info-grid">
              <p><strong>Email:</strong> {selectedCandidate.candidate.email}</p>
              <p><strong>Mobile:</strong> {selectedCandidate.candidate.mobileNo}</p>
              <p><strong>Address:</strong> {selectedCandidate.candidate.address || "N/A"}</p>
              <p><strong>City:</strong> {selectedCandidate.candidate.city || "N/A"}</p>
              <p><strong>State:</strong> {selectedCandidate.candidate.state || "N/A"}</p>
              <p><strong>10th %:</strong> {selectedCandidate.candidate.tenthPercentage || "N/A"}</p>
              <p><strong>12th %:</strong> {selectedCandidate.candidate.twelfthPercentage || "N/A"}</p>
              <p><strong>Degree:</strong> {selectedCandidate.candidate.degree || "N/A"}</p>
              <p><strong>CGPA:</strong> {selectedCandidate.candidate.degreeCgpa || "N/A"}</p>
            </div>
          </div>

          <div className="applications-section">
            <h3>Applications ({selectedCandidate.applications.length})</h3>
            {selectedCandidate.applications.map((app) => (
              <div key={app._id} className="application-card">
                <div className="app-header">
                  <div>
                    <h4>Job #{app.jobId} - {jobMap[app.jobId] || "Unknown"}</h4>
                    <p className="app-date">
                      Applied: {new Date(app.appliedAt || app.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <select
                    value={app.status || 'pending'}
                    onChange={(e) => handleStatusUpdate(app._id, e.target.value)}
                    className={`status-select status-${app.status || 'pending'}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </select>
                </div>
                {app.resume?.url && (
                  <a
                    href={`${url}/${app.resume.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-resume-btn"
                  >
                    View Resume
                  </a>
                )}
                <button
                  className="delete-btn-small"
                  onClick={() => handleDelete(app._id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main View (Candidates or Applications)
  return (
    <div className="applicants-page scrollable-div">
      <div className="page-header">
        <h2>Recruitment Management</h2>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'candidates' ? 'active' : ''}`}
            onClick={() => setViewMode('candidates')}
          >
            Candidates
          </button>
          <button
            className={`toggle-btn ${viewMode === 'applications' ? 'active' : ''}`}
            onClick={() => setViewMode('applications')}
          >
            Applications
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-value">{stats.totalCandidates || candidates.length}</div>
          <div className="stat-label">Total Candidates</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalApplications || applications.length}</div>
          <div className="stat-label">Total Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.shortlisted}</div>
          <div className="stat-label">Shortlisted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.hired}</div>
          <div className="stat-label">Hired</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-header">
          <input
            type="text"
            placeholder="Search by name, email, or job title..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="search-input"
          />
          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '▼' : '▶'} Advanced Filters
          </button>
          <button
            className="clear-filters-btn"
            onClick={clearFilters}
          >
            Clear All
          </button>
        </div>

        {/* Quick Filters (Always Visible) */}
        <div className="quick-filters">
          {viewMode === 'applications' && (
            <>
              <select
                value={filter.jobId}
                onChange={(e) => setFilter({ ...filter, jobId: e.target.value })}
                className="filter-select"
              >
                <option value="">All Jobs</option>
                {vacancies.map((vacancy) => (
                  <option key={vacancy.jobId} value={vacancy.jobId}>
                    {vacancy.jobId} - {vacancy.jobTitle}
                  </option>
                ))}
              </select>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </>
          )}
          <select
            value={filter.sortBy}
            onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
            className="filter-select"
          >
            <option value={viewMode === 'applications' ? "appliedAt" : "createdAt"}>
              Sort by {viewMode === 'applications' ? "Applied Date" : "Created Date"}
            </option>
            {viewMode === 'applications' && (
              <>
                <option value="appliedAt">Applied Date</option>
                <option value="createdAt">Created Date</option>
                <option value="status">Status</option>
              </>
            )}
            {viewMode === 'candidates' && (
              <>
                <option value="createdAt">Created Date</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
              </>
            )}
          </select>
          <select
            value={filter.sortOrder}
            onChange={(e) => setFilter({ ...filter, sortOrder: e.target.value })}
            className="filter-select"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {/* Advanced Filters (Collapsible) */}
        {showFilters && (
          <div className="advanced-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>City</label>
                <input
                  type="text"
                  placeholder="e.g., Noida"
                  value={filter.city}
                  onChange={(e) => setFilter({ ...filter, city: e.target.value })}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>State</label>
                <input
                  type="text"
                  placeholder="e.g., Uttar Pradesh"
                  value={filter.state}
                  onChange={(e) => setFilter({ ...filter, state: e.target.value })}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Degree</label>
                <input
                  type="text"
                  placeholder="e.g., B.Tech, MCA"
                  value={filter.degree}
                  onChange={(e) => setFilter({ ...filter, degree: e.target.value })}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Min CGPA</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  placeholder="e.g., 7.5"
                  value={filter.minCgpa}
                  onChange={(e) => setFilter({ ...filter, minCgpa: e.target.value })}
                  className="filter-input"
                />
              </div>
            </div>
            {viewMode === 'applications' && (
              <div className="filter-row">
                <div className="filter-group">
                  <label>Applied Date From</label>
                  <input
                    type="date"
                    value={filter.appliedDateFrom}
                    onChange={(e) => setFilter({ ...filter, appliedDateFrom: e.target.value })}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <label>Applied Date To</label>
                  <input
                    type="date"
                    value={filter.appliedDateTo}
                    onChange={(e) => setFilter({ ...filter, appliedDateTo: e.target.value })}
                    className="filter-input"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Candidates View */}
      {viewMode === 'candidates' && (
        <>
          <div className="candidates-list">
            {loading ? (
              <p className="loading">Loading candidates...</p>
            ) : candidates.length === 0 ? (
              <p className="no-data">No candidates found.</p>
            ) : (
              candidates.map((candidate) => (
                <div key={candidate._id} className="candidate-card">
                  <div className="candidate-card-header">
                    <h3>{candidate.firstName} {candidate.lastName}</h3>
                    <span className="application-count">{candidate.applicationCount || 0} application(s)</span>
                  </div>
                  <p><strong>Email:</strong> {candidate.email}</p>
                  <p><strong>Mobile:</strong> {candidate.mobileNo}</p>
                  <p><strong>Location:</strong> {candidate.city || "N/A"}, {candidate.state || "N/A"}</p>
                  <button
                    className="view-profile-btn"
                    onClick={() => fetchCandidateDetails(candidate._id)}
                  >
                    View Profile & Applications
                  </button>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.currentPage === 1 || loading}
                onClick={() => {
                  setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalItems} total)
              </span>
              <button
                disabled={pagination.currentPage === pagination.totalPages || loading}
                onClick={() => {
                  setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Applications View */}
      {viewMode === 'applications' && (
        <>
          <div className="applications-list">
            {loading ? (
              <p className="loading">Loading applications...</p>
            ) : applications.length === 0 ? (
              <p className="no-data">No applications found.</p>
            ) : (
              applications.map((application) => {
                const candidate = application.candidateId || application;
                const candidateName = candidate.firstName && candidate.lastName 
                  ? `${candidate.firstName} ${candidate.lastName}` 
                  : candidate.firstName || candidate.lastName || "N/A";
                
                return (
                  <div key={application._id} className="application-card-full">
                    <div className="app-card-header">
                      <div>
                        <h3>{candidateName}</h3>
                        <p className="app-meta">
                          <strong>Job:</strong> #{application.jobId} - {jobMap[application.jobId] || "Unknown"} | 
                          <strong> Email:</strong> {candidate.email} | 
                          <strong> Applied:</strong> {new Date(application.appliedAt || application.createdAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <select
                        value={application.status || 'pending'}
                        onChange={(e) => handleStatusUpdate(application._id, e.target.value)}
                        className={`status-select status-${application.status || 'pending'}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                      </select>
                    </div>
                    <div className="app-card-actions">
                      {application.resume?.url ? (
                        <a
                          href={`${url}/${application.resume.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-resume-btn"
                        >
                          View Resume
                        </a>
                      ) : (
                        <span className="no-resume">No Resume</span>
                      )}
                      <button
                        className="delete-btn-small"
                        onClick={() => handleDelete(application._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.currentPage === 1 || loading}
                onClick={() => {
                  setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalItems} total)
              </span>
              <button
                disabled={pagination.currentPage === pagination.totalPages || loading}
                onClick={() => {
                  setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Applicants;
