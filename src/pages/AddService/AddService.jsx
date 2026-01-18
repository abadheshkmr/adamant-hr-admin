import React, { useEffect, useState } from 'react'
import './AddService.css'
import axios from "axios";
import { toast } from 'react-toastify';


const AddService = ({url}) => {

  const [image , setImage] = useState(false);
  const [data , setData] = useState({
    name:"",
    description:"",
    // price:"",
    // category:"Salad"
  })

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data =>({...data,[name]:value}));
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("title",data.name);
    formData.append("description",data.description);
    // formData.append("price" , Number(data.price));
    // formData.append("category" , data.category);
    formData.append("image",image);
    const response = await axios.post(`${url}/api/service/add` , formData);
    if(response.data.success){
      setData({
        name:"",
        description:"",
      })
      setImage(false);
      toast.success(response.data.message);
    }
    else {
      toast.error(response.data.message);
    }
  }

  return (
    <div className='add' >
        <form onSubmit={onSubmitHandler} className="flex-col">

        <div className="add-img-upload flex-col">
            <p>Upload Icon</p>
            <label htmlFor="image">
              <img src={image?URL.createObjectURL(image):'images/upload_area.png'} alt="" />
            </label>
            <input onChange={(e)=>setImage(e.target.files[0])} type="file" id="image" hidden required />
        </div>
        <div className="add-product-name flex-col">
          <p>Service name</p>
          <input onChange={onChangeHandler} type="text" value={data.name} name="name" placeholder='Type here'  />
        </div>
        <div className="add-product-name flex-col">
          <p>Service Description</p>
          <textarea onChange={onChangeHandler} value={data.description} name="description" rows={6} placeholder='Write Content here' required></textarea>
        </div>
        <button type='submit' className='add-btn' >ADD</button>
        </form>
    </div>
  )
}

export default AddService