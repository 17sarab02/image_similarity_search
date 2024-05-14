import React from 'react'

var mouse = {
  x: undefined,
  y: undefined
}

let listOfColors = [
  '#A1C698',
  '#D3E1A0',
  '#FFEBB0',
  '#F6C094',
  '#F49595',
  '#8B7099',
  '#949EC3',
  '#C1D2E6'
]

window.addEventListener('mousemove', (e)=>{
  mouse.x = e.x;
  mouse.y = e.y;
})

class Circle{
  constructor(x, y, startSize, endSize, hoverSize, dx, dy, gradientColor){
    this.x = x
    this.y = y
    this.drawSize = startSize
    this.endSize = endSize
    this.hoverSize = hoverSize
    this.targetSize = endSize
    this.dx = dx
    this.dy = dy
    this.velocityX = dx
    this.velocityY = dy
    this.gradientColor = gradientColor
    this.boundX = window.innerWidth - 8
    this.boundY = window.innerHeight

    window.addEventListener('resize', ()=>{
      this.boundX = window.innerWidth - 8
      this.boundY = window.innerHeight
    })
  }
  
  draw = (ctx)=>{
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.drawSize, 0, Math.PI*2, false)
    ctx.fillStyle = this.gradientColor
    ctx.fill()
    this.update()
  }

  update = ()=>{
    this.x = this.x+this.dx
    this.y = this.y+this.dy

    if((this.x-this.endSize) < 0) {this.dx = this.velocityX;}
    if((this.y-this.endSize) < 0) {this.dy = this.velocityX;}
    if((this.x+this.endSize) >= this.boundX) this.dx = -this.velocityX;
    if((this.y+this.endSize) >= this.boundY) this.dy = -this.velocityY;

    let distance = Math.sqrt((this.x - mouse.x)*(this.x - mouse.x)+(this.y - mouse.y)*(this.y - mouse.y))
    if(distance < this.endSize * 2) this.targetSize = this.hoverSize
    else this.targetSize = this.endSize
    if(this.drawSize < this.targetSize) this.drawSize += 2
    if(this.drawSize > this.targetSize) this.drawSize -= 2
  }
}

export default class Background extends React.Component {
  constructor(props){
    super(props)
    this.canvasRef = React.createRef()
    this.state = {
      cWidth: window.innerWidth - 8,
      cHeight: window.innerHeight
    }
  }
  
  render() {
    return <canvas ref={this.canvasRef} height={this.state.cHeight} width={this.state.cWidth}>
    </canvas>
  }

  componentDidMount(){
    window.addEventListener('resize', ()=>{
      this.setState({cWidth: window.innerWidth - 8})
      this.setState({cHeight: window.innerHeight})
    })

    const canvas = this.canvasRef.current
    const ctx = canvas.getContext('2d')
    
    const listOfCircles = []
    for(var i=0; i<8; i++){
      let circleSize = Math.random() * (100-50) + 50
      let randomX = Math.random() * (window.innerWidth-circleSize) + circleSize
      let randomY = Math.random() * (window.innerHeight-circleSize) + circleSize
      let velocityX = Math.random()
      let velocityY = Math.random()
      let randomColor = listOfColors[i%8]
      listOfCircles.push(new Circle(randomX, randomY, 0, circleSize, circleSize*1.5, velocityX, velocityY, randomColor, this.props.fullWidth, this.props.fullHeight))
    }
    const renderer = ()=>{
      ctx.clearRect(0, 0, this.state.cWidth, this.state.cHeight)
      ctx.fillStyle = '#151515'
      ctx.fillRect(0, 0, this.state.cWidth, this.state.cHeight)
      listOfCircles.map(currentCircle => currentCircle.draw(ctx))
      requestAnimationFrame(renderer)
    }
    renderer()
  }
}