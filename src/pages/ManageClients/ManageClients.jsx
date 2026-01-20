import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "./ManageClients.css";
import { toast } from "react-toastify";
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManageClients = ({ url }) => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    isActive: true
  });

  // Fetch all clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${url}/api/client/list`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.data.success) {
        setClients(res.data.data || []);
      } else {
        toast.error("Failed to fetch clients");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Error fetching clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submit (add or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        // Update existing client
        const res = await axios.put(`${url}/api/client/update`, {
          id: editingClient._id,
          ...formData
        }, {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        });
        
        if (res.data.success) {
          toast.success("Client updated successfully ✅");
          setEditingClient(null);
          setFormData({
            name: "",
            description: "",
            contactPerson: "",
            email: "",
            phone: "",
            address: "",
            website: "",
            isActive: true
          });
          fetchClients();
        } else {
          toast.error(res.data.message || "Failed to update client");
        }
      } else {
        // Add new client
        const res = await axios.post(`${url}/api/client/add`, formData, {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        });
        
        if (res.data.success) {
          toast.success("Client added successfully ✅");
          setFormData({
            name: "",
            description: "",
            contactPerson: "",
            email: "",
            phone: "",
            address: "",
            website: "",
            isActive: true
          });
          fetchClients();
        } else {
          toast.error(res.data.message || "Failed to add client");
        }
      }
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error(error.response?.data?.message || "Error saving client");
    }
  };

  // Handle edit
  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || "",
      description: client.description || "",
      contactPerson: client.contactPerson || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      website: client.website || "",
      isActive: client.isActive !== undefined ? client.isActive : true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await axios.post(`${url}/api/client/remove`, { id }, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (res.data.success) {
        toast.success("Client deleted successfully ✅");
        fetchClients();
      } else {
        toast.error(res.data.message || "Failed to delete client");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error(error.response?.data?.message || "Error deleting client");
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      description: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      isActive: true
    });
  };

  if (loading) {
    return <div className="loading">Loading clients...</div>;
  }

  return (
    <div className="manage-clients-page scrollable-div">
      <h2>{editingClient ? "Edit Client" : "Add New Client"}</h2>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Client Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter client/company name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactPerson">Contact Person</label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="Contact person name"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="client@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 1234567890"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="website">Website</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://www.example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Client address"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Client description"
            rows="4"
          />
        </div>

        <div className="form-group checkbox-group">
          <label htmlFor="isActive">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            Active (Client is active and can be used in vacancies)
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {editingClient ? "Update Client" : "Add Client"}
          </button>
          {editingClient && (
            <button type="button" onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Clients List */}
      <div className="clients-list-section">
        <h3>All Clients ({clients.length})</h3>
        
        {clients.length === 0 ? (
          <p className="no-clients">No clients found. Add your first client above.</p>
        ) : (
          <div className="clients-grid">
            {clients.map((client) => (
              <div key={client._id} className={`client-card ${!client.isActive ? 'inactive' : ''}`}>
                <div className="client-card-header">
                  <h4>{client.name}</h4>
                  {!client.isActive && <span className="inactive-badge">Inactive</span>}
                </div>
                
                {client.description && (
                  <p className="client-description">{client.description}</p>
                )}
                
                <div className="client-details">
                  {client.contactPerson && (
                    <p><strong>Contact:</strong> {client.contactPerson}</p>
                  )}
                  {client.email && (
                    <p><strong>Email:</strong> {client.email}</p>
                  )}
                  {client.phone && (
                    <p><strong>Phone:</strong> {client.phone}</p>
                  )}
                  {client.website && (
                    <p><strong>Website:</strong> <a href={client.website} target="_blank" rel="noopener noreferrer">{client.website}</a></p>
                  )}
                  {client.address && (
                    <p><strong>Address:</strong> {client.address}</p>
                  )}
                  <p><strong>Vacancies:</strong> {client.vacancyCount || 0}</p>
                </div>

                <div className="client-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(client)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(client._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageClients;
