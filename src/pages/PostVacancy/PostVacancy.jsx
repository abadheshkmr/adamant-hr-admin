import React, { useState, useContext, useEffect, useRef } from 'react'
import './PostVacancy.css'
import axios from "axios";
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';

const PostVacancy = ({url}) => {
  const { auth } = useContext(AuthContext);
  const [industries, setIndustries] = useState([]);
  const [clients, setClients] = useState([]);
  const industriesFetched = useRef(false);
  const clientsFetched = useRef(false);

  const [data, setData] = useState({
    jobTitle: "",
    description: "",
    qualification: "",
    industry: "",
    client: "",
    showClientToCandidate: false,
    isPromoted: false,
    displayOrder: 0,
    skills: [],
    city: "",
    state: "",
    country: "India",
    isRemote: false,
    employmentType: "Full-time",
    experienceLevel: "Fresher",
    salaryMin: "",
    salaryMax: "",
    isNegotiable: false,
    applicationDeadline: "",
    numberOfOpenings: 1,
    status: "active"
  });

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

    const vacancyData = {
      jobTitle: data.jobTitle,
      description: data.description,
      qualification: data.qualification,
      industry: data.industry || null,
      client: data.client || null,
      showClientToCandidate: data.showClientToCandidate,
      isPromoted: data.isPromoted,
      displayOrder: data.displayOrder ? parseInt(data.displayOrder) : 0,
      skills: data.skills,
      city: data.city,
      state: data.state,
      country: data.country,
      isRemote: data.isRemote,
      employmentType: data.employmentType,
      experienceLevel: data.experienceLevel,
      salary: {
        min: data.salaryMin ? parseInt(data.salaryMin) : undefined,
        max: data.salaryMax ? parseInt(data.salaryMax) : undefined,
        currency: 'INR',
        isNegotiable: data.isNegotiable
      },
      applicationDeadline: data.applicationDeadline || undefined,
      numberOfOpenings: parseInt(data.numberOfOpenings) || 1,
      status: data.status
    };

    try {
      const response = await axios.post(`${url}/api/vacancy/add`, vacancyData, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (response.data.success) {
        // Reset form
        setData({
          jobTitle: "",
          description: "",
          qualification: "",
          industry: "",
          client: "",
          showClientToCandidate: false,
          skills: [],
          city: "",
          state: "",
          country: "India",
          isRemote: false,
          employmentType: "Full-time",
          experienceLevel: "Fresher",
          salaryMin: "",
          salaryMax: "",
          isNegotiable: false,
          applicationDeadline: "",
          numberOfOpenings: 1,
          status: "active"
        });
        setSkillInput("");
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || "Failed to post vacancy");
      }
    } catch (error) {
      console.error("Error posting vacancy:", error);
      toast.error(error.response?.data?.message || "Error posting vacancy");
    }
  };

  return (
    <div className='add scrollable-div'>
      <form onSubmit={onSubmitHandler} className="flex-col">
        <h2>Post New Vacancy</h2>

        {/* Basic Information */}
        <div className="add-product-name flex-col">
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

        <div className="add-product-name flex-col">
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

        <div className="add-product-name flex-col">
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
          <div className="add-product-name flex-col">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.showClientToCandidate}
                onChange={onChangeHandler}
                name="showClientToCandidate"
              />
              Show Client Name to Candidates
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                (If checked, candidates will see the client/company name)
              </span>
            </label>
          </div>
        )}

        <div className="add-product-name flex-col">
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

        <div className="add-product-name flex-col">
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
        <div className="add-product-name flex-col">
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
          <div className="add-product-name flex-col">
            <p>City</p>
            <input 
              onChange={onChangeHandler} 
              type="text" 
              value={data.city} 
              name="city" 
              placeholder='e.g., Noida' 
            />
          </div>
          <div className="add-product-name flex-col">
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

        <div className="add-product-name flex-col">
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
          <div className="add-product-name flex-col">
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
          <div className="add-product-name flex-col">
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
          <div className="add-product-name flex-col">
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
          <div className="add-product-name flex-col">
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

        <div className="add-product-name flex-col">
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
          <div className="add-product-name flex-col">
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
          <div className="add-product-name flex-col">
            <p>Application Deadline</p>
            <input 
              onChange={onChangeHandler} 
              type="date" 
              value={data.applicationDeadline} 
              name="applicationDeadline" 
            />
          </div>
        </div>

        <div className="add-product-name flex-col">
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

        {/* Promotion Controls */}
        <div className="add-product-name flex-col" style={{ 
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
            fontSize: '15px',
            marginBottom: data.isPromoted ? '12px' : '0'
          }}>
            <input
              type="checkbox"
              checked={data.isPromoted}
              onChange={onChangeHandler}
              name="isPromoted"
              style={{ 
                width: '20px', 
                height: '20px', 
                cursor: 'pointer',
                accentColor: '#006AB0'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⭐</span>
                <strong>Promote this job</strong>
              </span>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '400' }}>
                Show on frontend by default (promoted jobs appear first)
              </span>
            </div>
          </label>
          
          {data.isPromoted && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Display Order (Higher = Shows First)
              </label>
              <input
                type="number"
                value={data.displayOrder}
                onChange={onChangeHandler}
                name="displayOrder"
                min="0"
                placeholder="0"
                style={{
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  width: '100%',
                  maxWidth: '200px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', marginBottom: '0' }}>
                Jobs with higher display order appear first. Default is 0.
              </p>
            </div>
          )}
        </div>

        <button type='submit' className='add-btn'>POST VACANCY</button>
      </form>
    </div>
  );
};

export default PostVacancy;
