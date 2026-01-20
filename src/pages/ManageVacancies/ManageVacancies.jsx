import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from "react";
import "./ManageVacancies.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AuthContext } from '../../context/AuthContext';

const ManageVacancies = ({ url }) => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  
  // Multi-select state
  const [selectedVacancies, setSelectedVacancies] = useState(new Set());
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    client: '',
    status: '',
    employmentType: '',
    city: '',
    state: ''
  });

  // Fetch industries for filter - only once
  const industriesFetched = useRef(false);
  const clientsFetched = useRef(false);
  
  useEffect(() => {
    if (industriesFetched.current) return;
    let isMounted = true;
    const abortController = new AbortController();

    const fetchIndustries = async () => {
      try {
        const response = await axios.get(`${url}/api/industry/list`, {
          signal: abortController.signal
        });
        if (response.data.success && isMounted) {
          setIndustries(response.data.data);
          industriesFetched.current = true;
        }
      } catch (error) {
        if (axios.isCancel(error) || error.name === 'AbortError') return;
        if (isMounted && error.response?.status !== 429) {
          console.error("Error fetching industries:", error);
        }
      }
    };
    
    fetchIndustries();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [url]);

  // Fetch clients for filter - only once
  useEffect(() => {
    if (clientsFetched.current) return;
    let isMounted = true;
    const abortController = new AbortController();

    const fetchClients = async () => {
      try {
        const response = await axios.get(`${url}/api/client/list`, {
          headers: { 'Authorization': `Bearer ${auth.token}` },
          signal: abortController.signal
        });
        if (response.data.success && isMounted) {
          setClients(response.data.data);
          clientsFetched.current = true;
        }
      } catch (error) {
        if (axios.isCancel(error) || error.name === 'AbortError') return;
        if (isMounted && error.response?.status !== 429) {
          console.error("Error fetching clients:", error);
        }
      }
    };
    
    fetchClients();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [url, auth.token]);

  // Build query string from filters
  const buildQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', '20');
    
    if (filters.search) params.append('search', filters.search);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.client) params.append('client', filters.client);
    if (filters.status) params.append('status', filters.status);
    if (filters.employmentType) params.append('employmentType', filters.employmentType);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    
    return params.toString();
  }, [currentPage, filters]);

  const fetchlist = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/vacancy/list?${buildQueryString}`, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (response.data.success) {
        setVacancies(response.data.data);
        setPagination(response.data.pagination);
        setSelectedVacancies(new Set());
      } else {
        toast.error("Error fetching vacancies");
      }
    } catch (error) {
      console.error("Error fetching vacancies:", error);
      toast.error("Error fetching vacancies");
    } finally {
      setLoading(false);
    }
  }, [url, buildQueryString, auth.token]);

  useEffect(() => {
    fetchlist();
  }, [fetchlist]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.industry, filters.client, filters.status, filters.employmentType, filters.city, filters.state]);

  const toggleSelect = (id) => {
    setSelectedVacancies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedVacancies.size === vacancies.length) {
      setSelectedVacancies(new Set());
    } else {
      setSelectedVacancies(new Set(vacancies.map(v => v._id)));
    }
  };

  const clearSelection = () => {
    setSelectedVacancies(new Set());
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vacancy?")) return;
    try {
      const response = await axios.post(`${url}/api/vacancy/remove`, { id }, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (response.data.success) {
        toast.success("Vacancy deleted successfully ✅");
        setVacancies(prev => prev.filter(v => v._id !== id));
      } else {
        toast.error("Error deleting vacancy");
      }
    } catch (error) {
      console.error("Error deleting vacancy:", error);
      toast.error("Error deleting vacancy");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedVacancies.size} vacancy/vacancies?`)) return;
    setBulkLoading(true);
    const selectedArray = Array.from(selectedVacancies);
    const deletedIds = new Set(selectedArray);
    
    setVacancies(prev => prev.filter(v => !deletedIds.has(v._id)));
    clearSelection();

    try {
      const response = await axios.post(`${url}/api/vacancy/bulk-remove`, 
        { ids: selectedArray },
        { headers: { 'Authorization': `Bearer ${auth.token}` } }
      );
      
      if (response.data.success) {
        toast.success(`Successfully deleted ${response.data.deletedCount} vacancy/vacancies`);
      } else {
        toast.error(response.data.message || "Error deleting vacancies");
        fetchlist();
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Network or server error");
      fetchlist();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    setBulkLoading(true);
    const selectedArray = Array.from(selectedVacancies);
    const selectedSet = new Set(selectedArray);
    
    setVacancies(prev => prev.map(v => 
      selectedSet.has(v._id) ? { ...v, status: newStatus } : v
    ));
    clearSelection();

    try {
      const response = await axios.put(`${url}/api/vacancy/bulk-update-status`, 
        { ids: selectedArray, status: newStatus },
        { headers: { 'Authorization': `Bearer ${auth.token}` } }
      );
      
      if (response.data.success) {
        toast.success(`Successfully updated ${response.data.updatedCount} vacancy/vacancies to ${newStatus}`);
      } else {
        toast.error(response.data.message || "Error updating vacancies");
        fetchlist();
      }
    } catch (error) {
      console.error("Bulk status update error:", error);
      toast.error("Network or server error");
      fetchlist();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      industry: '',
      client: '',
      status: '',
      employmentType: '',
      city: '',
      state: ''
    });
  };

  const toggleClientVisibility = async (vacancyId, currentValue) => {
    const newValue = !currentValue;
    
    // Optimistically update the UI immediately
    setVacancies(prev => prev.map(vacancy => 
      vacancy._id === vacancyId 
        ? { ...vacancy, showClientToCandidate: newValue }
        : vacancy
    ));
    
    try {
      const response = await axios.put(`${url}/api/vacancy/update`, {
        id: vacancyId,
        showClientToCandidate: newValue
      }, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      
      if (response.data.success) {
        toast.success(`Client visibility ${newValue ? 'enabled' : 'disabled'} ✅`);
        // Update with server response to ensure sync
        if (response.data.data) {
          setVacancies(prev => prev.map(vacancy => 
            vacancy._id === vacancyId 
              ? { ...vacancy, showClientToCandidate: response.data.data.showClientToCandidate }
              : vacancy
          ));
        }
      } else {
        // Revert on error
        setVacancies(prev => prev.map(vacancy => 
          vacancy._id === vacancyId 
            ? { ...vacancy, showClientToCandidate: currentValue }
            : vacancy
        ));
        toast.error("Failed to update client visibility");
      }
    } catch (error) {
      console.error("Error updating client visibility:", error);
      // Revert on error
      setVacancies(prev => prev.map(vacancy => 
        vacancy._id === vacancyId 
          ? { ...vacancy, showClientToCandidate: currentValue }
          : vacancy
      ));
      toast.error("Error updating client visibility");
    }
  };

  const allSelected = vacancies.length > 0 && selectedVacancies.size === vacancies.length;
  const someSelected = selectedVacancies.size > 0 && selectedVacancies.size < vacancies.length;

  // Card View Component
  const CardView = ({ vacancy }) => {
    const isSelected = selectedVacancies.has(vacancy._id);
    return (
      <div className={`vacancy-card-modern ${isSelected ? 'selected' : ''}`}>
        <div className="card-header">
          <div className="card-header-left">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(vacancy._id)}
              className="card-checkbox"
            />
            <div className="card-title-section">
              <h3 className="card-title">{vacancy.jobTitle}</h3>
              <span className="card-job-id">#{vacancy.jobId}</span>
            </div>
          </div>
          <div className="card-actions">
            <button
              className="icon-btn edit-btn"
              onClick={() => navigate(`/edit-vacancy/${vacancy._id}`)}
              title="Edit Vacancy"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.50023C18.8978 2.10243 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10243 21.5 2.50023C21.8978 2.89804 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.10243 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="icon-btn delete-btn"
              onClick={() => handleDelete(vacancy._id)}
              disabled={bulkLoading}
              title="Delete Vacancy"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="card-body">
          <div className="card-badges">
            {vacancy.industry && (
              <span className="badge industry-badge">{vacancy.industry.name}</span>
            )}
            {vacancy.client && (
              <span className={`badge client-badge ${vacancy.showClientToCandidate ? 'visible' : 'hidden'}`}>
                🏢 {vacancy.client.name}
                {vacancy.showClientToCandidate && <span className="visibility-indicator">👁️</span>}
              </span>
            )}
            <span className={`badge status-badge status-${vacancy.status}`}>
              {vacancy.status}
            </span>
          </div>

          <div className="card-meta">
            {vacancy.location?.city && (
              <span className="meta-item">📍 {vacancy.location.city}{vacancy.location.state ? `, ${vacancy.location.state}` : ''}</span>
            )}
            {vacancy.employmentType && <span className="meta-item">💼 {vacancy.employmentType}</span>}
            {vacancy.experienceLevel && <span className="meta-item">⭐ {vacancy.experienceLevel}</span>}
          </div>

          {vacancy.salary && (vacancy.salary.min || vacancy.salary.max) && (
            <div className="card-salary">
              💰 {vacancy.salary.min && vacancy.salary.max 
                ? `₹${vacancy.salary.min.toLocaleString()} - ₹${vacancy.salary.max.toLocaleString()}`
                : vacancy.salary.min 
                  ? `₹${vacancy.salary.min.toLocaleString()}+`
                  : `Up to ₹${vacancy.salary.max.toLocaleString()}`}
            </div>
          )}

          <p className="card-description">
            {vacancy.description.length > 120 ? vacancy.description.substring(0, 120) + '...' : vacancy.description}
          </p>

          {vacancy.skills && vacancy.skills.length > 0 && (
            <div className="card-skills">
              {vacancy.skills.slice(0, 4).map((skill, idx) => (
                <span key={idx} className="skill-tag">{skill}</span>
              ))}
              {vacancy.skills.length > 4 && <span className="skill-more">+{vacancy.skills.length - 4}</span>}
            </div>
          )}

          {vacancy.client && (
            <div className="client-visibility-toggle">
              <label className="client-toggle-label">
                <input
                  type="checkbox"
                  checked={vacancy.showClientToCandidate}
                  onChange={() => toggleClientVisibility(vacancy._id, vacancy.showClientToCandidate)}
                  className="client-toggle-checkbox"
                />
                <span className="client-toggle-text">
                  <span className="toggle-icon">{vacancy.showClientToCandidate ? '👁️' : '🚫'}</span>
                  {vacancy.showClientToCandidate ? 'Visible to Candidates' : 'Hidden from Candidates'}
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="card-footer">
          <span className="card-date">
            {new Date(vacancy.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    );
  };

  // List View Component
  const ListView = ({ vacancy }) => {
    const isSelected = selectedVacancies.has(vacancy._id);
    return (
      <div className={`vacancy-list-item ${isSelected ? 'selected' : ''}`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelect(vacancy._id)}
          className="list-checkbox"
        />
        <div className="list-content">
          <div className="list-header">
            <div className="list-title-section">
              <h4 className="list-title">{vacancy.jobTitle}</h4>
              <span className="list-job-id">#{vacancy.jobId}</span>
            </div>
            <div className="list-badges">
              {vacancy.industry && <span className="badge-small">{vacancy.industry.name}</span>}
              {vacancy.client && <span className="badge-small client">🏢 {vacancy.client.name}</span>}
              <span className={`badge-small status-${vacancy.status}`}>{vacancy.status}</span>
            </div>
          </div>
          <div className="list-meta">
            {vacancy.location?.city && <span>📍 {vacancy.location.city}</span>}
            {vacancy.employmentType && <span>💼 {vacancy.employmentType}</span>}
            {vacancy.experienceLevel && <span>⭐ {vacancy.experienceLevel}</span>}
            {vacancy.salary?.min && <span>💰 ₹{vacancy.salary.min.toLocaleString()}+</span>}
          </div>
          <p className="list-description">
            {vacancy.description.length > 100 ? vacancy.description.substring(0, 100) + '...' : vacancy.description}
          </p>
          {vacancy.client && (
            <div className="list-client-toggle">
              <label className="client-toggle-label-small">
                <input
                  type="checkbox"
                  checked={vacancy.showClientToCandidate}
                  onChange={() => toggleClientVisibility(vacancy._id, vacancy.showClientToCandidate)}
                  className="client-toggle-checkbox-small"
                />
                <span className="client-toggle-text-small">
                  {vacancy.showClientToCandidate ? '👁️ Visible to Candidates' : '🚫 Hidden from Candidates'}
                </span>
              </label>
            </div>
          )}
        </div>
        <div className="list-actions">
          <button
            className="icon-btn-small edit-btn"
            onClick={() => navigate(`/edit-vacancy/${vacancy._id}`)}
            title="Edit Vacancy"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.50023C18.8978 2.10243 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10243 21.5 2.50023C21.8978 2.89804 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.10243 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="icon-btn-small delete-btn"
            onClick={() => handleDelete(vacancy._id)}
            disabled={bulkLoading}
            title="Delete Vacancy"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="vacancy-loading">Loading vacancies...</div>;
  }

  return (
    <section className="vacancies-section-modern scrollable-div">
      <div className="page-header-modern">
        <div>
          <h2 className="page-title-modern">Manage Vacancies</h2>
          {pagination && (
            <p className="page-subtitle-modern">
              {pagination.totalItems} {pagination.totalItems === 1 ? 'vacancy' : 'vacancies'}
            </p>
          )}
        </div>
        <div className="view-toggle-modern">
          <button
            className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => setViewMode('card')}
            title="Card View"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor"/>
              <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/>
              <rect x="2" y="11" width="12" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Filters - Collapsible */}
      <div className="filters-section-modern">
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Search jobs..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="filter-input-modern"
          />
          <select
            value={filters.industry}
            onChange={(e) => handleFilterChange('industry', e.target.value)}
            className="filter-select-modern"
          >
            <option value="">All Industries</option>
            {industries.map(industry => (
              <option key={industry._id} value={industry._id}>{industry.name}</option>
            ))}
          </select>
          <select
            value={filters.client}
            onChange={(e) => handleFilterChange('client', e.target.value)}
            className="filter-select-modern"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client._id} value={client._id}>{client.name}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select-modern"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
          <button onClick={clearFilters} className="clear-filters-btn-modern">Clear</button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedVacancies.size > 0 && (
        <div className="bulk-actions-modern">
          <span className="bulk-count">{selectedVacancies.size} selected</span>
          <div className="bulk-buttons">
            <button onClick={clearSelection} className="bulk-btn-secondary">Clear</button>
            <button onClick={handleBulkDelete} disabled={bulkLoading} className="bulk-btn-danger">
              Delete
            </button>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusUpdate(e.target.value);
                  e.target.value = '';
                }
              }}
              disabled={bulkLoading}
              className="bulk-select"
            >
              <option value="">Update Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      )}

      {/* Select All */}
      {vacancies.length > 0 && (
        <div className="select-all-modern">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="select-all-checkbox"
            />
            <span>{allSelected ? 'Deselect All' : someSelected ? `Selected ${selectedVacancies.size} of ${vacancies.length}` : 'Select All'}</span>
          </label>
        </div>
      )}

      {/* Vacancies Display */}
      <div className={`vacancies-container ${viewMode === 'list' ? 'list-view' : 'card-view'}`}>
        {vacancies.length === 0 ? (
          <div className="empty-state">No vacancies found matching your filters.</div>
        ) : viewMode === 'card' ? (
          vacancies.map(vacancy => <CardView key={vacancy._id} vacancy={vacancy} />)
        ) : (
          vacancies.map(vacancy => <ListView key={vacancy._id} vacancy={vacancy} />)
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination-modern">
          <button
            disabled={currentPage === 1 || bulkLoading}
            onClick={() => {
              setCurrentPage(prev => prev - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            disabled={currentPage === pagination.totalPages || bulkLoading}
            onClick={() => {
              setCurrentPage(prev => prev + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default ManageVacancies;
