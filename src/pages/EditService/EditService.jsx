import React, { useEffect, useState, useContext } from "react";
import "./EditService.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from '../../context/AuthContext';

const EditService = ({ url }) => {
  const { auth } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [image, setImage] = useState(false);
  const [data, setData] = useState({
    name: "",
    description: "",
  });

  // Fetch existing data
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await axios.get(`${url}/api/service/get/${id}`);
        console.log(response.data);
        
        if (response.data.success) {
          setData({
            name: response.data.data.title,
            description: response.data.data.description,
          });
          if (response.data.data.icon) {
            setImage(response.data.data.icon);
          }
        } else {
          toast.error("Service not found!");
          navigate("/services"); // redirect if not found
        }
      } catch (err) {
        toast.error("Error fetching service data!");
      }
    };
    fetchService();
  }, [id, url, navigate]);

  // Input change handler
  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit handler
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("title", data.name);
    formData.append("description", data.description);
    if (image && typeof image !== "string") {
      formData.append("image", image);
    }
    formData.append("id", id); // include ID for update

    try {
      const response = await axios.put(`${url}/api/service/update`, formData, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (response.data.success) {
        toast.success("Service updated successfully!");
        navigate("/list-services"); // redirect after update
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error("Update failed!");
    }
  };

  return (
    <div className="edit">
      <form onSubmit={onSubmitHandler} className="flex-col">
        <div className="edit-img-upload flex-col">
          <p>Upload Icon</p>
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

        <div className="edit-product-name flex-col">
          <p>Service name</p>
          <input
            onChange={onChangeHandler}
            type="text"
            value={data.name}
            name="name"
            placeholder="Type here"
            required
          />
        </div>

        <div className="edit-product-description flex-col">
          <p>Service Description</p>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            name="description"
            rows={6}
            placeholder="Write Content here"
            required
          ></textarea>
        </div>

        <button type="submit" className="edit-btn">
          UPDATE
        </button>
      </form>
    </div>
  );
};

export default EditService;
