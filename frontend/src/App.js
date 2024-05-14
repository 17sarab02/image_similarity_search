import React from 'react';
import './App.css';
import Background from './components/Background'
import Logo from './components/Logo';
import UploadBox from './components/UploadBox'
import RequestContainer from './components/RequestContainer';
import ImageGrid from './components/ImageGrid'

import useStore from './store'

function App(){
  const {imageCount, setImageCount, loadingSuccessful, loadingFailed, connectionLoaded, connectionLoading, listOfImages} = useStore()

  React.useEffect(()=>{
    fetch(`${process.env.REACT_APP_SERVER_ENDPOINT}/objectCount`, {
      method: 'POST'
    })
    .then(res=>res.json())
    .then(ret=>{setImageCount(ret.totalCount); loadingSuccessful()})
    .catch(e=>loadingFailed())
  }, [loadingSuccessful, loadingFailed, setImageCount])

  return <div className='App'>
      <Background />
      <div className='LogoSection'>
      <Logo />
      </div>
      <div className='Count FadeInSlow' style={{animationDelay: '0.2s'}}>
        <h3>{connectionLoaded?`Total-Images: ${imageCount}`:connectionLoading?'Loading...':'Connection Failed'}</h3>
      </div>
      <div className='UploadSection'>
      <UploadBox />
      </div>
      <div className='RequestSection'>
        <RequestContainer />
      </div>
      {(listOfImages.length > 0)&&<div className='ImageGridSection'>
      <ImageGrid />
      </div>}
    </div>
}

export default App;