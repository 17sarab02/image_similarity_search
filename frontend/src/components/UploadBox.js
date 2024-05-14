import React from 'react'
import useStore from '../store'
import './UploadBox.css'

function UploadBox() {
  const { selectedImage, selectImage } = useStore()

  const handleUpload = (fileData) => {
    if (!fileData) {
      return;
    }
    if (!fileData.type.match('image/*')) {
      console.log('Only image files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(fileData);

    reader.onload = (event) => {
      selectImage(event.target.result);
    };

    reader.onerror = (error) => {
      console.error('Error reading image:', error);
    };
  }

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    handleUpload(file)    
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleUpload(file)
  };

  return <div className='UploadBox Glass FadeInSlow' onDragOver={handleDragOver} onDrop={handleDrop}>
    {selectedImage && <>
      <div className='AbsoluteOverlay BlackOverlay FadeInSlow'>
      </div>
      <div className='AbsoluteOverlay ImageContainer FadeInSlow'>
        <button onClick={()=>{selectImage(null)}} className='CrossIcon'>
        <svg viewBox="0 0 56 56">
          <path fill="white" d="M30.53,28.04l9.45-9.45c.7-.7,.7-1.83,0-2.53s-1.83-.7-2.53,0l-9.45,9.45-9.45-9.45c-.7-.7-1.83-.7-2.53,0-.7,.7-.7,1.83,0,2.53l9.45,9.45-9.45,9.45c-.7,.7-.7,1.83,0,2.53,.35,.35,.8,.52,1.26,.52s.92-.17,1.26-.52l9.45-9.45,9.45,9.45c.35,.35,.8,.52,1.26,.52s.92-.17,1.26-.52c.7-.7,.7-1.83,0-2.53l-9.45-9.45Z"/>
        </svg>
        </button>
        <img className='SelectedImage' src={selectedImage} alt='none' />
      </div>
    </>}
    {!selectedImage && <div className='AbsoluteOverlay UploadFileContainer'>
      <input className='UploadFileButton' type='file' onChange={handleImageChange} />
      <svg className='UploadFileButtonGraphic' viewBox="0 0 448 288">
        <path fill="white"
          d="M366.1,121.2c0-1.2,.2-2.4,.2-3.6C366.3,52.6,314.5,0,250.6,0c-46.1,0-85.7,27.4-104.3,67-8.1-4.1-17.2-6.5-26.8-6.5-29.5,0-54.1,21.9-58.8,50.5C25.3,123.2,0,157.1,0,197c0,50.2,40.1,91,89.5,91h102.5v-80h-48.2l80.2-83.7,80.2,83.6h-48.2v80h110.3c45.2,0,81.7-37.5,81.7-83.4s-36.7-83.2-81.9-83.3Z" />
      </svg>
    </div>}
  </div>
}

export default UploadBox