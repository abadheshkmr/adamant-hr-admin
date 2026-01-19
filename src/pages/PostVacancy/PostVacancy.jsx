import React, { useState, useContext } from 'react'
import './PostVacancy.css'
import axios from "axios";
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';

const PostVacancy = ({url}) => {
  const { auth } = useContext(AuthContext);

  const [data , setData] = useState({
    jobTitle:"",
    description:"",
    qualification:""
  })

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data =>({...data,[name]:value}));
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    const response = await axios.post(`${url}/api/vacancy/add` , data, {
      headers: {
        'Authorization': `Bearer ${auth.token}`
      }
    });
    if(response.data.success){
      setData({
        jobTitle:"",
        description:"",
        qualification:""
      })
      toast.success(response.data.message);
    }
    else {
      toast.error(response.data.message);
    }
  }

  return (
    <div className='add' >
        <form onSubmit={onSubmitHandler} className="flex-col">
        <div className="add-product-name flex-col">
          <p>Job Title</p>
          <input onChange={onChangeHandler} type="text" value={data.jobTitle} name="jobTitle" placeholder='Type here' required />
        </div>
        <div className="add-product-name flex-col">
          <p>Description</p>
          <textarea onChange={onChangeHandler} value={data.description} name="description" rows={6} placeholder='Write Content here' required></textarea>
        </div>
        <div className="add-product-name flex-col">
          <p>Qualification</p>
          <textarea onChange={onChangeHandler} value={data.qualification} name="qualification" rows={4} placeholder='Write Qualification here' required></textarea>
        </div>
        <button type='submit' className='add-btn' >POST VACANCY</button>
        </form>
    </div>
  )
}

export default PostVacancy
