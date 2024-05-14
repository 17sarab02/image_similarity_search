import React from 'react'
import useStore from '../store'
import './ImageGrid.css'
import ImageCard from './ImageCard'

function ImageGrid(){
  const {listOfImages} = useStore()

  return <div className='ImageGrid'>
    <h2>Search Results</h2>
    <div className='ImageCarousel'>
    {listOfImages.map(element=><ImageCard key={element.imageID} image={element} />)}
    </div>
  </div>
}

export default ImageGrid