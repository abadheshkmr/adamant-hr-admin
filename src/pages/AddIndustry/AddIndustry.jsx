import React, { useState } from 'react'
import './AddIndustry.css'
import axios from "axios";
import { toast } from 'react-toastify';

const AddIndustry = ({url}) => {

  const [image , setImage] = useState(false);
  const [data , setData] = useState({
    name:"",
    description:"",
    roles: []        // ✅ array of strings
  });
  const [roleInput, setRoleInput] = useState(""); // ✅ temp input

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data =>({...data,[name]:value}));
  };

  const addRole = () => {
    const role = roleInput.trim();
    if(role && !data.roles.includes(role)){
      setData(prev => ({...prev, roles:[...prev.roles, role]}));
      setRoleInput("");
    }
  };

  const removeRole = (idx) => {
    setData(prev => ({...prev, roles: prev.roles.filter((_,i)=>i!==idx)}));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name",data.name);
    formData.append("description",data.description);
    formData.append("image",image);
    formData.append("list", JSON.stringify(data.roles)); // ✅ send array as JSON
    for (let [key, value] of formData.entries()) {
  console.log(key, value);
}
    
    
    const response = await axios.post(`${url}/api/industry/add` , formData);
    if(response.data.success){
      setData({
        name:"",
        description:"",
        roles:[]
      });
      setImage(false);
      toast.success(response.data.message);
    }
    else {
      toast.error(response.data.message);
    }
  };

  return (
    <div className='add' >
      <form onSubmit={onSubmitHandler} className="flex-col">

        {/* Upload Image */}
        <div className="add-img-upload flex-col">
          <p>Upload Image</p>
          <label htmlFor="image">
            <img src={image?URL.createObjectURL(image):'images/upload_area.png'} alt="" />
          </label>
          <input onChange={(e)=>setImage(e.target.files[0])} type="file" id="image" hidden required />
        </div>

        {/* Industry Name */}
        <div className="add-product-name flex-col">
          <p>Industry name</p>
          <input onChange={onChangeHandler} type="text" value={data.name} name="name" placeholder='Type here'  />
        </div>

        {/* Description */}
        <div className="add-product-name flex-col">
          <p>Industry Description</p>
          <textarea onChange={onChangeHandler} value={data.description} name="description" rows={6} placeholder='Write Content here' required></textarea>
        </div>

        {/* ✅ Job Roles */}
        <div className="add-product-name flex-col">
          <p>Job Roles</p>
          <div className="roles-box">
            <div className="roles-input">
              <input
                type="text"
                value={roleInput}
                placeholder="Add role"
                onChange={(e)=>setRoleInput(e.target.value)}
                onKeyDown={(e)=> e.key==="Enter" && (e.preventDefault(), addRole())}
              />
              <button type="button" className="add-role-btn" onClick={addRole}>Add</button>
            </div>

            <div className="roles-list">
              {data.roles.map((r,i)=>(
                <span key={i} className="role-item">
                  {r}
                  <button type="button" className="remove-role-btn" onClick={()=>removeRole(i)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button type='submit' className='add-btn' >ADD</button>
      </form>
    </div>
  );
};

export default AddIndustry;
