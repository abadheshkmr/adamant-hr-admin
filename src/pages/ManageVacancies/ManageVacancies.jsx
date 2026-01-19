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
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  // Multi-select state
  const [selectedVacancies, setSelectedVacancies] = useState(new Set());
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    status: '',
    employmentType: '',
    city: '',
    state: ''
  });

  // Fetch industries for filter - only once
  const industriesFetched = useRef(false);
  
  useEffect(() => {
    // Skip if already fetched
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
        if (axios.isCancel(error) || error.name === 'AbortError') {
          return;
        }
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

  // Build query string from filters
  const buildQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', '20');
    
    if (filters.search) params.append('search', filters.search);
    if (filters.industry) params.append('industry', filters.industry);
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
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (response.data.success) {
        setVacancies(response.data.data);
        setPagination(response.data.pagination);
        // Clear selection when data changes
        setSelectedVacancies(new Set());
      } else {
        toast.error("Error fetching vacancies");
      }
    } catch (error) {
      console.error("Axios error:", error);
      toast.error("Network or server error");
    } finally {
      setLoading(false);
    }
  }, [url, auth.token, buildQueryString]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.industry, filters.status, filters.employmentType, filters.city, filters.state]);

  useEffect(() => {
    if (auth.token) {
      fetchlist();
    }
  }, [fetchlist, auth.token]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Selection handlers
  const toggleSelect = useCallback((id) => {
    setSelectedVacancies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedVacancies.size === vacancies.length) {
      setSelectedVacancies(new Set());
    } else {
      setSelectedVacancies(new Set(vacancies.map(v => v._id)));
    }
  }, [selectedVacancies.size, vacancies]);

  const clearSelection = useCallback(() => {
    setSelectedVacancies(new Set());
  }, []);

  // Single delete with confirmation
  const handleDelete = useCallback(async(id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this vacancy? This action cannot be undone.");
    if (!confirmDelete) return;

    // Check if this is the last item on the last page before optimistic update
    const isLastItemOnLastPage = pagination && 
                                  currentPage === pagination.totalPages && 
                                  vacancies.length === 1;

    // Optimistic update
    setVacancies(prev => prev.filter(v => v._id !== id));
    
    try {
      const response = await axios.post(`${url}/api/vacancy/remove`, { id }, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if(response.data.success) {
        toast.success("Vacancy deleted successfully");
        // Only refetch if we're on last page and it was the last item
        if (isLastItemOnLastPage) {
          fetchlist();
        }
      } else {
        toast.error("Error deleting vacancy");
        fetchlist(); // Revert on error
      }
    } catch (error) {
      console.error("Axios error:", error);
      toast.error("Network or server error");
      fetchlist(); // Revert on error
    }
  }, [url, auth.token, pagination, currentPage, vacancies.length, fetchlist]);

  // Bulk delete
  const handleBulkDelete = async () => {
    const selectedArray = Array.from(selectedVacancies);
    if (selectedArray.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedArray.length} vacancy/vacancies? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setBulkLoading(true);
    
    // Optimistic update
    const deletedIds = new Set(selectedArray);
    setVacancies(prev => prev.filter(v => !deletedIds.has(v._id)));
    clearSelection();

    try {
      const response = await axios.post(`${url}/api/vacancy/bulk-remove`, 
        { ids: selectedArray },
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success(`Successfully deleted ${response.data.deletedCount} vacancy/vacancies`);
        // Refetch to update pagination
        fetchlist();
      } else {
        toast.error(response.data.message || "Error deleting vacancies");
        fetchlist(); // Revert on error
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Network or server error");
      fetchlist(); // Revert on error
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus) => {
    const selectedArray = Array.from(selectedVacancies);
    if (selectedArray.length === 0) return;

    setBulkLoading(true);
    
    // Optimistic update
    const selectedSet = new Set(selectedArray);
    setVacancies(prev => prev.map(v => 
      selectedSet.has(v._id) ? { ...v, status: newStatus } : v
    ));
    clearSelection();

    try {
      const response = await axios.put(`${url}/api/vacancy/bulk-update-status`, 
        { ids: selectedArray, status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success(`Successfully updated ${response.data.updatedCount} vacancy/vacancies to ${newStatus}`);
      } else {
        toast.error(response.data.message || "Error updating vacancies");
        fetchlist(); // Revert on error
      }
    } catch (error) {
      console.error("Bulk status update error:", error);
      toast.error("Network or server error");
      fetchlist(); // Revert on error
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
      status: '',
      employmentType: '',
      city: '',
      state: ''
    });
  };

  // Check if all visible items are selected
  const allSelected = vacancies.length > 0 && selectedVacancies.size === vacancies.length;
  const someSelected = selectedVacancies.size > 0 && selectedVacancies.size < vacancies.length;

  // Memoize vacancy cards
  const vacancyCards = useMemo(() => {
    return vacancies.map((vacancy) => {
      const isSelected = selectedVacancies.has(vacancy._id);
      return (
        <div 
          className={`vacancy-card ${isSelected ? 'selected' : ''}`} 
          key={vacancy._id}
          style={{
            border: isSelected ? '2px solid #007bff' : '1px solid #ddd',
            background: isSelected ? '#f0f8ff' : 'white'
          }}
        >
          <div className="vacancy-content">
            {/* Checkbox */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(vacancy._id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Select</span>
              </label>
            </div>

            {/* Industry Badge - Text only, no image */}
            {vacancy.industry && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '10px',
                padding: '6px 12px',
                background: '#f0f0f0',
                borderRadius: '4px',
                width: 'fit-content'
              }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                  {vacancy.industry.name}
                </span>
              </div>
            )}

            <h3>{vacancy.jobTitle}</h3>
            <p><strong>Job ID:</strong> {vacancy.jobId}</p>

            {/* Location and Employment Details - Matching frontend style */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '10px', fontSize: '14px' }}>
              {vacancy.location && (vacancy.location.city || vacancy.location.state) && (
                <span>
                  📍 {vacancy.location.city}{vacancy.location.city && vacancy.location.state ? ', ' : ''}{vacancy.location.state}
                  {vacancy.location.isRemote && <span style={{ color: '#28a745', marginLeft: '4px' }}>• Remote</span>}
                </span>
              )}
              {vacancy.employmentType && (
                <span>💼 {vacancy.employmentType}</span>
              )}
              {vacancy.experienceLevel && (
                <span>⭐ {vacancy.experienceLevel}</span>
              )}
              {vacancy.status && (
                <span>
                  📊 Status: 
                  <span style={{ 
                    marginLeft: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: vacancy.status === 'active' ? '#d4edda' : vacancy.status === 'closed' ? '#f8d7da' : '#fff3cd',
                    color: vacancy.status === 'active' ? '#155724' : vacancy.status === 'closed' ? '#721c24' : '#856404',
                    fontSize: '12px'
                  }}>
                    {vacancy.status.charAt(0).toUpperCase() + vacancy.status.slice(1)}
                  </span>
                </span>
              )}
            </div>

            {/* Skills - Matching frontend style (show first 5, then +X more) */}
            {vacancy.skills && vacancy.skills.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Skills:</strong> 
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {vacancy.skills.slice(0, 5).map((skill, idx) => (
                    <span key={idx} style={{ 
                      background: '#e9ecef', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {skill}
                    </span>
                  ))}
                  {vacancy.skills.length > 5 && <span style={{ fontSize: '12px', color: '#666' }}>+{vacancy.skills.length - 5} more</span>}
                </div>
              </div>
            )}

            {/* Salary - Matching frontend style (green, bold, with emoji) */}
            {vacancy.salary && (vacancy.salary.min || vacancy.salary.max) && (
              <p style={{ marginBottom: '10px', color: '#28a745', fontWeight: 'bold' }}>
                💰 Salary: 
                {vacancy.salary.min && vacancy.salary.max 
                  ? ` ₹${vacancy.salary.min.toLocaleString()} - ₹${vacancy.salary.max.toLocaleString()}`
                  : vacancy.salary.min 
                    ? ` ₹${vacancy.salary.min.toLocaleString()}+`
                    : ` Up to ₹${vacancy.salary.max.toLocaleString()}`
                }
                {vacancy.salary.isNegotiable && <span style={{ fontSize: '12px', marginLeft: '4px' }}>(Negotiable)</span>}
              </p>
            )}

            {/* Description - Matching frontend style (truncated to 150 chars) */}
            <p style={{ marginBottom: '10px' }}>
              <strong>Description:</strong> {vacancy.description.length > 150 ? vacancy.description.substring(0, 150) + '...' : vacancy.description}
            </p>
            
            {/* Qualification - Matching frontend style (truncated to 100 chars) */}
            <p style={{ marginBottom: '10px' }}>
              <strong>Qualification:</strong> {vacancy.qualification.length > 100 ? vacancy.qualification.substring(0, 100) + '...' : vacancy.qualification}
            </p>
            
            {/* Additional Admin-only Details */}
            {vacancy.applicationDeadline && (
              <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                📅 <strong>Deadline:</strong> {new Date(vacancy.applicationDeadline).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
            {vacancy.numberOfOpenings && vacancy.numberOfOpenings > 1 && (
              <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                👥 <strong>Openings:</strong> {vacancy.numberOfOpenings}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                className="action-btn"
                onClick={() => navigate(`/edit-vacancy/${vacancy._id}`)}
                style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Edit
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => handleDelete(vacancy._id)}
                disabled={bulkLoading}
              >
                Delete
              </button>
            </div>
            <p className="dateofpost">
              Posted: {new Date(vacancy.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      );
    });
  }, [vacancies, selectedVacancies, toggleSelect, navigate, handleDelete, bulkLoading]);

  if (loading) {
    return <div className="vacancy-loading" style={{ padding: '20px', textAlign: 'center' }}>Loading vacancies...</div>;
  }

  return (
    <section className="vacancies-section scrollable-div">
      <h2 className="vacancies-title">Manage Vacancies</h2>

      {/* Filter Section */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Filters</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          {/* Search */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Search</label>
            <input
              type="text"
              placeholder="Job title or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
            />
          </div>

          {/* Industry */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Industry</label>
            <select
              value={filters.industry}
              onChange={(e) => handleFilterChange('industry', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry._id} value={industry._id}>{industry.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Employment Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Employment Type</label>
            <select
              value={filters.employmentType}
              onChange={(e) => handleFilterChange('employmentType', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
            >
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          {/* City */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>City</label>
            <input
              type="text"
              placeholder="e.g., Noida"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
            />
          </div>

          {/* State */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>State</label>
            <input
              type="text"
              placeholder="e.g., Uttar Pradesh"
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
            />
          </div>
        </div>

        <button
          onClick={clearFilters}
          style={{
            padding: '8px 16px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedVacancies.size > 0 && (
        <div style={{
          background: '#007bff',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: 'bold' }}>
              {selectedVacancies.size} vacancy/vacancies selected
            </span>
            <button
              onClick={clearSelection}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Selection
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              style={{
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: bulkLoading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {bulkLoading ? 'Deleting...' : 'Delete Selected'}
            </button>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusUpdate(e.target.value);
                  e.target.value = ''; // Reset dropdown
                }
              }}
              disabled={bulkLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: bulkLoading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              <option value="">Bulk Status Update</option>
              <option value="active">Activate Selected</option>
              <option value="closed">Close Selected</option>
              <option value="draft">Set to Draft</option>
            </select>
          </div>
        </div>
      )}

      {/* Select All */}
      {vacancies.length > 0 && (
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 'bold' }}>
              {allSelected ? 'Deselect All' : someSelected ? `Selected ${selectedVacancies.size} of ${vacancies.length}` : 'Select All'}
            </span>
          </label>
          {pagination && (
            <span style={{ color: '#666', fontSize: '14px' }}>
              Showing {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, pagination.totalItems)} of {pagination.totalItems} vacancies
            </span>
          )}
        </div>
      )}

      <div className="vacancies-list">
        {vacancyCards}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <button
            disabled={currentPage === 1 || bulkLoading}
            onClick={() => {
              setCurrentPage(prev => prev - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ padding: '8px 16px', cursor: currentPage === 1 || bulkLoading ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            disabled={currentPage === pagination.totalPages || bulkLoading}
            onClick={() => {
              setCurrentPage(prev => prev + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ padding: '8px 16px', cursor: currentPage === pagination.totalPages || bulkLoading ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default ManageVacancies;
