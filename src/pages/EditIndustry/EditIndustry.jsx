import React, { useEffect, useState } from "react";
import "./EditIndustry.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const EditIndustry = ({ url }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [image, setImage] = useState(false);
  const [data, setData] = useState({
    name: "",
    description: "",
    roles: [],
  });
  const [roleInput, setRoleInput] = useState("");

  // Fetch industry data by ID
  useEffect(() => {
    const fetchIndustry = async () => {
      try {
        const res = await axios.get(`${url}/api/industry/get/${id}`);
        console.log(res.data);
        if (res.data.success) {
            
          const industry = res.data.data;
          setData({
            name: industry.name,
            description: industry.description,
            roles: industry.list || [],
          });
          if (industry.image) {
            setImage(industry.image);
          }
        } else {
          toast.error("Industry not found");
        }
      } catch (err) {
        toast.error("Error fetching industry data");
      }
    };
    fetchIndustry();
  }, [id, url, navigate]);

  // Input handler
  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // Add role
  const addRole = () => {
    const role = roleInput.trim();
    if (role && !data.roles.includes(role)) {
      setData((prev) => ({ ...prev, roles: [...prev.roles, role] }));
      setRoleInput("");
    }
  };

  // Remove role
  const removeRole = (idx) => {
    setData((prev) => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== idx),
    }));
  };

  // Submit handler
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("id", id);
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("list", JSON.stringify(data.roles));

    if (image && typeof image !== "string") {
      formData.append("image", image);
    }

    try {
      const res = await axios.put(`${url}/api/industry/update`, formData);
      if (res.data.success) {
        toast.success("Industry updated successfully!");
        navigate("/list-industries");
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Update failed!");
    }
  };

  return (
    <div className="edit">
      <form onSubmit={onSubmitHandler} className="flex-col">
        {/* Upload Image */}
        <div className="edit-img-upload flex-col">
          <p>Upload Image</p>
          <label htmlFor="image">
            <img
              src={
                image
                  ? typeof image === "string"
                    ? `${url}/images/${image}`
                    : URL.createObjectURL(image)
                  : "images/upload_area.png"
              }
              alt=""
            />
          </label>
          <input
            onChange={(e) => setImage(e.target.files[0])}
            type="file"
            id="image"
            hidden
          />
        </div>

        {/* Industry Name */}
        <div className="edit-product-name flex-col">
          <p>Industry name</p>
          <input
            onChange={onChangeHandler}
            type="text"
            value={data.name}
            name="name"
            placeholder="Type here"
            required
          />
        </div>

        {/* Description */}
        <div className="edit-product-name flex-col">
          <p>Industry Description</p>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            name="description"
            rows={6}
            placeholder="Write Content here"
            required
          ></textarea>
        </div>

        {/* Job Roles */}
        <div className="edit-product-name flex-col">
          <p>Job Roles</p>
          <div className="roles-box">
            <div className="roles-input">
              <input
                type="text"
                value={roleInput}
                placeholder="Add role"
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addRole())
                }
              />
              <button type="button" className="add-role-btn" onClick={addRole}>
                Add
              </button>
            </div>

            <div className="roles-list">
              {data.roles.map((r, i) => (
                <span key={i} className="role-item">
                  {r}
                  <button
                    type="button"
                    className="remove-role-btn"
                    onClick={() => removeRole(i)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="edit-btn">
          UPDATE
        </button>
      </form>
    </div>
  );
};

export default EditIndustry;
