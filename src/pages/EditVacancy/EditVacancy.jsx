import React, { useState, useContext, useEffect, useRef } from 'react'
import './EditVacancy.css'
import axios from "axios";
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const EditVacancy = ({url}) => {
  const { auth } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [industries, setIndustries] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const industriesFetched = useRef(false);
  const clientsFetched = useRef(false);

  const [data, setData] = useState(null); // Start with null to indicate not loaded yet
  const [originalData, setOriginalData] = useState(null); // Store original data from DB

  const [skillInput, setSkillInput] = useState("");

  // Fetch industries - only once when component mounts
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
          // Request was cancelled, ignore
          return;
        }
        if (isMounted) {
          console.error("Error fetching industries:", error);
          // Only show error if it's not a rate limit (429)
          if (error.response?.status !== 429) {
            toast.error("Failed to load industries");
          }
        }
      }
    };
    
    fetchIndustries();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [url]); // Only depend on url

  // Fetch clients - only once when component mounts
  useEffect(() => {
    // Skip if already fetched
    if (clientsFetched.current) return;

    let isMounted = true;
    const abortController = new AbortController();

    const fetchClients = async () => {
      try {
        const response = await axios.get(`${url}/api/client/list`, {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          },
          signal: abortController.signal
        });
        if (response.data.success && isMounted) {
          // Filter only active clients
          const activeClients = response.data.data.filter(client => client.isActive !== false);
          setClients(activeClients);
          clientsFetched.current = true;
        }
      } catch (error) {
        if (axios.isCancel(error) || error.name === 'AbortError') {
          // Request was cancelled, ignore
          return;
        }
        if (isMounted) {
          console.error("Error fetching clients:", error);
          // Only show error if it's not a rate limit (429)
          if (error.response?.status !== 429) {
            toast.error("Failed to load clients");
          }
        }
      }
    };
    
    fetchClients();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [url, auth.token]); // Depend on url and auth.token

  // Fetch existing vacancy data
  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        // Use admin endpoint to get full details including client
        const response = await axios.get(`${url}/api/vacancy/get/${id}`, {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        });
        if (response.data.success) {
          const vacancy = response.data.data;
          console.log("Fetched vacancy data:", vacancy); // Debug log
          
          // Store original data for reference
          const originalVacancyData = {
            jobTitle: vacancy.jobTitle,
            description: vacancy.description,
            qualification: vacancy.qualification,
            industry: vacancy.industry?._id || vacancy.industry,
            client: vacancy.client?._id || vacancy.client,
            showClientToCandidate: vacancy.showClientToCandidate,
            skills: vacancy.skills,
            city: vacancy.location?.city,
            state: vacancy.location?.state,
            country: vacancy.location?.country,
            isRemote: vacancy.location?.isRemote,
            employmentType: vacancy.employmentType,
            experienceLevel: vacancy.experienceLevel,
            salaryMin: vacancy.salary?.min,
            salaryMax: vacancy.salary?.max,
            isNegotiable: vacancy.salary?.isNegotiable,
            applicationDeadline: vacancy.applicationDeadline,
            numberOfOpenings: vacancy.numberOfOpenings,
            status: vacancy.status
          };
          setOriginalData(originalVacancyData);
          
          // Populate form with all data from database - preserve actual values, use defaults only if truly missing
          setData({
            jobTitle: vacancy.jobTitle || "",
            description: vacancy.description || "",
            qualification: vacancy.qualification || "",
            industry: vacancy.industry?._id || vacancy.industry || "",
            client: vacancy.client?._id || vacancy.client || "",
            showClientToCandidate: vacancy.showClientToCandidate !== undefined ? vacancy.showClientToCandidate : false,
            isPromoted: vacancy.isPromoted !== undefined ? vacancy.isPromoted : false,
            displayOrder: vacancy.displayOrder !== undefined ? vacancy.displayOrder : 0,
            skills: Array.isArray(vacancy.skills) ? vacancy.skills : [],
            city: vacancy.location?.city !== undefined ? vacancy.location.city : "",
            state: vacancy.location?.state !== undefined ? vacancy.location.state : "",
            country: vacancy.location?.country !== undefined ? vacancy.location.country : "India",
            isRemote: vacancy.location?.isRemote !== undefined ? vacancy.location.isRemote : false,
            employmentType: vacancy.employmentType || "Full-time",
            experienceLevel: vacancy.experienceLevel || "Fresher",
            salaryMin: vacancy.salary?.min !== undefined && vacancy.salary.min !== null ? vacancy.salary.min : "",
            salaryMax: vacancy.salary?.max !== undefined && vacancy.salary.max !== null ? vacancy.salary.max : "",
            isNegotiable: vacancy.salary?.isNegotiable !== undefined ? vacancy.salary.isNegotiable : false,
            applicationDeadline: vacancy.applicationDeadline 
              ? new Date(vacancy.applicationDeadline).toISOString().split('T')[0]
              : "",
            numberOfOpenings: vacancy.numberOfOpenings !== undefined ? vacancy.numberOfOpenings : 1,
            status: vacancy.status || "active"
          });
        } else {
          toast.error("Vacancy not found!");
          navigate("/manage-vacancies");
        }
      } catch (error) {
        console.error("Error fetching vacancy:", error);
        toast.error("Error fetching vacancy data!");
        navigate("/manage-vacancies");
      } finally {
        setLoading(false);
      }
    };
    if (id && auth.token) {
      fetchVacancy();
    }
  }, [id, url, navigate, auth.token]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setData(data => ({...data, [name]: value}));
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !data.skills.includes(skill)) {
      setData(prev => ({...prev, skills: [...prev.skills, skill]}));
      setSkillInput("");
    }
  };

  const removeSkill = (index) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!data) {
      toast.error("Form data not loaded. Please wait...");
      return;
    }

    // Build vacancy data - send all current form values to ensure nothing is lost
    // The backend will only update fields that are provided, so we send everything
    const vacancyData = {
      id: id,
      jobTitle: data.jobTitle,
      description: data.description,
      qualification: data.qualification,
      industry: data.industry || null,
      client: data.client || null,
      showClientToCandidate: data.showClientToCandidate,
      isPromoted: data.isPromoted,
      displayOrder: data.displayOrder ? parseInt(data.displayOrder) : 0,
      skills: Array.isArray(data.skills) ? data.skills : [],
      city: data.city,
      state: data.state,
      country: data.country || "India",
      isRemote: data.isRemote,
      employmentType: data.employmentType,
      experienceLevel: data.experienceLevel,
      salary: {
        min: data.salaryMin && data.salaryMin !== "" ? parseInt(data.salaryMin) : undefined,
        max: data.salaryMax && data.salaryMax !== "" ? parseInt(data.salaryMax) : undefined,
        currency: 'INR',
        isNegotiable: data.isNegotiable
      },
      applicationDeadline: data.applicationDeadline && data.applicationDeadline !== "" 
        ? data.applicationDeadline 
        : null,
      numberOfOpenings: data.numberOfOpenings ? parseInt(data.numberOfOpenings) : 1,
      status: data.status
    };
    
    console.log("Submitting vacancy data:", vacancyData); // Debug log
    console.log("Original data from DB:", originalData); // Debug log

    try {
      const response = await axios.put(`${url}/api/vacancy/update`, vacancyData, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (response.data.success) {
        toast.success("Vacancy updated successfully!");
        navigate("/manage-vacancies");
      } else {
        toast.error(response.data.message || "Failed to update vacancy");
      }
    } catch (error) {
      console.error("Error updating vacancy:", error);
      toast.error(error.response?.data?.message || "Error updating vacancy");
    }
  };

  if (loading || !data) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading vacancy data...</div>;
  }

  return (
    <div className='edit scrollable-div'>
      <form onSubmit={onSubmitHandler} className="flex-col">
        <h2>Edit Vacancy</h2>

        {/* Basic Information */}
        <div className="edit-product-name flex-col">
          <p>Job Title *</p>
          <input 
            onChange={onChangeHandler} 
            type="text" 
            value={data.jobTitle} 
            name="jobTitle" 
            placeholder='e.g., Software Engineer' 
            required 
          />
        </div>

        <div className="edit-product-name flex-col">
          <p>Industry</p>
          <select 
            onChange={onChangeHandler} 
            value={data.industry} 
            name="industry"
          >
            <option value="">Select Industry (Optional)</option>
            {industries.map(industry => (
              <option key={industry._id} value={industry._id}>
                {industry.name}
              </option>
            ))}
          </select>
        </div>

        <div className="edit-product-name flex-col">
          <p>Client/Company</p>
          <select 
            onChange={onChangeHandler} 
            value={data.client} 
            name="client"
          >
            <option value="">Select Client (Optional)</option>
            {clients.map(client => (
              <option key={client._id} value={client._id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {data.client && (
          <div className="edit-product-name flex-col" style={{ 
            background: '#f9fafb', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '20px'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '15px'
            }}>
              <input
                type="checkbox"
                checked={data.showClientToCandidate}
                onChange={onChangeHandler}
                name="showClientToCandidate"
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  cursor: 'pointer',
                  accentColor: '#6366f1'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{data.showClientToCandidate ? '👁️' : '🚫'}</span>
                  <strong>Show Client Name to Candidates</strong>
                </span>
                <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '400' }}>
                  {data.showClientToCandidate 
                    ? 'Candidates will see the client/company name on the job listing'
                    : 'Client name will be hidden from candidates (only visible to admin)'}
                </span>
              </div>
            </label>
          </div>
        )}

        <div className="edit-product-name flex-col">
          <p>Description *</p>
          <textarea 
            onChange={onChangeHandler} 
            value={data.description} 
            name="description" 
            rows={6} 
            placeholder='Job description...' 
            required
          />
        </div>

        <div className="edit-product-name flex-col">
          <p>Qualification *</p>
          <textarea 
            onChange={onChangeHandler} 
            value={data.qualification} 
            name="qualification" 
            rows={4} 
            placeholder='Required qualifications...' 
            required
          />
        </div>

        {/* Skills */}
        <div className="edit-product-name flex-col">
          <p>Required Skills</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={skillInput}
              placeholder="Add skill"
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              style={{ flex: 1, padding: '8px' }}
            />
            <button type="button" onClick={addSkill} style={{ padding: '8px 16px' }}>Add</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {data.skills.map((skill, i) => (
              <span key={i} style={{ 
                background: '#f0f0f0', 
                padding: '4px 8px', 
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {skill}
                <button 
                  type="button" 
                  onClick={() => removeSkill(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="edit-product-name flex-col">
            <p>City</p>
            <input 
              onChange={onChangeHandler} 
              type="text" 
              value={data.city} 
              name="city" 
              placeholder='e.g., Noida' 
            />
          </div>
          <div className="edit-product-name flex-col">
            <p>State</p>
            <input 
              onChange={onChangeHandler} 
              type="text" 
              value={data.state} 
              name="state" 
              placeholder='e.g., Uttar Pradesh' 
            />
          </div>
        </div>

        <div className="edit-product-name flex-col">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.isRemote}
              onChange={onChangeHandler}
              name="isRemote"
            />
            Remote Work Available
          </label>
        </div>

        {/* Employment Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="edit-product-name flex-col">
            <p>Employment Type *</p>
            <select 
              onChange={onChangeHandler} 
              value={data.employmentType} 
              name="employmentType" 
              required
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>
          <div className="edit-product-name flex-col">
            <p>Experience Level *</p>
            <select 
              onChange={onChangeHandler} 
              value={data.experienceLevel} 
              name="experienceLevel" 
              required
            >
              <option value="Fresher">Fresher</option>
              <option value="0-2 years">0-2 years</option>
              <option value="2-5 years">2-5 years</option>
              <option value="5-10 years">5-10 years</option>
              <option value="10+ years">10+ years</option>
            </select>
          </div>
        </div>

        {/* Salary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="edit-product-name flex-col">
            <p>Min Salary (INR)</p>
            <input 
              onChange={onChangeHandler} 
              type="number" 
              value={data.salaryMin} 
              name="salaryMin" 
              placeholder='e.g., 30000' 
              min="0"
            />
          </div>
          <div className="edit-product-name flex-col">
            <p>Max Salary (INR)</p>
            <input 
              onChange={onChangeHandler} 
              type="number" 
              value={data.salaryMax} 
              name="salaryMax" 
              placeholder='e.g., 50000' 
              min="0"
            />
          </div>
        </div>

        <div className="edit-product-name flex-col">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.isNegotiable}
              onChange={onChangeHandler}
              name="isNegotiable"
            />
            Salary Negotiable
          </label>
        </div>

        {/* Additional Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="edit-product-name flex-col">
            <p>Number of Openings</p>
            <input 
              onChange={onChangeHandler} 
              type="number" 
              value={data.numberOfOpenings} 
              name="numberOfOpenings" 
              min="1"
              placeholder='1' 
            />
          </div>
          <div className="edit-product-name flex-col">
            <p>Application Deadline</p>
            <input 
              onChange={onChangeHandler} 
              type="date" 
              value={data.applicationDeadline} 
              name="applicationDeadline" 
            />
          </div>
        </div>

        <div className="edit-product-name flex-col">
          <p>Status</p>
          <select 
            onChange={onChangeHandler} 
            value={data.status} 
            name="status"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type='submit' className='edit-btn'>UPDATE VACANCY</button>
          <button 
            type='button' 
            onClick={() => navigate("/manage-vacancies")}
            style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditVacancy;
