import React from 'react'
import useStore from '../store'
import './RequestContainer.css'

function RequestContainer() {
  const [requestCount, setRequestCount] = React.useState('');
  const [parameterToUse, setParameterToUse] = React.useState('euclidean')
  const { selectedImage, addImageToList, imageCount, clearImageList, connectionLoaded } = useStore()

  const manageCount = (e) => {
    if (parseInt(e.target.value) <= 0 || e.target.value.length <= 0)
      setRequestCount(0)
    else if (parseInt(e.target.value) > imageCount)
      setRequestCount(imageCount)
    else
      setRequestCount(parseInt(e.target.value))
  }

  const retrieveObjectIDs = async () => {
    if (requestCount <= 0) {
      alert('Enter some number of images to retrieve')
      return
    }
    if (!selectedImage) {
      alert('Enter a query image')
      return
    }
    await clearImageList()
    try {
      const responseObject = await fetch(`${process.env.REACT_APP_SERVER_ENDPOINT}/getSimilar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: selectedImage,
          similarCount: parseInt(requestCount),
          parameter: parameterToUse
        })
      })
      const responseParsed = await responseObject.json()
      responseParsed.forEach(element => {
        fetch(`${process.env.REACT_APP_SERVER_ENDPOINT}/getImage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageID: element.imageID,
            metric: element.metric
          })
        }).then(res=>res.json()).then(ret=>addImageToList(ret))
      })
      document.querySelector('.App').scrollTo(0, 1000)
    }
    catch (e) {
      console.log('Error')
    }
  }
  
  const uploadImageToServer = async ()=>{
    if(!selectedImage){
      alert('Choose an Image to upload first')
      return
    }
    try{
      const responseObject = await fetch(`${process.env.REACT_APP_SERVER_ENDPOINT}/uploadImage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: selectedImage
        })
      })
      const returnedObject = await responseObject.json()
      alert(returnedObject.message)
    }
    catch (e){
      alert('Error while uploading')
    }
  }

  return <div className='RequestContainer Flex ColumnFlexed CentrisedContent'>
    <div className='RequestBlock'>
      <input className='SearchCount' type='number' value={requestCount} onChange={manageCount} />
    </div>
    <div className='RequestBlock'>
      <select className='Parameters' onChange={e=>setParameterToUse(e.target.value)}>
        <option value='euclidean'>Euclidean</option>
        <option value='cosine'>Angular</option>
        <option value='manhattan'>Manhattan</option>
      </select>
    </div>
    <div className='RequestBlock'>
      <button className='UploadButton' onClick={uploadImageToServer} disabled={!connectionLoaded}>Upload Image</button>
    </div>
    <div className='RequestBlock'>
      <button className='SearchButton' onClick={retrieveObjectIDs} disabled={!connectionLoaded}>Find Similar</button>
    </div>
  </div>
}

export default RequestContainer