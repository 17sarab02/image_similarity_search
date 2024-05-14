import React from 'react'
import useStore from '../store'

function ImageCard(props){
  const {selectImage} = useStore()

  const handleDownload = (imageUrl) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${props.image.imageID}.jpg`; // Use appropriate extension based on image format
    link.click();
  };

  return <div className='ImageCard Glass FadeInSlow'>
    <img className='ImageCardContent AbsoluteOverlay' src={props.image.imageData} alt={props.image.imageID} style={{animationDelay: `${Math.random()/2}s`}}></img>
    <div className='MetricDisplay AbsoluteOverlay'>
      <p>Distance Metric</p>
      <p>{props.image.metric.toFixed(10)}</p>
    </div>
    <div className='ImageOptions AbsoluteOverlay'>
      <button className='DownloadButton' onClick={()=>{handleDownload(props.image.imageData)}}>
        <svg viewBox="0 0 84.53 76.42">
          <path fill='white'
              d="M70.96,25.25c-1.95-1.95-5.12-1.95-7.07,0l-16.62,16.62V5c0-2.76-2.24-5-5-5s-5,2.24-5,5V41.87L20.64,25.25c-1.95-1.95-5.12-1.95-7.07,0-1.95,1.95-1.95,5.12,0,7.07l25.16,25.16c.23,.23,.49,.44,.76,.62,.12,.08,.25,.14,.38,.2,.16,.09,.31,.18,.48,.25,.16,.07,.34,.11,.5,.16,.14,.04,.28,.1,.43,.13,.32,.06,.65,.1,.98,.1s.66-.03,.98-.1c.15-.03,.29-.09,.43-.13,.17-.05,.34-.09,.5-.15,.17-.07,.33-.17,.49-.26,.12-.07,.25-.12,.37-.2,.28-.18,.53-.39,.77-.63l25.16-25.15c1.95-1.95,1.95-5.12,0-7.07Z" />
          <path fill='white' d="M79.53,76.42H5c-2.76,0-5-2.24-5-5s2.24-5,5-5H79.53c2.76,0,5,2.24,5,5s-2.24,5-5,5Z" />
        </svg>
      </button>
      <button className='ChainButton' onClick={()=>{selectImage(props.image.imageData)}}>
      <svg viewBox="0 0 69.57 72.99">
    <path fill='white'
        d="M33.07,72.99c-1.28,0-2.56-.49-3.54-1.46-1.95-1.95-1.95-5.12,0-7.07l27.96-27.96L29.54,8.54c-1.95-1.95-1.95-5.12,0-7.07,1.95-1.95,5.12-1.95,7.07,0l31.5,31.5c1.95,1.95,1.95,5.12,0,7.07l-31.5,31.5c-.98,.98-2.26,1.46-3.54,1.46Z" />
    <path fill='white'
        d="M5,72.99c-.64,0-1.29-.12-1.91-.38-1.87-.77-3.09-2.6-3.09-4.62V5C0,2.98,1.22,1.15,3.09,.38,4.96-.39,7.11,.03,8.54,1.46l31.5,31.5c.94,.94,1.46,2.21,1.46,3.54s-.53,2.6-1.46,3.54l-31.5,31.5c-.96,.96-2.24,1.46-3.54,1.46ZM10,17.07V55.92l19.43-19.43L10,17.07Z" />
</svg>
      </button>
    </div>
  </div>
}

export default ImageCard